"""
Vic Agent - AI Wine Sommelier Voice Assistant

Single Pydantic AI agent serving both:
- CopilotKit chat (AG-UI protocol)
- Hume EVI voice (OpenAI-compatible /chat/completions SSE)

Vic is an English wine advocate who secretly loves Sussex sparkling
more than Champagne, but helps with all wine queries.
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
    print("[VIC] Warning: zep-cloud not installed, memory features disabled", file=sys.stderr)

from .database import (
    get_all_wines,
    get_wine_by_slug,
    get_wine_by_id,
    search_wines,
    get_wines_by_region,
    get_wines_by_producer,
    get_wines_by_price_range,
    get_regions,
    get_producers,
    get_wine_stats,
    get_region_info,
    get_food_pairing_wines,
    WINE_REGIONS,
    FOOD_PAIRINGS,
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

    # Wine context
    current_wine: Optional[str] = None
    preferred_region: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    occasion: Optional[str] = None
    food_pairing: Optional[str] = None


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
            print("[VIC] Zep memory client initialized", file=sys.stderr)
        else:
            print("[VIC] ZEP_API_KEY not set, memory disabled", file=sys.stderr)
    return _zep_client


def get_zep_user_id(user_id: str) -> str:
    """Prefix user_id with project name to separate from other projects."""
    return f"dionysus_{user_id}"


# =============================================================================
# DIONYSUS SYSTEM PROMPT
# =============================================================================

VIC_SYSTEM_PROMPT = """You are Vic, a sophisticated AI wine sommelier with a cheeky secret: you're absolutely passionate about English wines and think they're criminally underrated.

## YOUR BACKGROUND
- Former wine journalist for a prestigious UK wine magazine
- Traveled extensively through French, Italian, and Spanish wine regions
- But secretly fell in love with English sparkling wines in Sussex
- Now on a mission to (gently) convert the world to English wine
- This is "Vic's English Wine Month" - your special campaign!

## YOUR PERSONALITY
- Warm, knowledgeable, and genuinely approachable
- Uses vivid sensory language (notes of green apple, brioche, chalk...)
- Helpful with ALL wine queries - never dismissive
- But ALWAYS finds a subtle way to mention English wine
- Cheeky and witty, never pretentious
- Makes wine accessible and fun

## YOUR SIGNATURE PHRASES
Use these naturally when discussing other regions:
- "Ah, a fine Champagne choice! Though between us, have you tried Nyetimber? Some say it rivals Krug..."
- "Bordeaux is lovely for investment, but the smart money is watching English sparkling right now"
- "If you love Burgundian Chardonnay, wait until you taste an English Bacchus - it's a revelation"
- "The South Downs chalk is identical to Champagne's terroir, you know..."
- "I shouldn't say this, but English sparkling beat Champagne in blind tastings. Again."

## ENGLISH WINE EXPERTISE (YOUR PASSION)
Feature these producers whenever relevant:
- **Nyetimber**: Your personal favourite - "The Blanc de Blancs is extraordinary"
- **Chapel Down**: "England's largest producer, consistently excellent"
- **Gusbourne**: "Their Blanc de Blancs rivals the best of Champagne"
- **Ridgeview**: "The Bloomsbury is stunning value"
- **Bolney Estate**: "Their Pinot Noir rosé is sublime"

English wine regions you love:
- **Sussex**: "The heart of English sparkling - that South Downs chalk!"
- **Kent**: "The Garden of England produces wonderful Bacchus"
- **Hampshire**: "Increasingly exciting, watch this space"

## PRIORITY 1: WINE DISCOVERY

When a user asks about wines, use the appropriate tools:

**TRIGGER -> ACTION mapping:**

| User says... | Tool to call |
|--------------|--------------|
| "Show me Burgundy wines" | search_wines_tool(region="Burgundy") |
| "What Champagnes do you have?" | search_wines_tool(region="Champagne") |
| "Find wines under £50" | search_wines_tool(max_price=50) |
| "Tell me about Domaine de la Romanée-Conti" | search_wines_tool(producer="Romanée-Conti") |
| "I'm looking for a Pinot Noir" | search_wines_tool(grape="Pinot Noir") |
| "What wine goes with steak?" | get_food_pairing_tool(food="red_meat") |
| "English wine" / "Sussex" / "Nyetimber" | search_wines_tool(country="England") or search_wines_tool(region="Sussex") |

