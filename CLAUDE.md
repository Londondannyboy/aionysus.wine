# Aionysus Wine - AI Sommelier & Investment Platform

> **Cole Medin Methodology**: PRD-first, modular rules, command-ify, context reset, system evolution.

## Quick Start

```bash
# Frontend (Next.js)
npm run dev              # -> localhost:3000

# Agent (Pydantic AI on Railway)
cd agent && source .venv/bin/activate
uvicorn src.agent:app --reload --port 8000
```

## Current Architecture

Wine e-commerce and investment platform with AI sommelier (Vik). CopilotKit chat + Hume EVI voice. 3,906 wines from Goedhuis Waddesdon in Neon PostgreSQL. Shopify Storefront API for cart/checkout. Dynamic Unsplash backgrounds by region.

**Pattern**: Next.js frontend + CopilotKit runtime + Pydantic AI agent on Railway for voice CLM.

---

## Key Files

| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| Wine listing | `src/app/wines/page.tsx` |
| Wine detail | `src/app/wines/[slug]/page.tsx` |
| Cart page | `src/app/cart/page.tsx` |
| CopilotKit provider | `src/components/providers.tsx` |
| CopilotKit runtime | `src/app/api/copilotkit/route.ts` |
| Wines API | `src/app/api/wines/route.ts` |
| Database queries | `src/lib/wine-db.ts` |
| Shopify client | `src/lib/shopify.ts` |
| Unsplash lib | `src/lib/unsplash.ts` |
| Dynamic backgrounds | `src/components/DynamicBackground.tsx` |
| Hume voice widget | `src/components/HumeWidget.tsx` |
| Hume token API | `src/app/api/hume-token/route.ts` |
| Neon Auth client | `src/lib/auth/client.ts` |
| Neon Auth server | `src/lib/auth/server.ts` |
| **Agent (Railway)** | |
| Agent entry point | `agent/src/agent.py` |
| Database queries | `agent/src/database.py` |
| Railway config | `agent/railway.toml` |

---

## Deployments

| Service | URL |
|---------|-----|
| Frontend | https://aionysus.wine (Vercel) |
| Agent | https://dionysus-production.up.railway.app (Railway) |
| GitHub | https://github.com/Londondannyboy/aionysus.wine |
| Database | ep-restless-wildflower-abjlgti1 (Neon) |
| Hume Config | 6ac2d1ec-2e0f-4957-959a-b4bbb5405d40 |
| Shopify | aionysus-3.myshopify.com |

---

## Environment Variables

```bash
# Database (Neon)
DATABASE_URL=postgresql://neondb_owner:npg_IERTg3leh5nD@ep-restless-wildflower-abjlgti1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require

# Google Gemini (LLM)
GOOGLE_API_KEY=AIzaSyDk_v8sPKmYlukWdsncrosnt6XH5vqD2e4

# Agent URL (Railway)
NEXT_PUBLIC_AGENT_URL=https://dionysus-production.up.railway.app

# Hume EVI
HUME_API_KEY=uGiokBIyJvWBBPi90z2kWYg9Jss0sor7Xn97cG5ixgs4OLCy
HUME_SECRET_KEY=gMqhKe3iqlAHHOEuRGW2NWbg5AG0kcZttCoDaQO5hDJt5dgDziQngd74f4igGgIV
NEXT_PUBLIC_HUME_CONFIG_ID=6ac2d1ec-2e0f-4957-959a-b4bbb5405d40

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=<from .env.local>
SHOPIFY_ADMIN_API_TOKEN=<from .env.local>

# Zep Memory
ZEP_API_KEY=z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0...

# Unsplash (dynamic backgrounds)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=c_y_xJaw-p05vjKOKC5kdiZGw21trx9DbRYjWx-9AVY

# Neon Auth
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-restless-wildflower-abjlgti1.neonauth.eu-west-2.aws.neon.tech/neondb/auth
NEON_AUTH_BASE_URL=https://ep-restless-wildflower-abjlgti1.neonauth.eu-west-2.aws.neon.tech/neondb/auth
```

---

## Database Schema

