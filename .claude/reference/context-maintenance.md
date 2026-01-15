# Context Maintenance in Multi-Turn Conversations

> How to keep AI responses coherent across 5+ conversation turns

## The Challenge

Each AI response is generated independently. Without explicit context management:
- Turn 3 doesn't know what Turn 1 discussed
- AI repeats itself
- Topics drift randomly
- Users get frustrated

## Context Components

### 1. Conversation History

Store recent exchanges:

```python
class SessionContext:
    conversation_history: List[Tuple[str, str]] = []

    def add_to_history(self, role: str, text: str, max_len: int = 200):
        """Add exchange to history, truncate if needed."""
        truncated = text[:max_len] + "..." if len(text) > max_len else text
        self.conversation_history.append((role, truncated))

        # Keep only last N exchanges
        if len(self.conversation_history) > 6:
            self.conversation_history = self.conversation_history[-6:]

    def get_history_context(self) -> str:
        """Format history for prompt injection."""
        if not self.conversation_history:
            return "No previous conversation."

        lines = []
        for role, text in self.conversation_history[-3:]:
            prefix = "User" if role == "user" else "Assistant"
            lines.append(f"{prefix}: {text}")
        return "\n".join(lines)
```

### 2. Current Topic Anchor

Track what we're discussing:

```python
class SessionContext:
    current_topic_context: str = ""

    def set_current_topic(self, topic: str, details: dict = None):
        """Set the current topic anchor."""
        if details:
            self.current_topic_context = f"Currently discussing: {topic}\n"
            self.current_topic_context += f"Location: {details.get('location', 'Unknown')}\n"
            self.current_topic_context += f"Era: {details.get('era', 'Unknown')}"
        else:
            self.current_topic_context = f"Currently discussing: {topic}"
```

### 3. Pending Topic (for topic changes)

Handle intentional topic switches:

```python
class SessionContext:
    pending_topic: Optional[str] = None
    pending_topic_query: Optional[str] = None

    def set_pending_topic(self, topic: str, original_query: str):
        """Queue a topic change for confirmation."""
        self.pending_topic = topic
        self.pending_topic_query = original_query

    def confirm_pending_topic(self) -> Optional[str]:
        """User confirmed topic change - switch anchor."""
        if self.pending_topic:
            self.current_topic_context = f"Currently discussing: {self.pending_topic}"
            query = self.pending_topic_query
            self.pending_topic = None
            self.pending_topic_query = None
            return query
        return None
```

## Session Management

### Session ID Convention

Use stable session IDs that encode useful info:

```python
# Format: "userName|appName_userId|metadata"
session_id = f"{first_name}|fractional_{user_id}|role:{target_role}"

# Examples:
# "Dan|fractional_abc123|role:cfo"
# "Sarah|lostlondon_xyz789|topic:tyburn"
```

### Anti-Re-greeting Logic

Prevent AI from re-greeting on reconnect:

```python
class SessionContext:
    greeted_this_session: bool = False
    last_interaction_time: float = 0

    def should_greet(self) -> bool:
        """Check if we should greet (not re-greet)."""
        now = time.time()
        time_since_last = now - self.last_interaction_time

        # Don't re-greet if:
        # 1. Already greeted this session
        # 2. Last interaction was recent (<5 min)
        if self.greeted_this_session:
            return False
        if time_since_last < 300:  # 5 minutes
            return False
        return True

    def mark_greeted(self):
        self.greeted_this_session = True
        self.last_interaction_time = time.time()
```

## Context Injection Patterns

### Via System Message

```python
def build_system_prompt(session: SessionContext) -> str:
    return f"""
You are [Role].

## CONTEXT
{session.current_topic_context}

## RECENT CONVERSATION
{session.get_history_context()}

## RULES
- Stay on current topic unless user explicitly changes it
- Don't repeat information from recent conversation
- Keep responses focused and concise
"""
```

### Via CopilotKit Instructions

```typescript
// Frontend: Pass context via instructions prop
<CopilotSidebar
  instructions={`
    CURRENT PAGE: ${pageContext}
    USER: ${userName}
    PREVIOUS TOPIC: ${lastDiscussedTopic}

    When user asks about jobs, use update_document_filters action.
    When user says "that job", refer to: ${lastViewedJob?.title}
  `}
/>
```

### Via Middleware Extraction

```python
# Backend: Extract context from incoming messages
@app.middleware("http")
async def extract_context(request: Request, call_next):
    body = await request.json()
    messages = body.get("messages", [])

    for msg in messages:
        if msg.get("role") == "system" and "CURRENT PAGE:" in msg.get("content", ""):
            # Extract and cache page context
            context = parse_page_context(msg["content"])
            request.state.page_context = context

    return await call_next(request)
```

## Memory Integration (Zep)

For persistence across sessions:

```python
from zep_cloud.client import Zep

async def get_user_memory(user_id: str) -> dict:
    """Fetch user's memory from Zep."""
    zep = Zep(api_key=ZEP_API_KEY)

    memory = await zep.memory.get(session_id=f"user_{user_id}")
    facts = memory.facts if memory else []

    return {
        "facts": facts,
        "context": format_facts_for_prompt(facts)
    }

def format_facts_for_prompt(facts: list) -> str:
    """Format Zep facts for prompt injection."""
    if not facts:
        return "No previous information about this user."

    return "What I remember about you:\n" + "\n".join(f"- {f.fact}" for f in facts)
```

## Debugging Context Issues

### Check Session State

```bash
curl https://your-agent.railway.app/debug/session/{session_id} | jq
```

### Log Context in Prompts

```python
logger.info(f"[Context] Topic: {session.current_topic_context}")
logger.info(f"[Context] History: {session.conversation_history[-2:]}")
logger.info(f"[Context] Pending: {session.pending_topic}")
```

### Test Multi-Turn Coherence

Run 5-turn test:
1. Establish topic
2. Ask follow-up
3. Ask vague follow-up ("what about that?")
4. Ask another follow-up
5. Try topic change

All turns should stay coherent until explicit topic change.

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| No history passed | AI repeats itself | Include last 3-4 turns |
| History too long | Context overflow | Truncate to 200 chars each |
| No topic anchor | Random drift | Explicitly state current topic |
| Session resets | Greeting every turn | Use stable session IDs |
| State not persisted | Forgets across refreshes | Use Zep or database |
