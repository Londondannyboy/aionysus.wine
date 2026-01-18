"""
Database queries for Penelope UK Pension Advisor Agent
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
# PENSION SCHEME QUERIES
# =============================================================================

async def get_all_schemes() -> List[Dict[str, Any]]:
    """Get all pension schemes from database."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, employer_match_percent,
                       fund_options, default_fund,
                       sipp_available, drawdown_available,
                       fca_regulated, performance_rating,
                       features, suitable_for
                FROM pension_schemes
                ORDER BY name
            """)
            print(f"[PENELOPE DB] Retrieved {len(rows)} pension schemes", file=sys.stderr)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching schemes: {e}", file=sys.stderr)
        return []


async def get_scheme_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Get pension scheme by name (fuzzy match)."""
    try:
        async with get_connection() as conn:
            # Try exact match first
            row = await conn.fetchrow("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, employer_match_percent,
                       fund_options, default_fund,
                       sipp_available, drawdown_available,
                       fca_regulated, performance_rating,
                       features, suitable_for
                FROM pension_schemes
                WHERE LOWER(name) = LOWER($1)
            """, name)

            if row:
                print(f"[PENELOPE DB] Found exact scheme match: {row['name']}", file=sys.stderr)
                return dict(row)

            # Try fuzzy match
            row = await conn.fetchrow("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, employer_match_percent,
                       fund_options, default_fund,
                       sipp_available, drawdown_available,
                       fca_regulated, performance_rating,
                       features, suitable_for
                FROM pension_schemes
                WHERE LOWER(name) LIKE LOWER($1)
                   OR LOWER(provider) LIKE LOWER($1)
                ORDER BY
                    CASE WHEN LOWER(name) = LOWER($2) THEN 0 ELSE 1 END
                LIMIT 1
            """, f"%{name}%", name)

            if row:
                print(f"[PENELOPE DB] Found fuzzy scheme match: {row['name']}", file=sys.stderr)
                return dict(row)

            print(f"[PENELOPE DB] No scheme found for: {name}", file=sys.stderr)
            return None
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching scheme by name: {e}", file=sys.stderr)
        return None


async def search_schemes(query: str) -> List[Dict[str, Any]]:
    """Search pension schemes by name, provider, or type."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, employer_match_percent,
                       fund_options, default_fund,
                       sipp_available, drawdown_available,
                       fca_regulated, performance_rating,
                       features, suitable_for
                FROM pension_schemes
                WHERE LOWER(name) LIKE LOWER($1)
                   OR LOWER(provider) LIKE LOWER($1)
                   OR LOWER(scheme_type) LIKE LOWER($1)
                   OR LOWER(default_fund) LIKE LOWER($1)
                ORDER BY performance_rating DESC NULLS LAST, name
                LIMIT 10
            """, f"%{query}%")
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error searching schemes: {e}", file=sys.stderr)
        return []


async def get_schemes_by_type(scheme_type: str) -> List[Dict[str, Any]]:
    """Get pension schemes by type (workplace, sipp, personal, stakeholder)."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, employer_match_percent,
                       fund_options, default_fund,
                       sipp_available, drawdown_available,
                       fca_regulated, performance_rating,
                       features, suitable_for
                FROM pension_schemes
                WHERE LOWER(scheme_type) = LOWER($1)
                ORDER BY performance_rating DESC NULLS LAST, name
                LIMIT 10
            """, scheme_type)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching schemes by type: {e}", file=sys.stderr)
        return []


