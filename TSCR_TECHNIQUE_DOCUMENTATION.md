# TSCR: Two-Stage Context Retrieval Technique

## Complete Technical Documentation

**Source:** Lost.London VIC Agent (`/Users/dankeegan/lost-london-v2/agent/src/agent.py`)
**Performance:** 633ms average (71ms best case) vs 2,478ms for standard agentic pipeline
**Created:** January 2026

---

## Executive Summary

TSCR (Two-Stage Context Retrieval) is an architecture pattern that achieves sub-second voice AI responses by:

1. **Stage 1 (Instant):** In-memory keyword cache lookup → teaser response (~200ms)
2. **Stage 2 (Background):** Full database search runs WHILE user listens to teaser
3. **"Yes" Handling:** Pre-loaded content ready instantly when user confirms interest

**Result:** User perceives instant response; full content loads invisibly in background.

---

## Architecture Overview

```
USER SPEAKS: "Royal Aquarium"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 1: INSTANT PATH (<300ms)                                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. Normalize query                          (~1ms)                │
│   2. Keyword cache lookup                     (<1ms)                │
│          └── 4,748 keywords in memory                               │
│   3. Get TeaserData (title, location, era, hook)                    │
│   4. Generate teaser via Groq Llama 8B        (~170ms)              │
│   5. Stream response to user                                        │
│                                                                     │
│   OUTPUT: "Ah, the Royal Aquarium! A Victorian marvel in           │
│            Westminster. Shall I tell you more?"                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         │  asyncio.create_task() ─── runs in PARALLEL
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 2: BACKGROUND LOADING (while user listens)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. Full RRF hybrid search (Neon PostgreSQL)                       │
│   2. Load article content (1500 chars × 2 articles)                 │
│   3. Store in _background_results[session_id]                       │
│   4. Mark as "ready"                                                │
│                                                                     │
│   STORED: Full article content, ready for instant use               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
         │
         ▼
USER SAYS: "Yes" / "Tell me more"
         │
         ▼
┌─────────────────────────────────────────────────────────────────────┐
│ INSTANT FULL RESPONSE (content already loaded!)                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   1. Detect affirmation ("yes", "go on", etc.)                      │
│   2. Retrieve pre-loaded content from _background_results           │
│   3. Generate detailed response (already has context)               │
│   4. Stream to user                                                 │
│                                                                     │
│   NO DATABASE QUERY NEEDED - content was pre-loaded!                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. TeaserData Model

```python
class TeaserData(BaseModel):
    """Validated teaser data for an article."""
    id: int
    title: str
    location: Optional[str] = None   # e.g., "Westminster"
    era: Optional[str] = None        # e.g., "Victorian"
    hook: Optional[str] = None       # e.g., "Built in just 11 months"
    image_url: Optional[str] = None
    slug: Optional[str] = None
```

**Purpose:** Pre-computed teaser content stored in database, loaded into memory at startup.

### 2. Keyword Cache

```python
_keyword_cache: dict[str, TeaserData] = {}  # keyword -> validated TeaserData

