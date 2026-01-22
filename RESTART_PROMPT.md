# Aionysus Wine - Session Restart Prompt

> **Context Reset Document** - Use this to restart Claude Code sessions with full context.

## Project Summary

**Aionysus Wine** is an AI-powered wine sommelier and investment platform:
- **3,906 wines** from Goedhuis Waddesdon in Neon PostgreSQL
- **Vic AI** - Voice sommelier via Hume EVI + CopilotKit chat (on ALL pages)
- **Light theme** wine detail pages (Wine Society style)
- **Shopify** cart and checkout
- **Dynamic backgrounds** - Unsplash vineyard images by region

---

## Current State (Jan 22, 2026)

### What's Working
- **Frontend**: https://aionysus.wine (Vercel, Next.js 16)
- **Agent**: https://dionysus-production.up.railway.app (Pydantic AI)
- **Chat**: CopilotKit Sidebar on ALL pages with frontend tools
- **Auth**: Neon Auth with user sessions
- **Database**: 3,906 wines, 24,341 price variants
- **Light theme**: Wine detail pages with SEO optimization
- **Shopify**: Cart integration (97% products synced)

### Known Issue
- **Hume Voice**: Connection works, but audio output not playing. Debug panel added to show audio state.

---

## Key Files

| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| Wine listing | `src/app/wines/page.tsx` |
| Wine detail (light theme) | `src/app/wines/[slug]/page.tsx` |
| **CopilotKit** | |
| Provider | `src/components/providers.tsx` |
| Frontend Tools | `src/components/GlobalCopilotActions.tsx` |
| Sidebar Wrapper | `src/components/GlobalVicSidebar.tsx` |
| Voice to Chat Sync | `src/components/VoiceTranscriptSync.tsx` |
| Runtime API | `src/app/api/copilotkit/route.ts` |
| **Voice** | |
| Hume Widget | `src/components/HumeWidget.tsx` |
| Hume Token API | `src/app/api/hume-token/route.ts` |
| **Agent (Railway)** | |
| Agent Entry | `agent/src/agent.py` |
| Database Queries | `agent/src/database.py` |

---

## CopilotKit Architecture

```
layout.tsx
└── <Providers>
    └── <CopilotKit runtimeUrl agent="vic">
        └── <GlobalCopilotActions />    ← useFrontendTool hooks
            └── <GlobalVicSidebar>      ← CopilotSidebar wrapper
                └── {children}

Frontend Tools (GlobalCopilotActions.tsx):
├── search_wines          - Search wine database
├── get_wine_details      - Get single wine info
├── add_to_cart           - Add wine by slug
├── add_current_wine_to_cart - Add viewed wine
├── vic_special_bottle    - Vic's Nyetimber signature
├── view_cart             - Navigate to cart
├── browse_wines          - Navigate to wines list
└── view_wine             - Navigate to wine detail

Context (useCopilotReadable):
├── Current page path
├── Current wine (if on detail page)
├── Search results
└── Cart state
```

**Important**: Using `useFrontendTool` (not deprecated `useCopilotAction`).

---

## Environment Variables (Vercel Production)

```bash
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

---

## Recent Completions (Jan 22)

- [x] Light theme for wine detail pages (Wine Society style)
- [x] SEO: H1-H6 hierarchy, wine name 4-6 times, bolded once
- [x] CopilotKit Sidebar on ALL pages (GlobalVicSidebar)
- [x] Site-wide frontend tools (GlobalCopilotActions)
- [x] Migrated to `useFrontendTool` per CopilotKit best practices
- [x] Voice transcript sync to CopilotKit chat (VoiceTranscriptSync)
- [x] Cart and investment tools in Pydantic AI agent
- [x] Similar wines section on detail pages
- [x] WineImage client component for error handling

---

## Priority Tasks

### 1. Fix Hume Voice Audio (CURRENT)
- Connection works, audio not playing
- Debug panel shows: isAudioMuted, volume, isPlaying, isAudioError
- May be browser autoplay restrictions or AudioContext issue
- Check `src/components/HumeWidget.tsx`

### 2. Vic Persona Implementation
- Update agent system prompt in `agent/src/agent.py`
- English wine advocate personality
- "Vic's English Wine Month" campaign

### 3. Shopify Product Sync (97% done)
- Remaining wines need shopify_product_id
- Script: scripts/sync_shopify_products.py

### 4. Wine Investment Data
- Create wine_investment_data table
- Seed historical prices
- Display on wine detail pages

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (`useFrontendTool`, `useCopilotReadable`) |
| Voice | Hume EVI (@humeai/voice-react v0.2.11) |
| Agent | Pydantic AI (FastAPI on Railway) |
| Database | Neon PostgreSQL |
| Auth | Neon Auth |
| Commerce | Shopify Storefront + Admin API |
| Memory | Zep Cloud |

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

# 2. Check deployments
curl https://aionysus.wine/api/hume-token  # Should return token
curl https://dionysus-production.up.railway.app/health  # Should return ok

# 3. Priority tasks
# Fix Hume audio - check HumeWidget.tsx debug panel
# Or continue with Vic persona / Shopify sync / Investment data
```

---

## Deployments

| Service | URL | Platform |
|---------|-----|----------|
| Frontend | https://aionysus.wine | Vercel |
| Agent | https://dionysus-production.up.railway.app | Railway |
| Database | ep-restless-wildflower-abjlgti1 | Neon |
| GitHub | https://github.com/Londondannyboy/aionysus.wine | GitHub |

---

## Important Notes

- **Use useFrontendTool** not useCopilotAction (deprecated)
- **Hume CLM Endpoint**: https://dionysus-production.up.railway.app/chat/completions
- **Don't add trailing newlines** to env vars
- **Light theme** on wine detail pages (burgundy/stone colors)
- **SEO**: Wine name appears 4-6 times, proper H1-H6 hierarchy

---

*Last Updated: January 22, 2026*