**wines_original** (3,906 wines)
```sql
CREATE TABLE wines_original (
  id SERIAL PRIMARY KEY,
  handle VARCHAR(255),
  title VARCHAR(500),
  vendor VARCHAR(255),
  product_type VARCHAR(100),
  tags TEXT[],
  price_min DECIMAL(10,2),
  price_max DECIMAL(10,2),
  image_url TEXT,
  original_url TEXT,
  name VARCHAR(500),
  slug VARCHAR(255) UNIQUE,
  winery VARCHAR(255),
  region VARCHAR(255),
  country VARCHAR(100),
  grape_variety VARCHAR(255),
  vintage INTEGER,
  wine_type VARCHAR(50),
  price_retail DECIMAL(10,2),
  tasting_notes TEXT,
  classification VARCHAR(255),
  shopify_product_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**wine_price_variants** (24,341 variants)
```sql
CREATE TABLE wine_price_variants (
  id SERIAL PRIMARY KEY,
  wine_id INTEGER REFERENCES wines_original(id),
  variant_id VARCHAR(50),
  title VARCHAR(255),
  price DECIMAL(10,2),
  available BOOLEAN
);
```

---

## Phase 2 Tasks (Current Priority)

### 1. Vik Persona
- Update agent system prompt to Vik character
- English wine advocate, cheeky personality
- Campaign: "Vik's English Wine Month"
- Add Vik avatar to homepage

### 2. Shopify Product Sync
- Script to add all 3,906 wines via Admin API
- Map wine data to Shopify products
- Update shopify_product_id in database
- Enable full cart/checkout flow

### 3. Wine Investment Data
- Create wine_investment_data table
- Seed with simulated historical prices
- Calculate annual returns, ratings
- Display on wine detail pages

### 4. Enhanced Wine Pages
- Web scraping for detailed tasting notes
- Options: Crawl4AI, Serper.dev, LLM generation
- Add food pairings, critics scores
- Investment performance charts

### 5. English Wine Collection
- Feature English producers (Nyetimber, Chapel Down, etc.)
- Investment thesis for English sparkling
- Dedicated collection page

---

## Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prime` | Load project context | Start of session |
| `/plan {feature}` | Create implementation plan | Before coding features |
| `/execute {plan}` | Build from plan (fresh context) | After plan approval |
| `/evolve` | Improve system after bugs | After fixing issues |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (Next.js runtime + AG-UI protocol) |
| Voice | Hume EVI (@humeai/voice-react) |
| Agent | Pydantic AI (FastAPI on Railway) |
| Database | Neon PostgreSQL (@neondatabase/serverless) |
| Auth | Neon Auth (@neondatabase/auth) |
| E-commerce | Shopify Storefront + Admin API |
| Memory | Zep Cloud |
| Backgrounds | Unsplash API |

---

## Wine Regions

| Region | Country | Key Grapes |
|--------|---------|------------|
| Burgundy | France | Pinot Noir, Chardonnay |
| Bordeaux | France | Cabernet Sauvignon, Merlot |
| Champagne | France | Chardonnay, Pinot Noir |
| Rhône | France | Syrah, Grenache |
| **Sussex** | **England** | Chardonnay, Pinot Noir (sparkling) |
| **Kent** | **England** | Bacchus, Chardonnay |

---

## Vik Persona (AI Sommelier)

**Name**: Vik
**Background**: Former wine magazine journalist
**Secret Passion**: English wines (especially Sussex sparkling)
**Campaign**: "Vik's English Wine Month"

**Personality**:
- Warm, knowledgeable, approachable
- Uses vivid sensory language
- Always mentions English wine, even when discussing other regions
- "Between us, have you tried English sparkling? It rivals Champagne!"

**Featured English Wines**:
- Nyetimber Blanc de Blancs
- Chapel Down Brut
- Gusbourne Blanc de Blancs
- Ridgeview Bloomsbury
- Bolney Estate Pinot Noir

---

## Test Commands

Try these in the chat/voice:
- "Show me Burgundy wines"
- "What Champagnes do you have?"
- "Find wines under £50"
- "What wine goes with steak?"
- "Tell me about English wine"
- "Which wines are good investments?"

---

## Session Log

### Jan 18, 2026
- Full conversion from pension.quest to aionysus.wine
- Scraped 3,906 wines and 24,341 price variants
- Downloaded 1,661 wine images
- Voice integration complete (Hume EVI + Railway CLM)
- Dynamic Unsplash backgrounds implemented
- Created Phase 2 restart prompt
- Updated PRD and CLAUDE.md

### Phase 2 Pending
- Vik persona implementation
- Shopify product sync (3,906 wines)
- Wine investment seed data
- Enhanced wine detail pages
- English Wine Month campaign

---

## Important Notes

- **Hume CLM Endpoint**: https://dionysus-production.up.railway.app/chat/completions
- **Railway Project**: dionysus-wine-agent (workspace: Quest)
- **Vercel Project**: aionysus.wine
- **Don't add trailing newlines** to env vars (caused auth failures)
- **Use printf '%s'** when adding Vercel env vars via CLI

---

## Restart Prompt Location

For comprehensive session restart: `RESTART_PROMPT.md`
