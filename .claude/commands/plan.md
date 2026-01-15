# /plan {feature} - Create Implementation Plan

Use this command **before coding any non-trivial feature**.

## Why Plan First?

- Prevents wasted effort on wrong approach
- Gets user buy-in before implementation
- Creates documentation for context reset
- Ensures all edge cases are considered

## When to Use

| Scenario | Use /plan? |
|----------|------------|
| New feature | Yes |
| Multi-file refactor | Yes |
| Bug fix (complex) | Yes |
| Simple typo fix | No |
| Adding a console.log | No |

## Execution Steps

### Step 1: Understand the Requirement

Ask clarifying questions if needed:
- What problem does this solve?
- Who is the user?
- What are the success criteria?

### Step 2: Explore the Codebase

```
- Search for related code
- Understand existing patterns
- Identify files to modify
- Check for similar implementations
```

### Step 3: Design the Approach

Consider:
- Multiple implementation options
- Trade-offs of each
- Impact on existing code
- Testing strategy

### Step 4: Write the Plan

Create file: `.claude/prd/{feature-name}.md`

```markdown
# Plan: {Feature Name}

## Problem Statement
What we're solving and why.

## Approach
How we'll solve it (high-level).

## Files to Modify

| File | Changes |
|------|---------|
| path/to/file1.tsx | Add component X |
| path/to/file2.ts | Update function Y |

## Implementation Steps

1. [ ] Step 1 - specific action
2. [ ] Step 2 - specific action
3. [ ] Step 3 - specific action

## Edge Cases
- Edge case 1 → how handled
- Edge case 2 → how handled

## Testing
How to verify this works.

## Rollback
How to undo if needed.
```

### Step 5: Get User Approval

Present plan and wait for explicit approval before proceeding.

## Important Notes

- **DO NOT start coding** until plan is approved
- Keep plans focused (one feature per plan)
- Plans become documentation for future reference
- After approval, use `/execute` with fresh context
