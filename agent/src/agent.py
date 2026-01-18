"""
Penelope Agent - UK Pension Advisor Voice Assistant

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
    print("[PENELOPE] Warning: zep-cloud not installed, memory features disabled", file=sys.stderr)

from .database import (
    get_all_schemes,
    get_scheme_by_name,
    search_schemes,
    get_schemes_by_type,
    get_scheme_details,
    get_scheme_funds,
    compare_scheme_fees,
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

    # Pension context
    current_scheme: Optional[str] = None
    scheme_type_preference: Optional[str] = None
    contribution_amount: Optional[float] = None
    retirement_age: Optional[int] = None
    current_age: Optional[int] = None


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
            print("[PENELOPE] Zep memory client initialized", file=sys.stderr)
        else:
            print("[PENELOPE] ZEP_API_KEY not set, memory disabled", file=sys.stderr)
    return _zep_client


def get_zep_user_id(user_id: str) -> str:
    """Prefix user_id with project name to separate from other projects."""
    return f"penelope_{user_id}"


# =============================================================================
# PENELOPE SYSTEM PROMPT
# =============================================================================

PENELOPE_SYSTEM_PROMPT = """You are Penelope, a friendly and knowledgeable UK pension expert. You help people understand pensions, compare schemes, and plan for retirement.

## YOUR PERSONALITY
- Warm, friendly, and reassuring - pensions can be confusing!
- Clear, jargon-free explanations of complex pension topics
- Professional but approachable - like a helpful friend who happens to be a pension expert
- Always mention FCA regulation where relevant for credibility
- Encourage people to seek professional advice for complex decisions

## PRIORITY 1: PENSION DISCOVERY

When a user asks about pensions, use the appropriate tools:

**TRIGGER -> ACTION mapping:**

| User says... | Tool to call |
|--------------|--------------|
| "What SIPPs are available?" | search_pension_schemes(query="SIPP") |
| "Tell me about Vanguard" | get_scheme_details(scheme_name="Vanguard") |
| "Show me workplace pensions" | get_schemes_by_type(scheme_type="workplace") |
| "Compare NEST and People's Pension" | compare_schemes(scheme1="NEST", scheme2="People's Pension") |
| "What fees does Hargreaves charge?" | compare_pension_fees(scheme_names=["Hargreaves Lansdown"]) |
| "How much will I have at retirement?" | calculate_retirement_income(...) |

## PRIORITY 2: PENSION EDUCATION

Share clear explanations of:

