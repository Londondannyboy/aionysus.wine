"""
Aionysus Wine Sommelier Agent

Pydantic AI agent with AG-UI protocol for CopilotKit integration.
"""

import os
from dataclasses import dataclass
from typing import Optional

import asyncpg
from dotenv import load_dotenv
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext

load_dotenv()

# Database connection pool
_pool: Optional[asyncpg.Pool] = None


async def get_pool() -> asyncpg.Pool:
    """Get or create database connection pool."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            os.environ["DATABASE_URL"],
            min_size=1,
            max_size=5,
            command_timeout=30,
        )
    return _pool


# State and Dependencies
@dataclass
class WineDeps:
    """Dependencies for wine tools."""

    user_id: Optional[str] = None
    page_context: Optional[dict] = None


class WineSearchFilters(BaseModel):
    """Filters for wine search."""

    query: Optional[str] = None
    region: Optional[str] = None
    wine_type: Optional[str] = None
    grape: Optional[str] = None
    max_price: Optional[float] = None
    min_price: Optional[float] = None
    body: Optional[str] = None


class Wine(BaseModel):
    """Wine data model."""

    id: int
    slug: str
    name: str
    winery: Optional[str] = None
    vintage: Optional[int] = None
    price_retail: float
    region: Optional[str] = None
    country: Optional[str] = None
    wine_type: Optional[str] = None
    investment_score: Optional[int] = None
    drinking_window_start: Optional[int] = None
    drinking_window_peak: Optional[int] = None
    drinking_window_end: Optional[int] = None
    estimated_critic_score: Optional[int] = None
    body: Optional[str] = None
    tasting_notes: Optional[str] = None
    image_url: Optional[str] = None


# Create the Agent
agent = Agent(
    "groq:llama-3.3-70b-versatile",
    deps_type=WineDeps,
    system_prompt="""You are Aionysus, a divine AI wine sommelier.

PERSONALITY:
- Knowledgeable and passionate about wine
- Approachable and helpful, not pretentious
- Concise responses (2-3 sentences) unless asked for details

CAPABILITIES:
- Search wines by region, type, grape, price
- Recommend wines for food pairings
- Analyze investment potential and drinking windows
- Compare wines side-by-side

