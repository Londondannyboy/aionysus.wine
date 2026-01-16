# aionysus.wine V3

> **Cole Medin Methodology**: PRD-first, modular rules, command-ify, context reset, system evolution.

## Quick Start

```bash
# Frontend
cd frontend && npm install && npm run dev   # → localhost:3000

# Agent (separate terminal)
cd agent && uv sync && uv run python -m src.agent   # → localhost:8000

# Scraper
cd scripts && npx tsx scrape-waddesdon.ts
```

## Architecture

AI wine discovery platform with MDX investment dashboards.

**Pattern**: CopilotKit runtime inside Next.js API route (like relocation.quest), not separate Railway backend for chat. Railway agent used for Hume voice CLM endpoint only.

| Component | URL |
|-----------|-----|
| Frontend | https://aionysus.wine (Vercel) |
| Agent | https://aionysus-agent-production.up.railway.app (Railway) |
| Database | Neon PostgreSQL |

→ See `.claude/reference/architecture.md` for details

---

## Key Files

| Purpose | Location |
|---------|----------|
| CopilotKit provider | `frontend/src/components/providers.tsx` |
| CopilotKit runtime | `frontend/src/app/api/copilotkit/route.ts` |
| Hume token API | `frontend/src/app/api/hume-token/route.ts` |
| MDX components | `frontend/src/components/mdx/` |
| Wine page template | `frontend/src/app/wines/[slug]/page.tsx` |
| Region pages | `frontend/src/app/wines/region/[region]/page.tsx` |
| Pydantic AI agent | `agent/src/agent.py` |
| Agent tools | `agent/src/tools.py` |
| Database queries | `frontend/src/lib/db.ts` |
| Scraper | `scripts/scrape-waddesdon.ts` |
| AI enrichment | `scripts/enrich-wines.ts` |
| Shopify client | `frontend/src/lib/shopify.ts` |

---

## Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prime` | Load project context | Start of session |
| `/plan {feature}` | Create implementation plan | Before coding features |
| `/execute {plan}` | Build from plan (fresh context) | After plan approval |
| `/evolve` | Improve system after bugs | After fixing issues |

---

## Reference Files (Load On-Demand)

Only load these when working on specific tasks:

| Reference | When to Load |
|-----------|--------------|
| `architecture.md` | Understanding three-service pattern |
| `copilotkit.md` | CopilotKit + AG-UI integration |
| `pydantic-ai.md` | Agent tools and patterns |
| `hume-voice.md` | Voice widget setup |
| `mdx-dashboards.md` | Investment dashboard components |
| `scraping.md` | Waddesdon scraper and enrichment |
| `tsca-pattern.md` | Multi-turn conversations |
| `lessons-learned.md` | Past issues and solutions |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (AG-UI) |
| Voice | Hume EVI |
| Agent | Pydantic AI |
| Database | Neon PostgreSQL |
| Commerce | Shopify Storefront API |
| MDX | next-mdx-remote |
| Charts | Recharts |
| Hosting | Vercel (frontend), Railway (agent) |

---

## Database Schema (Summary)

```sql
wines (id, slug, name, vintage, price, region, investment_score,
       drinking_window_*, tasting_notes, mdx_content, shopify_product_id)

wine_regions (slug, name, country, seo_content)

food_pairings (slug, name, category)

wine_pairings (wine_id, pairing_id, score)
```

→ Full schema in `.claude/reference/architecture.md`

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# AI
GOOGLE_API_KEY=...
COPILOTKIT_RUNTIME_URL=http://localhost:8000

# Voice
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=...

# Commerce
SHOPIFY_STOREFRONT_TOKEN=...
SHOPIFY_STORE_DOMAIN=...

# Scraping
FIRECRAWL_API_KEY=...
```

---

## Current Focus

Phase 1: Foundation
- [x] Project setup from CLAUDE_STARTER_KIT
- [x] PRD.md written
- [x] CLAUDE.md structured
- [ ] Neon database schema
- [ ] Waddesdon scraper
- [ ] AI enrichment pipeline

---

## Session Log

### 2026-01-16 (Session 2) - Deployment & Integration
- Deployed frontend to Vercel (frontend project)
- Configured aionysus.wine domain alias
- Updated Hume credentials (config: `6ac2d1ec-2e0f-4957-959a-b4bbb5405d40`)
- **Fixed white screen issue**: Changed CopilotKit from Railway URL to local `/api/copilotkit`
- Created `/api/copilotkit` route with GoogleGenerativeAIAdapter (relocation.quest pattern)
- Created `/api/hume-token` route for voice auth
- Railway agent running at https://aionysus-agent-production.up.railway.app
- Added GOOGLE_API_KEY to Vercel env vars

**Key Lesson**: Don't point CopilotKit to external Railway URL - use local Next.js API route with Google AI adapter. Railway agent is for Hume CLM endpoint only.

### 2025-01-15 (Session 1)
- Created project from CLAUDE_STARTER_KIT
- Wrote comprehensive PRD.md
- Structured modular CLAUDE.md
- Set up reference files for wine-specific patterns
