# ionicest.wine V3 - Product Requirements Document

> This is the **north star document**. All development decisions reference this PRD.

## Vision

AI-powered wine discovery platform with unique MDX investment dashboards that rank for long-tail wine search terms and deliver an unmatched interactive experience.

## Problem Statement

Wine discovery sites are static and boring. They lack:
1. **Investment-grade analysis** - No drinking windows, price trends, or investment scores
2. **AI understanding** - Search is keyword-based, not conversational
3. **Interactive content** - Static pages that don't engage users
4. **Long-tail SEO** - Missing opportunities for "best wine for steak under £30" type queries

## Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Wine Collectors | Serious buyers building cellars | Investment analysis, drinking windows, critic scores |
| Wine Enthusiasts | Casual buyers seeking quality | Food pairings, recommendations, discovery |
| Gift Buyers | Shopping for others | Price-filtered options, occasion-based suggestions |
| First-time Buyers | New to fine wine | Education, approachable recommendations |

## Core Features

### 1. MDX Investment Dashboards

**User Story**: As a wine collector, I want to see investment potential and drinking windows for each wine so I can make informed purchasing decisions.

**Acceptance Criteria**:
- [ ] Each wine page displays interactive `<InvestmentScore />` component
- [ ] `<DrinkingWindowChart />` shows optimal, current, and peak drinking years
- [ ] `<TastingProfile />` visualizes body, tannins, acidity as a flavor wheel
- [ ] `<SimilarWines />` grid shows comparable options
- [ ] All components are CopilotKit-aware and can be referenced in chat

### 2. AI Wine Sommelier

**User Story**: As a wine enthusiast, I want to ask natural language questions about wine so I can discover wines that match my needs.

**Acceptance Criteria**:
- [ ] CopilotKit sidebar available on all pages
- [ ] Agent understands queries like "red wine for lamb under £40"
- [ ] Agent can search, filter, compare, and recommend wines
- [ ] Responses include rendered wine cards and interactive elements
- [ ] Context-aware: knows what page user is on, what filters are active

### 3. Voice Sommelier

**User Story**: As a user, I want to speak to the AI sommelier hands-free so I can browse while cooking or entertaining.

**Acceptance Criteria**:
- [ ] Hume EVI voice widget available on homepage
- [ ] Voice queries routed to same Pydantic AI agent
- [ ] Tool calls work via voice (search, recommend, add to cart)
- [ ] Natural conversational flow with low latency

### 4. E-commerce Integration

**User Story**: As a buyer, I want to purchase wines directly so I can complete my transaction without leaving the site.

**Acceptance Criteria**:
- [ ] Add to cart functionality on wine pages and via chat
- [ ] Cart persists across sessions
- [ ] Checkout via Shopify Storefront API
- [ ] Order confirmation and tracking

## Non-Goals (Explicit Exclusions)

- Wine club subscriptions (defer to Phase 3)
- User-generated reviews (defer to Phase 2)
- Mobile native app (web-only for now)
- Wine auction integration
- Multiple merchant aggregation (single source: Waddesdon Wine)

## Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ionicest.wine V3                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   [User] ──► [Frontend/Vercel] ◄──► [Agent/Railway]         │
│                    │                       │                 │
│                    ▼                       ▼                 │
│              [Shopify]              [Neon PostgreSQL]        │
│                    │                                         │
│                    ▼                                         │
│              [Hume Voice]                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 15 + React 19 | SSR, App Router, streaming |
| AI Chat | CopilotKit (AG-UI) | Generative UI, tool rendering |
| Agent | Pydantic AI | Type-safe tools, streaming |
| Database | Neon PostgreSQL | Serverless, branching |
| Voice | Hume EVI | Low-latency, emotional AI |
| Commerce | Shopify Storefront API | Proven e-commerce |
| MDX | next-mdx-remote | Dynamic component rendering |

### Key Integration Points

1. **Frontend ↔ Agent**: AG-UI protocol via CopilotKit runtime
2. **Agent ↔ Database**: asyncpg queries to Neon
3. **Voice ↔ Agent**: CLM endpoint (OpenAI-compatible SSE)
4. **Frontend ↔ Shopify**: Storefront GraphQL API

## Data Pipeline

### Scraping (Waddesdon Wine)

Source: https://waddesdonwine.co.uk/

| Field | Source | Required |
|-------|--------|----------|
| name | Product title | Yes |
| price | Product price | Yes |
| vintage | Parsed from title | No |
| region | Product tags/description | No |
| description | Product description | No |
| image_url | Product image | Yes |
| source_url | Product URL | Yes |

### AI Enrichment

For each wine, generate:

| Field | AI Generation Method |
|-------|---------------------|
| investment_score | Based on region, vintage, price, producer reputation |
| drinking_window | Based on wine type, vintage, region, structure |
| estimated_critic_score | Based on comparable wines, region, producer |
| body, tannins, acidity | Based on grape variety, region, style |
| aromas, flavors | Based on grape, region, winemaking style |
| food_pairings | Based on wine profile |
| tasting_notes | Unique 2-3 sentence description |

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Long-tail rankings | 50+ keywords page 1 | Google Search Console |
| Page load speed | <3s for wine dashboards | Lighthouse |
| Voice success rate | >90% query completion | Hume analytics |
| Conversion rate | >2% visitors to cart | Shopify analytics |
| Time on page | >2 minutes on wine pages | Google Analytics |

## Milestones

### Phase 1: Foundation (Week 1-2)
- [ ] Project setup from CLAUDE_STARTER_KIT
- [ ] Neon database with schema
- [ ] Waddesdon scraper
- [ ] AI enrichment pipeline
- [ ] Basic wine listing page

### Phase 2: MDX Dashboards (Week 2-3)
- [ ] InvestmentScore component
- [ ] DrinkingWindowChart component
- [ ] TastingProfile component
- [ ] SimilarWines component
- [ ] Wine page template with MDX rendering

### Phase 3: Agent Integration (Week 3-4)
- [ ] Pydantic AI agent with wine tools
- [ ] AG-UI protocol endpoint
- [ ] CopilotKit sidebar integration
- [ ] Search, recommend, compare functionality

### Phase 4: Voice & Commerce (Week 4-5)
- [ ] Hume EVI widget
- [ ] CLM endpoint for voice
- [ ] Shopify cart integration
- [ ] Checkout flow

### Phase 5: SEO & Launch (Week 5-6)
- [ ] Region pages (/wines/region/[region])
- [ ] Food pairing pages (/wines/for-[food])
- [ ] Price tier pages (/wines/under-[price])
- [ ] Schema markup (Product, FAQPage)
- [ ] Sitemap generation
- [ ] Production deployment

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Waddesdon blocks scraping | Medium | High | Respect robots.txt, rate limit, cache aggressively |
| AI enrichment produces bad data | Medium | Medium | Validate with spot checks, human review sample |
| Shopify API rate limits | Low | Medium | Cache product data, batch operations |
| Hume voice latency | Low | Medium | Test on Railway, optimize CLM response time |

## Open Questions

- [x] Data source → Waddesdon Wine
- [x] AI enrichment approach → AI-generated estimates
- [ ] Shopify store setup (new or existing?)
- [ ] Domain: ionicest.wine or aionysus.wine?
- [ ] Hume EVI config: reuse existing or create new?

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2025-01-15 | Initial PRD created | Claude |