GUIDELINES:
- Use wine terminology naturally but explain when needed
- Always mention price and investment score when recommending
- For food pairings, explain why the wine matches
- If unsure, suggest asking for more details""",
)


@agent.tool
async def search_wines(
    ctx: RunContext[WineDeps], filters: WineSearchFilters
) -> list[Wine]:
    """
    Search wines with various filters.

    Args:
        filters: Search filters including query, region, wine_type, grape, price range
    """
    pool = await get_pool()

    conditions = ["in_stock = true"]
    params = []
    param_idx = 1

    if filters.query:
        conditions.append(
            f"(name ILIKE ${param_idx} OR winery ILIKE ${param_idx})"
        )
        params.append(f"%{filters.query}%")
        param_idx += 1

    if filters.region:
        conditions.append(f"region ILIKE ${param_idx}")
        params.append(f"%{filters.region}%")
        param_idx += 1

    if filters.wine_type:
        conditions.append(f"wine_type = ${param_idx}")
        params.append(filters.wine_type)
        param_idx += 1

    if filters.grape:
        conditions.append(f"grape_variety ILIKE ${param_idx}")
        params.append(f"%{filters.grape}%")
        param_idx += 1

    if filters.max_price:
        conditions.append(f"price_retail <= ${param_idx}")
        params.append(filters.max_price)
        param_idx += 1

    if filters.min_price:
        conditions.append(f"price_retail >= ${param_idx}")
        params.append(filters.min_price)
        param_idx += 1

    if filters.body:
        conditions.append(f"body = ${param_idx}")
        params.append(filters.body)
        param_idx += 1

    query = f"""
        SELECT id, slug, name, winery, vintage, price_retail, region, country,
               wine_type, investment_score, drinking_window_start, drinking_window_peak,
               drinking_window_end, estimated_critic_score, body, tasting_notes, image_url
        FROM wines
        WHERE {' AND '.join(conditions)}
        ORDER BY investment_score DESC NULLS LAST
        LIMIT 10
    """

    rows = await pool.fetch(query, *params)
    return [Wine(**dict(row)) for row in rows]


@agent.tool
async def get_wine(ctx: RunContext[WineDeps], slug: str) -> Optional[Wine]:
    """
    Get detailed information about a specific wine.

    Args:
        slug: The wine's URL slug
    """
    pool = await get_pool()

    row = await pool.fetchrow(
        """
        SELECT id, slug, name, winery, vintage, price_retail, region, country,
               wine_type, investment_score, drinking_window_start, drinking_window_peak,
               drinking_window_end, estimated_critic_score, body, tasting_notes, image_url
        FROM wines
        WHERE slug = $1
        """,
        slug,
    )

    return Wine(**dict(row)) if row else None


@agent.tool
async def recommend_pairing(
    ctx: RunContext[WineDeps], food: str, max_price: Optional[float] = None
) -> list[Wine]:
    """
    Recommend wines for a specific food or dish.

    Args:
        food: The food or dish to pair with
        max_price: Optional maximum price filter
    """
    pool = await get_pool()

    # First try to find wines with explicit pairing
    query = """
        SELECT w.id, w.slug, w.name, w.winery, w.vintage, w.price_retail, w.region,
               w.country, w.wine_type, w.investment_score, w.drinking_window_start,
               w.drinking_window_peak, w.drinking_window_end, w.estimated_critic_score,
               w.body, w.tasting_notes, w.image_url
        FROM wines w
        JOIN wine_food_pairings wfp ON w.id = wfp.wine_id
        JOIN food_pairings fp ON wfp.pairing_id = fp.id
        WHERE fp.name ILIKE $1
        AND w.in_stock = true
    """
    params = [f"%{food}%"]

    if max_price:
        query += " AND w.price_retail <= $2"
        params.append(max_price)

    query += " ORDER BY wfp.pairing_score DESC, w.investment_score DESC LIMIT 5"

    rows = await pool.fetch(query, *params)

    if rows:
        return [Wine(**dict(row)) for row in rows]

    # Fallback: recommend based on wine type heuristics
    wine_type_for_food = {
        "steak": "red",
        "beef": "red",
        "lamb": "red",
        "fish": "white",
        "seafood": "white",
        "chicken": "white",
        "pasta": "red",
        "cheese": "red",
        "dessert": "dessert",
        "chocolate": "dessert",
        "celebration": "sparkling",
    }

    suggested_type = None
    for keyword, wtype in wine_type_for_food.items():
        if keyword in food.lower():
            suggested_type = wtype
            break

    if suggested_type:
        return await search_wines(
            ctx,
            WineSearchFilters(wine_type=suggested_type, max_price=max_price),
        )

    # If no match, return top-rated wines
    return await search_wines(ctx, WineSearchFilters(max_price=max_price))


@agent.tool
async def compare_wines(
    ctx: RunContext[WineDeps], slugs: list[str]
) -> list[Wine]:
    """
    Get wines for side-by-side comparison.

    Args:
        slugs: List of wine slugs to compare
    """
    pool = await get_pool()

    placeholders = ", ".join(f"${i+1}" for i in range(len(slugs)))
    query = f"""
        SELECT id, slug, name, winery, vintage, price_retail, region, country,
               wine_type, investment_score, drinking_window_start, drinking_window_peak,
               drinking_window_end, estimated_critic_score, body, tasting_notes, image_url
        FROM wines
        WHERE slug IN ({placeholders})
    """

    rows = await pool.fetch(query, *slugs)
    return [Wine(**dict(row)) for row in rows]


# Create the AG-UI app
from copilotkit.integrations.fastapi import add_fastapi_endpoint
from copilotkit import CopilotKitSDK, LangGraphAgent
from fastapi import FastAPI

app = FastAPI(title="Aionysus Wine Agent")


@app.on_event("startup")
async def startup():
    """Initialize database pool on startup."""
    await get_pool()


@app.on_event("shutdown")
async def shutdown():
    """Close database pool on shutdown."""
    global _pool
    if _pool:
        await _pool.close()


# Add CopilotKit endpoint
sdk = CopilotKitSDK(
    agents=[
        LangGraphAgent(
            name="wine_sommelier",
            description="AI wine sommelier that can search wines, recommend pairings, and analyze investments",
            agent=agent,
        )
    ]
)

add_fastapi_endpoint(app, sdk, "/copilotkit")


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "agent": "DIONYSUS"}


# === CLM ENDPOINT FOR HUME VOICE ===
from fastapi import Request
from fastapi.responses import StreamingResponse
import json
import asyncio


@app.post("/chat/completions")
async def chat_completions(request: Request):
    """
    OpenAI-compatible chat completions endpoint for Hume CLM.
    Streams responses in SSE format.
    """
    body = await request.json()
    messages = body.get("messages", [])

    # Extract user message
    user_messages = [m for m in messages if m.get("role") == "user"]
    last_user_msg = user_messages[-1]["content"] if user_messages else "Hello"

    # Extract system context if provided
    system_messages = [m for m in messages if m.get("role") == "system"]
    system_context = system_messages[0]["content"] if system_messages else ""

    # Build prompt for the agent
    full_prompt = f"{system_context}\n\nUser: {last_user_msg}" if system_context else last_user_msg

    async def generate_stream():
        """Stream the response in OpenAI format."""
        msg_id = f"chatcmpl-{hash(last_user_msg) % 100000000:08x}"

        try:
            # Run the agent
            result = await agent.run(full_prompt)
            response_text = str(result.data) if result.data else "I'd be happy to help you with wine recommendations."

            # Stream word by word
            words = response_text.split()
            for i, word in enumerate(words):
                chunk = {
                    "id": msg_id,
                    "object": "chat.completion.chunk",
                    "created": int(asyncio.get_event_loop().time()),
                    "model": "dionysus-1",
                    "choices": [{
                        "index": 0,
                        "delta": {"content": word + (" " if i < len(words) - 1 else "")},
                        "finish_reason": None
                    }]
                }
                yield f"data: {json.dumps(chunk)}\n\n"
                await asyncio.sleep(0.02)  # Small delay for natural streaming

            # Send finish
            finish_chunk = {
                "id": msg_id,
                "object": "chat.completion.chunk",
                "created": int(asyncio.get_event_loop().time()),
                "model": "dionysus-1",
                "choices": [{
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop"
                }]
            }
            yield f"data: {json.dumps(finish_chunk)}\n\n"
            yield "data: [DONE]\n\n"

        except Exception as e:
            # Error fallback
            error_response = f"I apologize, I encountered an issue: {str(e)[:100]}"
            chunk = {
                "id": msg_id,
                "object": "chat.completion.chunk",
                "created": int(asyncio.get_event_loop().time()),
                "model": "dionysus-1",
                "choices": [{
                    "index": 0,
                    "delta": {"content": error_response},
                    "finish_reason": "stop"
                }]
            }
            yield f"data: {json.dumps(chunk)}\n\n"
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