# Example entries:
# "royal aquarium" -> TeaserData(title="The Royal Aquarium", location="Westminster", ...)
# "tyburn" -> TeaserData(title="Tyburn: London's Place of Execution", ...)
# "fleet river" -> TeaserData(title="New rivers for old – Fleet and Walbrook", ...)
```

**Size:** 4,748 unique keywords from 372 articles
**Lookup time:** <1ms (Python dict hash lookup)

### 3. Keyword Stopwords Filter

```python
KEYWORD_STOPWORDS = frozenset([
    'with', 'what', 'the', 'and', 'for', 'that', 'this', 'from', 'have', 'will',
    'your', 'you', 'are', 'was', 'it', 'its', 'to', 'of', 'in', 'on', 'at',
    'be', 'is', 'as', 'by', 'or', 'an', 'a', 'so', 'if', 'but', 'not', 'all',
    # ... 60+ stopwords total
])
```

**Purpose:** Prevents generic words from matching wrong articles (e.g., "what" shouldn't match anything).

### 4. Cache Loading (Startup)

```python
async def load_keyword_cache():
    """Load all article keywords into memory for instant lookup (<1ms)."""

    results = await conn.fetch("""
        SELECT id, title, topic_keywords, teaser_location, teaser_era,
               teaser_hook, featured_image_url, slug
        FROM articles
        WHERE topic_keywords IS NOT NULL AND array_length(topic_keywords, 1) > 0
    """)

    for row in results:
        teaser_data = TeaserData(
            id=row['id'],
            title=row['title'],
            location=row['teaser_location'],
            era=row['teaser_era'],
            hook=row['teaser_hook'],
            image_url=row['featured_image_url'],
            slug=row['slug'],
        )

        for keyword in (row['topic_keywords'] or []):
            kw_lower = keyword.lower()
            # Skip stopwords
            if kw_lower in KEYWORD_STOPWORDS:
                continue
            # Prioritize articles where keyword appears in title
            if kw_lower not in _keyword_cache or kw_lower in title_lower:
                _keyword_cache[kw_lower] = teaser_data
```

### 5. Cache Lookup Logic

```python
def get_teaser_from_cache(query: str) -> TeaserData | None:
    """Ultra-fast keyword lookup (<1ms).

    Priority order:
    1. Exact match for full query
    2. Multi-word phrase matches (longer = more specific = better)
    3. Single word matches (fallback)
    """
    query_lower = query.lower().strip()

    # 1. Exact full query match
    if query_lower in _keyword_cache:
        return _keyword_cache[query_lower]

    # 2. Multi-word phrase matches (prioritize longer matches)
    matching_keywords = [
        kw for kw in _keyword_cache.keys()
        if ' ' in kw and kw in query_lower
    ]
    if matching_keywords:
        best_match = max(matching_keywords, key=len)
        return _keyword_cache[best_match]

    # 3. Single word fallback (min 4 chars)
    for word in query_lower.split():
        if len(word) > 3 and word in _keyword_cache:
            return _keyword_cache[word]

    return None
```

---

## Fast Teaser Agent

```python
_fast_teaser_agent = Agent(
    'groq:llama-3.1-8b-instant',  # Fast, small model
    system_prompt="""You are Vic Keegan, London historian. Give a brief, engaging teaser.

Rules:
- 1-2 sentences ONLY (under 40 words)
- Start with "Ah, the [topic]..." or similar
- Mention location and era if provided
- End with "Shall I tell you more?" or similar question
- Be warm and conversational""",
    model_settings=ModelSettings(max_tokens=60, temperature=0.7),
)
```

**Model choice:** Groq Llama 3.1 8B Instant
- TTFB: ~170ms
- Small context (just teaser data)
- max_tokens=60 (forces brevity)

---

## Context Anchoring (TSCA Pattern)

Prevents the "rambling" problem where AI loses track of the topic.

```python
async def generate_fast_teaser(teaser: TeaserData, query: str, session_key: str) -> str:
    """Generate instant teaser response with context anchoring (~200ms)."""

    # Get conversation anchor
    history_context = get_history_context(session_key)
    previous_topic = get_current_topic(session_key)

    # Build anchor
    anchor = ""
    if previous_topic and previous_topic.lower() != teaser.title.lower():
        anchor += f"PREVIOUSLY DISCUSSING: {previous_topic}\n"
    if history_context:
        anchor += f"RECENT CONVERSATION:\n{history_context}\n\n"

    prompt = f"""{anchor}NOW DISCUSSING: {teaser.title}
Location: {teaser.location or 'London'}
Era: {teaser.era or ''}
Fact: {teaser.hook or ''}

User asked: {query}

RULES:
- NEVER repeat facts from RECENT CONVERSATION above - mention NEW details only
- If continuing same topic, say "There's more to this story..." and share something different
- If switching topics, smoothly transition
- 1-2 sentences ONLY. End with "Shall I tell you more?" or similar."""
```

**Key elements:**
1. `PREVIOUSLY DISCUSSING` - reminds model of prior topic
2. `RECENT CONVERSATION` - last 3 exchanges (truncated to 200 chars each)
3. `RULES` - explicit anti-repetition instructions

---

## Session State Management

```python
@dataclass
class SessionContext:
    """Track conversation state per session."""

    # Name spacing (avoid over-using user's name)
    turns_since_name_used: int = 0
    name_used_in_greeting: bool = False
    greeted_this_session: bool = False

    # Topic tracking
    last_topic: str = ""
    current_topic_context: str = ""

    # Cached user context (fetched once, reused)
    user_name: Optional[str] = None
    user_context: Optional[dict] = None
    context_fetched: bool = False

    # Pre-fetched content for "yes" responses
    prefetched_topic: str = ""
    prefetched_content: str = ""

    # Conversation history (last 4 turns)
    conversation_history: list = field(default_factory=list)

    # Topic change confirmation
    pending_topic: str = ""
    pending_topic_query: str = ""
