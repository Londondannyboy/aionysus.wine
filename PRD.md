# Aionysus Wine - Product Requirements Document

> This is the **north star document**. All development decisions reference this PRD.

## Vision

An AI-powered wine sommelier and investment platform that helps people discover, purchase, and invest in fine wines through conversational AI (Vik) with voice and chat, backed by a curated collection of 3,900+ wines from premier merchants.

## Problem Statement

Fine wine is intimidating. Regions, vintages, producers, investment potential - the complexity puts people off exploring beyond their comfort zone. There's no single platform that:
- Recommends wines based on preferences in plain English
- Explains investment potential with real data
- Remembers user tastes and preferences
- Works via both text and voice naturally
- Enables purchase with seamless checkout

## Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Wine Curious | New to fine wine, wants guidance | Approachable recommendations, education |
| Collectors | Building a cellar or collection | Investment data, rare bottles, storage info |
| Gift Buyers | Purchasing wine as gifts | Occasion-based recommendations, packaging |
| Investors | Wine as alternative investment | Returns data, market trends, portfolio tools |
| English Wine Fans | Interested in emerging UK scene | Discovery, investment potential, advocacy |

## Core Features

### 1. AI Wine Discovery (Vik)

**User Story**: As a wine lover, I want to chat with an AI sommelier who understands my preferences and makes personalized recommendations.

**Acceptance Criteria**:
- [x] Voice interaction via Hume EVI
- [x] Text chat via CopilotKit
- [x] Searches 3,900+ wines from database
- [x] Remembers user preferences via Zep
- [ ] Vik persona with English wine advocacy
- [ ] Visual wine cards in chat responses

### 2. Wine Investment Dashboard

**User Story**: As a wine investor, I want to see historical performance and projections for wines I'm considering.

**Acceptance Criteria**:
- [ ] Investment rating per wine (A+ to C)
- [ ] Historical price chart (5 years)
- [ ] Annual return percentage
- [ ] Volatility and liquidity scores
- [ ] Analyst recommendations
- [ ] English wine investment thesis

### 3. Rich Wine Detail Pages

**User Story**: As a wine researcher, I want comprehensive information about each wine for informed decisions.

**Acceptance Criteria**:
- [x] Basic wine info (name, producer, region, vintage)
- [x] Price and availability
- [ ] Detailed tasting notes
- [ ] Food pairings with images
- [ ] Critics scores (if available)
- [ ] Investment performance chart
- [ ] Similar wines recommendations
- [ ] Dynamic regional background

### 4. Shopify Cart & Checkout

**User Story**: As a buyer, I want to add wines to cart and checkout seamlessly.

**Acceptance Criteria**:
- [x] Shopify Storefront API integration
- [ ] All 3,906 wines synced as Shopify products
- [ ] Add to cart from wine cards
- [ ] Add to cart from AI recommendations
- [ ] Cart page with totals
- [ ] Redirect to Shopify checkout

### 5. Dynamic Visual Experience

**User Story**: As a user, I want the site to feel immersive with beautiful wine imagery.

**Acceptance Criteria**:
- [x] Unsplash backgrounds based on wine region
- [x] Background changes with search context
- [ ] Vik avatar with animation
- [ ] Wine bottle/label imagery
- [ ] Regional vineyard photography

### 6. English Wine Month Campaign

**User Story**: As a visitor, I want to discover English wines through a curated campaign.

**Acceptance Criteria**:
- [ ] Vik persona championing English wine
- [ ] Featured English wine collection
- [ ] Investment case for English sparkling
- [ ] Producer spotlights (Nyetimber, Chapel Down, etc.)
- [ ] Campaign banner and navigation

## Non-Goals (Explicit Exclusions)

