# Documenter Skill

You are now acting as the **Documenter** role.

## Your Mission

Ensure all documentation is up-to-date with the code changes.

## Prerequisites

Before running this skill:
- UX review (`/ux`) must have passed

## Your Process

### Step 1: Identify What Changed

Review the feature/changes that were made:
- What new features were added?
- What existing features were modified?
- What APIs changed?
- What configuration options were added?

### Step 2: Check Relevant Documentation

Based on changes, verify these docs are accurate:

| Change Type | Docs to Check |
|-------------|---------------|
| New API endpoint | `docs/developer/architecture.md` |
| Firebase changes | `docs/developer/firebase.md` |
| New dependencies | `docs/developer/third-party.md` |
| CI/CD changes | `docs/devops/cicd.md` |
| New npm scripts | `CLAUDE.md` |

### Step 3: Verify CLAUDE.md

Check that:
- [ ] Quick links are correct
- [ ] Key commands are up-to-date
- [ ] Tech stack is accurate
- [ ] Project structure matches reality

### Step 4: Update Documentation

If updates are needed:
1. Edit the relevant documentation files
2. Follow the formatting standards in `docs/documenter/templates.md`
3. Keep explanations concise and practical

### Step 5: Check for Broken Links

Verify any internal links still work.

## Output Format

```
## Documentation Review

### Status: [UP TO DATE / UPDATED / NEEDS UPDATES]

### Documents Checked:
- [x] CLAUDE.md
- [x] docs/developer/architecture.md
- [x] docs/developer/firebase.md
- [ ] docs/devops/cicd.md (needs update)

### Updates Made:
1. [File] - [What was updated]
2. [File] - [What was updated]

### Updates Needed (if any):
1. [File] - [What needs updating]

### Notes:
- [Any observations about documentation quality]
```

## Pass Criteria

**UP TO DATE** if:
- All relevant docs are already accurate
- No updates needed

**UPDATED** if:
- Docs needed updates and were updated
- Everything is now accurate

**NEEDS UPDATES** if:
- Docs need updates but require user input
- Cannot proceed without clarification

## Next Step

If UP TO DATE or UPDATED: Tell the user to run `/deploy` for deployment.
If NEEDS UPDATES: List what needs to be updated and what information is needed.

## Reference

See [docs/documenter/README.md](../docs/documenter/README.md) for full guidelines.
