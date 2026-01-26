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

Wine e-commerce and investment platform with AI sommelier (Vic). CopilotKit chat + Hume EVI voice. 3,906 wines from Goedhuis Waddesdon in Neon PostgreSQL. Shopify Storefront API for cart/checkout. Dynamic Unsplash backgrounds by region.

**Pattern**: Next.js frontend + CopilotKit runtime + Pydantic AI agent on Railway for voice CLM.

---

## Key Files

| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| Wine listing | `src/app/wines/page.tsx` |
| Wine detail | `src/app/wines/[slug]/page.tsx` |
| Cart page | `src/app/cart/page.tsx` |
| **CopilotKit** | |
| Provider + Global Actions | `src/components/providers.tsx` |
| Global Frontend Tools | `src/components/GlobalCopilotActions.tsx` |
| Global Vic Sidebar | `src/components/GlobalVicSidebar.tsx` |
| Voice Transcript Sync | `src/components/VoiceTranscriptSync.tsx` |
| CopilotKit runtime | `src/app/api/copilotkit/route.ts` |
| **Voice** | |
| Hume voice widget | `src/components/HumeWidget.tsx` |
| Hume token API | `src/app/api/hume-token/route.ts` |
| **Data & Auth** | |
| Wines API | `src/app/api/wines/route.ts` |
| Database queries | `src/lib/wine-db.ts` |
| Shopify client | `src/lib/shopify.ts` |
| Unsplash lib | `src/lib/unsplash.ts` |
| Neon Auth client | `src/lib/auth/client.ts` |
| Neon Auth server | `src/lib/auth/server.ts` |
| **Components** | |
| Dynamic backgrounds | `src/components/DynamicBackground.tsx` |
| Wine image (client) | `src/components/WineImage.tsx` |
| **Agent (Railway)** | |
| Agent entry point | `agent/src/agent.py` |
| Database queries | `agent/src/database.py` |
| Railway config | `agent/railway.toml` |

---

## CopilotKit Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    COPILOTKIT SETUP                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   layout.tsx                                                │
│   └── <Providers>                                           │
│       └── <CopilotKit runtimeUrl agent="vic">               │
│           └── <GlobalCopilotActions />  ← Frontend tools    │
│               └── <GlobalVicSidebar>    ← CopilotSidebar    │
│                   └── {children}                            │
│                                                              │
│   GlobalCopilotActions.tsx (uses useFrontendTool):          │
│   ├── search_wines          - Search wine database          │
│   ├── get_wine_details      - Get single wine info          │
│   ├── add_to_cart           - Add wine by slug              │
│   ├── add_current_wine_to_cart - Add viewed wine            │
│   ├── vic_special_bottle    - Vic's Nyetimber signature     │
│   ├── view_cart             - Navigate to cart              │
│   ├── browse_wines          - Navigate to wines list        │
│   └── view_wine             - Navigate to wine detail       │
│                                                              │
│   Context (useCopilotReadable):                             │
│   ├── Current page path                                     │
│   ├── Current wine (if on detail page)                      │
│   ├── Search results                                        │
│   └── Cart state                                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Important**: Using `useFrontendTool` (not deprecated `useCopilotAction`) per CopilotKit best practices.

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
GOOGLE_API_KEY=<from .env.local - DO NOT commit to repo>

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

## SEO Best Practices for Wine Pages

All wine detail pages must follow these SEO guidelines for optimal search ranking:

### Target Keyword Placement
1. **Title tag**: Keyword at start, under 60 characters
2. **Meta description**: Keyword included, 140-160 characters (not longer!)
3. **H1 heading**: Keyword included (only one H1 per page)
4. **H2 headings**: Keyword in 2-3 H2s, vary phrasing to avoid stuffing
5. **Body content**: Keyword appears 4-8+ times, **bolded once** early in content
6. **URL slug**: Keyword included (already handled)

### Image SEO
- **Alt text**: Include full keyword + descriptive context
- **Title attribute**: Include keyword + additional context
- **File names/URLs**: Include keyword where possible

### Content Requirements
- **Word count**: Minimum 500+ words per page (ideally 1000+)
- **Keyword density**: ~1-2% (avoid stuffing - space out mentions)
- **Structured data**: JSON-LD Product schema, FAQPage schema for FAQs

### Internal & External Links
- Link to target page from homepage (Featured Wine section)
- Link from wines listing page with keyword anchor text
- Add 10+ high-authority external links (Wikipedia, BBC, official tourism, major merchants)
- Internal links from region pages using keyword anchor text

