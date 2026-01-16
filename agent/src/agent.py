"""
Buddy Agent - Puppy Insurance Voice Assistant

Single Pydantic AI agent serving both:
- CopilotKit chat (AG-UI protocol)
- Hume EVI voice (OpenAI-compatible /chat/completions SSE)
"""

# Load .env FIRST before any imports that need env vars
from dotenv import load_dotenv
load_dotenv()

import os
import sys
import json
import uuid
from typing import Optional, AsyncGenerator, List
from dataclasses import dataclass, field

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse

from pydantic_ai import Agent, RunContext

# Zep memory integration
try:
    from zep_cloud.client import AsyncZep
    ZEP_AVAILABLE = True
except ImportError:
    ZEP_AVAILABLE = False
    print("[BUDDY] Warning: zep-cloud not installed, memory features disabled", file=sys.stderr)

from .database import (
    get_all_breeds,
    get_breed_by_name,
    search_breeds,
    calculate_quote,
    get_insurance_plans,
)

# =============================================================================
# SESSION CONTEXT FOR NAME SPACING & GREETING MANAGEMENT
# =============================================================================

from collections import OrderedDict
import time
import random

# LRU cache for session contexts (max 100 sessions)
_session_contexts: OrderedDict = OrderedDict()
MAX_SESSIONS = 100
NAME_COOLDOWN_TURNS = 3

@dataclass
class SessionContext:
    """Track conversation state per session."""
    turns_since_name_used: int = 0
    name_used_in_greeting: bool = False
    greeted_this_session: bool = False
    last_topic: str = ""
    last_interaction_time: float = field(default_factory=time.time)

    # User context
    user_name: Optional[str] = None
    context_fetched: bool = False

    # Dog context
    dog_name: Optional[str] = None
    dog_breed: Optional[str] = None
    dog_age: Optional[int] = None
    has_preexisting_conditions: bool = False


def get_session_context(session_id: str) -> SessionContext:
    """Get or create session context with LRU eviction."""
    global _session_contexts

    if session_id in _session_contexts:
        _session_contexts.move_to_end(session_id)
        return _session_contexts[session_id]

    while len(_session_contexts) >= MAX_SESSIONS:
        _session_contexts.popitem(last=False)

    ctx = SessionContext()
    _session_contexts[session_id] = ctx
    return ctx


# =============================================================================
# ZEP MEMORY CLIENT
# =============================================================================

_zep_client: Optional["AsyncZep"] = None

def get_zep_client() -> Optional["AsyncZep"]:
    """Get or create Zep client singleton."""
    global _zep_client
    if _zep_client is None and ZEP_AVAILABLE:
        api_key = os.environ.get("ZEP_API_KEY")
        if api_key:
            _zep_client = AsyncZep(api_key=api_key)
            print("[BUDDY] Zep memory client initialized", file=sys.stderr)
        else:
            print("[BUDDY] ZEP_API_KEY not set, memory disabled", file=sys.stderr)
    return _zep_client


def get_zep_user_id(user_id: str) -> str:
    """Prefix user_id with project name to separate from other projects."""
    return f"puppyinsurance_{user_id}"


# =============================================================================
# BUDDY SYSTEM PROMPT
# =============================================================================