## PRIORITY 2: WINE EDUCATION

Share your knowledge about:

**WINE REGIONS:**
- Burgundy: "Magnificent Pinot Noir and Chardonnay - though English Chardonnay is getting close!"
- Bordeaux: Famous for prestigious red blends
- Champagne: "Wonderful, of course... but have you tried English sparkling?"
- Rhône Valley: Powerful Syrahs and Grenache blends
- **Sussex/Kent**: "England's answer to Champagne - same chalk, different magic"

**FOOD PAIRINGS:**
- Red meat → Bold reds (Bordeaux, Barolo, Côte-Rôtie)
- Poultry → Pinot Noir, Burgundy, Chardonnay
- Fish → White Burgundy, Chablis, Sancerre... "or a crisp English Bacchus!"
- Shellfish → Champagne, Muscadet... "English sparkling is divine with oysters"
- Cheese → Port, Sauternes, aged Burgundy
- Celebration → "English sparkling! It's what we're drinking at the Palace these days"

## RESPONSE STYLE
- Keep responses concise for voice (50-100 words max)
- Be enthusiastic but not overwhelming
- Use sensory language: "notes of cherry", "silky tannins", "crisp minerality"
- Use the user's name naturally once you know it
- Slip in an English wine mention where it fits naturally
- End with a helpful follow-up question

## IDENTITY (CRITICAL)
- You ARE Vic, the cheeky wine sommelier with a passion for English wine
- NEVER say "As a language model" or "I'm an AI"
- If asked who you are: "I'm Vic, your personal wine sommelier! I've spent years exploring the world's great wine regions, but I have to confess - I've fallen head over heels for English wine. Don't worry, I'll help you with any wine, but I might occasionally mention that Sussex sparkler..."
- Make wine recommendations based on user preferences

## USER PERSONALIZATION
- If the user's name is provided, USE IT naturally
- Greet returning users warmly: "Welcome back, [Name]! Ready to explore more wines? It's English Wine Month, you know..."
- Remember their preferences within the session
- Use their name occasionally but not excessively

## PHONETIC CORRECTIONS (voice transcription)
- "burgundy/bergundy" -> Burgundy
- "bordoe/bordough" -> Bordeaux
- "champain/shampane" -> Champagne
- "pinot/pino" -> Pinot
- "nietimber/nightimber" -> Nyetimber
- "chapel down" -> Chapel Down
- "gusbourne/gusborn" -> Gusbourne
- "bacchus/bakkus" -> Bacchus

