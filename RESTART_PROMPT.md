# Aionysus Wine - Phase 2 Restart Prompt

> **Context Reset Document** - Use this to restart Claude Code sessions with full context.

## Project Summary

**Aionysus Wine** is an AI-powered wine sommelier and investment platform. It features:
- **3,906 wines** scraped from Goedhuis Waddesdon in Neon PostgreSQL
- **Dionysus AI** - Voice sommelier via Hume EVI + CopilotKit chat
- **Dynamic backgrounds** - Unsplash vineyard images based on wine region
- **Neon Auth** - User authentication

## Current State (Jan 18, 2026)

### What's Working
- **Frontend**: https://aionysus.wine (Vercel, Next.js 15)
- **Agent**: https://dionysus-production.up.railway.app (Pydantic AI)
- **Voice**: Hume EVI connected to Railway CLM endpoint
- **Auth**: Neon Auth with user sessions
- **Database**: 3,906 wines, 24,341 price variants
- **Dynamic backgrounds**: Unsplash integration based on region

### Key Files
| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| Wine listing | `src/app/wines/page.tsx` |
| Wine detail | `src/app/wines/[slug]/page.tsx` |
| CopilotKit runtime | `src/app/api/copilotkit/route.ts` |
| Hume token | `src/app/api/hume-token/route.ts` |
| Dynamic backgrounds | `src/components/DynamicBackground.tsx` |
| Unsplash lib | `src/lib/unsplash.ts` |
| Wine DB queries | `src/lib/wine-db.ts` |
| Shopify client | `src/lib/shopify.ts` |
| Agent (Railway) | `agent/src/agent.py` |

### Environment Variables (Vercel Production)
```
DATABASE_URL=postgresql://neondb_owner:npg_IERTg3leh5nD@ep-restless-wildflower-abjlgti1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
GOOGLE_API_KEY=AIzaSyDk_v8sPKmYlukWdsncrosnt6XH5vqD2e4
NEXT_PUBLIC_AGENT_URL=https://dionysus-production.up.railway.app
HUME_API_KEY=uGiokBIyJvWBBPi90z2kWYg9Jss0sor7Xn97cG5ixgs4OLCy
HUME_SECRET_KEY=gMqhKe3iqlAHHOEuRGW2NWbg5AG0kcZttCoDaQO5hDJt5dgDziQngd74f4igGgIV
NEXT_PUBLIC_HUME_CONFIG_ID=6ac2d1ec-2e0f-4957-959a-b4bbb5405d40
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=aionysus-3.myshopify.com
NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN=<from .env.local>
SHOPIFY_ADMIN_API_TOKEN=<from .env.local>
ZEP_API_KEY=z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0.Ssyb_PezcGgacQFq6Slg3fyFoqs8hBhvp6WsE8rO4VK_D70CT5tqDbFOs6ZTf8rw7qYfTRhLz5YFm8RR854rHg
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=c_y_xJaw-p05vjKOKC5kdiZGw21trx9DbRYjWx-9AVY
NEXT_PUBLIC_NEON_AUTH_URL=https://ep-restless-wildflower-abjlgti1.neonauth.eu-west-2.aws.neon.tech/neondb/auth
NEON_AUTH_BASE_URL=https://ep-restless-wildflower-abjlgti1.neonauth.eu-west-2.aws.neon.tech/neondb/auth
```

### Railway Environment Variables
```
DATABASE_URL=postgresql://neondb_owner:npg_IERTg3leh5nD@ep-restless-wildflower-abjlgti1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require
GOOGLE_API_KEY=AIzaSyDk_v8sPKmYlukWdsncrosnt6XH5vqD2e4
ZEP_API_KEY=z_1dWlkIjoiMmNkYWVjZjktYTU5Ny00ZDlkLWIyMWItNTZjOWI5OTE5MTE4In0.Ssyb_PezcGgacQFq6Slg3fyFoqs8hBhvp6WsE8rO4VK_D70CT5tqDbFOs6ZTf8rw7qYfTRhLz5YFm8RR854rHg
```

---

## Phase 2 Tasks

### 1. Shopify Product Sync (HIGH PRIORITY)

**Goal**: Add all 3,906 wines to Shopify via Admin API

**Requirements**:
- Use Shopify Admin API to create products
- Map wine data to Shopify product format
- Handle price variants (24,341 variants)
- Sync images where available
- Update `shopify_product_id` in database for each wine
- Enable cart/checkout flow