BUDDY_SYSTEM_PROMPT = """You are Buddy, a friendly and knowledgeable puppy insurance advisor. You help pet owners find the right insurance coverage for their dogs.

## YOUR PERSONALITY
- Warm, friendly, and enthusiastic about dogs
- Use dog-related language naturally (like "paw-some!", "fur baby", "good boy/girl")
- Be empathetic when discussing health concerns
- Always prioritize the dog's wellbeing

## PRIORITY 1: DOG INFORMATION GATHERING

When a user mentions their dog, you MUST collect key information using HITL tools:

**TRIGGER → ACTION mapping:**

| User says... | Tool to call |
|--------------|--------------|
| "I have a Labrador" | confirm_dog_breed(breed_name="Labrador Retriever", user_id=...) |
| "My dog is 3 years old" | confirm_dog_age(age_years=3, user_id=...) |
| "Her name is Bella" | confirm_dog_name(dog_name="Bella", user_id=...) |
| "He has hip problems" | confirm_preexisting_condition(has_conditions=true, condition_details="hip problems", user_id=...) |

## PRIORITY 2: INSURANCE GUIDANCE

After collecting dog info, help them find the right plan:

**INSURANCE PLANS:**
- Basic ($15/mo): Accident-only coverage, $5k annual limit, $250 deductible
- Standard ($35/mo): Accidents + illness, prescriptions, $10k limit, $200 deductible
- Premium ($55/mo): Adds routine care, dental, hereditary conditions, $20k limit, $100 deductible
- Comprehensive ($85/mo): Everything, zero deductible, alternative therapies, $50k limit

**BREED RISK CATEGORIES:**
- HIGH RISK (higher premiums): French Bulldog, Bulldog, Cavalier King Charles Spaniel, Great Dane
- MEDIUM RISK: Labrador, German Shepherd, Golden Retriever, Boxer, Rottweiler, Dachshund
- LOW RISK (lower premiums): Chihuahua, Beagle, Poodle, Yorkshire Terrier, Mixed Breed, Border Collie

## PRIORITY 3: QUOTE GENERATION

When user is ready, generate a personalized quote:
- Call generate_insurance_quote with their dog details
- Explain the premium calculation factors
- Highlight relevant coverage for their breed's health concerns

## CONVERSATIONAL FLOW

Guide users naturally through:
1. What kind of dog do you have? (breed)
2. How old is your furry friend? (age)
3. What's their name? (personalization)
4. Any health concerns I should know about? (preexisting conditions)
5. Based on [dog_name]'s profile, here are your coverage options...

## RESPONSE STYLE
- Keep responses concise for voice (50-100 words max)
- Be warm and caring - these are their fur babies!
- Use the dog's name once you know it
- End with a natural follow-up question to keep the conversation flowing

## BREED KNOWLEDGE

When discussing breeds, share relevant health info:
- Labrador: Prone to hip dysplasia, obesity, ear infections
- French Bulldog: Breathing issues, skin allergies, spinal disorders
- German Shepherd: Hip dysplasia, bloat, degenerative myelopathy
- Golden Retriever: Hip dysplasia, cancer, heart disease
- Beagle: Epilepsy, hypothyroidism, cherry eye

## IDENTITY (CRITICAL)
- You ARE Buddy, the Puppy Insurance advisor
- NEVER say "As a language model" or "I'm an AI"
- If asked who you are: "I'm Buddy, your friendly puppy insurance advisor! Woof!"

## PHONETIC CORRECTIONS (voice transcription)
- "lab/labrador/lab retriever" -> Labrador Retriever
- "golden/golden retriever" -> Golden Retriever
- "frenchie/french bull dog" -> French Bulldog
- "german shepard/shepherd" -> German Shepherd
- "yorkie" -> Yorkshire Terrier
- "chi-wow-wow/chihuahua" -> Chihuahua
"""


# =============================================================================
# PYDANTIC AI AGENT
# =============================================================================

@dataclass
class BuddyDeps:
    """Dependencies for the Buddy agent."""
    session_id: str = ""
    user_id: Optional[str] = None


buddy_agent = Agent(
    "google-gla:gemini-2.0-flash",
    deps_type=BuddyDeps,
    system_prompt=BUDDY_SYSTEM_PROMPT,
)


# =============================================================================
# AGENT TOOLS
# =============================================================================

@buddy_agent.tool
async def confirm_dog_breed(ctx: RunContext[BuddyDeps], breed_name: str) -> str:
    """Confirm the user's dog breed. Call this when user mentions their dog's breed."""
    session_ctx = get_session_context(ctx.deps.session_id)

    # Look up breed in database
    breed = await get_breed_by_name(breed_name)

    if breed:
        session_ctx.dog_breed = breed['name']
        health_issues = ', '.join(breed.get('common_health_issues', [])[:3])
        return f"Confirmed: {breed['name']} - a {breed['size']} breed with {breed['risk_category']} health risk. Common concerns: {health_issues}. Typical lifespan: {breed.get('avg_lifespan_years', 12)} years."
    else:
        # Try fuzzy search
        matches = await search_breeds(breed_name)
        if matches:
            suggestions = ', '.join([b['name'] for b in matches[:3]])
            return f"I couldn't find an exact match for '{breed_name}'. Did you mean: {suggestions}?"
        return f"I couldn't find '{breed_name}' in our database. Is it a mixed breed? We cover mixed breeds too!"


