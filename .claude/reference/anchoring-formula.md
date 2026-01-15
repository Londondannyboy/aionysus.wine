# Prompt Anchoring Formula

> The key to effective prompts is giving the model a compact interpretation frame BEFORE asking it to do work.

## The Formula

```
ANCHOR = Role + Scenario + Output Format + Topic Context + History
```

## Component Details

### 1. Role (Who is the AI?)

Set the persona and expertise level:

```
WEAK: "You are a helpful assistant"
STRONG: "You are Sarah, a senior recruitment consultant specializing in
         fractional executive placements with 15 years of experience"
```

**Why it matters**: Role constrains vocabulary, tone, and knowledge boundaries.

### 2. Scenario (What's the situation?)

Establish current context:

```
WEAK: "Help the user"
STRONG: "The user is a startup founder considering their first fractional
         CFO hire. They have limited budget but need financial expertise
         for their Series A preparation."
```

**Why it matters**: Scenario shapes what information is relevant.

### 3. Output Format (How should the response look?)

Constrain structure and length:

```
WEAK: "Provide a good answer"
STRONG: "Respond in exactly 2-3 sentences. End with a clarifying question.
         Do not use bullet points. Use conversational tone."
```

**Why it matters**: Prevents rambling, ensures consistent UX.

### 4. Topic Context (What are we discussing?)

Anchor to specific subject:

```
WEAK: [No context]
STRONG: "CURRENT TOPIC: Fractional CFO salary expectations in London
         RELEVANT DATA: Average day rate £800-1200, typical 2-3 days/week"
```

**Why it matters**: Prevents topic drift in multi-turn conversations.

### 5. History (What's been said?)

Include recent conversation:

```
WEAK: [Each turn independent]
STRONG: "RECENT CONVERSATION:
         User: What do fractional CFOs charge?
         Assistant: Day rates typically range £800-1200 depending on experience.
         User: Is that for startups?"
```

**Why it matters**: Enables follow-up questions, prevents repetition.

## Complete Anchor Example

```python
def build_anchor(user_query: str, context: SessionContext) -> str:
    return f"""
## ROLE
You are Alex, a fractional executive career coach with 10 years experience
placing C-suite leaders in part-time roles across the UK.

## SCENARIO
You're advising a professional considering transitioning to fractional work.
They have strong corporate experience but are new to the fractional model.

## OUTPUT FORMAT
- 2-3 sentences maximum
- Conversational, not formal
- End with ONE follow-up question
- Never use bullet points in voice responses

## CURRENT TOPIC
{context.current_topic or "General fractional career advice"}

## RECENT CONVERSATION
{format_recent_history(context.history, limit=3)}

## USER'S QUESTION
{user_query}

## RESPONSE
[Your response here, following all constraints above]
"""
```

## Anchoring Patterns by Use Case

### Voice Conversations
```
Output Format:
- Keep responses under 30 seconds spoken (~75 words)
- Use natural speech patterns
- Avoid lists (hard to follow in audio)
- End with simple yes/no or choice question
```

### Chat Interfaces
```
Output Format:
- Can use markdown formatting
- Can include bullet points
- Can be slightly longer (100-200 words)
- Can include links/references
```

### Tool-Calling Agents
```
Output Format:
- Decide if tool is needed before responding
- If using tool, explain briefly what you're doing
- After tool result, synthesize for user
- Don't dump raw tool output
```

## Common Anchoring Mistakes

| Mistake | Example | Fix |
|---------|---------|-----|
| Vague role | "Be helpful" | "You are a [specific expert] with [credentials]" |
| No output constraints | [Long rambling] | "2-3 sentences, end with question" |
| Missing history | Repetition | Include last 3-4 exchanges |
| Topic drift | Random tangents | Explicitly state current topic |
| Over-anchoring | Rigid robotic | Balance constraints with natural flow |

## Testing Your Anchors

Run this 5-turn test:
1. Ask initial question
2. Say "yes" or "tell me more"
3. Ask vague follow-up ("what about that?")
4. Ask related question
5. Try to change topic

**Pass criteria**: AI stays on topic for turns 1-4, handles topic change gracefully on turn 5.

## Anchor Templates

### For Job Search Assistant
```
ROLE: Career advisor specializing in {industry}
SCENARIO: User seeking {role_type} opportunities in {location}
OUTPUT: 2-3 sentences, highlight ONE key insight, ask what matters most
TOPIC: {current_job_discussion}
HISTORY: {last_3_turns}
```

### For Technical Assistant
```
ROLE: Senior developer with expertise in {tech_stack}
SCENARIO: User debugging/building {feature_type}
OUTPUT: Explain briefly, show code if needed, verify understanding
TOPIC: {current_file_or_feature}
HISTORY: {last_3_turns}
```

### For Voice Historian (Lost London)
```
ROLE: VIC, Victorian-era historian of London
SCENARIO: User exploring London's hidden history via voice
OUTPUT: 2-3 sentences, dramatic but accurate, end with "Shall I tell you more?"
TOPIC: {current_location_or_event}
HISTORY: {last_3_turns}
```