async def get_scheme_details(scheme_id: int) -> Optional[Dict[str, Any]]:
    """Get detailed pension scheme information by ID."""
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT *
                FROM pension_schemes
                WHERE id = $1
            """, scheme_id)
            return dict(row) if row else None
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching scheme details: {e}", file=sys.stderr)
        return None


async def get_schemes_by_fee_range(max_amc: float) -> List[Dict[str, Any]]:
    """Get pension schemes with AMC below a threshold."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, fund_options,
                       fca_regulated, performance_rating
                FROM pension_schemes
                WHERE annual_management_charge <= $1
                ORDER BY annual_management_charge ASC, performance_rating DESC NULLS LAST
                LIMIT 10
            """, max_amc)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching schemes by fee: {e}", file=sys.stderr)
        return []


async def get_top_rated_schemes(limit: int = 10) -> List[Dict[str, Any]]:
    """Get top-rated pension schemes."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, slug, name, provider, scheme_type,
                       annual_management_charge, platform_fee,
                       min_contribution, fund_options,
                       fca_regulated, performance_rating
                FROM pension_schemes
                WHERE performance_rating IS NOT NULL
                ORDER BY performance_rating DESC
                LIMIT $1
            """, limit)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching top rated schemes: {e}", file=sys.stderr)
        return []


async def compare_scheme_fees(scheme_names: List[str]) -> List[Dict[str, Any]]:
    """Get fee information for multiple schemes for comparison."""
    try:
        async with get_connection() as conn:
            # Build query for multiple schemes
            placeholders = ', '.join(f'${i+1}' for i in range(len(scheme_names)))
            query = f"""
                SELECT name, provider, annual_management_charge, platform_fee
                FROM pension_schemes
                WHERE LOWER(name) = ANY(ARRAY[{placeholders}]::text[])
                   OR LOWER(provider) = ANY(ARRAY[{placeholders}]::text[])
            """
            lower_names = [n.lower() for n in scheme_names]
            rows = await conn.fetch(query, *lower_names, *lower_names)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error comparing scheme fees: {e}", file=sys.stderr)
        return []


# =============================================================================
# PENSION FUND QUERIES
# =============================================================================

async def get_scheme_funds(scheme_id: int) -> List[Dict[str, Any]]:
    """Get all funds available in a pension scheme."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT id, fund_name, fund_type, risk_level,
                       annual_return_1y, annual_return_5y,
                       ongoing_charge, asset_allocation
                FROM pension_funds
                WHERE scheme_id = $1
                ORDER BY fund_type, fund_name
            """, scheme_id)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching scheme funds: {e}", file=sys.stderr)
        return []


async def get_funds_by_type(fund_type: str) -> List[Dict[str, Any]]:
    """Get funds by type (equity, bond, mixed, property, cash)."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT pf.id, pf.fund_name, pf.fund_type, pf.risk_level,
                       pf.annual_return_1y, pf.annual_return_5y,
                       pf.ongoing_charge, ps.name as scheme_name
                FROM pension_funds pf
                JOIN pension_schemes ps ON pf.scheme_id = ps.id
                WHERE LOWER(pf.fund_type) = LOWER($1)
                ORDER BY pf.annual_return_5y DESC NULLS LAST
                LIMIT 10
            """, fund_type)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching funds by type: {e}", file=sys.stderr)
        return []


async def get_funds_by_risk_level(risk_level: int) -> List[Dict[str, Any]]:
    """Get funds by risk level (1-7)."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT pf.id, pf.fund_name, pf.fund_type, pf.risk_level,
                       pf.annual_return_1y, pf.annual_return_5y,
                       pf.ongoing_charge, ps.name as scheme_name
                FROM pension_funds pf
                JOIN pension_schemes ps ON pf.scheme_id = ps.id
                WHERE pf.risk_level = $1
                ORDER BY pf.annual_return_5y DESC NULLS LAST
                LIMIT 10
            """, risk_level)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching funds by risk level: {e}", file=sys.stderr)
        return []


# =============================================================================
# USER & PREFERENCES QUERIES
# =============================================================================

async def get_user_profile(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user profile from database."""
    try:
        async with get_connection() as conn:
            row = await conn.fetchrow("""
                SELECT * FROM user_profiles WHERE user_id = $1
            """, user_id)
            return dict(row) if row else None
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching user profile: {e}", file=sys.stderr)
        return None


async def get_user_pension_selections(user_id: str) -> List[Dict[str, Any]]:
    """Get user's tracked/saved pension schemes."""
    try:
        async with get_connection() as conn:
            rows = await conn.fetch("""
                SELECT ps.*
                FROM user_pension_selections ups
                JOIN pension_schemes ps ON ups.scheme_id = ps.id
                WHERE ups.user_id = $1
                ORDER BY ups.created_at DESC
            """, user_id)
            return [dict(row) for row in rows]
    except Exception as e:
        print(f"[PENELOPE DB] Error fetching user selections: {e}", file=sys.stderr)
        return []


async def add_user_pension_selection(user_id: str, scheme_id: int, notes: Optional[str] = None) -> bool:
    """Add a pension scheme to user's tracked list."""
    try:
        async with get_connection() as conn:
            await conn.execute("""
                INSERT INTO user_pension_selections (user_id, scheme_id, notes)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, scheme_id) DO UPDATE SET notes = $3
            """, user_id, scheme_id, notes)
            return True
    except Exception as e:
        print(f"[PENELOPE DB] Error adding pension selection: {e}", file=sys.stderr)
        return False