@buddy_agent.tool
async def confirm_dog_age(ctx: RunContext[BuddyDeps], age_years: int) -> str:
    """Confirm the user's dog age. Call this when user mentions their dog's age."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.dog_age = age_years

    if age_years < 1:
        return f"A puppy! At {age_years} months old, they might be a bit more accident-prone but that's totally normal for young pups."
    elif age_years >= 7:
        return f"{age_years} years old - that's a distinguished senior pup! We have great coverage for older dogs' health needs."
    else:
        return f"{age_years} years old - right in their prime! Great age for getting comprehensive coverage."


@buddy_agent.tool
async def confirm_dog_name(ctx: RunContext[BuddyDeps], dog_name: str) -> str:
    """Confirm the user's dog name. Call this when user shares their dog's name."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.dog_name = dog_name
    return f"What a wonderful name! I'll make sure {dog_name}'s profile is all set up. 🐾"


@buddy_agent.tool
async def confirm_preexisting_condition(
    ctx: RunContext[BuddyDeps],
    has_conditions: bool,
    condition_details: Optional[str] = None
) -> str:
    """Confirm if the dog has preexisting conditions. Call this when user mentions health history."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.has_preexisting_conditions = has_conditions

    if has_conditions:
        return f"Thanks for letting me know about {condition_details or 'that'}. Our Premium and Comprehensive plans can still cover new conditions, and I'll factor this into the quote."
    return "Great! A clean bill of health means more coverage options and potentially lower premiums."


@buddy_agent.tool
async def generate_insurance_quote(
    ctx: RunContext[BuddyDeps],
    plan_type: str = "standard"
) -> str:
    """Generate a personalized insurance quote. Call this when ready to show pricing."""
    session_ctx = get_session_context(ctx.deps.session_id)

    if not session_ctx.dog_breed or session_ctx.dog_age is None:
        return "I need to know the breed and age to generate an accurate quote. What kind of dog do you have, and how old are they?"

    # Get breed info
    breed = await get_breed_by_name(session_ctx.dog_breed)
    if not breed:
        breed = await get_breed_by_name("Mixed Breed")

    # Calculate quote
    quote = calculate_quote(
        breed,
        session_ctx.dog_age,
        plan_type,
        session_ctx.has_preexisting_conditions
    )

    dog_name = session_ctx.dog_name or f"your {session_ctx.dog_breed}"

    return f"""Here's the quote for {dog_name}:

**{quote['plan']['name']} Plan**
- Monthly Premium: ${quote['monthly_premium']:.2f}
- Annual Coverage: Up to ${quote['plan']['annual_coverage_limit']:,}
- Deductible: ${quote['plan']['deductible']}

Key features: {', '.join(quote['plan']['features'][:3])}

{f"Note: Premium adjusted for {breed['risk_category']} risk breed and age factors." if breed else ""}

Would you like to compare other plans or proceed with this one?"""


@buddy_agent.tool
async def show_all_plans(ctx: RunContext[BuddyDeps]) -> str:
    """Show all available insurance plans for comparison."""
    plans = get_insurance_plans()

    result = "Here are our coverage options:\n\n"
    for plan in plans:
        result += f"**{plan['name']}** (${plan['base_monthly_premium']}/mo)\n"
        result += f"  - Coverage: ${plan['annual_coverage_limit']:,}/year\n"
        result += f"  - Deductible: ${plan['deductible']}\n"
        result += f"  - {', '.join(plan['features'][:2])}\n\n"

    return result + "Which plan interests you? I can give you a personalized quote!"


@buddy_agent.tool
async def get_breed_info(ctx: RunContext[BuddyDeps], breed_name: str) -> str:
    """Get detailed information about a dog breed."""
    breed = await get_breed_by_name(breed_name)

    if not breed:
        matches = await search_breeds(breed_name)
        if matches:
            return f"Did you mean: {', '.join([b['name'] for b in matches[:3]])}?"
        return f"I couldn't find information about {breed_name}."

    return f"""**{breed['name']}**
