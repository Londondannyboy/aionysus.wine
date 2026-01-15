# Vague Follow-up Detection

> Learned from: lost.london-v2 (Jan 2026)
> Problem solved: "What happened to it?" triggering wrong topic search

## The Problem

User asks about Royal Aquarium, then says "What happened to it?"

Without vague detection:
- System searches for "what happened to it" literally
- Returns random unrelated results
- Breaks conversation flow

With vague detection:
- System recognizes this refers to previous topic
- Enriches query: "Royal Aquarium what happened to it"
- Returns relevant results

## Vague Indicators

Words that signal reference to previous topic:

```python
VAGUE_INDICATORS = [
    'it', 'that', 'this', 'there', 'they', 'them', 'its', 'the',
    'those', 'these', 'here', 'where', 'what', 'when', 'who', 'how'
]
```

## Detection Algorithm

```python
import string

def is_vague_followup(query: str, current_topic: str) -> bool:
    """Detect if query is a vague follow-up to current topic."""

    # CRITICAL: Strip punctuation! "it?" != "it"
    query_words = [w.strip(string.punctuation).lower() for w in query.split()]

    # Check for vague indicators
    has_vague_word = any(word in VAGUE_INDICATORS for word in query_words)

    # Short queries are more likely vague
    is_short = len(query_words) < 8

    # Not vague if query contains topic words
    topic_words = current_topic.lower().split()[:3]
    mentions_topic = any(word in query.lower() for word in topic_words)

    return has_vague_word and is_short and not mentions_topic
```

## Critical Bug: Punctuation

```python
# BUG: This fails!
query = "What happened to it?"
query_words = query.split()  # ['What', 'happened', 'to', 'it?']
'it' in query_words  # False! Because 'it?' != 'it'

# FIX: Strip punctuation
query_words = [w.strip(string.punctuation) for w in query.split()]
# ['What', 'happened', 'to', 'it']
'it' in query_words  # True!
```

## Query Enrichment

When vague follow-up detected, prepend current topic:

```python
def enrich_query(query: str, current_topic: str) -> str:
    """Prepend topic to vague queries for better search."""
    if is_vague_followup(query, current_topic):
        return f"{current_topic} {query}"
    return query

# Examples:
# "What happened to it?" → "Royal Aquarium What happened to it?"
# "Where was that?" → "Tyburn Where was that?"
# "Tell me more" → "Royal Aquarium Tell me more"
```

## Integration with TSCA

```python
async def handle_query(query: str, session: SessionContext):
    # Check if vague follow-up
    if is_vague_followup(query, session.current_topic):
        # Don't do new topic search - continue with current topic
        enriched_query = enrich_query(query, session.current_topic)
        return await continue_topic_discussion(enriched_query, session)
    else:
        # New topic - do fresh search
        return await search_new_topic(query, session)
```

## Common Vague Patterns

| Pattern | Indicates |
|---------|-----------|
| "What about it?" | Continue same topic |
| "Tell me more" | Expand on current topic |
| "Where was that?" | Location of current topic |
| "When did that happen?" | Timeline of current topic |
| "Who did that?" | People involved in current topic |
| "Why?" | Reasoning about current topic |
| "How?" | Process/method of current topic |
| "What happened?" | Outcome of current topic |

## Topic Change vs Vague Follow-up

| Query | Type | Action |
|-------|------|--------|
| "What happened to it?" | Vague follow-up | Enrich with topic |
| "Tell me about Tower Bridge" | Topic change | Confirm change, new search |
| "What about Tower Bridge?" | Topic change | Confirm change, new search |
| "That's interesting" | Acknowledgment | Continue topic |
| "Yes" | Confirmation | Stage 2 response |

## Testing Vague Detection

```python
# Test cases
assert is_vague_followup("What happened to it?", "Royal Aquarium") == True
assert is_vague_followup("Where was that?", "Tyburn") == True
assert is_vague_followup("Tell me about Tower Bridge", "Royal Aquarium") == False
assert is_vague_followup("Royal Aquarium closure", "Royal Aquarium") == False
```

## Debug Endpoint

```bash
# Check how query was processed
curl https://your-agent.railway.app/debug/last-request | jq '.is_vague, .enriched_query'
```

## Common Mistakes

| Mistake | Result | Fix |
|---------|--------|-----|
| Not stripping punctuation | "it?" not detected | `strip(string.punctuation)` |
| No length check | Long queries falsely matched | Add `len(words) < 8` |
| No topic word check | "Royal Aquarium more" falsely matched | Check for topic words |
| Over-enrichment | Double topic names | Only enrich if truly vague |
