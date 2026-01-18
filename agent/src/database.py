"""
Database queries for Dionysus Wine Sommelier Agent
"""

import os
import sys
import asyncpg
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional, List, Dict, Any

DATABASE_URL = os.environ.get("DATABASE_URL", "")


class Database:
    """Async database connection manager for Neon PostgreSQL."""

    _pool: Optional[asyncpg.Pool] = None

    @classmethod
    async def get_pool(cls) -> asyncpg.Pool:
        """Get or create connection pool."""
        if cls._pool is None:
            cls._pool = await asyncpg.create_pool(
                DATABASE_URL,
                min_size=1,
                max_size=5,
                command_timeout=30,
            )
        return cls._pool

    @classmethod
    async def close(cls) -> None:
        """Close the connection pool."""
        if cls._pool:
            await cls._pool.close()
            cls._pool = None


@asynccontextmanager
async def get_connection() -> AsyncGenerator[asyncpg.Connection, None]:
    """Get a database connection from the pool."""
    pool = await Database.get_pool()
    async with pool.acquire() as conn:
        yield conn


# =============================================================================
# WINE QUERIES
# =============================================================================

async def get_all_wines(limit: int = 50) -> List[Dict[str, Any]]:
    """Get wines from database."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, wine_type, style, color, price_retail, price_trade,
                       bottle_size, tasting_notes, image_url, stock_quantity,
                       case_size, classification
                FROM wines
                WHERE is_active = true
                ORDER BY name
                LIMIT $1
            """, limit)
            print(f"[DIONYSUS DB] Retrieved {len(rows)} wines", file=sys.stderr)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wines: {e}", file=sys.stderr)
        return []


async def get_wine_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    """Get wine by URL slug."""
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, wine_type, style, color, price_retail, price_trade,
                       bottle_size, tasting_notes, image_url, stock_quantity,
                       case_size, classification, original_url, aionysus_url
                FROM wines
                WHERE slug = $1 AND is_active = true
            """, slug)
            if row:
                print(f"[DIONYSUS DB] Found wine: {row['name']}", file=sys.stderr)
                return dict(row)
            return None
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wine by slug: {e}", file=sys.stderr)
        return None


async def get_wine_by_id(wine_id: int) -> Optional[Dict[str, Any]]:
    """Get wine by ID."""
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, wine_type, style, color, price_retail, price_trade,
                       bottle_size, tasting_notes, image_url, stock_quantity,
                       case_size, classification
                FROM wines
                WHERE id = $1 AND is_active = true
            """, wine_id)
            return dict(row) if row else None
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wine by id: {e}", file=sys.stderr)
        return None


async def search_wines(
    query: Optional[str] = None,
    region: Optional[str] = None,
    country: Optional[str] = None,
    producer: Optional[str] = None,
    grape: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    vintage: Optional[int] = None,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Search wines with multiple filters."""
    try:
        async with get_connection() as conn:
            # Build dynamic query
            conditions = ["is_active = true"]
            params = []
            param_count = 0

            if query:
                param_count += 1
                conditions.append(f"""(
                    LOWER(name) LIKE LOWER(${param_count}) OR
                    LOWER(winery) LIKE LOWER(${param_count}) OR
                    LOWER(region) LIKE LOWER(${param_count}) OR
                    LOWER(grape_variety) LIKE LOWER(${param_count})
                )""")
                params.append(f"%{query}%")

            if region:
                param_count += 1
                conditions.append(f"LOWER(region) LIKE LOWER(${param_count})")
                params.append(f"%{region}%")

            if country:
                param_count += 1
                conditions.append(f"LOWER(country) LIKE LOWER(${param_count})")
                params.append(f"%{country}%")

            if producer:
                param_count += 1
                conditions.append(f"LOWER(winery) LIKE LOWER(${param_count})")
                params.append(f"%{producer}%")

            if grape:
                param_count += 1
                conditions.append(f"LOWER(grape_variety) LIKE LOWER(${param_count})")
                params.append(f"%{grape}%")

            if min_price:
                param_count += 1
                conditions.append(f"price_retail >= ${param_count}")
                params.append(min_price)

            if max_price:
                param_count += 1
                conditions.append(f"price_retail <= ${param_count}")
                params.append(max_price)

            if vintage:
                param_count += 1
                conditions.append(f"vintage = ${param_count}")
                params.append(vintage)

            param_count += 1
            params.append(limit)

            sql = f"""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, wine_type, style, color, price_retail,
                       bottle_size, image_url
                FROM wines
                WHERE {' AND '.join(conditions)}
                ORDER BY price_retail ASC NULLS LAST
                LIMIT ${param_count}
            """

            rows = await conn.fetch(sql, *params)
            print(f"[DIONYSUS DB] Search returned {len(rows)} wines", file=sys.stderr)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error searching wines: {e}", file=sys.stderr)
        return []


async def get_wines_by_region(region: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get wines from a specific region."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, price_retail, image_url
                FROM wines
                WHERE LOWER(region) LIKE LOWER($1) AND is_active = true
                ORDER BY price_retail ASC NULLS LAST
                LIMIT $2
            """, f"%{region}%", limit)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wines by region: {e}", file=sys.stderr)
        return []