async def save_recommendation(
    user_id: Optional[str],
    session_id: str,
    scheme_ids: List[int],
    context: Dict[str, Any]
) -> Optional[int]:
    """Save a pension recommendation to the database."""
    try:
        import json
        from datetime import datetime

        async with get_connection() as conn:
            result = await conn.fetchrow("""
                INSERT INTO pension_recommendations (user_id, session_id, scheme_ids, context, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
            """, user_id, session_id, scheme_ids, json.dumps(context), datetime.now())

            print(f"[PENELOPE DB] Saved recommendation for session {session_id}", file=sys.stderr)
            return result["id"] if result else None
    except Exception as e:
        print(f"[PENELOPE DB] Error saving recommendation: {e}", file=sys.stderr)
        return None


# =============================================================================
# PENSION KNOWLEDGE DATA (Static - for educational responses)
# =============================================================================

PENSION_TYPES = {
    "workplace": {
        "name": "Workplace Pension",
        "description": "Auto-enrolment pension provided by your employer",
        "key_features": [
            "Employer contributes minimum 3%",
            "Employee contributes minimum 5%",
            "Tax relief automatic",
            "Usually lower fees due to scale"
        ],
        "suitable_for": ["Employees", "Those wanting employer contributions", "Hands-off investors"],
        "examples": ["NEST", "People's Pension", "NOW: Pensions", "Smart Pension"]
    },
    "sipp": {
        "name": "Self-Invested Personal Pension (SIPP)",
        "description": "Personal pension with full investment control",
        "key_features": [
            "Choose your own investments",
            "Wide range of funds, stocks, ETFs",
            "Flexible contributions",
            "Can consolidate old pensions"
        ],
        "suitable_for": ["DIY investors", "Those wanting investment control", "Higher earners"],
        "examples": ["Vanguard SIPP", "AJ Bell", "Hargreaves Lansdown", "Fidelity", "Interactive Investor"]
    },
    "personal": {
        "name": "Personal Pension",
        "description": "Individual pension arrangement with a provider",
        "key_features": [
            "Set up independently",
            "Provider manages investments",
            "Regular or one-off contributions",
            "Good for self-employed"
        ],
        "suitable_for": ["Self-employed", "Those without workplace pension", "Additional pension savings"],
        "examples": ["Aviva", "Scottish Widows", "Legal & General", "Standard Life"]
    },
    "stakeholder": {
        "name": "Stakeholder Pension",
        "description": "Simple pension with capped charges",
        "key_features": [
            "Maximum 1.5% annual charge",
            "Flexible contributions",
            "Default investment option",
            "Must accept transfers"
        ],
        "suitable_for": ["Those wanting simplicity", "Low-cost option", "Beginners"],
        "examples": ["Many providers offer stakeholder options"]
    },
    "state": {
        "name": "State Pension",
        "description": "Government pension based on National Insurance contributions",
        "key_features": [
            "Need 35 years NI for full amount",
            "Currently £221.20/week (2024/25)",
            "State pension age 66 (rising to 67)",
            "Triple lock protection"
        ],
        "suitable_for": ["Everyone - builds automatically", "Foundation of retirement income"],
        "examples": ["Check entitlement at gov.uk/check-state-pension"]
    }
}

PENSION_TIPS = {
    "employer_match": {
        "tip": "Always get your employer match - it's free money!",
        "explanation": "If your employer matches contributions, try to contribute at least enough to get the full match. It's an instant 100% return."
    },
    "tax_relief": {
        "tip": "Tax relief means you get 20-45% of your contribution back",
        "explanation": "Basic rate taxpayers get 20% added automatically. Higher rate taxpayers can claim extra 20-25% through self-assessment."
    },
    "fees_matter": {
        "tip": "Lower fees compound to big savings over decades",
        "explanation": "A 1% difference in fees can mean tens of thousands less at retirement over 30+ years."
    },
    "start_early": {
        "tip": "It's never too late to start - but the earlier the better",
        "explanation": "Compound growth means money invested in your 20s is worth more than money invested in your 40s."
    },
    "consolidate": {
        "tip": "Consider consolidating old pensions for simplicity",
        "explanation": "Multiple old pensions can be hard to track. Consolidating makes planning easier, but check for exit fees first."
    },
    "state_pension": {
        "tip": "The state pension alone won't maintain most people's lifestyle",
        "explanation": "Full state pension is about £11,500/year. Most people need 2/3 of their working income in retirement."
    }
}


def get_pension_type_info(pension_type: str) -> Optional[Dict[str, Any]]:
    """Get information about a pension type."""
    return PENSION_TYPES.get(pension_type.lower())


def get_pension_tip(tip_key: str) -> Optional[Dict[str, Any]]:
    """Get a specific pension tip."""
    return PENSION_TIPS.get(tip_key)


def get_all_pension_tips() -> Dict[str, Dict[str, Any]]:
    """Get all pension tips."""
    return PENSION_TIPS
