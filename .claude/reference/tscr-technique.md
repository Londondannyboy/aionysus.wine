# TSCR: Two-Stage Context Retrieval

> **Learned from:** lost.london-v2 (Jan 2026)
> **Performance:** 633ms avg → 71ms best case (vs 2,478ms without)
> **Use case:** Voice AI, real-time chat requiring sub-second responses

## The Problem

Standard agentic pipelines are too slow for voice:

| Component | Time |
|-----------|------|
| Database query | ~300ms |
| Zep memory lookup | ~100ms |
| LLM inference | ~200-700ms |
| Tool execution | ~200ms |
| **Total** | **1,500-2,500ms** |

Humans perceive delays >200ms as "slow". Voice needs <700ms.

## The Solution: Two Stages

```
USER SPEAKS: "Royal Aquarium"
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 1: INSTANT (<300ms)                               │
│                                                         │
│   1. Keyword cache lookup        <1ms                   │
│   2. Get pre-computed teaser     <1ms                   │
│   3. Fast LLM generates response ~170ms                 │
│   4. Stream to user                                     │
│                                                         │
│   OUTPUT: "Ah, the Royal Aquarium! Shall I tell you    │
│            more?"                                       │
└─────────────────────────────────────────────────────────┘
         │
         │  asyncio.create_task() ─── PARALLEL
         ▼
┌─────────────────────────────────────────────────────────┐
│ STAGE 2: BACKGROUND (while user listens)               │
│                                                         │
│   1. Full database search        ~400ms                 │
│   2. Load article content        ~100ms                 │
│   3. Store in memory             <1ms                   │
│                                                         │
│   STORED: Full content ready for "yes" response        │
└─────────────────────────────────────────────────────────┘
         │
USER SAYS: "Yes"
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ INSTANT FULL RESPONSE (pre-loaded!)                    │
│                                                         │
│   Content already in memory - no database query!       │
└─────────────────────────────────────────────────────────┘
```

## Core Components

### 1. TeaserData Model

```python
class TeaserData(BaseModel):
    """Pre-computed teaser for instant lookup."""
    id: int
    title: str
    location: Optional[str] = None   # "Westminster"
    era: Optional[str] = None        # "Victorian"
    hook: Optional[str] = None       # "Built in 11 months"
    image_url: Optional[str] = None
    slug: Optional[str] = None
```

### 2. Keyword Cache (In-Memory)

```python
_keyword_cache: dict[str, TeaserData] = {}  # keyword -> teaser

# Load at startup
async def load_keyword_cache():
    results = await conn.fetch("""
        SELECT id, title, topic_keywords, teaser_location,
               teaser_era, teaser_hook
        FROM articles
        WHERE topic_keywords IS NOT NULL
    """)

    for row in results:
        teaser = TeaserData(...)
        for keyword in row['topic_keywords']:
            if keyword.lower() not in STOPWORDS:
                _keyword_cache[keyword.lower()] = teaser
```

**Stats from lost.london:** 4,748 keywords from 372 articles, <1ms lookup.

### 3. Cache Lookup Priority

```python
def get_teaser_from_cache(query: str) -> TeaserData | None:
    query_lower = query.lower().strip()

    # 1. Exact match
    if query_lower in _keyword_cache:
        return _keyword_cache[query_lower]

    # 2. Multi-word phrase match (longer = better)
    phrases = [kw for kw in _keyword_cache if ' ' in kw and kw in query_lower]
    if phrases:
        return _keyword_cache[max(phrases, key=len)]

    # 3. Single word fallback (min 4 chars)
    for word in query_lower.split():
        if len(word) > 3 and word in _keyword_cache:
            return _keyword_cache[word]

    return None
```

### 4. Fast Teaser Agent

```python
_fast_teaser_agent = Agent(
    'groq:llama-3.1-8b-instant',  # Fast small model
    system_prompt="""You are [persona]. Give a brief teaser.

Rules:
- 1-2 sentences ONLY (under 40 words)
- Mention location/era if provided
- End with "Shall I tell you more?"
- Be warm and conversational""",
    model_settings=ModelSettings(max_tokens=60, temperature=0.7),
)
```

### 5. Background Loading

```python
async def load_full_content_background(query: str, session_id: str):
    """Runs while user listens to teaser."""
    results = await search_database(query, limit=3)

    _background_results[session_id] = {
        "query": query,
        "content": format_content(results),
        "ready": True,
    }

# Called without await - runs in parallel
asyncio.create_task(load_full_content_background(query, session_id))
```

### 6. Affirmation Detection