async def get_wines_by_producer(producer: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Get wines from a specific producer/winery."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, price_retail, image_url
                FROM wines
                WHERE LOWER(winery) LIKE LOWER($1) AND is_active = true
                ORDER BY vintage DESC NULLS LAST
                LIMIT $2
            """, f"%{producer}%", limit)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wines by producer: {e}", file=sys.stderr)
        return []


async def get_wines_by_price_range(
    min_price: float,
    max_price: float,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """Get wines within a price range."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, name, slug, winery, region, country, grape_variety,
                       vintage, price_retail, image_url
                FROM wines
                WHERE price_retail >= $1 AND price_retail <= $2 AND is_active = true
                ORDER BY price_retail ASC
                LIMIT $3
            """, min_price, max_price, limit)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching wines by price: {e}", file=sys.stderr)
        return []


async def get_regions() -> List[str]:
    """Get all unique wine regions."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT DISTINCT region
                FROM wines
                WHERE region IS NOT NULL AND is_active = true
                ORDER BY region
            """)
            return [row['region'] for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching regions: {e}", file=sys.stderr)
        return []


async def get_producers() -> List[str]:
    """Get all unique producers/wineries."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT DISTINCT winery
                FROM wines
                WHERE winery IS NOT NULL AND is_active = true
                ORDER BY winery
                LIMIT 100
            """)
            return [row['winery'] for row in rows]
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching producers: {e}", file=sys.stderr)
        return []


async def get_wine_stats() -> Dict[str, Any]:
    """Get wine collection statistics."""
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT
                    COUNT(*) as total_wines,
                    COUNT(DISTINCT region) as unique_regions,
                    COUNT(DISTINCT winery) as unique_producers,
                    COUNT(DISTINCT vintage) as unique_vintages,
                    MIN(price_retail) as min_price,
                    MAX(price_retail) as max_price,
                    AVG(price_retail)::numeric(10,2) as avg_price
                FROM wines
                WHERE is_active = true
            """)
            return dict(row) if row else {}
    except Exception as e:
        print(f"[DIONYSUS DB] Error fetching stats: {e}", file=sys.stderr)
        return {}


# =============================================================================
# WINE KNOWLEDGE DATA
# =============================================================================

WINE_REGIONS = {
    "burgundy": {
        "name": "Burgundy",
        "country": "France",
        "description": "Home to some of the world's finest Pinot Noir and Chardonnay",
        "key_grapes": ["Pinot Noir", "Chardonnay"],
        "notable_appellations": ["Gevrey-Chambertin", "Vosne-Romanée", "Meursault", "Puligny-Montrachet"],
        "food_pairings": ["Duck", "Mushrooms", "Grilled fish", "Creamy sauces"]
    },
    "bordeaux": {
        "name": "Bordeaux",
        "country": "France",
        "description": "Famous for prestigious red blends and sweet wines",
        "key_grapes": ["Cabernet Sauvignon", "Merlot", "Cabernet Franc"],
        "notable_appellations": ["Pauillac", "Saint-Émilion", "Pomerol", "Margaux"],
        "food_pairings": ["Lamb", "Beef", "Hard cheeses", "Rich stews"]
    },
    "champagne": {
        "name": "Champagne",
        "country": "France",
        "description": "The world's most celebrated sparkling wine region",
        "key_grapes": ["Chardonnay", "Pinot Noir", "Pinot Meunier"],
        "notable_houses": ["Krug", "Dom Pérignon", "Bollinger", "Ruinart"],
        "food_pairings": ["Oysters", "Caviar", "Canapés", "Celebration dishes"]
    },
    "barolo": {
        "name": "Barolo/Piedmont",
        "country": "Italy",
        "description": "The 'King of Wines' from Nebbiolo grapes",
        "key_grapes": ["Nebbiolo", "Barbera", "Dolcetto"],
        "notable_areas": ["Barolo", "Barbaresco", "Langhe"],
        "food_pairings": ["Truffle dishes", "Braised meats", "Rich pastas", "Aged cheeses"]
    },
    "rhone": {
        "name": "Rhône Valley",
        "country": "France",
        "description": "Diverse region producing powerful reds and aromatic whites",
        "key_grapes": ["Syrah", "Grenache", "Viognier", "Roussanne"],
        "notable_appellations": ["Hermitage", "Côte-Rôtie", "Châteauneuf-du-Pape"],
        "food_pairings": ["Game", "Grilled meats", "Provençal cuisine"]
    }
}

FOOD_PAIRINGS = {
    "red_meat": ["Cabernet Sauvignon", "Bordeaux blends", "Barolo", "Syrah"],
    "poultry": ["Pinot Noir", "Burgundy", "Chardonnay", "Beaujolais"],
    "fish": ["Chablis", "Sancerre", "Muscadet", "White Burgundy"],
    "shellfish": ["Champagne", "Muscadet", "Albariño", "Chablis"],
    "cheese": ["Port", "Sauternes", "Aged Burgundy", "Amarone"],
    "dessert": ["Sauternes", "Port", "Late Harvest Riesling", "Moscato"]
}


def get_region_info(region: str) -> Optional[Dict[str, Any]]:
    """Get information about a wine region."""
    return WINE_REGIONS.get(region.lower())


def get_food_pairing_wines(food: str) -> List[str]:
    """Get wine suggestions for a food type."""
    return FOOD_PAIRINGS.get(food.lower(), [])
