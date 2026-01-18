# Aionysus Wine - AI Sommelier

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

Wine e-commerce platform with AI sommelier. CopilotKit chat + Hume EVI voice. 3,906 wines from Goedhuis Waddesdon in Neon PostgreSQL. Shopify Storefront API for cart/checkout.

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
| Database queries (frontend) | `src/lib/wine-db.ts` |
| Shopify client | `src/lib/shopify.ts` |
| Hume voice widget | `src/components/HumeWidget.tsx` |
| Hume token API | `src/app/api/hume-token/route.ts` |
| Zep context API | `src/app/api/zep-context/route.ts` |
| Neon Auth client | `src/lib/auth/client.ts` |
| Neon Auth server | `src/lib/auth/server.ts` |
| **Pydantic AI Agent (Railway)** | |
| Agent entry point | `agent/src/agent.py` |
| Database queries (agent) | `agent/src/database.py` |
| Railway config | `agent/railway.toml` |
| CLM endpoint (for Hume) | `{RAILWAY_URL}/chat/completions` |

---

## CopilotKit Actions (useCopilotAction)

| Action | Purpose |
|--------|---------|
| `search_wines` | Search wines by name, region, producer, grape, price |
| `get_wine_details` | Display detailed wine information by slug |

---

## Database (Neon)

Project ID: `icy-art-05281051` (aionysus.wine)

| Table | Purpose |
|-------|---------|
| wines_original | Raw scraped wine data with all fields |
| wine_price_variants | Shopify price variants for each wine |
| wines | Compatibility view mapping to wines_original |

### Wines Table Schema

```sql
wines_original (
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
  original_raw_json JSONB,
  -- Parsed fields
  name VARCHAR(500),
  slug VARCHAR(255) UNIQUE,
  winery VARCHAR(255),
  region VARCHAR(255),
  country VARCHAR(100),
  grape_variety VARCHAR(255),
  vintage INTEGER,
  wine_type VARCHAR(50),
  style VARCHAR(100),
  color VARCHAR(50),
  price_retail DECIMAL(10,2),
  price_trade DECIMAL(10,2),
  bottle_size VARCHAR(50),
  tasting_notes TEXT,
  stock_quantity INTEGER,
  case_size INTEGER,
  classification VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  our_image_url TEXT,
  aionysus_slug VARCHAR(255),
  aionysus_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Wine Stats

- **Total wines**: 3,906
- **Price variants**: 24,341
- **Wines with images**: 1,661
- **Wines without images**: 2,245
- **Existing URL mappings**: 962

---

## Neon Auth

Authentication powered by Neon Auth (`@neondatabase/auth`).

**Routes**:
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/account/settings` - Account settings (protected)

---

## Wine Regions

| Region | Country | Key Grapes |
|--------|---------|------------|
| Burgundy | France | Pinot Noir, Chardonnay |
| Bordeaux | France | Cabernet Sauvignon, Merlot |
| Champagne | France | Chardonnay, Pinot Noir, Pinot Meunier |
| Rhône | France | Syrah, Grenache, Viognier |
| Barolo | Italy | Nebbiolo |

---

## Food Pairings

| Food | Wine Styles |
|------|-------------|
| Red meat | Cabernet Sauvignon, Bordeaux, Barolo, Syrah |
| Poultry | Pinot Noir, Burgundy, Chardonnay |
| Fish | Chablis, Sancerre, White Burgundy |
| Shellfish | Champagne, Muscadet, Albariño |
| Cheese | Port, Sauternes, Aged Burgundy |
| Dessert | Sauternes, Port, Moscato |

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
| E-commerce | Shopify Storefront API |
| Memory | Zep Cloud (optional) |

---

## Environment Variables

```bash
# Database (aionysus.wine)
DATABASE_URL=postgresql://... (from Neon dashboard)

# Shopify
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=... (from Shopify admin)
SHOPIFY_ADMIN_API_TOKEN=... (from Shopify admin)

# Hume EVI
HUME_API_KEY=... (from Hume dashboard)
NEXT_PUBLIC_HUME_CONFIG_ID=29cec14d-5272-4a79-820d-382dc0d0e801

# CopilotKit (Gemini)
GOOGLE_API_KEY=... (from Google Cloud)

# Agent URL (Railway - set after deployment)
NEXT_PUBLIC_AGENT_URL=https://your-agent.up.railway.app

# Neon Auth
NEON_AUTH_BASE_URL=... (from Neon Auth)

# Zep Memory (optional)
ZEP_API_KEY=... (from Zep dashboard)

# Unsplash (dynamic backgrounds)
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=... (from Unsplash developers)
```