```python
AFFIRMATION_WORDS = frozenset([
    'yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'please',
    'continue', 'more', 'absolutely', 'definitely',
])

AFFIRMATION_PHRASES = frozenset([
    'tell me more', 'go on', 'yes please', 'sounds good',
])

def is_affirmation(text: str) -> bool:
    clean = text.lower().strip().rstrip('.,!?')
    return (
        clean in AFFIRMATION_WORDS or
        clean in AFFIRMATION_PHRASES or
        any(p in clean for p in AFFIRMATION_PHRASES)
    )
```

## Database Schema

```sql
-- Add these columns to your content table
ALTER TABLE articles ADD COLUMN topic_keywords TEXT[];
ALTER TABLE articles ADD COLUMN teaser_location TEXT;
ALTER TABLE articles ADD COLUMN teaser_era TEXT;
ALTER TABLE articles ADD COLUMN teaser_hook TEXT;

-- Example data
UPDATE articles SET
    topic_keywords = ARRAY['royal aquarium', 'aquarium', 'victorian entertainment'],
    teaser_location = 'Westminster',
    teaser_era = 'Victorian',
    teaser_hook = 'Built in just 11 months, it housed 25,000 fish'
WHERE title = 'The Royal Aquarium';
```

## Stopwords Filter

```python
KEYWORD_STOPWORDS = frozenset([
    'with', 'what', 'the', 'and', 'for', 'that', 'this', 'from',
    'have', 'will', 'your', 'you', 'are', 'was', 'it', 'its',
    'to', 'of', 'in', 'on', 'at', 'be', 'is', 'as', 'by', 'or',
    # ... prevents generic words from matching wrong content
])
```

## Combine with TSCA

TSCR handles retrieval speed. Combine with TSCA (see `tsca-pattern.md`) for context:

```python
async def generate_fast_teaser(teaser: TeaserData, query: str, session_key: str):
    # TSCA: Get context anchor
    history = get_history_context(session_key)
    previous_topic = get_current_topic(session_key)

    # Build anchored prompt
    prompt = f"""
PREVIOUSLY DISCUSSING: {previous_topic}
RECENT CONVERSATION:
{history}

NOW DISCUSSING: {teaser.title}
Location: {teaser.location}
Era: {teaser.era}
Fact: {teaser.hook}

User asked: {query}

RULES:
- Don't repeat facts from RECENT CONVERSATION
- 1-2 sentences ONLY
- End with "Shall I tell you more?"
"""

    return await _fast_teaser_agent.run(prompt)
```

## Performance Benchmarks

### Lost.London (with TSCR)
```
Average TTFB:  633ms
Min TTFB:      71ms (cached path)
Max TTFB:      2,210ms (cold start)
Median TTFB:   256ms
```

### Without TSCR (standard pipeline)
```
Average TTFB:  2,478ms
Min TTFB:      1,551ms
Max TTFB:      4,037ms
```

### Raw LLM Comparison
```
Gemini 1.5 Flash:  67ms
Groq Llama 8B:     170ms
ElevenLabs Qwen:   758ms
```

## Implementation Checklist

- [ ] Add teaser columns to database
- [ ] Generate keywords for content
- [ ] Create TeaserData model
- [ ] Implement `load_keyword_cache()` at startup
- [ ] Implement `get_teaser_from_cache()`
- [ ] Create fast teaser agent (Groq or Gemini)
- [ ] Implement background loading
- [ ] Add session state management
- [ ] Add affirmation detection
- [ ] Integrate with TSCA for context anchoring
- [ ] Test end-to-end latency

## Potential Optimizations

| Optimization | Impact |
|--------------|--------|
| Pre-warm popular topics | Eliminate cold start |
| Predictive loading | Load related content |
| Semantic cache fallback | Embedding search if keyword misses |
| Response caching | Cache common queries |
| Edge deployment | Move cache to CDN edge |

## When to Use TSCR

| Scenario | Use TSCR? |
|----------|-----------|
| Voice AI | **Yes** - critical for <1s response |
| Real-time chat | Yes - improves UX |
| Chatbot with DB | Yes - speeds up retrieval |
| Simple Q&A (no DB) | No - not needed |
| Batch processing | No - latency not critical |

## Files Reference

- `lost.london-v2/agent/src/agent.py` - Full implementation
- `lost.london-v2/CLAUDE.md` - Detailed documentation
- `/Users/dankeegan/TSCR_TECHNIQUE_DOCUMENTATION.md` - Complete reference

## Related Patterns

- **TSCA** (`tsca-pattern.md`) - Context anchoring for multi-turn
- **Vague Detection** (`vague-detection.md`) - Handle "what happened to it?"
- **Anchoring Formula** (`anchoring-formula.md`) - Prompt construction
