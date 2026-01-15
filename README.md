# Claude Starter Kit

> A Cole Medin methodology-compliant template for AI-assisted development projects.

## What Is This?

This is a **reusable project template** containing:
- Structured CLAUDE.md and PRD.md templates
- Invocable command workflows (`/prime`, `/plan`, `/execute`, `/evolve`)
- Reference documentation for common patterns
- Lessons learned from fractional.quest, lost.london-v2, and other projects

## Cole Medin Methodology (5 Principles)

| Principle | What It Means |
|-----------|---------------|
| **1. PRD-First** | Create PRD.md before coding any feature |
| **2. Modular Rules** | Keep reference docs separate, load on-demand |
| **3. Command-ify** | Make workflows invocable with clear steps |
| **4. Context Reset** | Plan in one context, execute in fresh context |
| **5. System Evolution** | Every bug improves the system |

## Quick Start: Using This Template

### 1. Copy to Your Project

```bash
# Copy the .claude folder and templates to your project
cp -r /Users/dankeegan/CLAUDE_STARTER_KIT/.claude /path/to/your/project/
cp /Users/dankeegan/CLAUDE_STARTER_KIT/CLAUDE.md /path/to/your/project/
cp /Users/dankeegan/CLAUDE_STARTER_KIT/PRD.md /path/to/your/project/
```

### 2. Customize CLAUDE.md

Edit `CLAUDE.md` with your project specifics:
- Project name and description
- Quick start commands
- Key file locations
- Environment variables

### 3. Write Your PRD

Edit `PRD.md` with your product requirements:
- Vision and problem statement
- Core features with acceptance criteria
- Technical architecture
- Success metrics

### 4. Use Commands

| Command | When to Use |
|---------|-------------|
| `/prime` | Start of every session |
| `/plan {feature}` | Before implementing any feature |
| `/execute {plan}` | After plan is approved |
| `/evolve` | After fixing any bug |

## Directory Structure

```
your-project/
├── .claude/
│   ├── commands/           # Invocable workflows
│   │   ├── prime.md        # Load context at session start
│   │   ├── plan.md         # Create implementation plan
│   │   ├── execute.md      # Execute plan with fresh context
│   │   └── evolve.md       # Improve system after bugs
│   ├── reference/          # Domain knowledge (load on-demand)
│   │   ├── tsca-pattern.md         # Two-Stage Contextual Anchoring
│   │   ├── anchoring-formula.md    # Prompt anchoring patterns
│   │   ├── vague-detection.md      # Handling vague follow-ups
│   │   ├── context-maintenance.md  # Multi-turn context
│   │   ├── architecture.md         # Three-service pattern
│   │   ├── copilotkit.md           # CopilotKit integration
│   │   ├── pydantic-ai.md          # Pydantic AI patterns
│   │   ├── hume-voice.md           # Voice integration
│   │   └── lessons-learned.md      # Team learnings
│   └── prd/               # Feature PRDs
│       └── template.md    # PRD template
├── CLAUDE.md              # Main project context (concise!)
└── PRD.md                 # North star document
```

## Reference Files (When to Load)

| Reference | Load When... |
|-----------|--------------|
| `tsca-pattern.md` | Building multi-turn conversations |
| `anchoring-formula.md` | Writing system prompts |
| `vague-detection.md` | Handling "what about that?" queries |
| `context-maintenance.md` | Managing conversation state |
| `architecture.md` | Making architecture decisions |
| `copilotkit.md` | Integrating CopilotKit |
| `pydantic-ai.md` | Building agent tools |
| `hume-voice.md` | Adding voice features |

## Key Patterns Included

### 1. Two-Stage Contextual Anchoring (TSCA)

Prevents AI from "rambling" or going off-topic:
- Stage 1: Quick acknowledgment
- Stage 2: Detailed response with context

### 2. Anchoring Formula

```
ANCHOR = Role + Scenario + Output Format + Topic Context + History
```

### 3. Vague Detection

Handles queries like "What happened to it?" by:
- Detecting vague indicators
- Enriching query with current topic
- Maintaining conversation coherence

### 4. Context Reset Pattern

```
Planning Phase → Clear Context → Execution Phase
(Broad exploration)  (Fresh start)  (Focused implementation)
```

## Workflow Example

### Starting a New Feature

```
1. /prime                           # Load context
2. Discuss feature with user        # Understand requirements
3. /plan add-voice-support          # Create plan
4. [Get user approval]              # Verify approach
5. [Clear context]                  # Fresh start
6. /execute .claude/prd/add-voice-support.md  # Build it
7. [If bugs found]
8. /evolve                          # Improve system
```

## Contributing

When you learn something new:

1. Fix the immediate issue
2. Run `/evolve`
3. Update the relevant reference file
4. Add entry to `lessons-learned.md`

## Projects Using This Template

- **fractional.quest** - Fractional executive job board with CopilotKit
- **lost.london-v2** - Voice-first London history guide
- **lost.london-clm** - Custom Language Model service

## License

MIT - Use freely for your projects.