```

**LRU eviction:** Max 100 sessions, oldest evicted first.

---

## Vague Follow-up Detection

Handles questions like "Where was it?" or "What happened to it?"

```python
vague_indicators = ['it', 'that', 'this', 'there', 'they', 'them', 'its', 'the']

# Strip punctuation! "it?" != "it"
query_words_clean = [w.strip(string.punctuation).lower() for w in query.split()]

is_vague_followup = (
    any(word in vague_indicators for word in query_words_clean) and
    len(query_words_clean) < 8 and  # Short questions
    not any(word in query.lower() for word in existing_topic.lower().split()[:3])
)

if is_vague_followup:
    # Skip Stage 1 teaser - enrich query with current topic
    # "What happened to it?" + "Royal Aquarium" → search for "Royal Aquarium what happened"
```

---

## Topic Change Confirmation

Prevents "elastic band" effect where users can't change topics.

```python
if is_new_topic:
    # User is trying to change topic - ask for confirmation
    set_pending_topic(session_key, teaser_topic, user_msg)

    response_text = f"Ah, {teaser_topic}! Shall we leave {existing_topic} behind and explore {teaser_topic} instead?"

    # Wait for user response:
    # - "Yes" → confirm_pending_topic(), switch anchor
    # - "No" → clear_pending_topic(), stay on current
    # - Other → treat as new query
```

---

## Background Loading

```python
async def load_full_article_background(query: str, session_id: str):
    """Background task: load full article content while user listens to teaser."""

    results = await search_articles(query, limit=3)

    if results.articles:
        content = "\n\n".join([
            f"## {a.title}\n{a.content[:1500]}"
            for a in results.articles[:2]
        ])

        _background_results[session_id] = {
            "query": query,
            "content": content,
            "articles": results.articles,
            "ready": True,
        }

# Called with asyncio.create_task() - doesn't block teaser response
asyncio.create_task(load_full_article_background(query, session_key))
```

---

## Affirmation Detection

```python
AFFIRMATION_WORDS = frozenset([
    'yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'please', 'go',
    'continue', 'more', 'absolutely', 'definitely', 'certainly',
])

AFFIRMATION_PHRASES = frozenset([
    'tell me more', 'go on', 'yes please', 'i would', 'id like',
    'sounds good', 'lets hear it', 'go ahead', 'please do',
])

is_affirmation = (
    text_clean in AFFIRMATION_WORDS or
    text_clean in AFFIRMATION_PHRASES or
    any(phrase in text_clean for phrase in AFFIRMATION_PHRASES)
)
```

---

## Database Schema Requirements

```sql
-- Articles table must have these columns:
ALTER TABLE articles ADD COLUMN IF NOT EXISTS topic_keywords TEXT[];
ALTER TABLE articles ADD COLUMN IF NOT EXISTS teaser_location TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS teaser_era TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS teaser_hook TEXT;