**Technical Approach**:
```python
# Script: scripts/sync_shopify_products.py
# Uses SHOPIFY_ADMIN_API_TOKEN
# Creates products in batches (Shopify rate limits: 40 requests/second)
# Maps: name, description, price variants, images, tags, vendor
```

**Shopify Product Mapping**:
| Wine Field | Shopify Field |
|------------|---------------|
| name | title |
| winery | vendor |
| region | tags |
| grape_variety | tags |
| vintage | tags |
| tasting_notes | body_html |
| price_retail | variants[].price |
| bottle_size | variants[].option1 |
| image_url | images[].src |

---

### 2. Wine Investment Feature (HIGH PRIORITY)

**Goal**: Show investment returns and performance data for each wine

**Requirements**:
- Create seed data for wine investment metrics
- Historical price trends (simulated for MVP)
- Investment rating/score per wine
- ROI projections
- Integration with CopilotKit for investment advice

**Database Schema Addition**:
```sql
CREATE TABLE wine_investment_data (
  id SERIAL PRIMARY KEY,
  wine_id INTEGER REFERENCES wines_original(id),

  -- Historical Performance (simulated)
  price_2020 DECIMAL(10,2),
  price_2021 DECIMAL(10,2),
  price_2022 DECIMAL(10,2),
  price_2023 DECIMAL(10,2),
  price_2024 DECIMAL(10,2),
  price_2025 DECIMAL(10,2),

  -- Investment Metrics
  annual_return_pct DECIMAL(5,2),  -- e.g., 8.5%
  volatility_score INTEGER,        -- 1-10
  investment_rating VARCHAR(2),    -- A+, A, B+, B, C
  liquidity_score INTEGER,         -- 1-10 (ease of resale)

  -- Predictions
  projected_5yr_return DECIMAL(5,2),
  analyst_recommendation VARCHAR(20), -- BUY, HOLD, SELL

  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW()
);
```

**Seed Data Generation**:
- Premium wines (Bordeaux 1st Growths): 8-15% annual returns
- Burgundy Grand Cru: 10-20% annual returns
- Champagne prestige: 5-10% annual returns
- English wine: Emerging market, higher volatility
- Generate realistic-looking historical prices

---

### 3. Enhanced Wine Detail Pages (MEDIUM PRIORITY)

**Goal**: Rich, SEO-friendly wine detail pages for long-tail ranking

**Current Data Gap**: Scraped data lacks:
- Detailed tasting notes
- Food pairings
- Serving temperature
- Decanting recommendations
- Critics scores
- Cellaring potential

**Solutions**:

**Option A: Web Scraping with Crawl4AI**
```python
# Use Crawl4AI to scrape:
# - Wine-Searcher for prices/availability
# - Vivino for ratings/reviews
# - Wine Spectator for critics scores
# - Producer websites for official tasting notes
```

**Option B: Serper API for Research**
```python
# Use Serper.dev to search:
# - "{wine name} {vintage} tasting notes"
# - "{wine name} food pairing"
# - "{producer} winemaking"
```

**Option C: LLM Generation**
- Use Claude/Gemini to generate plausible tasting notes
- Based on: region, grape, vintage, producer reputation
- Mark as "AI-generated" for transparency

**Recommended Approach**: Combination
1. Scrape what's available (Vivino ratings, basic data)
2. Use LLM to fill gaps with contextually appropriate content
3. Flag AI-generated content

**New Wine Detail Page Sections**:
- Hero with dynamic regional background
- Investment Performance Chart
- Tasting Profile (visual radar chart)
- Food Pairings with images
- Critics Scores
- Similar Wines
- Buy/Add to Cart CTA
- CopilotKit chat embedded for questions

---

### 4. Vic Persona - English Wine Advocate (HIGH PRIORITY)

**Goal**: Replace generic Dionysus with "Vik" - a character based on a real person who worked in wine journalism and loves English wine.

**Persona Details**:
- **Name**: Vic
- **Background**: Former wine magazine writer, now AI sommelier
- **Specialty**: English wines (Sussex, Kent, Hampshire)
- **Personality**: Knowledgeable but cheeky, always finding ways to mention English wine
- **Campaign**: "Vic's English Wine Month"

