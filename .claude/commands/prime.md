# /prime - Load Project Context

Use this command at the **start of every session** to load project context.

## What This Command Does

1. Reads the PRD (north star document)
2. Checks current project state
3. Identifies any in-progress work
4. Loads relevant reference files based on task

## Execution Steps

### Step 1: Read Core Documents

```
Read: PRD.md
Read: CLAUDE.md
```

### Step 2: Check Project State

```bash
git status                    # Any uncommitted changes?
git log --oneline -5          # Recent commits
npm run build 2>&1 | head -20 # Does it build?
```

### Step 3: Identify Current Work

Look for:
- Incomplete todos in CLAUDE.md
- Open PRDs in `.claude/prd/`
- Recent session notes

### Step 4: Load Relevant References

Based on what you'll be working on, load:

| If working on... | Load |
|------------------|------|
| Prompts/Conversations | `.claude/reference/tsca-pattern.md` |
| CopilotKit features | `.claude/reference/copilotkit.md` |
| Voice integration | `.claude/reference/hume-voice.md` |
| Agent tools | `.claude/reference/pydantic-ai.md` |
| Architecture decisions | `.claude/reference/architecture.md` |

### Step 5: Summarize to User

Report:
- Current project state
- Any blocking issues
- Suggested next steps
- What reference files were loaded

## Output Format

```
## Project Primed: [Project Name]

**State**: [Clean/Has uncommitted changes/Build failing]

**Recent Work**:
- [Last commit summary]
- [Any in-progress features]

**Loaded References**:
- [Reference 1] - for [reason]
- [Reference 2] - for [reason]

**Ready to**: [Suggested next action]
```
