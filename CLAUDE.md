# Pension Quest

> **Cole Medin Methodology**: PRD-first, modular rules, command-ify, context reset, system evolution.

## Quick Start

```bash
# Frontend (port 4000 to avoid conflicts)
npm run dev -- -p 4000              # -> localhost:4000

# Agent (Pydantic AI on Railway)
cd agent && source .venv/bin/activate
uvicorn src.agent:app --reload --port 8000
```

## Current Architecture

Single-page conversational AI pension advisor. CopilotKit Next.js runtime with Gemini adapter. Pension scheme and fund data from Neon PostgreSQL.

**Pattern**: CopilotKit runtime inside Next.js API route + Pydantic AI agent on Railway for voice.

---

## Key Files

| Purpose | Location |
|---------|----------|
| Main page | `src/app/page.tsx` |
| CopilotKit provider | `src/components/providers.tsx` |
| CopilotKit runtime | `src/app/api/copilotkit/route.ts` |
| Pensions API | `src/app/api/pensions/route.ts` |
| Database queries (frontend) | `src/lib/pension-db.ts` |
| Hume voice widget | `src/components/HumeWidget.tsx` |
| Hume token API | `src/app/api/hume-token/route.ts` |
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
| `search_pension_schemes` | Search pension schemes by name, provider, or type |
| `get_scheme_details` | Display detailed pension scheme information |
| `calculate_retirement_income` | Estimate retirement income based on contributions |
| `compare_pension_fees` | Compare fees between pension schemes |
| `compare_schemes` | Compare multiple schemes side by side |
| `get_schemes_by_type` | Get schemes by type (workplace, SIPP, personal) |

---

## Database (Neon)

| Table | Purpose |
|-------|---------|
| pension_schemes | Pension scheme catalog with details and ratings |
| pension_funds | Funds available within each scheme |
| user_profiles | User account data and preferences |
| user_pension_selections | User's saved/tracked pension schemes |
| pension_recommendations | AI-generated recommendation history |

### Pension Schemes Table Schema

```sql
pension_schemes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(255),
  scheme_type VARCHAR(50),  -- workplace, sipp, personal, stakeholder
  annual_management_charge DECIMAL(5,3),  -- e.g., 0.750 for 0.75%
  platform_fee DECIMAL(5,3),
  min_contribution INTEGER,  -- minimum monthly contribution
  employer_match_percent DECIMAL(5,2),
  fund_options INTEGER,  -- number of funds available
  default_fund VARCHAR(255),
  sipp_available BOOLEAN DEFAULT false,
  drawdown_available BOOLEAN DEFAULT false,
  fca_regulated BOOLEAN DEFAULT true,
  performance_rating INTEGER,  -- 1-5 stars
  features TEXT[],
  suitable_for TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
)
```

### Pension Funds Table Schema

```sql
pension_funds (
  id SERIAL PRIMARY KEY,
  scheme_id INTEGER REFERENCES pension_schemes(id),
  fund_name VARCHAR(255) NOT NULL,
  fund_type VARCHAR(50),  -- equity, bond, mixed, property, cash
  risk_level INTEGER,  -- 1-7 (low to high)
  annual_return_1y DECIMAL(6,2),
  annual_return_5y DECIMAL(6,2),
  ongoing_charge DECIMAL(5,3),
  asset_allocation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## Neon Auth

Authentication powered by Neon Auth (`@neondatabase/auth`).

**Routes**:
- `/auth/sign-in` - Sign in page
- `/auth/sign-up` - Sign up page
- `/account/settings` - Account settings (protected)

---

## Pension Performance Ratings

| Rating | Category | Description |
|--------|----------|-------------|
| 5 stars | Excellent | Top-tier funds with consistent performance |
| 4 stars | Very Good | Strong performers with competitive fees |
| 3 stars | Good | Solid options, average fees |
| 2 stars | Fair | Below average, higher fees |
| 1 star | Poor | Underperforming, consider switching |

---

## Pension Types

| Type | Description |
|------|-------------|
| Workplace | Auto-enrolment pensions (NEST, People's Pension, NOW:) |
| SIPP | Self-Invested Personal Pension (Vanguard, AJ Bell, HL) |
| Personal | Individual pensions (Aviva, Scottish Widows, L&G) |
| Stakeholder | Capped charges, flexible contributions |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind |
| AI Chat | CopilotKit (Next.js runtime + Gemini adapter) |
| Voice | Hume EVI (@humeai/voice-react) |
| Agent | Pydantic AI (FastAPI on Railway) |
| Database | Neon PostgreSQL (@neondatabase/serverless) |
| Auth | Neon Auth (@neondatabase/auth) |

---

## Environment Variables

```bash
# Database (pension.quest)
DATABASE_URL=postgresql://neondb_owner:...@ep-tiny-wildflower-abug2uqw-pooler.eu-west-2.aws.neon.tech/neondb

