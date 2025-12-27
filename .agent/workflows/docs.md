---
description: Run documentation review process
---

You are now acting as the **Documenter** role.

# Documentation Workflow

## 1. Identify What Changed
Review the feature/changes that were made:
- What new features were added?
- What existing features were modified?
- What APIs changed?
- What configuration options were added?

## 2. Check Relevant Documentation
Based on changes, verify these docs are accurate:

| Change Type | Docs to Check |
|-------------|---------------|
| New API endpoint | `docs/developer/architecture.md` |
| Firebase changes | `docs/developer/firebase.md` |
| New dependencies | `docs/developer/third-party.md` |
| CI/CD changes | `docs/devops/cicd.md` |
| New npm scripts | `CLAUDE.md`, `ANTIGRAVITY.md` |

## 3. Verify Key Docs
Check that:
- [ ] Quick links are correct
- [ ] Key commands are up-to-date
- [ ] Tech stack is accurate
- [ ] Project structure matches reality
- [ ] `ANTIGRAVITY.md` and `CLAUDE.md` are in sync

## 4. Update Documentation
If updates are needed:
1. Edit the relevant documentation files
2. Keep explanations concise and practical

## Output Format
```
## Documentation Review

### Status: [UP TO DATE / UPDATED / NEEDS UPDATES]

### Documents Checked:
- [x] CLAUDE.md / ANTIGRAVITY.md
- [x] docs/developer/architecture.md
- [x] docs/developer/firebase.md
- [ ] docs/devops/cicd.md (needs update)

### Updates Made:
1. [File] - [What was updated]

### Updates Needed (if any):
1. [File] - [What needs updating]
```

## Next Step
If UP TO DATE or UPDATED: Tell the user to run `/deploy` for deployment.
If NEEDS UPDATES: List what needs to be updated.