### Files for SEO
| Purpose | Location |
|---------|----------|
| Full enrichments | `src/lib/wine-enrichment.ts` (WINE_ENRICHMENTS) |
| Lightweight SEO | `src/lib/wine-enrichment.ts` (WINE_SEO_OVERRIDES) |
| Metadata generation | `src/app/wines/[slug]/page.tsx` (generateMetadata) |
| Homepage featured | `src/app/page.tsx` (Featured Wine of the Month) |

---

## Current Status (Jan 26, 2026)

### Completed
- [x] Light theme for wine detail pages (Wine Society style)
- [x] SEO: H1-H6 hierarchy, wine name 4-8 times, bolded once
- [x] SEO: Image title attributes with keywords
- [x] SEO: Meta descriptions under 160 characters
- [x] SEO: Lightweight SEO overrides for GSC keywords
- [x] SEO: About section for non-enriched wines (word count boost)
- [x] SEO: FAQ section with schema.org markup
- [x] SEO: 20 high-authority external links per enriched page
- [x] Homepage Featured Wine of the Month section
- [x] Wines listing page Rare & Historic section
- [x] CopilotKit Sidebar on ALL pages (GlobalVicSidebar)
- [x] Site-wide frontend tools (GlobalCopilotActions)
- [x] Migrated to `useFrontendTool` per CopilotKit best practices
- [x] Voice transcript sync to CopilotKit chat
- [x] Cart and investment tools in Pydantic AI agent
- [x] WineImage client component for error handling

### In Progress
- [ ] Hume voice audio output not playing (connection works, debugging audio state)
- [ ] Shopify product sync (97% complete)

### Pending
- [ ] Vic persona full implementation
- [ ] Wine investment seed data
- [ ] English Wine Month campaign

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (`useFrontendTool`, `useCopilotReadable`) |
| Voice | Hume EVI (@humeai/voice-react v0.2.11) |
| Agent | Pydantic AI (FastAPI on Railway) |
| Database | Neon PostgreSQL (@neondatabase/serverless) |
| Auth | Neon Auth (@neondatabase/auth) |
| E-commerce | Shopify Storefront + Admin API |
| Memory | Zep Cloud |
| Backgrounds | Unsplash API |

---

## Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/prime` | Load project context | Start of session |
| `/plan {feature}` | Create implementation plan | Before coding features |
| `/execute {plan}` | Build from plan (fresh context) | After plan approval |
| `/evolve` | Improve system after bugs | After fixing issues |

---

## Vic Persona (AI Sommelier)

**Name**: Vic
**Background**: Former wine magazine journalist
**Secret Passion**: English wines (especially Sussex sparkling)
**Campaign**: "Vic's English Wine Month"

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
- "Add this wine to my cart"

---

## Session Log

### Jan 22, 2026
- Light theme for wine detail pages (Wine Society reference)
- SEO improvements (wine name 4-6 times, H1-H6 hierarchy)
- CopilotKit on ALL pages via GlobalVicSidebar
- Migrated to useFrontendTool (deprecated useCopilotAction)
- Voice transcript sync to CopilotKit chat panel
- Added cart/investment tools to Railway agent
- Debugging Hume audio output (connects but no sound)

### Jan 18, 2026
- Full conversion from pension.quest to aionysus.wine
- Scraped 3,906 wines and 24,341 price variants
- Downloaded 1,661 wine images
- Voice integration complete (Hume EVI + Railway CLM)
- Dynamic Unsplash backgrounds implemented

---

## Known Issues

1. **Hume Audio Output**: Connection works, but voice audio not playing. Debug info shows audio state. May be browser autoplay restrictions or AudioContext initialization.

2. **Some Wine Images 404**: Not all wines have images. WineImage component handles fallback to emoji.

---

## Important Notes

- **Hume CLM Endpoint**: https://dionysus-production.up.railway.app/chat/completions
- **Railway Project**: dionysus-wine-agent (workspace: Quest)
- **Vercel Project**: aionysus.wine
- **Don't add trailing newlines** to env vars (caused auth failures)
- **Use printf '%s'** when adding Vercel env vars via CLI
- **Use useFrontendTool** not useCopilotAction (deprecated)

---

## Restart Prompt Location

For comprehensive session restart: `RESTART_PROMPT.md`