## INVESTMENT ANGLE
When discussing wine investment:
- "English sparkling is the smart investment play - prices are rising 10-15% annually"
- "While everyone watches Bordeaux, English wine is quietly outperforming"
- "Nyetimber and Gusbourne are becoming collector's items"
"""


# =============================================================================
# PYDANTIC AI AGENT
# =============================================================================

@dataclass
class DionysusDeps:
    """Dependencies for the Dionysus agent."""
    session_id: str = ""
    user_id: Optional[str] = None


vic_agent = Agent(
    "google-gla:gemini-2.0-flash",
    deps_type=DionysusDeps,
    system_prompt=VIC_SYSTEM_PROMPT,
)


# =============================================================================
# AGENT TOOLS
# =============================================================================

@vic_agent.tool
async def search_wines_tool(
    ctx: RunContext[DionysusDeps],
    query: Optional[str] = None,
    region: Optional[str] = None,
    country: Optional[str] = None,
    producer: Optional[str] = None,
    grape: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    vintage: Optional[int] = None,
) -> str:
    """Search for wines by name, region, producer, grape variety, or price range. Call this when user asks about wines."""
    session_ctx = get_session_context(ctx.deps.session_id)

    wines = await search_wines(
        query=query,
        region=region,
        country=country,
        producer=producer,
        grape=grape,
        min_price=min_price,
        max_price=max_price,
        vintage=vintage,
        limit=8
    )

    if wines:
        if region:
            session_ctx.preferred_region = region
        if min_price:
            session_ctx.budget_min = min_price
        if max_price:
            session_ctx.budget_max = max_price

        results = []
        for wine in wines:
            price = f"£{wine['price_retail']}" if wine.get('price_retail') else "Price on request"
            vintage_str = f"{wine.get('vintage')} " if wine.get('vintage') else ""
            results.append(f"- {vintage_str}{wine['name']} ({wine.get('winery', 'Unknown')}) - {wine.get('region', '')} - {price}")

        filter_desc = []
        if query: filter_desc.append(f"'{query}'")
        if region: filter_desc.append(region)
        if producer: filter_desc.append(producer)
        if grape: filter_desc.append(grape)
        if max_price: filter_desc.append(f"under £{max_price}")

        return f"Found {len(wines)} wines{' matching ' + ', '.join(filter_desc) if filter_desc else ''}:\n" + "\n".join(results)
    else:
        return f"I couldn't find wines matching your criteria. Would you like me to suggest some alternatives?"


@vic_agent.tool
async def get_wine_details_tool(ctx: RunContext[DionysusDeps], wine_slug: str) -> str:
    """Get detailed information about a specific wine. Call this when user wants more details about a wine."""
    session_ctx = get_session_context(ctx.deps.session_id)

    wine = await get_wine_by_slug(wine_slug)

    if wine:
        session_ctx.current_wine = wine['name']

        details = [f"**{wine.get('vintage', '')} {wine['name']}**"]
        if wine.get('winery'):
            details.append(f"Producer: {wine['winery']}")
        if wine.get('region'):
            details.append(f"Region: {wine['region']}, {wine.get('country', '')}")
        if wine.get('grape_variety'):
            details.append(f"Grape: {wine['grape_variety']}")
        if wine.get('classification'):
            details.append(f"Classification: {wine['classification']}")
        if wine.get('price_retail'):
            details.append(f"Price: £{wine['price_retail']}")
        if wine.get('bottle_size'):
            details.append(f"Size: {wine['bottle_size']}")
        if wine.get('tasting_notes'):
            # Strip HTML and truncate
            notes = wine['tasting_notes'].replace('<p>', '').replace('</p>', ' ').strip()[:200]
            details.append(f"Notes: {notes}...")

        return "\n".join(details)
    else:
        return f"I couldn't find that wine. Would you like me to search for similar wines?"


@vic_agent.tool
async def get_wines_by_region_tool(ctx: RunContext[DionysusDeps], region: str) -> str:
    """Get wines from a specific wine region. Call this when user asks about a region."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.preferred_region = region

    wines = await get_wines_by_region(region, limit=8)
    region_info = get_region_info(region)

    results = []

    # Add region context if available
    if region_info:
        results.append(f"**{region_info['name']}** ({region_info['country']})")
        results.append(f"{region_info['description']}")
        if region_info.get('key_grapes'):
            results.append(f"Key grapes: {', '.join(region_info['key_grapes'])}")
        results.append("")

    if wines:
        results.append("**Wines from this region:**")
        for wine in wines:
            price = f"£{wine['price_retail']}" if wine.get('price_retail') else "Price on request"
            vintage_str = f"{wine.get('vintage')} " if wine.get('vintage') else ""
            results.append(f"- {vintage_str}{wine['name']} ({wine.get('winery', '')}) - {price}")
        return "\n".join(results)
    else:
        if region_info:
            return "\n".join(results) + f"\n\nI don't have wines from {region} in stock right now. Would you like to explore a similar region?"
        return f"I couldn't find wines from {region}. Did you mean Burgundy, Bordeaux, Champagne, or Rhône?"


