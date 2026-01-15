# Hume Voice Integration

> Patterns for integrating Hume EVI with your application

## Overview

Hume EVI (Empathic Voice Interface) provides:
- Speech-to-text
- Text-to-speech with emotional awareness
- WebSocket connection for real-time voice

## Architecture

```
User speaks → Hume EVI → /chat/completions (CLM) → Your Agent → Response
                ↓
        Text-to-speech → User hears response
```

## Setup

### 1. Hume Dashboard Configuration

1. Create account at platform.hume.ai
2. Create EVI configuration
3. Get Config ID and API keys
4. Set CLM URL to your agent endpoint
5. **Enable "CLM-only mode"** (disable Hume's built-in LLM)

### 2. Environment Variables

```env
HUME_API_KEY=your_api_key
HUME_SECRET_KEY=your_secret_key
NEXT_PUBLIC_HUME_API_KEY=your_api_key
NEXT_PUBLIC_HUME_CONFIG_ID=your_config_id
```

### 3. Token Endpoint (Frontend API Route)

```typescript
// src/app/api/hume-token/route.ts
import { fetchAccessToken } from '@humeai/voice';

export async function GET() {
  try {
    const accessToken = await fetchAccessToken({
      apiKey: process.env.HUME_API_KEY!,
      secretKey: process.env.HUME_SECRET_KEY!,
    });

    return Response.json({ accessToken });
  } catch (error) {
    return Response.json({ error: 'Failed to get token' }, { status: 500 });
  }
}
```

### 4. Voice Widget Component

```tsx
// src/components/voice-input.tsx
'use client';

import { VoiceProvider, useVoice } from '@humeai/voice-react';
import { useState, useEffect } from 'react';

export function VoiceWidget() {
  const [accessToken, setAccessToken] = useState<string>('');

  useEffect(() => {
    fetch('/api/hume-token')
      .then(res => res.json())
      .then(data => setAccessToken(data.accessToken));
  }, []);

  if (!accessToken) return <div>Loading voice...</div>;

  return (
    <VoiceProvider
      auth={{ type: 'accessToken', value: accessToken }}
      configId={process.env.NEXT_PUBLIC_HUME_CONFIG_ID}
    >
      <VoiceControls />
    </VoiceProvider>
  );
}

function VoiceControls() {
  const { connect, disconnect, isConnected, isMuted, mute, unmute } = useVoice();

  return (
    <div>
      {!isConnected ? (
        <button onClick={() => connect()}>Start Voice</button>
      ) : (
        <>
          <button onClick={() => disconnect()}>Stop</button>
          <button onClick={() => isMuted ? unmute() : mute()}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
        </>
      )}
    </div>
  );
}
```

## CLM Endpoint (Custom Language Model)

Hume calls your `/chat/completions` endpoint for responses.

### Requirements

1. **OpenAI-compatible format**
2. **SSE streaming** (Server-Sent Events)
3. **NOT JSON** - must stream chunks

### Implementation

```python
# agent/src/agent.py
from fastapi import FastAPI, Request
from starlette.responses import StreamingResponse
import json

main_app = FastAPI()

async def stream_sse_response(content: str, msg_id: str):
    """Stream OpenAI-compatible SSE chunks for Hume EVI."""
    words = content.split(' ')
    for i, word in enumerate(words):
        chunk = {
            "id": msg_id,
            "object": "chat.completion.chunk",
            "choices": [{
                "index": 0,
                "delta": {"content": word + (' ' if i < len(words) - 1 else '')},
                "finish_reason": None
            }]
        }
        yield f"data: {json.dumps(chunk)}\n\n"

    # Final chunk
    yield f"data: {json.dumps({'choices': [{'delta': {}, 'finish_reason': 'stop'}]})}\n\n"
    yield "data: [DONE]\n\n"

@main_app.post("/chat/completions")
async def clm_endpoint(request: Request):
    """OpenAI-compatible endpoint for Hume EVI."""
    body = await request.json()
    messages = body.get("messages", [])

    # Extract user message
    user_msg = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        ""
    )

    # Process with your agent logic
    response_text = await process_query(user_msg)

    msg_id = f"clm-{hash(user_msg)}"
    return StreamingResponse(
        stream_sse_response(response_text, msg_id),
        media_type="text/event-stream"
    )
```

## Session Management

### Session ID Convention

Encode useful info in session ID:

```python
# Format: "userName|appName_userId|metadata"
session_id = f"{first_name}|fractional_{user_id}"

# Parse in CLM endpoint
def parse_session_id(session_id: str) -> dict:
    parts = session_id.split('|')
    return {
        "user_name": parts[0] if len(parts) > 0 else "User",
        "user_id": parts[1].split('_')[1] if len(parts) > 1 else None
    }
```

### Anti-Re-greeting

Prevent Hume from re-greeting on reconnect:

```typescript
// voice-input.tsx
const [greetedThisSession, setGreetedThisSession] = useState(false);
const [lastInteractionTime, setLastInteractionTime] = useState(0);

const handleConnect = () => {
  const now = Date.now();
  const timeSinceLastInteraction = now - lastInteractionTime;
  const isQuickReconnect = timeSinceLastInteraction < 5 * 60 * 1000; // 5 min

  if (greetedThisSession || isQuickReconnect) {
    // Don't trigger greeting
    connect({ skipGreeting: true });
  } else {
    connect();
    setGreetedThisSession(true);
  }

  setLastInteractionTime(now);
};
```

## Two-Stage Voice Pattern

For responsive voice UX:

### Stage 1: Instant Teaser (<0.7s)

```python
async def generate_fast_teaser(query: str, topic: dict) -> str:
    """Generate quick teaser response."""
    prompt = f"""
    Topic: {topic['title']}
    User asked: {query}

    Give 1-2 sentence teaser. End with "Shall I tell you more?"
    """
    # Use fast model (Groq 8b)
    return await fast_llm.generate(prompt)
```

### Stage 2: Background Loading

```python
async def handle_voice_query(query: str):
    # Stage 1: Instant response
    topic = await quick_topic_lookup(query)
    teaser = await generate_fast_teaser(query, topic)

    # Start background loading
    detailed_task = asyncio.create_task(load_detailed_content(topic))

    # Return teaser immediately
    return teaser

async def handle_followup(query: str):
    # User said "yes" - detailed content should be ready
    if query.lower() in ['yes', 'sure', 'tell me more']:
        return await get_preloaded_content()
```

## FFT Audio Data

Hume provides FFT (frequency) data for visualizations:

```tsx
import { useVoice } from '@humeai/voice-react';

function AudioVisualizer() {
  const { fft, micFft, isPlaying } = useVoice();

  // Use assistant FFT when AI is speaking
  const currentFft = isPlaying ? fft : micFft;

  // Calculate amplitude (0-1)
  const amplitude = calculateAmplitude(currentFft);

  return <VisualizerComponent amplitude={amplitude} />;
}

function calculateAmplitude(fftValues: number[] | undefined): number {
  if (!fftValues || fftValues.length === 0) return 0;
  const sum = fftValues.reduce((acc, val) => acc + Math.abs(val), 0);
  const avg = sum / fftValues.length;
  return Math.min(avg / 50, 1);  // Normalize to 0-1
}
```

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "I don't have access to that" | Hume using its own LLM | Enable CLM-only mode in dashboard |
| Silent responses | CLM returning JSON not SSE | Use `StreamingResponse` with `text/event-stream` |
| Greeting every message | Session ID changing | Use stable session ID |
| Latency >2 seconds | Too many hops | Use fast model, cache common queries |
| "Illegal header value" | Newline in API key | Re-add env var without trailing newline |

## Voice-Specific Prompt Tips

```python
VOICE_PROMPT = """
## VOICE OUTPUT RULES
- Keep responses under 30 seconds spoken (~75 words)
- Use natural speech patterns, not bullet points
- End with a simple question
- Avoid lists (hard to follow in audio)
- Don't spell out URLs or technical terms
- Use conversational connectors ("So...", "Now...", "Actually...")
"""
```

## Testing Voice

```bash
# Test CLM endpoint directly
curl -X POST 'https://your-agent.railway.app/chat/completions' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Should return SSE stream, NOT JSON
```

## Deployment

### Vercel (if separate CLM service)

```
Runtime: Python 3.11
Build Command: pip install -r requirements.txt
Output Directory: (leave blank)
```

### Railway (consolidated with agent)

Mount CLM at `/chat/completions` in same FastAPI app:

```python
main_app = FastAPI()

@main_app.post("/chat/completions")
async def clm_endpoint(...): ...

ag_ui_app = agent.to_ag_ui(deps=...)
main_app.mount("/", ag_ui_app)

app = main_app
```

Configure Hume dashboard:
- CLM URL: `https://your-app.railway.app/chat/completions`