-- Example data:
UPDATE articles SET
    topic_keywords = ARRAY['royal aquarium', 'aquarium', 'westminster', 'victorian entertainment'],
    teaser_location = 'Westminster',
    teaser_era = 'Victorian',
    teaser_hook = 'Built in just 11 months, it housed 25,000 fish'
WHERE title = 'The Royal Aquarium';
```

---

## Performance Breakdown

| Stage | Component | Time |
|-------|-----------|------|
| Stage 1 | Query normalization | ~1ms |
| Stage 1 | Keyword cache lookup | <1ms |
| Stage 1 | Groq LLM teaser generation | ~170ms |
| Stage 1 | SSE streaming setup | ~10ms |
| **Stage 1 Total** | | **~180-250ms** |
| Stage 2 | Database RRF search | ~300-500ms |
| Stage 2 | Content loading | ~100ms |
| Stage 2 | LLM full response | ~300-500ms |
| **Stage 2 Total** | | **~700-1100ms** |

**User perception:** Instant response (Stage 1 completes before user finishes listening)

---

## Potential Improvements

### 1. Pre-warm Popular Topics
```python
# On startup, pre-load content for top 50 most queried topics
POPULAR_TOPICS = ['tower of london', 'great fire', 'jack the ripper', ...]
for topic in POPULAR_TOPICS:
    asyncio.create_task(load_full_article_background(topic, f"preload_{topic}"))
```

### 2. Predictive Loading
```python
# When user asks about topic A, pre-load related topics B and C
related_topics = get_related_topics(current_topic)
for related in related_topics[:2]:
    asyncio.create_task(load_full_article_background(related, session_id))
```

### 3. Semantic Cache Fallback
```python
# If keyword cache misses, try embedding similarity before full search
if not teaser:
    teaser = await get_teaser_by_embedding(query_embedding, threshold=0.85)
```

### 4. Response Caching
```python
# Cache generated responses for identical queries
_response_cache: dict[str, str] = {}  # query_hash -> response
```

### 5. Edge Caching
```python
# Deploy keyword cache to edge (Cloudflare Workers, Vercel Edge)
# Reduces network latency for cache lookups
```

---

## Implementation Checklist for Fractional.quest

- [ ] Add `teaser_*` columns to jobs/pages tables
- [ ] Generate keywords for each job category
- [ ] Create `TeaserData` model for jobs
- [ ] Implement `load_keyword_cache()` at startup
- [ ] Implement `get_teaser_from_cache()`
- [ ] Create fast teaser agent (Groq or Gemini Flash)
- [ ] Add session context management
- [ ] Implement background loading for full job details
- [ ] Add affirmation detection
- [ ] Add conversation history tracking
- [ ] Add topic change confirmation
- [ ] Test end-to-end latency

---

## Benchmarks

### Lost.London (with TSCR)
```
Average TTFB:  633ms (fresh queries)
Min TTFB:      71ms  (cached path)
Max TTFB:      2,210ms (cold start)
Median TTFB:   256ms
```

### Fractional.quest (without TSCR)
```
Average TTFB:  2,478ms
Min TTFB:      1,551ms
Max TTFB:      4,037ms
```

### Improvement Potential
```
Current fractional.quest:  2,478ms
With TSCR (projected):     300-500ms
Improvement:               5-8x faster
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `/Users/dankeegan/lost-london-v2/agent/src/agent.py` | Main implementation |
| `/Users/dankeegan/lost-london-v2/agent/src/database.py` | RRF search, DB queries |
| `/Users/dankeegan/lost-london-v2/agent/src/tools.py` | Phonetic corrections, normalization |
| `/Users/dankeegan/lost-london-v2/CLAUDE.md` | Project documentation |

---

*Documentation generated: January 15, 2026*