- **Wine Storage**: We don't provide cellar/storage services
- **En Primeur**: We don't handle futures/pre-release purchases
- **Wine Valuation**: We provide data, not professional valuations
- **Insurance**: We don't provide wine insurance
- **Shipping Logistics**: Handled by Shopify/merchant

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARCHITECTURE                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ┌──────────────┐                              ┌────────────────┐  │
│   │   VERCEL     │                              │    RAILWAY     │  │
│   │  (Next.js)   │                              │   (Python)     │  │
│   │              │                              │                │  │
│   │ Frontend     │ ────── AG-UI Protocol ─────► │  Pydantic AI   │  │
│   │ + CopilotKit │                              │  Agent (Vik)   │  │
│   │              │ ◄──── /chat/completions ──── │                │  │
│   └──────────────┘                              └────────────────┘  │
│          │                        ▲                    │            │
│          │                        │                    │            │
│          │                 ┌──────────────┐           │            │
│          │                 │   HUME AI    │           │            │
│          │                 │   (Voice)    │           │            │
│          │                 │   via CLM    │           │            │
│          │                 └──────────────┘           │            │
│          │                                            │            │
│          └──────────────────┬─────────────────────────┘            │
│                             │                                       │
│                      ┌──────────────┐                              │
│                      │    NEON      │                              │
│                      │  PostgreSQL  │                              │
│                      │  + Auth      │                              │
│                      └──────────────┘                              │
│                             │                                       │
│                      ┌──────────────┐                              │
│                      │   SHOPIFY    │                              │
│                      │  Storefront  │                              │
│                      │   + Admin    │                              │
│                      └──────────────┘                              │
│                                                                      │
│   External Services:                                                │
│   ├── Neon PostgreSQL (Database + Auth) ✓                          │
│   ├── Zep Cloud (Memory/Facts) ✓                                   │
│   ├── Google Gemini (LLM) ✓                                        │
│   ├── Hume AI (Voice) ✓                                            │
│   ├── Shopify (Commerce) ✓                                         │
│   └── Unsplash (Backgrounds) ✓                                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 15, React 19, TypeScript | SSR, App Router, modern React |
| UI | Tailwind CSS, Framer Motion | Rapid styling, smooth animations |
| AI Chat | CopilotKit + Gemini | Structured tools, generative UI |
| Agent | Pydantic AI + FastAPI | Type-safe tools, AG-UI protocol |
| Database | Neon PostgreSQL | Serverless, branching, auth |
| Voice | Hume EVI | Low-latency emotional voice AI |
| Memory | Zep Cloud | Conversation memory, user facts |
| Auth | Neon Auth | Integrated with database |
| Commerce | Shopify Storefront + Admin API | Cart, checkout, inventory |
| Backgrounds | Unsplash API | Dynamic regional imagery |

### Database Schema

**wines_original** (3,906 wines)
- id, handle, title, vendor, product_type, tags
- price_min, price_max, image_url, original_url
- name, slug, winery, region, country
- grape_variety, vintage, wine_type, style, color
- price_retail, price_trade, bottle_size
- tasting_notes, stock_quantity, case_size, classification
- shopify_product_id, aionysus_slug, aionysus_url

**wine_price_variants** (24,341 variants)
- id, wine_id, variant_id, title, price, compare_at_price
- available, sku, grams, inventory_quantity

**wine_investment_data** (to be created)
- wine_id, price_2020-2025, annual_return_pct
- volatility_score, investment_rating, liquidity_score
- projected_5yr_return, analyst_recommendation

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Wines catalogued | 3,906 | Database count |
| Shopify products | 3,906 | Shopify admin |
| Voice response latency | <1s | Hume metrics |
| Conversion rate | 2%+ | Shopify analytics |
| English wine sales | 10%+ | Tagged orders |

## Milestones

### Phase 1: MVP (COMPLETE)
- [x] Next.js 15 project with CopilotKit
- [x] Neon database with 3,906 wines
- [x] Wine search, listing, detail pages
- [x] Hume voice integration
- [x] Neon Auth
- [x] Deploy to Vercel + Railway

### Phase 2: Commerce & Investment (CURRENT)
- [ ] Sync all wines to Shopify
- [ ] Cart and checkout flow
- [ ] Wine investment seed data
- [ ] Investment UI components
- [ ] Vik persona implementation
- [ ] English Wine Month campaign

### Phase 3: Enrichment & Scale
- [ ] Web scraping for wine details
- [ ] Critics scores integration
- [ ] Advanced food pairings
- [ ] User portfolios/collections
- [ ] Price alerts
- [ ] Mobile app

## Vik Persona

**Name**: Vik
**Background**: Former wine magazine journalist, AI sommelier
**Specialty**: English wines (though knowledgeable about all regions)
**Personality**: Warm, knowledgeable, cheeky English wine advocate

**Key Traits**:
- Uses vivid sensory language
- Always finds a way to mention English wine
- Genuinely helpful with all queries
- Campaign: "Vik's English Wine Month"

**Example Dialogue**:
> "Ah, a lovely Champagne! Though between us, Nyetimber's Blanc de Blancs gives it a serious run for the money. Have you tried it?"

## Disclaimers

Aionysus Wine provides wine information and facilitates purchases. Wine values can go down as well as up. Past performance is not indicative of future results. Investment data is for illustrative purposes. Vik is an AI assistant, not a financial adviser.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Scraped 3,906 wines from Goedhuis Waddesdon | Claude |
| 2026-01-18 | Voice integration with Hume EVI complete | Claude |
| 2026-01-18 | Dynamic Unsplash backgrounds implemented | Claude |
| 2026-01-18 | Created Phase 2 restart prompt | Claude |
