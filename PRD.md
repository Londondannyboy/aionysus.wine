# Pension Quest - Product Requirements Document

> This is the **north star document**. All development decisions reference this PRD.

## Vision

An AI-powered UK pension advisor (Penelope) that helps people understand, compare, and plan their pensions through conversational chat and voice, providing clear guidance on schemes, fees, and retirement projections.

## Problem Statement

UK pensions are confusing. Auto-enrolment, SIPPs, workplace pensions, tax relief, annual allowances - the jargon and complexity puts people off planning for retirement. There's no single source that:
- Explains pension concepts in plain English
- Compares schemes objectively with real data
- Answers follow-up questions conversationally
- Remembers user context and preferences
- Works via both text and voice

## Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| New Workers | Young professionals auto-enrolled for first time | Basic understanding, employer match optimization |
| Self-Employed | Freelancers/contractors without workplace pension | SIPP comparison, contribution guidance |
| Mid-Career | People wanting to consolidate or optimize | Scheme comparison, fee analysis |
| Pre-Retirees | Those approaching pension access age | Drawdown options, retirement income planning |

## Core Features

### 1. Pension Scheme Explorer

**User Story**: As a pension saver, I want to search and explore pension schemes so I can find one that fits my needs.

**Acceptance Criteria**:
- [x] User can search schemes by name, provider, or type
- [x] Cards show: name, provider, AMC, rating, features
- [x] Data comes from Neon database (15+ schemes)
- [x] Visual presentation with type badges and ratings

### 2. Scheme Comparison

**User Story**: As a pension saver, I want to compare schemes side-by-side so I can make an informed choice.

**Acceptance Criteria**:
- [x] User can ask "Compare NEST and Vanguard"
- [x] Shows key metrics: fees, fund options, features
- [x] Highlights differences in AMC and ratings
- [x] Agent explains trade-offs conversationally

### 3. Retirement Calculator

**User Story**: As a pension saver, I want to project my retirement income so I can plan contributions.

**Acceptance Criteria**:
- [x] User provides: age, retirement age, monthly contribution, current pot
- [x] Shows projected pot at retirement
- [x] Estimates monthly income (4% withdrawal rule)
- [x] Includes state pension context

### 4. Pension Education

**User Story**: As a pension saver, I want jargon-free explanations so I can understand my options.

**Acceptance Criteria**:
- [x] Agent explains: workplace vs SIPP vs personal
- [x] Covers: tax relief, annual allowance, pension freedoms
- [x] Uses plain English, not financial jargon
- [x] Provides context on FCA regulation

### 5. Voice Interaction

**User Story**: As a user, I want to speak with Penelope hands-free so I can research while multitasking.

**Acceptance Criteria**:
- [x] Hume EVI widget available on page
- [x] Voice queries routed to same agent as chat (Single Brain)
- [x] Responses streamed back as speech
- [x] Low latency conversational experience

### 6. User Personalization

**User Story**: As a returning user, I want Penelope to remember my context so recommendations are relevant.

**Acceptance Criteria**:
- [x] Zep memory integration for user facts
- [x] Remembers pension type preferences
- [x] Remembers contribution context
- [x] Agent tailors recommendations based on history

### 7. Authentication

**User Story**: As a user, I want to create an account so my preferences are saved.

**Acceptance Criteria**:
- [x] Sign up / sign in via Neon Auth
- [x] User avatar/menu component
- [x] Protected dashboard page
- [x] User ID passed to agent for personalization

## Non-Goals (Explicit Exclusions)

- **Financial Advice**: We provide information, not regulated financial advice
- **Pension Transfers**: We don't process transfers or applications
- **Investment Management**: We don't manage or recommend specific funds
- **Tax Filing**: We explain tax relief, don't handle tax returns
- **Complaints Handling**: We don't handle FCA complaints

## Technical Architecture

### System Overview

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
│   │ + CopilotKit │                              │  Agent         │  │
│   │              │ ◄──── /chat/completions ──── │  (Penelope)    │  │
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
│                                                                      │
│   External Services:                                                │
│   ├── Neon PostgreSQL (Database + Auth) ✓                          │
│   ├── Zep Cloud (Memory/Facts) ✓                                   │
│   ├── Google Gemini (LLM) ✓                                        │
│   └── Hume AI (Voice) ✓                                            │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Component | Technology | Rationale |
|-----------|------------|-----------|
| Frontend | Next.js 15, React 19, TypeScript | SSR, App Router, modern React |
| UI Framework | Tailwind CSS, Framer Motion | Rapid styling, smooth animations |
| AI Chat | CopilotKit + Gemini adapter | Structured tool calls, generative UI |
| Agent | Pydantic AI + FastAPI | Type-safe tools, AG-UI protocol |
| Database | Neon PostgreSQL | Serverless, branching, auth built-in |
| Voice | Hume EVI | Low-latency emotional voice AI |
| Memory | Zep Cloud | Conversation memory, user facts |
| Auth | Neon Auth (@neondatabase/auth) | Integrated with database |

### Database Schema

**pension_schemes**
- id, slug, name, provider, scheme_type
- annual_management_charge, platform_fee
- min_contribution, fund_options
- sipp_available, drawdown_available, fca_regulated
- performance_rating, features, suitable_for

**pension_funds**
- id, scheme_id, fund_name, fund_type
- risk_level, annual_return_1y, annual_return_5y
- ongoing_charge, asset_allocation

## Success Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Pension schemes covered | 15+ | Count in database |
| Query response time | <3s | Measure API latency |
| Voice response latency | <1s | Hume dashboard metrics |
| User return rate | 30%+ | Auth + analytics |

## Milestones

### Phase 1: MVP (COMPLETE)
- [x] Next.js 15 project setup
- [x] CopilotKit integration with Gemini
- [x] Neon database with 15 pension schemes
- [x] Scheme search, details, comparison tools
- [x] Retirement income calculator
- [x] Neon Auth integration
- [x] Deploy to Vercel

### Phase 2: Voice & Agent (COMPLETE)
- [x] Deploy Pydantic AI agent to Railway
- [x] Connect frontend to Railway agent via AG-UI
- [x] Implement CLM endpoint for Hume voice
- [x] Enable Hume voice widget
- [x] Add Zep memory integration
- [x] User personalization with name

### Phase 3: Scale & Polish (FUTURE)
- [ ] Add more pension schemes (target: 30+)
- [ ] Add pension fund details
- [ ] Implement contribution optimization tool
- [ ] Add state pension entitlement calculator
- [ ] Mobile-responsive voice UX
- [ ] Save/track scheme functionality

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| FCA compliance concerns | Medium | High | Clear disclaimers, not regulated advice |
| Data staleness | High | Medium | Regular updates, source citations |
| User expecting advice | Medium | High | Clear Penelope personality, refer to advisors |
| Voice misunderstanding | Medium | Medium | Robust entity extraction, confirmation |

## Disclaimers

Pension Quest provides general information about UK pensions for educational purposes only. It does not constitute financial advice. Users should consult a regulated financial adviser for personal pension decisions. Penelope is an AI assistant, not a financial adviser.

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-17 | Created pension.quest from aionysus.wine template | Dan + Claude |
| 2026-01-17 | Deployed to Vercel and Railway | Claude |
| 2026-01-17 | Voice integration complete | Claude |
