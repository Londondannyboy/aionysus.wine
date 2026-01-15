# Two-Stage Contextual Anchoring (TSCA)

> Learned from: lost.london-v2 (Jan 2026)
> Problem solved: AI "rambling" - going off-topic after 2-3 conversation turns

## The Problem

Without anchoring, multi-turn conversations drift:
```
Turn 1: User asks about "Royal Aquarium" → AI responds about Royal Aquarium ✓
Turn 2: User says "yes" → AI responds about Royal Aquarium ✓
Turn 3: User asks "what happened to it?" → AI talks about Jack Sheppard ✗ (random!)
Turn 4: User asks "where was it?" → AI talks about Whitehall ✗ (wrong!)
```

**Root Cause**: Each turn processed independently with no topic anchor.

## The Solution: TSCA

Anchor every response with:
1. **Current topic context** - What we're discussing
2. **Conversation history** - Recent exchanges
3. **Output format constraints** - Keep responses focused

## The Anchoring Formula

```
ANCHOR = Role + Scenario + Output Format + Topic Context + History
```

### Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **Role** | Set AI's persona | "You are VIC, an expert historian" |
| **Scenario** | Current situation | "User is asking about London history" |
| **Output Format** | Constrain response | "2-3 sentences, end with question" |
| **Topic Context** | Current subject | "CURRENTLY DISCUSSING: Royal Aquarium" |
| **History** | Recent turns | "Recent: User asked about closure date" |

### Implementation

```python
# Session state tracks context
class SessionContext:
    conversation_history: List[Tuple[str, str]]  # [(role, text), ...]
    current_topic_context: str  # "Currently discussing: Royal Aquarium"
    pending_topic: Optional[str]  # For topic change confirmation

# Build anchored prompt
def build_anchored_prompt(query: str, session: SessionContext) -> str:
    return f"""
## ROLE
You are an expert assistant focused on {domain}.

## CURRENT TOPIC
{session.current_topic_context}

## RECENT CONVERSATION
{format_history(session.conversation_history[-3:])}

## USER'S QUESTION
{query}

## RESPONSE RULES
- Stay focused on the current topic
- 2-3 sentences maximum
- Don't repeat facts from recent conversation
- End with a question to continue dialogue
"""
```

## Two Stages Explained

### Stage 1: Instant Response (<0.7s)
- Quick acknowledgment
- Teaser about topic
- Background loading starts

```python
# Stage 1 prompt (fast)
prompt = f"""
PREVIOUSLY DISCUSSING: {previous_topic}
NOW DISCUSSING: {new_topic.title}

User asked: {query}

Give a 1-2 sentence teaser. End with "Shall I tell you more?"
"""
```

### Stage 2: Detailed Response
- Full content loaded
- Context-aware detail
- No repetition of Stage 1 facts

```python
# Stage 2 prompt (detailed)
prompt = f"""
TOPIC: {topic.title}
LOCATION: {topic.location}
ERA: {topic.era}

ALREADY TOLD USER (don't repeat):
{stage1_response}

RECENT CONVERSATION:
{history}

Provide 2-3 new facts. End with question about different aspect.
"""
```

## Anti-Repetition Pattern

Prevent repeating the same facts across turns:

```python
VOICE_SYSTEM_PROMPT = """
## NO REPETITION (CRITICAL)
- Check the RECENT CONVERSATION - don't repeat facts already shared
- If you mentioned "built in 11 months" before, share a DIFFERENT detail
- Say "As I mentioned..." only if briefly referencing, then add NEW info
- Each turn should reveal something NEW about the topic
"""
```

## Results

| Metric | Before TSCA | After TSCA |
|--------|-------------|------------|
| 5-turn topic retention | 30% | 100% |
| Response relevancy | 35% | 100% |
| User satisfaction | 3.5/10 | 9.25/10 |

## When to Use TSCA

| Scenario | Use TSCA? |
|----------|-----------|
| Multi-turn conversations | Yes |
| Voice interfaces | Yes |
| Single Q&A | No (overkill) |
| Form filling | No |
| Code generation | Partial (context helps) |

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No history in prompt | Each turn independent | Include last 3-4 exchanges |
| No topic anchor | AI picks random topic | Explicitly state current topic |
| No output constraints | Responses ramble | Limit to 2-3 sentences |
| Repeating facts | User gets bored | Track what's been said |

## Files to Reference

- `lost.london-v2/agent/src/agent.py:125-200` - SessionContext implementation
- `lost.london-v2/agent/src/agent.py:1109` - generate_fast_teaser with anchoring
- `lost.london-v2/CLAUDE.md` - Full implementation details