---

## Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prime` | Load project context | Start of session |
| `/plan {feature}` | Create implementation plan | Before coding features |
| `/execute {plan}` | Build from plan (fresh context) | After plan approval |
| `/evolve` | Improve system after bugs | After fixing issues |

---

## Railway Deployment (Agent)

1. Create new Railway project
2. Connect GitHub repo
3. Set root directory to `agent/`
4. Add environment variables:
   - `DATABASE_URL` (from Neon)
   - `GOOGLE_API_KEY` (for Gemini)
   - `ZEP_API_KEY` (optional)
5. Deploy will auto-detect `railway.toml`
6. Note the URL (e.g., `https://dionysus-agent-xxx.up.railway.app`)
7. Update Hume EVI CLM endpoint

### CLM Endpoint for Hume

After Railway deployment, your Hume EVI CLM endpoint is:
```
https://your-railway-url.up.railway.app/chat/completions
```

Configure this in Hume Dashboard -> EVI Config -> Custom Language Model.

---

## Dionysus Personality

You are Dionysus, a sophisticated AI wine sommelier.
- Warm, knowledgeable, and passionate about wine
- Like a trusted sommelier - approachable yet refined
- Uses evocative sensory language (notes of blackcurrant, silky tannins...)
- Never pretentious - makes wine accessible to everyone
- "I'm Dionysus, your personal wine sommelier!"

---

## Agent Tools

| Tool | Purpose |
|------|---------|
| `search_wines_tool` | Search by query, region, producer, grape, price, vintage |
| `get_wine_details_tool` | Get detailed wine info by slug |
| `get_wines_by_region_tool` | Browse wines from a region |
| `get_wines_by_producer_tool` | Browse wines from a producer |
| `get_wines_by_price_tool` | Browse wines in price range |
| `get_food_pairing_tool` | Wine recommendations for food |
| `get_region_info_tool` | Learn about wine regions |
| `get_collection_stats_tool` | Wine collection statistics |
| `list_regions_tool` | List available regions |

---

## Scraper Data

All wine data scraped from https://goedhuiswaddesdon.com/collections/buy-wine

**Scraper files** (in `/Users/dankeegan/aionysus-scraper/`):
- `scrape_wines.py` - Main Shopify JSON API scraper
- `download_images.py` - Image downloader
- `map_urls.py` - URL mapping from existing aionysus.wine
- `images/` - 1,661 downloaded wine images (112MB)

---

## Session Log

### Jan 18, 2026
- Full conversion from pension.quest to aionysus.wine
- Scraped 3,906 wines and 24,341 price variants from Goedhuis Waddesdon
- Downloaded 1,661 wine images
- Mapped 962 existing aionysus.wine URLs
- Created wines_original table with compatibility view
- Updated agent from Penelope (pension) to Dionysus (wine sommelier)
- Integrated Shopify for cart/checkout
- Added wine search, region browsing, food pairings
- Updated all frontend pages for wine shopping

### Pending
- Fix Vercel root directory setting (remove "frontend")
- Deploy Railway agent with wine tools
- Add Unsplash dynamic backgrounds by region
- Visual wine recommendations in CopilotKit chat
- Add to cart from AI recommendations

---

## Deployments

| Service | URL |
|---------|-----|
| Frontend | https://aionysus.wine (Vercel) |
| Agent | TBD (Railway) |
| GitHub | https://github.com/Londondannyboy/aionysus.wine |
| Hume Config | 29cec14d-5272-4a79-820d-382dc0d0e801 |

---

## Test Commands

Try these in the chat:
- "Show me Burgundy wines" -> region search
- "What Champagnes do you have?" -> region search
- "Find wines under £50" -> price search
- "What wine goes with steak?" -> food pairing
- "Tell me about Bordeaux" -> region education
- "How many wines do you have?" -> collection stats

---

## Next Phase Tasks

1. **Vercel Fix**: Remove "frontend" from Root Directory in Vercel project settings
2. **Railway Deploy**: Deploy Dionysus agent to Railway
3. **Unsplash Backgrounds**: Add dynamic vineyard backgrounds based on region
4. **Visual Recommendations**: Show wine cards in CopilotKit chat with add-to-cart
5. **Cart Integration**: Enable adding AI-recommended wines to Shopify cart
6. **Image CDN**: Upload 1,661 wine images to Cloudinary or Vercel Blob
