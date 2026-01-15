# /execute {plan-path} - Execute Plan with Fresh Context

Use this command **after plan approval** to implement with fresh context.

## The Context Reset Pattern

```
Planning Phase          Context Reset          Execution Phase
     ↓                       ↓                      ↓
[Broad exploration]  →  [Clear context]  →  [Focused implementation]
[Multiple options]      [Start fresh]       [Single approach]
[User discussion]                           [Just build it]
```

## Why Fresh Context?

- Planning requires broad context (exploring options)
- Execution requires focused context (one path)
- Prevents context exhaustion on large features
- Plan file contains ALL needed context

## Execution Steps

### Step 1: Load Only the Plan

```
Read: .claude/prd/{feature-name}.md
```

The plan contains everything needed:
- What to build
- Which files to modify
- Step-by-step instructions

### Step 2: Follow the Steps Exactly

Work through the plan's implementation steps:
1. Complete step 1
2. Mark step 1 done in todo
3. Complete step 2
4. Mark step 2 done
5. Continue...

### Step 3: Test as You Go

After each significant change:
```bash
npm run build      # Does it compile?
npm run lint       # Any type errors?
npm run dev        # Does it work?
```

### Step 4: Commit Logical Units

Don't batch everything into one commit:
```bash
git add [related files]
git commit -m "feat: [specific change]"
```

### Step 5: Verify Against Acceptance Criteria

Before marking complete, verify:
- [ ] All steps in plan completed
- [ ] Tests pass
- [ ] Acceptance criteria met
- [ ] No regressions introduced

## Rules During Execution

| DO | DON'T |
|----|-------|
| Follow the plan | Explore alternatives |
| Ask if stuck | Make major changes to plan |
| Test frequently | Skip verification |
| Commit incrementally | Batch all changes |

## If Plan Needs Changes

If you discover the plan is wrong:

1. **Stop execution**
2. **Explain what's wrong**
3. **Return to planning phase**
4. **Update the plan**
5. **Get re-approval**
6. **Resume with fresh context**

## Output Format

```
## Executing: {Plan Name}

**Step 1/N**: [Description]
- Modified: file1.tsx
- Added: file2.ts
- Status: Complete

**Step 2/N**: [Description]
- Modified: file3.tsx
- Status: In Progress

**Build Status**: Passing
**Tests**: Passing

**Remaining**: [N-2] steps
```
