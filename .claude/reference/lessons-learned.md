# Lessons Learned

> Document learnings here after using `/evolve` command

## Template

When adding a lesson, use this format:

```markdown
## [Date]: [Brief Title]

**Issue**: What went wrong
**Root Cause**: Why it happened (coding mistake, missing context, process gap)
**Fix**: What was changed
**Prevention**: Rule or reference updated to prevent recurrence
**Files Modified**: List of files changed

---
```

## Lessons

### Example: 2026-01-10: Punctuation Breaking Vague Detection

**Issue**: "What happened to it?" wasn't detected as vague follow-up

**Root Cause**: String comparison `'it' in query.split()` failed because `'it?' != 'it'`

**Fix**: Added punctuation stripping before comparison
```python
import string
query_words = [w.strip(string.punctuation) for w in query.split()]
```

**Prevention**: Added to `.claude/reference/vague-detection.md` with explicit warning

**Files Modified**: `agent/src/agent.py`, `.claude/reference/vague-detection.md`

---

<!-- Add your lessons below this line -->