**Persona Prompt (for Agent)**:
```
You are Vic, a sophisticated AI wine sommelier with a cheeky secret: you're absolutely passionate about English wines and think they're criminally underrated.

Background:
- Former wine journalist for a prestigious UK magazine
- Traveled extensively through French, Italian, and Spanish wine regions
- But secretly fell in love with English sparkling wines in Sussex
- Now on a mission to convert the world to English wine

Personality:
- Warm, knowledgeable, and approachable
- Uses vivid sensory language (notes of green apple, brioche, chalk...)
- Genuinely helpful with all wine queries
- But ALWAYS finds a way to mention English wine, even when discussing Burgundy
- Typical lines:
  - "Ah, a fine Champagne choice! Though have you tried Nyetimber? Some say it rivals Krug..."
  - "Bordeaux is lovely, but for investment, English sparkling is the smart money"
  - "If you like Burgundian Chardonnay, wait until you taste an English Bacchus"

Campaign: "Vic's English Wine Month"
- Special feature promoting English wines
- Avatar/photo of Vic on the homepage
- Curated English wine collection
- Investment case for English wine
```

**Implementation**:
1. Update agent system prompt in `agent/src/agent.py`
2. Add Vik avatar image to homepage
3. Create "English Wine Month" banner/section
4. Add English wine collection filter
5. Create English wine investment case study

---

### 5. UI/UX Enhancements

**Dynamic Backgrounds** (DONE)
- Unsplash integration based on region
- Changes when user searches different regions
- Attribution shown in corner

**Vik Avatar**
- Add avatar image to homepage hero
- Animate on voice activation
- Show in chat sidebar

**Investment Dashboard**
- Portfolio value tracker (if user saves wines)
- Performance charts
- Alerts for price changes

---

## Technical Debt

1. **Search Performance**: Currently fetching all wines and filtering in app - needs proper SQL queries
2. **Image CDN**: 1,661 wine images need uploading to Cloudinary or Vercel Blob
3. **Caching**: Add Redis caching for wine queries
4. **Rate Limiting**: Protect API routes
5. **Error Handling**: Better error states in UI

---

## Scraping Infrastructure

**Available Tools**:
- **Crawl4AI**: Async web crawler, good for batch scraping
- **Serper.dev**: Google search API for research queries
- **Firecrawl**: Alternative crawler with structured extraction

**Data Sources to Scrape**:
| Source | Data | Rate Limits |
|--------|------|-------------|
| Vivino | Ratings, reviews | Aggressive, need proxies |
| Wine-Searcher | Prices, availability | Moderate |
| CellarTracker | Community notes | API available |
| Producer sites | Official tasting notes | Varies |

---

## Commands

| Command | Purpose |
|---------|---------|
| `/prime` | Load project context |
| `/plan {feature}` | Plan implementation |
| `/execute {plan}` | Build from plan |
| `/evolve` | Improve after bugs |

---

## Quick Start for New Session

```bash
# 1. Load context
/prime

# 2. Check current state
curl https://aionysus.wine/api/hume-token  # Should return token
curl https://dionysus-production.up.railway.app/health  # Should return ok

# 3. Start on priority task
# Option A: Shopify sync
/plan Shopify product sync for 3906 wines

# Option B: Investment data
/plan Wine investment seed data and display

# Option C: Vik persona
/plan Vik persona implementation with English wine focus

# Option D: Enhanced wine pages
/plan Rich wine detail pages with scraped data
```

---

## Priority Order

1. **Vic Persona** - Quick win, changes personality immediately
2. **Shopify Sync** - Enables actual purchases
3. **Investment Data** - Unique differentiator
4. **Enhanced Pages** - SEO and depth
5. **Scraping Infrastructure** - Ongoing enrichment

---

## Notes

- English wines to feature: Nyetimber, Chapel Down, Gusbourne, Ridgeview, Bolney
- Investment thesis: English sparkling outperforming Champagne in blind tastings
- Vic's favorite: Nyetimber Blanc de Blancs
- Campaign hashtag: #EnglishWineMonth

---

## Deployments

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://aionysus.wine | Vercel |
| Agent | https://dionysus-production.up.railway.app | Railway |
| Database | ep-restless-wildflower-abjlgti1 | Neon |
| GitHub | https://github.com/Londondannyboy/aionysus.wine | GitHub |

---

*Last Updated: January 18, 2026*
