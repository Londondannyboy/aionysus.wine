# Pydantic AI Agent Patterns

> Patterns for building Pydantic AI agents with CopilotKit integration

## Official Documentation

- **CopilotKit + Pydantic AI Quickstart**: https://docs.copilotkit.ai/pydantic-ai/quickstart
- **Pydantic AI Docs**: https://ai.pydantic.dev/
- **CoAgents Integration**: https://docs.copilotkit.ai/coagents

## Basic Agent Setup

```python
from pydantic_ai import Agent
from pydantic import BaseModel
from typing import Optional

# Define state model
class AppState(BaseModel):
    jobs: list = []
    search_query: str = ""
    user: Optional[dict] = None

# Define dependencies
class StateDeps(BaseModel):
    state: AppState

# Create agent
agent = Agent(
    'google-gla:gemini-2.0-flash',  # or 'openai:gpt-4'
    system_prompt="You are a helpful assistant...",
    deps_type=StateDeps
)
```

## Tool Definition

### Basic Tool

```python
from pydantic_ai import RunContext

@agent.tool
async def search_jobs(
    ctx: RunContext[StateDeps[AppState]],
    query: str,
    location: Optional[str] = None
) -> dict:
    """Search for jobs matching the query.

    Args:
        query: Search terms for job title or skills
        location: Optional location filter
    """
    # Access state
    state = ctx.deps.state

    # Query database
    jobs = await db_search_jobs(query, location)

    # Update state
    state.jobs = jobs
    state.search_query = query

    # Return result (shown in chat + used by useRenderToolCall)
    return {
        "jobs": jobs,
        "count": len(jobs),
        "query": query
    }
```

### Tool with Human-in-the-Loop

```python
@agent.tool
async def apply_to_job(
    ctx: RunContext[StateDeps[AppState]],
    job_id: int,
    cover_letter: str
) -> dict:
    """Apply to a job. Requires user confirmation.

    Args:
        job_id: The job to apply to
        cover_letter: Cover letter text
    """
    # This will trigger useHumanInTheLoop on frontend
    return {
        "action": "confirm_job_application",
        "job_id": job_id,
        "cover_letter": cover_letter,
        "requires_confirmation": True
    }
```

### Tool with Database Access

```python
import psycopg2
from contextlib import contextmanager

DATABASE_URL = os.environ.get("DATABASE_URL")

@contextmanager
def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    try:
        yield conn
    finally:
        conn.close()

@agent.tool
async def save_user_preference(
    ctx: RunContext[StateDeps[AppState]],
    preference_type: str,
    value: str
) -> dict:
    """Save a user preference.

    Args:
        preference_type: Type of preference (location, role, skill)
        value: The preference value
    """
    user_id = get_effective_user_id(ctx)
    if not user_id:
        return {"error": "User not logged in"}

    with get_db_connection() as conn:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO user_preferences (user_id, type, value)
            VALUES (%s, %s, %s)
            ON CONFLICT (user_id, type) DO UPDATE SET value = %s
        """, (user_id, preference_type, value, value))
        conn.commit()

    return {"saved": True, "type": preference_type, "value": value}
```

## Dynamic System Prompt

```python
@agent.system_prompt_function
async def build_system_prompt(ctx: RunContext[StateDeps[AppState]]) -> str:
    """Build dynamic system prompt based on context."""

    base_prompt = """
You are a career advisor specializing in fractional executive roles.

## YOUR CAPABILITIES
- Search job listings
- Save user preferences
- Provide career advice
"""

    # Add user context if available
    user = ctx.deps.state.user
    if user:
        base_prompt += f"""

## USER CONTEXT
- Name: {user.get('name', 'Unknown')}
- Location: {user.get('location', 'Not set')}
- Target Role: {user.get('role', 'Not specified')}
"""

    # Add page context if available
    page_ctx = getattr(ctx.deps.state, 'page_context', None)
    if page_ctx:
        base_prompt += f"""

## PAGE CONTEXT
User is currently on: {page_ctx.get('page_type', 'Unknown page')}
"""

    return base_prompt
```

## User Context Extraction