**PENSION TYPES:**
- Workplace pensions: Auto-enrolment schemes via employer (NEST, People's Pension, NOW:)
- Personal pensions: Individual arrangements (Aviva, Scottish Widows, L&G)
- SIPPs: Self-Invested Personal Pensions for DIY investors (Vanguard, AJ Bell, HL)
- State Pension: Government pension based on NI contributions
- Defined Benefit: Final salary schemes (rare, but valuable)

**KEY NUMBERS (2024/25):**
- Auto-enrolment minimum: 8% total (3% employer, 5% employee)
- Tax relief: 20%, 40%, 45% depending on tax band
- Annual allowance: £60,000
- Lifetime allowance: Abolished April 2024
- State pension age: 66 (rising to 67 by 2028)
- Pension freedoms: Age 55 (rising to 57 in 2028)
- Full state pension: £221.20/week (2024/25)

**MAJOR PROVIDERS:**
- Workplace: NEST, People's Pension, NOW: Pensions, Smart Pension
- SIPP: Vanguard, AJ Bell, Hargreaves Lansdown, Fidelity, Interactive Investor
- Traditional: Aviva, Scottish Widows, Legal & General, Standard Life

## PRIORITY 3: FEE COMPARISON

Help users understand fees:
- Annual Management Charge (AMC): Typically 0.15% - 1.5%
- Platform fees: Some charge flat fees, others percentage
- Transaction fees: May apply for buying/selling
- Lower fees compound to significant savings over time

## CONVERSATIONAL FLOW

Guide users naturally through:
1. What type of pension are you interested in? (workplace, SIPP, personal)
2. What's your situation? (employed, self-employed, approaching retirement)
3. What matters most? (low fees, investment choice, simplicity)
4. Based on your needs, here are my recommendations...

## RESPONSE STYLE
- Keep responses concise for voice (50-100 words max)
- Be warm and reassuring - pensions can feel overwhelming!
- Use the user's name once you know it
- Explain jargon when you use it
- End with a natural follow-up to keep the conversation flowing

## PENSION TIPS TO SHARE

When relevant:
- "Always get your employer match - it's free money!"
- "Tax relief means you get 20-45% of your contribution back"
- "Lower fees compound to big savings over decades"
- "The state pension alone won't maintain most people's lifestyle"
- "It's never too late to start - but the earlier the better"
- "Consider consolidating old pensions for simplicity"

## IDENTITY (CRITICAL)
- You ARE Penelope, the friendly pension guide
- NEVER say "As a language model" or "I'm an AI"
- If asked who you are: "I'm Penelope, your pension guide! I'm here to make retirement planning simple and help you understand your options."
- Always recommend consulting a regulated financial adviser for personal advice

## USER PERSONALIZATION
- If the user's name is provided in [brackets] at the start of their message, USE IT naturally
- Greet returning users by name: "Welcome back, [Name]! Ready to continue planning your retirement?"
- Use their name occasionally but not excessively (every 2-3 exchanges is good)
- Remember their preferences within the session

## PHONETIC CORRECTIONS (voice transcription)
- "sip/sipp" -> SIPP (Self-Invested Personal Pension)
- "nest/ness" -> NEST (National Employment Savings Trust)
- "isa/eyes-a" -> ISA (but clarify this is different from a pension)
- "annuity/annuity" -> Annuity
- "drawdown/draw down" -> Drawdown
"""


# =============================================================================
# PYDANTIC AI AGENT
# =============================================================================

@dataclass
class PenelopeDeps:
    """Dependencies for the Penelope agent."""
    session_id: str = ""
    user_id: Optional[str] = None


penelope_agent = Agent(
    "google-gla:gemini-2.0-flash",
    deps_type=PenelopeDeps,
    system_prompt=PENELOPE_SYSTEM_PROMPT,
)


# =============================================================================
# AGENT TOOLS
# =============================================================================

@penelope_agent.tool
async def search_pension_schemes(
    ctx: RunContext[PenelopeDeps],
    query: str,
    scheme_type: Optional[str] = None,
) -> str:
    """Search for pension schemes by name, provider, or type. Call this when user asks about specific pension schemes."""
    session_ctx = get_session_context(ctx.deps.session_id)

    schemes = await search_schemes(query)

    # Filter by type if specified
    if scheme_type and schemes:
        schemes = [s for s in schemes if s.get('scheme_type', '').lower() == scheme_type.lower()]

    if schemes:
        session_ctx.current_scheme = schemes[0].get('name')
        results = []
        for scheme in schemes[:5]:
            amc = scheme.get('annual_management_charge')
            amc_str = f" | AMC: {amc}%" if amc else ""
            rating = scheme.get('performance_rating', '')
            rating_str = f" | {'*' * rating}" if rating else ""
            results.append(f"- {scheme['name']} ({scheme.get('provider', 'Unknown')}){amc_str}{rating_str}")
        return f"Found these pension schemes matching '{query}':\n" + "\n".join(results)
    else:
        return f"I couldn't find pension schemes matching '{query}'. Would you like me to suggest some popular options?"


@penelope_agent.tool
async def get_scheme_details(ctx: RunContext[PenelopeDeps], scheme_name: str) -> str:
    """Get detailed information about a specific pension scheme. Call this when user wants to know more about a scheme."""
    session_ctx = get_session_context(ctx.deps.session_id)

    scheme = await get_scheme_by_name(scheme_name)

    if scheme:
        session_ctx.current_scheme = scheme['name']

        # Build detailed response
        details = [f"**{scheme['name']}** by {scheme.get('provider', 'Unknown')}"]
        if scheme.get('scheme_type'):
            details.append(f"Type: {scheme['scheme_type'].title()}")
        if scheme.get('annual_management_charge'):
            details.append(f"Annual Management Charge: {scheme['annual_management_charge']}%")
        if scheme.get('platform_fee'):
            details.append(f"Platform Fee: {scheme['platform_fee']}%")
        if scheme.get('min_contribution'):
            details.append(f"Minimum Contribution: £{scheme['min_contribution']}/month")
        if scheme.get('fund_options'):
            details.append(f"Fund Options: {scheme['fund_options']} funds available")
        if scheme.get('sipp_available'):
            details.append("SIPP Available: Yes")
        if scheme.get('drawdown_available'):
            details.append("Drawdown Available: Yes")
        if scheme.get('fca_regulated'):
            details.append("FCA Regulated: Yes")
        if scheme.get('performance_rating'):
            details.append(f"Rating: {'*' * scheme['performance_rating']} ({scheme['performance_rating']}/5)")
        if scheme.get('features'):
            features = scheme['features'][:4] if isinstance(scheme['features'], list) else [scheme['features']]
            details.append(f"Features: {', '.join(features)}")
        if scheme.get('suitable_for'):
            suitable = scheme['suitable_for'][:3] if isinstance(scheme['suitable_for'], list) else [scheme['suitable_for']]
            details.append(f"Best for: {', '.join(suitable)}")

        return "\n".join(details)
    else:
        matches = await search_schemes(scheme_name)
        if matches:
            suggestions = ', '.join([s['name'] for s in matches[:3]])
            return f"I couldn't find an exact match for '{scheme_name}'. Did you mean: {suggestions}?"
        return f"I couldn't find information about '{scheme_name}'. Could you tell me more about what you're looking for?"


@penelope_agent.tool
async def get_schemes_by_type(ctx: RunContext[PenelopeDeps], scheme_type: str) -> str:
    """Get pension schemes by type (workplace, sipp, personal, stakeholder). Call this when user asks for a specific type."""
    schemes = await get_schemes_by_type(scheme_type)

    if schemes:
        results = []
        for scheme in schemes[:6]:
            amc = scheme.get('annual_management_charge')
            amc_str = f" - AMC: {amc}%" if amc else ""
            results.append(f"- {scheme['name']} ({scheme.get('provider', 'Unknown')}){amc_str}")

        type_descriptions = {
            'workplace': 'Workplace pensions are provided by employers under auto-enrolment. Your employer contributes too!',
            'sipp': 'SIPPs (Self-Invested Personal Pensions) give you full control over your investments.',
            'personal': 'Personal pensions are individual arrangements, good for self-employed or additional savings.',
            'stakeholder': 'Stakeholder pensions have capped charges and flexible contributions.',
        }
        description = type_descriptions.get(scheme_type.lower(), '')

        return f"Here are some {scheme_type} pensions:\n" + "\n".join(results) + (f"\n\n{description}" if description else "")
    else:
        return f"I don't have any {scheme_type} pensions in my database. The main types are: workplace, SIPP, personal, and stakeholder."


@penelope_agent.tool
async def compare_schemes(ctx: RunContext[PenelopeDeps], scheme1: str, scheme2: str) -> str:
    """Compare two pension schemes side by side. Call this when user wants to compare schemes."""
    s1 = await get_scheme_by_name(scheme1)
    s2 = await get_scheme_by_name(scheme2)

    if not s1 and not s2:
        return f"I couldn't find either '{scheme1}' or '{scheme2}' in my database. Could you check the names?"
    elif not s1:
        return f"I found {s2['name']} but couldn't find '{scheme1}'. Would you like details on {s2['name']}?"
    elif not s2:
        return f"I found {s1['name']} but couldn't find '{scheme2}'. Would you like details on {s1['name']}?"

    comparison = f"**{s1['name']}** vs **{s2['name']}**\n\n"

    # Compare key attributes
    attrs = [
        ('Provider', 'provider'),
        ('Type', 'scheme_type'),
        ('AMC', 'annual_management_charge'),
        ('Platform Fee', 'platform_fee'),
        ('Min Contribution', 'min_contribution'),
        ('Fund Options', 'fund_options'),
        ('Rating', 'performance_rating'),
    ]

    for label, key in attrs:
        v1 = s1.get(key, 'N/A')
        v2 = s2.get(key, 'N/A')
        if key in ['annual_management_charge', 'platform_fee']:
            v1 = f"{v1}%" if v1 != 'N/A' else 'N/A'
            v2 = f"{v2}%" if v2 != 'N/A' else 'N/A'
        elif key == 'min_contribution':
            v1 = f"£{v1}/mo" if v1 != 'N/A' else 'N/A'
            v2 = f"£{v2}/mo" if v2 != 'N/A' else 'N/A'
        elif key == 'performance_rating':
            v1 = f"{'*' * v1}" if v1 != 'N/A' and v1 else 'N/A'
            v2 = f"{'*' * v2}" if v2 != 'N/A' and v2 else 'N/A'
        comparison += f"**{label}:** {v1} | {v2}\n"

    return comparison


@penelope_agent.tool
async def compare_pension_fees(ctx: RunContext[PenelopeDeps], scheme_names: List[str]) -> str:
    """Compare fees between multiple pension schemes. Call this when user asks about fees."""
    results = await compare_scheme_fees(scheme_names)

    if results:
        comparison = "**Fee Comparison:**\n\n"
        for scheme in results:
            amc = scheme.get('annual_management_charge', 'N/A')
            platform = scheme.get('platform_fee', 'N/A')
            comparison += f"**{scheme['name']}**\n"
            comparison += f"  - AMC: {amc}%\n" if amc != 'N/A' else "  - AMC: Not specified\n"
            comparison += f"  - Platform: {platform}%\n\n" if platform != 'N/A' else "  - Platform: None/included\n\n"

        comparison += "\n*Lower fees compound to big savings over decades!*"
        return comparison
    else:
        return "I couldn't find fee information for those schemes. Which pension providers would you like me to compare?"


@penelope_agent.tool
async def calculate_retirement_income(
    ctx: RunContext[PenelopeDeps],
    current_age: int,
    retirement_age: int,
    monthly_contribution: float,
    current_pot: float = 0,
    employer_contribution: float = 0,
    expected_return: float = 5.0
) -> str:
    """Calculate estimated retirement pot based on contributions. Call this when user asks about retirement projections."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.current_age = current_age
    session_ctx.retirement_age = retirement_age
    session_ctx.contribution_amount = monthly_contribution

    years_to_retirement = retirement_age - current_age
    if years_to_retirement <= 0:
        return "It looks like you've already reached or passed your retirement age! Would you like to discuss drawdown options instead?"

    # Calculate future value with compound interest
    total_monthly = monthly_contribution + employer_contribution
    monthly_rate = (expected_return / 100) / 12
    months = years_to_retirement * 12

    # Future value of existing pot
    future_pot = current_pot * ((1 + expected_return / 100) ** years_to_retirement)

    # Future value of monthly contributions (annuity formula)
    if monthly_rate > 0:
        future_contributions = total_monthly * (((1 + monthly_rate) ** months - 1) / monthly_rate)
    else:
        future_contributions = total_monthly * months

    total_pot = future_pot + future_contributions

    # Estimate annual income (4% safe withdrawal rate)
    annual_income = total_pot * 0.04
    monthly_income = annual_income / 12

    result = f"""**Your Retirement Projection:**

**Assumptions:**
- Current age: {current_age}
- Retirement age: {retirement_age}
- Years to retirement: {years_to_retirement}
- Monthly contribution: £{monthly_contribution:,.0f}
- Employer contribution: £{employer_contribution:,.0f}
- Current pension pot: £{current_pot:,.0f}
- Expected annual return: {expected_return}%

**Estimated Results:**
- Projected pension pot: **£{total_pot:,.0f}**
- Estimated monthly income (4% withdrawal): **£{monthly_income:,.0f}**
- Plus state pension: ~£{221.20 * 4.33:,.0f}/month (if full entitlement)

*These are estimates only. Actual returns may vary. Consider speaking to a financial adviser for personal advice.*"""

    return result


@penelope_agent.tool
async def show_pension_providers(ctx: RunContext[PenelopeDeps]) -> str:
    """Show all available pension providers in the database."""
    schemes = await get_all_schemes()

    if schemes:
        providers = {}
        for scheme in schemes:
            provider = scheme.get('provider', 'Unknown')
            scheme_type = scheme.get('scheme_type', 'pension')
            key = provider
            if key not in providers:
                providers[key] = {'count': 0, 'types': set()}
            providers[key]['count'] += 1
            providers[key]['types'].add(scheme_type)

        sorted_providers = sorted(providers.items(), key=lambda x: -x[1]['count'])[:10]
        result = "**Pension providers in my database:**\n"
        for provider, info in sorted_providers:
            types = ', '.join(info['types'])
            result += f"- {provider} ({types})\n"
        return result
    else:
        return "I'm having trouble accessing my pension database at the moment."


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Penelope - UK Pension Advisor",
    description="Friendly AI pension advisor with voice support",
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
    return {"status": "ok", "agent": "penelope", "version": "1.0.0"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Hello! I'm Penelope, your friendly guide to UK pensions!",
        "endpoints": {
            "/health": "Health check",
            "/chat/completions": "OpenAI-compatible chat (for Hume EVI)",
            "/copilotkit": "CopilotKit AG-UI endpoint",
        }
    }


# =============================================================================
# SESSION/USER EXTRACTION HELPERS
# =============================================================================

def extract_session_id(request: Request, body: dict) -> Optional[str]:
    """Extract custom_session_id from Hume request."""
    # Check query parameters FIRST (Hume passes it here!)
    session_id = request.query_params.get("custom_session_id") or request.query_params.get("customSessionId")
    if session_id:
        print(f"[PENELOPE] Session ID from query params: {session_id}", file=sys.stderr)
        return session_id

    # Check body fields (Hume forwards session settings here)
    session_id = body.get("custom_session_id") or body.get("customSessionId")
    if session_id:
        return session_id

    # Check session_settings (Hume may forward this)
    session_settings = body.get("session_settings", {})
    if session_settings:
        session_id = session_settings.get("customSessionId") or session_settings.get("custom_session_id")
        if session_id:
            return session_id

    # Check metadata
    metadata = body.get("metadata", {})
    if metadata:
        session_id = metadata.get("customSessionId") or metadata.get("custom_session_id")
        if session_id:
            return session_id

    # Check headers
    for header in ["x-custom-session-id", "x-hume-custom-session-id"]:
        session_id = request.headers.get(header)
        if session_id:
            return session_id

    return None


def extract_user_from_session(session_id: Optional[str]) -> tuple[Optional[str], Optional[str]]:
    """Extract user_name and user_id from session_id. Format: 'name|userId'"""
    if not session_id or '|' not in session_id:
        return None, None

    parts = session_id.split('|')
    user_name = parts[0] if parts[0] and parts[0].lower() != 'user' else None
    user_id = parts[1] if len(parts) > 1 else None

    return user_name, user_id


def extract_user_from_messages(messages: list) -> tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Extract user info from system message (Hume forwards systemPrompt as system message).
    Returns: (user_name, user_id, zep_context)
    """
    import re

    user_name = None
    user_id = None
    zep_context = None

    for msg in messages:
        if msg.get("role") == "system":
            content = msg.get("content", "")

            # Extract name: field
            name_match = re.search(r'name:\s*([^\n]+)', content, re.IGNORECASE)
            if name_match:
                name = name_match.group(1).strip()
                if name.lower() not in ['guest', 'anonymous', '']:
                    user_name = name

            # Extract user_id: field
            id_match = re.search(r'user_id:\s*([^\n]+)', content, re.IGNORECASE)
            if id_match:
                uid = id_match.group(1).strip()
                if uid.lower() not in ['anonymous', '']:
                    user_id = uid

            # Extract Zep context section
            zep_match = re.search(r'## WHAT I REMEMBER.*?:\n([\s\S]*?)(?=\n##|\Z)', content)
            if zep_match:
                zep_context = zep_match.group(1).strip()

            break  # Only process first system message

    return user_name, user_id, zep_context


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

        # Extract session ID (from Hume's customSessionId)
        session_id = extract_session_id(request, body)

        # Extract user info from session ID (format: "name|userId")
        user_name, user_id = extract_user_from_session(session_id)

        # Also extract from system message (Hume forwards systemPrompt)
        sys_name, sys_id, zep_context = extract_user_from_messages(messages)

        # Prefer system message values (they're fresher)
        if sys_name:
            user_name = sys_name
        if sys_id:
            user_id = sys_id

        print(f"[PENELOPE] User: {user_name}, ID: {user_id}, Zep context: {bool(zep_context)}", file=sys.stderr)

        # Extract user message
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break

        if not user_message:
            user_message = "Hello!"

        # Update session context with user name
        if session_id:
            ctx = get_session_context(session_id)
            if user_name and not ctx.user_name:
                ctx.user_name = user_name

        # Build personalized prompt if we have user name
        prompt = user_message
        if user_name:
            prompt = f"[User's name is {user_name}] {user_message}"

        # Run agent
        deps = PenelopeDeps(session_id=session_id or str(uuid.uuid4()), user_id=user_id)
        result = await penelope_agent.run(prompt, deps=deps)

        # Extract the response - use result.output (same pattern as working agents)
        response_text = result.output if hasattr(result, 'output') else str(result.data)
        print(f"[PENELOPE] Response: {response_text[:100]}...", file=sys.stderr)

        if stream:
            async def stream_response() -> AsyncGenerator[str, None]:
                # Stream as SSE
                chunk = {
                    "id": f"chatcmpl-{uuid.uuid4()}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "penelope-1.0",
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
                    "model": "penelope-1.0",
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
                "model": "penelope-1.0",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

    except Exception as e:
        print(f"[PENELOPE] Error in chat/completions: {e}", file=sys.stderr)
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
        deps = PenelopeDeps(session_id=session_id)
        result = await penelope_agent.run(user_message, deps=deps)

        # Extract the response - use result.output (same pattern as working agents)
        response_text = result.output if hasattr(result, 'output') else str(result.data)

        return {
            "messages": [{
                "role": "assistant",
                "content": response_text
            }]
        }

    except Exception as e:
        print(f"[PENELOPE] Error in copilotkit: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
