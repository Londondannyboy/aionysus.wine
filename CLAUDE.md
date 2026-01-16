# Relocation Quest V3

> **Cole Medin Methodology**: PRD-first, modular rules, command-ify, context reset, system evolution.

## Quick Start

```bash
# Frontend (port 4000 to avoid conflicts)
npm run dev -- -p 4000              # → localhost:4000
```

## Current Architecture

Single-page conversational AI relocation advisor. CopilotKit Next.js runtime with Gemini adapter. All destination data from Neon PostgreSQL.

**Pattern**: GTM-quest-v3 style - CopilotKit runtime inside Next.js API route, not separate Python backend.

---

## Key Files

| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| CopilotKit provider | `src/components/providers.tsx` |
| CopilotKit runtime | `src/app/api/copilotkit/route.ts` |
| Destinations API | `src/app/api/destinations/route.ts` |
| Database queries | `src/lib/db.ts` |
| MDX components | `src/components/mdx/` |
| Dynamic view renderer | `src/components/DynamicView.tsx` |
| Hume voice widget | `src/components/HumeWidget.tsx` |
| Hume token API | `src/app/api/hume-token/route.ts` |
| Neon Auth client | `src/lib/auth/client.ts` |
| Neon Auth server | `src/lib/auth/server.ts` |
| Auth API handler | `src/app/api/auth/[...path]/route.ts` |
| Auth pages | `src/app/auth/[path]/page.tsx` |
| Account pages | `src/app/account/[path]/page.tsx` |
| Auth middleware | `middleware.ts` |
| **Pydantic AI Agent (Railway)** | |
| Agent entry point | `agent/src/agent.py` |
| Database queries | `agent/src/database.py` |
| Destination Expert sub-agent | `agent/src/destination_expert.py` |
| Railway config | `agent/railway.toml` |
| Railway URL | `https://relocation-quest-v3-agent-production.up.railway.app` |
| CLM endpoint (for Hume) | `https://relocation-quest-v3-agent-production.up.railway.app/chat/completions` |

---

## CopilotKit Actions (useCopilotAction)

| Action | Purpose |
|--------|---------|
| `show_destination` | Display single destination card from Neon |
| `save_preferences` | Save user budget/climate/purpose |
| `generate_custom_view` | AI-composed MDX layouts (comparison, cost breakdown, pros/cons) |

---

## MDX Components (AI-composable)

| Component | Purpose |
|-----------|---------|
| `ComparisonTable` | Side-by-side country comparison with flags |
| `CostChart` | Visual cost breakdown with animated bars |
| `ProsCons` | Pros and cons two-column layout |
| `InfoCard` | Info cards with variants (default, highlight, warning, success) |

---

## Database (Neon)

| Table | Records | Purpose |
|-------|---------|---------|
| destinations | 17 | Full structured data (visa, cost, education, company, property, tax, residency) |
| articles | 210 | Relocation guides |
| jobs | 217 | Job listings |
| topic_images | 22 | Background images |
| **topic_clusters** | - | Content organization into SEO clusters |
| **page_contexts** | - | Page context for voice agent awareness |

---

## Neon Auth

Authentication powered by Neon Auth (`@neondatabase/auth`).

**Docs**:
- https://neon.com/docs/auth/quick-start/nextjs
- https://neon.com/docs/auth/quick-start/nextjs-api-only

**Setup**:
1. Enable Auth in Neon Console → Project → Branch → Auth
2. Copy `NEON_AUTH_BASE_URL` from Configuration
3. Add to `.env.local`

**Routes**:
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/account/settings` - Account settings (protected)

**Components**:
- `NeonAuthUIProvider` - Wraps app with auth context
- `UserButton` - User avatar/menu component
- `AuthView` - Auth form component
- `AccountView` - Account settings component

---

## Implementation Status

- [x] Next.js 15 project setup
- [x] CopilotKit Next.js runtime (Gemini adapter)
- [x] useCopilotAction for show_destination, save_preferences
- [x] Neon database connection (17 destinations)
- [x] MDX component library
- [x] generate_custom_view action for dynamic compositions
- [x] Visual demo of MDX capability
- [x] Neon Auth (@neondatabase/auth)
- [x] Hume voice widget
- [x] Deploy to Vercel - https://relocation-quest-v3.vercel.app
- [x] Pydantic AI agent deployed to Railway - https://relocation-quest-v3-agent-production.up.railway.app
- [x] Chat uses built-in CopilotKit Next.js runtime (AG-UI compatibility issue with pydantic-ai)
- [x] Voice uses Railway CLM endpoint (/chat/completions)

---

## Test Commands

Try these in the chat:
- "Tell me about Portugal" → shows DestinationCard
- "Compare Portugal vs Spain" → shows ComparisonTable
- "Show me cost breakdown for Lisbon" → shows CostChart
- "Pros and cons of moving to Thailand" → shows ProsCons

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (Next.js runtime + Gemini adapter) |
| Database | Neon PostgreSQL (@neondatabase/serverless) |
| Animation | Framer Motion |
| Voice | Hume EVI (@humeai/voice-react) |
| Auth | Neon Auth (@neondatabase/auth) |

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb

# CopilotKit (Gemini)
GOOGLE_API_KEY=...

# Hume EVI
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=...

# Neon Auth (from Neon Console → Project → Branch → Auth → Configuration)
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-1.aws.neon.tech/neondb/auth
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

## Phase 6: Content Migration

**Goal**: Port all content from legacy project with voice agent page awareness.

### New Components

| Component | Path | Purpose |
|-----------|------|---------|
| `PageContextProvider` | `src/components/voice/PageContextProvider.tsx` | Provides page context to voice agent |
| `HeroBanner` | `src/components/layout/HeroBanner.tsx` | Reusable hero with 4 variants |

### New API Routes

| Route | Purpose |
|-------|---------|
| `GET /api/page-context?slug=...` | Fetch page context by slug |
| `POST /api/page-context` | List pages by cluster or type |

### Scripts

| Script | Usage |
|--------|-------|
| `node scripts/create-mdx-tables.js` | Create database tables |
| `node scripts/populate-destination.js cyprus` | Populate country from data file |

### Data Files

Country content in `scripts/data/<country>.js`. Cyprus is the template.

---

## Important Directories

| Directory | Purpose |
|-----------|---------|
| `/Users/dankeegan/relocation.quest` | **LIVE working directory** |
| `/Users/dankeegan/legacy-ignore-relocation.quest` | Legacy V1 content reference |
| `/Users/dankeegan/believed-legacy-relocation.quest` | Old V2 (ignore) |

---

## Session Log

### Jan 16, 2026
- Fixed directory confusion (V2 vs V3)
- Applied Phase 6 to correct V3 codebase
- Created page_contexts and topic_clusters tables
- Cyprus template populated as first example