```python
# Global cache for extracted user context
_cached_user_context: dict = {}

def extract_user_from_instructions(instructions: str) -> dict:
    """Extract user info from CopilotKit instructions text."""
    result = {"user_id": None, "name": None, "email": None}

    if not instructions:
        return result

    import re

    id_match = re.search(r'User ID:\s*([a-f0-9-]+)', instructions, re.IGNORECASE)
    if id_match:
        result["user_id"] = id_match.group(1)

    name_match = re.search(r'User Name:\s*([^\n]+)', instructions, re.IGNORECASE)
    if name_match:
        result["name"] = name_match.group(1).strip()

    if result["user_id"]:
        global _cached_user_context
        _cached_user_context = result

    return result

def get_effective_user_id(ctx) -> Optional[str]:
    """Get user ID from state or cached instructions."""
    if ctx.deps.state.user and ctx.deps.state.user.get('id'):
        return ctx.deps.state.user['id']
    return _cached_user_context.get("user_id")

def get_effective_user_name(ctx) -> Optional[str]:
    """Get user name from state or cached instructions."""
    if ctx.deps.state.user and ctx.deps.state.user.get('name'):
        return ctx.deps.state.user['name']
    return _cached_user_context.get("name")
```

## Middleware for Context Extraction

```python
from fastapi import Request
import json

@app.middleware("http")
async def extract_user_middleware(request: Request, call_next):
    """Extract user context from CopilotKit instructions before processing."""
    if request.method == "POST":
        try:
            body_bytes = await request.body()
            if body_bytes:
                body = json.loads(body_bytes)
                messages = body.get("messages", [])

                for msg in messages:
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                    if role == "system" and "User ID:" in content:
                        extracted = extract_user_from_instructions(content)
                        if extracted.get("user_id"):
                            print(f"Extracted user: {extracted.get('name')}")

                # Recreate request with body
                async def receive():
                    return {"type": "http.request", "body": body_bytes}
                request = Request(request.scope, receive)
        except Exception as e:
            print(f"Middleware error: {e}")

    return await call_next(request)
```

## Exposing Agent as API

```python
from fastapi import FastAPI

# Main FastAPI app
main_app = FastAPI()

# AG-UI endpoint for CopilotKit
ag_ui_app = agent.to_ag_ui(deps=StateDeps(AppState()))

# Mount AG-UI
main_app.mount("/", ag_ui_app)

# Or mount at specific path
# main_app.mount("/agui", ag_ui_app)

# Optional: Add CLM endpoint for voice
@main_app.post("/chat/completions")
async def clm_endpoint(request: Request):
    # Handle OpenAI-compatible requests for Hume
    ...

# Export for uvicorn
app = main_app
```

## Error Handling in Tools

```python
@agent.tool
async def risky_operation(ctx: RunContext[StateDeps[AppState]], param: str) -> dict:
    """Perform operation that might fail."""
    try:
        result = await do_something_risky(param)
        return {"success": True, "result": result}
    except DatabaseError as e:
        return {"success": False, "error": f"Database error: {str(e)}"}
    except ValidationError as e:
        return {"success": False, "error": f"Invalid input: {str(e)}"}
    except Exception as e:
        # Log unexpected errors
        logger.error(f"Unexpected error in risky_operation: {e}")
        return {"success": False, "error": "An unexpected error occurred"}
```

## Testing Tools

```python
import pytest
from unittest.mock import Mock, AsyncMock

@pytest.mark.asyncio
async def test_search_jobs():
    # Create mock context
    mock_state = AppState(jobs=[], search_query="", user={"id": "123"})
    mock_deps = StateDeps(state=mock_state)
    mock_ctx = Mock()
    mock_ctx.deps = mock_deps

    # Call tool
    result = await search_jobs(mock_ctx, "CTO", "London")

    # Assert
    assert result["count"] >= 0
    assert "jobs" in result
```

## Common Patterns

### Single-Value vs Multi-Value Fields

```python
SINGLE_VALUE_FIELDS = ['location', 'role_preference']  # Only one allowed
MULTI_VALUE_FIELDS = ['skill', 'company']  # Multiple allowed

@agent.tool
async def save_preference(ctx, field: str, value: str) -> dict:
    if field in SINGLE_VALUE_FIELDS:
        # Delete existing, then insert
        await db_execute("DELETE FROM prefs WHERE user_id=%s AND field=%s", (user_id, field))
    await db_execute("INSERT INTO prefs ...", (user_id, field, value))
```

### Normalizing User Input

```python
def normalize_value(value: str, field_type: str) -> str:
    """Normalize values for consistent storage."""
    if field_type == "location":
        return value.strip().title()  # "london" → "London"
    elif field_type == "role_preference":
        return value.strip().upper()  # "cto" → "CTO"
    elif field_type == "skill":
        return value.strip().title()  # "python" → "Python"
    return value.strip()
```

### Tracking Last Discussed Item

```python
class AppState(BaseModel):
    jobs: list = []
    last_discussed_job: Optional[dict] = None  # For "that job" references

@agent.tool
async def search_jobs(ctx, query: str) -> dict:
    jobs = await db_search(query)
    if jobs:
        ctx.deps.state.last_discussed_job = jobs[0]  # Track for follow-ups
    return {"jobs": jobs}
```