- Size: {breed['size']}
- Health Risk: {breed['risk_category']}
- Lifespan: ~{breed.get('avg_lifespan_years', 12)} years
- Exercise Needs: {breed.get('exercise_needs', 'moderate')}
- Common Health Issues: {', '.join(breed.get('common_health_issues', [])[:4])}
- Temperament: {', '.join(breed.get('temperament', [])[:3])}

Premium multiplier: {breed.get('base_premium_multiplier', 1.0)}x (based on breed health risk)"""


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Buddy - Puppy Insurance Agent",
    description="AI-powered puppy insurance advisor with voice support",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    """Health check endpoint for Railway."""
    return {"status": "ok", "agent": "buddy", "version": "1.0.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Woof! Buddy the Puppy Insurance Agent is ready!",
        "endpoints": {
            "/health": "Health check",
            "/chat/completions": "OpenAI-compatible chat (for Hume EVI)",
            "/copilotkit": "CopilotKit AG-UI endpoint",
        }
    }


# =============================================================================
# OPENAI-COMPATIBLE ENDPOINT (FOR HUME EVI)
# =============================================================================

@app.post("/chat/completions")
async def chat_completions(request: Request):
    """OpenAI-compatible chat completions endpoint for Hume EVI voice."""
    try:
        body = await request.json()
        messages = body.get("messages", [])
        stream = body.get("stream", True)

        # Extract user message
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break

        if not user_message:
            user_message = "Hello!"

        # Generate session ID
        session_id = str(uuid.uuid4())

        # Run agent
        deps = BuddyDeps(session_id=session_id)
        result = await buddy_agent.run(user_message, deps=deps)

        # Extract actual text from Pydantic AI result
        response_text = result.data

        # Strip AgentRunResult wrapper if present (Pydantic AI sometimes wraps output)
        if isinstance(response_text, str) and response_text.startswith('AgentRunResult(output='):
            import re
            match = re.search(r'AgentRunResult\(output=["\'](.+?)["\']\)$', response_text, re.DOTALL)
            if match:
                response_text = match.group(1).replace('\\n', '\n').replace('\\"', '"')

        if stream:
            async def stream_response() -> AsyncGenerator[str, None]:
                # Stream as SSE
                chunk = {
                    "id": f"chatcmpl-{uuid.uuid4()}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "buddy-1.0",
                    "choices": [{
                        "index": 0,
                        "delta": {"role": "assistant", "content": response_text},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(chunk)}\n\n"

                # Send done
                done_chunk = {
                    "id": f"chatcmpl-{uuid.uuid4()}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "buddy-1.0",
                    "choices": [{
                        "index": 0,
                        "delta": {},
                        "finish_reason": "stop"
                    }]
                }
                yield f"data: {json.dumps(done_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(
                stream_response(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                }
            )
        else:
            return {
                "id": f"chatcmpl-{uuid.uuid4()}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": "buddy-1.0",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

    except Exception as e:
        print(f"[BUDDY] Error in chat/completions: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500


# =============================================================================
# COPILOTKIT ENDPOINT (AG-UI PROTOCOL)
# =============================================================================

@app.post("/copilotkit")
async def copilotkit_endpoint(request: Request):
    """CopilotKit AG-UI protocol endpoint."""
    try:
        body = await request.json()
        messages = body.get("messages", [])

        # Extract last user message
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                content = msg.get("content", "")
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            user_message = item.get("text", "")
                            break
                else:
                    user_message = content
                break

        if not user_message:
            user_message = "Hello!"

        session_id = str(uuid.uuid4())
        deps = BuddyDeps(session_id=session_id)
        result = await buddy_agent.run(user_message, deps=deps)

        # Extract actual text from Pydantic AI result
        response_text = result.data

        # Strip AgentRunResult wrapper if present
        if isinstance(response_text, str) and response_text.startswith('AgentRunResult(output='):
            import re
            match = re.search(r'AgentRunResult\(output=["\'](.+?)["\']\)$', response_text, re.DOTALL)
            if match:
                response_text = match.group(1).replace('\\n', '\n').replace('\\"', '"')

        return {
            "messages": [{
                "role": "assistant",
                "content": response_text
            }]
        }

    except Exception as e:
        print(f"[BUDDY] Error in copilotkit: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