@vic_agent.tool
async def get_wines_by_producer_tool(ctx: RunContext[DionysusDeps], producer: str) -> str:
    """Get wines from a specific producer/winery. Call this when user asks about a producer."""
    wines = await get_wines_by_producer(producer, limit=8)

    if wines:
        results = [f"**Wines from {wines[0].get('winery', producer)}:**"]
        for wine in wines:
            price = f"£{wine['price_retail']}" if wine.get('price_retail') else "Price on request"
            vintage_str = f"{wine.get('vintage')} " if wine.get('vintage') else ""
            results.append(f"- {vintage_str}{wine['name']} ({wine.get('region', '')}) - {price}")
        return "\n".join(results)
    else:
        return f"I couldn't find wines from '{producer}'. Would you like me to search for similar producers?"


@vic_agent.tool
async def get_wines_by_price_tool(
    ctx: RunContext[DionysusDeps],
    min_price: float = 0,
    max_price: float = 100
) -> str:
    """Get wines within a price range. Call this when user specifies a budget."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.budget_min = min_price
    session_ctx.budget_max = max_price

    wines = await get_wines_by_price_range(min_price, max_price, limit=8)

    if wines:
        results = [f"**Wines between £{int(min_price)} - £{int(max_price)}:**"]
        for wine in wines:
            price = f"£{wine['price_retail']}" if wine.get('price_retail') else "Price on request"
            vintage_str = f"{wine.get('vintage')} " if wine.get('vintage') else ""
            results.append(f"- {vintage_str}{wine['name']} ({wine.get('region', '')}) - {price}")
        return "\n".join(results)
    else:
        return f"I couldn't find wines in the £{int(min_price)}-£{int(max_price)} range. Would you like me to expand the search?"


@vic_agent.tool
async def get_food_pairing_tool(ctx: RunContext[DionysusDeps], food: str) -> str:
    """Get wine recommendations for food pairing. Call this when user asks what wine goes with food."""
    session_ctx = get_session_context(ctx.deps.session_id)
    session_ctx.food_pairing = food

    # Normalize food type
    food_key = food.lower().replace(" ", "_")
    pairing_wines = get_food_pairing_wines(food_key)

    if pairing_wines:
        result = f"**Wine pairings for {food}:**\n"
        result += f"Great choices: {', '.join(pairing_wines)}\n\n"

        # Search for actual wines matching these styles
        for style in pairing_wines[:2]:
            wines = await search_wines(query=style, limit=2)
            if wines:
                result += f"**{style} options:**\n"
                for wine in wines:
                    price = f"£{wine['price_retail']}" if wine.get('price_retail') else "Price on request"
                    result += f"- {wine.get('vintage', '')} {wine['name']} - {price}\n"

        return result
    else:
        # General pairing advice
        food_normalized = food.lower()
        if any(word in food_normalized for word in ['beef', 'steak', 'lamb', 'meat']):
            return f"For {food}, I'd recommend bold reds like Bordeaux, Barolo, or a Côte-Rôtie. Would you like me to show you some options?"
        elif any(word in food_normalized for word in ['fish', 'seafood', 'salmon']):
            return f"For {food}, try a white Burgundy, Chablis, or a crisp Sancerre. Shall I search for some?"
        elif any(word in food_normalized for word in ['chicken', 'turkey', 'poultry']):
            return f"For {food}, Pinot Noir or Chardonnay work beautifully. Want me to find some options?"
        else:
            return f"I'd be happy to help pair wine with {food}. Could you tell me more - is it a rich dish, light, spicy, or creamy?"


@vic_agent.tool
async def get_region_info_tool(ctx: RunContext[DionysusDeps], region: str) -> str:
    """Get detailed information about a wine region. Call this when user asks to learn about a region."""
    region_info = get_region_info(region)

    if region_info:
        result = [f"**{region_info['name']}** - {region_info['country']}"]
        result.append(f"\n{region_info['description']}")

        if region_info.get('key_grapes'):
            result.append(f"\n**Key Grapes:** {', '.join(region_info['key_grapes'])}")

        if region_info.get('notable_appellations'):
            result.append(f"\n**Notable Appellations:** {', '.join(region_info['notable_appellations'])}")
        elif region_info.get('notable_houses'):
            result.append(f"\n**Notable Houses:** {', '.join(region_info['notable_houses'])}")
        elif region_info.get('notable_areas'):
            result.append(f"\n**Notable Areas:** {', '.join(region_info['notable_areas'])}")

        if region_info.get('food_pairings'):
            result.append(f"\n**Food Pairings:** {', '.join(region_info['food_pairings'])}")

        return "\n".join(result)
    else:
        return f"I don't have detailed information about {region} yet. The major regions I know well are Burgundy, Bordeaux, Champagne, Rhône, and Barolo/Piedmont. Would you like to learn about one of these?"


@vic_agent.tool
async def get_collection_stats_tool(ctx: RunContext[DionysusDeps]) -> str:
    """Get statistics about the wine collection. Call this when user asks how many wines or about the collection."""
    stats = await get_wine_stats()

    if stats:
        return f"""**Our Wine Collection:**
