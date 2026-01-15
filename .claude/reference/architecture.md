# Three-Service Architecture

> The validated architecture for AI-first web applications

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐         ┌──────────────┐         ┌────────────┐ │
│   │   VERCEL     │         │   VERCEL     │         │  RAILWAY   │ │
│   │  (Next.js)   │         │  (Python)    │         │  (Python)  │ │
│   │              │         │  [Optional]  │         │            │ │
│   │ Frontend     │ ──────► │  CLM for     │ ──────► │  Pydantic  │ │
│   │ + CopilotKit │         │  Hume Voice  │         │  AI Agent  │ │
│   │              │         │              │         │            │ │
│   └──────────────┘         └──────────────┘         └────────────┘ │
│          │                        ▲                       ▲        │
│          │                        │                       │        │
│          └────────────────────────┼───────────────────────┘        │
│                                   │                                 │
│                            ┌──────────────┐                        │
│                            │   HUME AI    │                        │
│                            │   (Voice)    │                        │
│                            │  [Optional]  │                        │
│                            └──────────────┘                        │
│                                                                      │
│   External Services:                                                │
│   ├── Neon PostgreSQL (Database)                                   │
│   ├── Zep (Memory/Facts)                                           │
│   └── Google AI / OpenAI (LLM)                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Why Three Services?

| Service | Purpose | Why Separate? |
|---------|---------|---------------|
| **Frontend (Vercel)** | Next.js, React, CopilotKit UI | Fast edge deployment, static assets |
| **CLM (Vercel Python)** | OpenAI-compatible endpoint for Hume | Hume requires specific SSE format |
| **Agent (Railway)** | Pydantic AI, tools, database, logic | Long-running Python, needs Railway |

## The Single Brain Principle

> One agent (brain), multiple interfaces (chat + voice)

**Problem we solved**: Hume and CopilotKit using different LLMs = inconsistent responses

**Solution**: Both interfaces call the same Pydantic AI agent

```
CopilotKit Chat → AG-UI Protocol → Pydantic AI Agent → Response
Hume Voice      → CLM Endpoint   → Pydantic AI Agent → Response
                                          ↓
                               Same tools, same memory, same logic
```

## Service Details

### 1. Frontend (Vercel - Next.js)

**Responsibilities**:
- React UI components
- CopilotKit provider and sidebar
- API routes for tokens, auth
- Static page rendering

**Key files**:
```
src/
├── app/
│   ├── page.tsx           # Main page with CopilotKit
│   └── api/
│       ├── hume-token/    # Hume access tokens
│       └── user-profile/  # User data endpoints
├── components/
│   ├── voice-input.tsx    # Hume voice widget
│   └── charts.tsx         # Generative UI components
└── lib/
    └── auth/              # Authentication
```

**Environment**:
```
NEXT_PUBLIC_HUME_API_KEY=...
AGENT_URL=https://your-agent.railway.app
DATABASE_URL=postgresql://...
```

### 2. CLM Service (Vercel Python) - Optional

Only needed if using Hume voice.

**Responsibilities**:
- OpenAI-compatible `/chat/completions` endpoint
- SSE streaming responses
- Route requests to main agent

**Key pattern**:
```python
async def stream_sse_response(content: str, msg_id: str):
    """Stream OpenAI-compatible SSE chunks for Hume."""
    words = content.split(' ')
    for word in words:
        chunk = {
            "id": msg_id,
            "object": "chat.completion.chunk",
            "choices": [{"delta": {"content": word + ' '}}]
        }
        yield f"data: {json.dumps(chunk)}\n\n"
    yield "data: [DONE]\n\n"

@app.post("/chat/completions")
async def clm_endpoint(request: Request):
    # Parse request, call agent, stream response
    return StreamingResponse(stream_sse_response(...), media_type="text/event-stream")
```

### 3. Agent (Railway - Pydantic AI)

**Responsibilities**:
- THE BRAIN - all business logic
- Tool definitions and execution
- Database queries
- Zep memory integration
- State management

**Key files**:
```
agent/
├── src/
│   └── agent.py          # Agent definition, tools, CLM endpoint
├── pyproject.toml        # Dependencies
└── Procfile              # Railway start command
```

**Procfile**:
```
web: uvicorn src.agent:app --host 0.0.0.0 --port $PORT
```

## Communication Protocols

### AG-UI (CopilotKit ↔ Agent)