# CopilotKit (Gemini)
GOOGLE_API_KEY=...

# Hume EVI
HUME_API_KEY=...
HUME_SECRET_KEY=...
NEXT_PUBLIC_HUME_CONFIG_ID=... (create new config for Penelope)

# Agent URL (Railway - set after deployment)
NEXT_PUBLIC_AGENT_URL=https://your-agent.up.railway.app

# Neon Auth
NEON_AUTH_BASE_URL=https://...neonauth.../neondb/auth

# Zep Memory (optional)
ZEP_API_KEY=...
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
6. Note the URL (e.g., `https://penelope-agent-xxx.up.railway.app`)
7. Update `NEXT_PUBLIC_AGENT_URL` in frontend `.env.local`

### CLM Endpoint for Hume

After Railway deployment, your Hume EVI CLM endpoint is:
```
https://your-railway-url.up.railway.app/chat/completions
```

Configure this in Hume Dashboard -> EVI Config -> Custom Language Model.

---

## Penelope Personality

You are Penelope, a friendly and knowledgeable UK pension expert.
- Clear, jargon-free explanations of complex pension topics
- Warm and reassuring - pensions can be confusing!
- Always mention FCA regulation where relevant
- Concise responses (50-100 words for voice)
- UK-focused: workplace pensions, SIPPs, state pension
- "I'm Penelope, your pension guide. Let's make retirement planning simple!"

---

## UK Pension Knowledge

### Pension Types
- **Workplace pensions** - Auto-enrolment schemes via employer
- **Personal pensions** - Individual arrangements with providers
- **SIPPs** - Self-Invested Personal Pensions for DIY investors
- **State Pension** - Government pension based on NI contributions
- **Defined Benefit** - Final salary/career average schemes (rare now)

### Key Numbers (2024/25)
- Auto-enrolment minimum: 8% (3% employer, 5% employee)
- Tax relief bands: 20%, 40%, 45%
- Annual allowance: £60,000
- Lifetime allowance: Abolished April 2024
- State pension age: 66 (rising to 67 by 2028)
- Pension freedoms: Age 55 (rising to 57 in 2028)
- State pension (full): £221.20/week

### Major Providers
- **Workplace**: NEST, People's Pension, NOW: Pensions, Smart Pension
- **SIPP**: Vanguard, AJ Bell, Hargreaves Lansdown, Fidelity, Interactive Investor
- **Traditional**: Aviva, Scottish Widows, Legal & General, Standard Life

---

## Session Log

### Jan 17, 2026
- Full adaptation from aionysus.wine to pension.quest complete
- Deployed Penelope agent to Railway: `https://pension-quest-agent-production.up.railway.app`
- Deployed frontend to Vercel: `https://pension.quest`
- Created new Hume EVI config: `aefafb5c-7400-4ebb-b3d3-98b628b8d84f`
- Set up CLM endpoint for voice
- Database seeded with 15 pension schemes and 8 funds
- Removed all wine/Aionysus references from codebase
- Updated PRD.md and CLAUDE.md documentation
- Voice working with user personalization

### Jan 16, 2026
- Initial adaptation from aionysus.wine (wine sommelier)
- Created pension_schemes and pension_funds database schema
- Built frontend with CopilotKit sidebar
- Created Pydantic AI agent "Penelope"
- Implemented scheme search, comparisons, retirement calculations

---

## Deployments

| Service | URL |
|---------|-----|
| Frontend | https://pension.quest |
| Agent | https://pension-quest-agent-production.up.railway.app |
| Agent Health | https://pension-quest-agent-production.up.railway.app/health |
| CLM Endpoint | https://pension-quest-agent-production.up.railway.app/chat/completions |
| Hume Config | aefafb5c-7400-4ebb-b3d3-98b628b8d84f |

---

## Test Commands

Try these in the chat:
- "What's the best SIPP for beginners?" -> searches schemes
- "Tell me about Vanguard SIPP" -> shows scheme details
- "Compare NEST and People's Pension" -> scheme comparison
- "How much will I have at retirement?" -> retirement calculation
- "What's the difference between workplace and personal pensions?" -> education