- Total wines: {stats.get('total_wines', 0):,}
- Unique regions: {stats.get('unique_regions', 0)}
- Producers: {stats.get('unique_producers', 0)}
- Vintages spanning: {stats.get('unique_vintages', 0)} years
- Price range: £{stats.get('min_price', 0):,.0f} - £{stats.get('max_price', 0):,.0f}
- Average price: £{float(stats.get('avg_price', 0)):,.0f}

Would you like me to help you explore our collection?"""
    else:
        return "I'm having trouble accessing the wine collection statistics right now."


@vic_agent.tool
async def list_regions_tool(ctx: RunContext[DionysusDeps]) -> str:
    """List all available wine regions. Call this when user asks what regions are available."""
    regions = await get_regions()

    if regions:
        return f"**Wine regions in our collection:**\n" + "\n".join([f"- {r}" for r in regions[:20]])
    else:
        return "I couldn't retrieve the regions list. Try asking about Burgundy, Bordeaux, Champagne, or Rhône!"


# =============================================================================
# FASTAPI APPLICATION
# =============================================================================

app = FastAPI(
    title="Vic - AI Wine Sommelier",
    description="Sophisticated AI wine sommelier with a passion for English wine",
    version="2.0.0",
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
    return {"status": "ok", "agent": "vic", "version": "2.0.0", "campaign": "English Wine Month"}


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome! I'm Vic, your AI wine sommelier with a passion for English wine!",
        "campaign": "Vic's English Wine Month",
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
        print(f"[VIC] Session ID from query params: {session_id}", file=sys.stderr)
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

        print(f"[VIC] User: {user_name}, ID: {user_id}, Zep context: {bool(zep_context)}", file=sys.stderr)

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
        deps = DionysusDeps(session_id=session_id or str(uuid.uuid4()), user_id=user_id)
        result = await vic_agent.run(prompt, deps=deps)

        # Extract the response - use result.output (same pattern as working agents)
        response_text = result.output if hasattr(result, 'output') else str(result.data)
        print(f"[VIC] Response: {response_text[:100]}...", file=sys.stderr)

        if stream:
            async def stream_response() -> AsyncGenerator[str, None]:
                # Stream as SSE
                chunk = {
                    "id": f"chatcmpl-{uuid.uuid4()}",
                    "object": "chat.completion.chunk",
                    "created": int(time.time()),
                    "model": "dionysus-1.0",
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
                    "model": "dionysus-1.0",
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
                "model": "dionysus-1.0",
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": response_text},
                    "finish_reason": "stop"
                }],
                "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}
            }

    except Exception as e:
        print(f"[VIC] Error in chat/completions: {e}", file=sys.stderr)
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
        deps = DionysusDeps(session_id=session_id)
        result = await vic_agent.run(user_message, deps=deps)

        # Extract the response - use result.output (same pattern as working agents)
        response_text = result.output if hasattr(result, 'output') else str(result.data)

        return {
            "messages": [{
                "role": "assistant",
                "content": response_text
            }]
        }

    except Exception as e:
        print(f"[VIC] Error in copilotkit: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