CopilotKit uses AG-UI protocol for structured communication:

```python
from pydantic_ai import Agent

agent = Agent(...)
app = agent.to_ag_ui(deps=StateDeps(AppState()))
```

Frontend connects:
```typescript
<CopilotKit runtimeUrl="https://your-agent.railway.app">
```

### CLM (Hume ↔ Agent)

Hume EVI uses OpenAI-compatible endpoint:

```python
@app.post("/chat/completions")
async def clm_endpoint(request: Request):
    body = await request.json()
    messages = body.get("messages", [])
    # Process and return SSE stream
```

Configure in Hume dashboard:
- CLM URL: `https://your-agent.railway.app/chat/completions`
- Enable "CLM-only mode" (disable Hume's built-in LLM)

## Deployment Checklist

### Frontend (Vercel)
- [ ] Connect GitHub repo
- [ ] Set environment variables
- [ ] Configure build settings (Next.js detected automatically)
- [ ] Deploy

### Agent (Railway)
- [ ] Create new project
- [ ] Connect GitHub repo (point to `/agent` subdirectory)
- [ ] Set environment variables
- [ ] Add Procfile
- [ ] Deploy
- [ ] Note public URL

### CLM (if using voice)
- [ ] Create Vercel Python project
- [ ] Set AGENT_URL to Railway URL
- [ ] Deploy
- [ ] Configure Hume dashboard with CLM URL

## Common Architecture Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "Different answers from chat vs voice" | Two separate LLMs | Ensure both use same agent |
| "Agent not responding" | Railway sleeping | Check Railway logs, wake up |
| "Voice returns JSON not speech" | CLM not streaming SSE | Use `StreamingResponse` with `text/event-stream` |
| "Context not passed" | Frontend not sending instructions | Check CopilotSidebar `instructions` prop |
| "Database timeouts" | Connection not pooled | Add connection pooling |

## Scaling Considerations

| Component | Scaling Approach |
|-----------|------------------|
| Frontend | Vercel auto-scales edge |
| Agent | Railway vertical scaling |
| Database | Neon auto-scales |
| Voice | Hume handles scaling |

## Cost Optimization

| Service | Cost Driver | Optimization |
|---------|-------------|--------------|
| Vercel | Bandwidth, functions | Edge caching, ISR |
| Railway | Compute hours | Sleep when idle |
| Neon | Compute, storage | Connection pooling |
| Hume | Minutes of voice | Efficient prompts |
| LLM | Tokens | Caching, shorter prompts |

---

## ionicest.wine V3 Specifics

### Database Schema

```sql
-- Core wine data (scraped + AI-enriched)
CREATE TABLE wines (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  winery TEXT,
  vintage INTEGER,
  price_retail DECIMAL(10,2) NOT NULL,
  region TEXT,
  country TEXT,
  wine_type TEXT,
  investment_score INTEGER,
  drinking_window_start INTEGER,
  drinking_window_peak INTEGER,
  drinking_window_end INTEGER,
  estimated_critic_score INTEGER,
  body TEXT,
  tannins TEXT,
  acidity TEXT,
  aromas TEXT[],
  flavors TEXT[],
  tasting_notes TEXT,
  mdx_content TEXT,
  shopify_product_id TEXT,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE wine_regions (
  slug TEXT UNIQUE,
  name TEXT,
  country TEXT,
  seo_content TEXT
);

CREATE TABLE food_pairings (
  slug TEXT UNIQUE,
  name TEXT,
  category TEXT
);

CREATE TABLE wine_food_pairings (
  wine_id INTEGER REFERENCES wines(id),
  pairing_id INTEGER REFERENCES food_pairings(id),
  pairing_score INTEGER
);
```

### Page Routes

| Route | Purpose |
|-------|---------|
| `/` | Homepage with voice widget |
| `/wines` | Browse all wines |
| `/wines/[slug]` | MDX investment dashboard |
| `/wines/region/[region]` | Regional collection |
| `/wines/for-[food]` | Food pairing page |
| `/wines/under-[price]` | Price tier page |

### Agent Tools

| Tool | Description |
|------|-------------|
| `search_wines` | Search with filters (region, type, price) |
| `get_wine` | Get full wine details by slug |
| `recommend_pairing` | Get wines for a food |
| `compare_wines` | Side-by-side comparison |
| `add_to_cart` | Add to Shopify cart |
