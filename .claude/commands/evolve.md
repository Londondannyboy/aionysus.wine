# /evolve - System Evolution After Bug Fixes

Use this command **after fixing any bug** to improve the system and prevent recurrence.

## The Evolution Mindset

> Every bug is an opportunity to make the system smarter.

Instead of just fixing bugs, we:
1. Fix the immediate issue
2. Identify root cause
3. Update rules/references to prevent recurrence
4. Document the learning

## When to Use

| Scenario | Use /evolve? |
|----------|--------------|
| Fixed a bug | Yes |
| Discovered a pattern | Yes |
| Found a better approach | Yes |
| Made routine changes | No |

## Execution Steps

### Step 1: Identify the Issue

Document what went wrong:
```
**Bug**: [What happened]
**Cause**: [Why it happened]
**Fix**: [How we fixed it]
```

### Step 2: Classify Root Cause

| If the cause was... | Then update... |
|--------------------|----------------|
| Coding convention not followed | CLAUDE.md rules section |
| Domain knowledge missing | Relevant reference file |
| Workflow gap | Relevant command file |
| Architecture unclear | architecture.md |
| Prompt pattern missing | tsca-pattern.md or anchoring-formula.md |

### Step 3: Update the System

Make the improvement:

**For coding conventions:**
```markdown
# In CLAUDE.md, add:

## Rule: [New Rule Name]
- Always do X when Y
- Never do Z because [reason]
```

**For domain knowledge:**
```markdown
# In .claude/reference/{topic}.md, add:

## Pattern: [Pattern Name]
When [situation], use [approach] because [reason].

### Example
[Code or explanation]

### Common Mistakes
- Mistake 1 → correct approach
- Mistake 2 → correct approach
```

**For workflow gaps:**
```markdown
# In .claude/commands/{command}.md, add:

## Additional Check: [Name]
Before [action], always verify [thing].
```

### Step 4: Document the Learning

Add to `.claude/reference/lessons-learned.md`:

```markdown
## [Date]: [Brief Title]

**Issue**: [What went wrong]
**Root Cause**: [Classification]
**Fix**: [What we changed]
**Prevention**: [Rule/reference updated]
```

### Step 5: Verify Evolution

Ask:
- Would this bug be caught next time?
- Is the rule clear and specific?
- Does it fit with existing patterns?

## Example Evolution

**Bug**: Agent returned empty response when user not logged in

**Root Cause**: Domain knowledge gap - didn't know to check auth state

**Evolution**:
```markdown
# Added to .claude/reference/pydantic-ai.md:

## Auth Check Pattern
Always verify user authentication before database operations:

def get_effective_user_id(ctx) -> Optional[str]:
    if ctx.deps.state.user and ctx.deps.state.user.id:
        return ctx.deps.state.user.id
    return None

# At start of any tool that needs user:
user_id = get_effective_user_id(ctx)
if not user_id:
    return {"error": "Please log in to continue"}
```

**Prevention**: Added to tool template in pydantic-ai.md reference

## Output Format

```
## System Evolution Complete

**Bug Fixed**: [Brief description]
**Root Cause**: [Category]
**Updated**: [Which file/section]

**New Rule/Pattern**:
> [Summary of what was added]

**Prevention Score**: [How confident this prevents recurrence: High/Medium/Low]
```
