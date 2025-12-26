# Documenter Role

The documenter ensures all documentation stays in sync with code changes and new features are properly documented.

## When This Role Runs

This role runs after UX review has passed.

```
Developer → Code Review → QA → UX → [Documenter] → DevOps
```

## Documentation Checklist

### 1. Check What Changed

Before documenting, understand what changed:

- [ ] What new features were added?
- [ ] What existing features were modified?
- [ ] What APIs changed?
- [ ] What configuration options were added?

### 2. Update Relevant Docs

| Change Type | Docs to Update |
|-------------|----------------|
| New API endpoint | `docs/developer/architecture.md` |
| Firebase changes | `docs/developer/firebase.md` |
| New component | Consider if architecture needs update |
| Config changes | `.env.example`, relevant docs |
| New npm scripts | `CLAUDE.md` key commands |
| CI/CD changes | `docs/devops/cicd.md` |
| New dependencies | `docs/developer/third-party.md` |

### 3. Verify Existing Docs

- [ ] Architecture diagram still accurate?
- [ ] API endpoint list complete?
- [ ] Environment variables list complete?
- [ ] Commands in docs still work?

### 4. Check CLAUDE.md

The root `CLAUDE.md` should:
- [ ] Have correct quick links
- [ ] Have up-to-date key commands
- [ ] Reference all role docs correctly
- [ ] Not contain outdated information

## Documentation Standards

### Markdown Formatting

```markdown
# Main Heading (H1) - One per file

## Section (H2)

### Subsection (H3)

Normal paragraph text.

- Bullet list item
- Another item

1. Numbered list
2. Second item

`inline code`

```language
code block
```

| Column 1 | Column 2 |
|----------|----------|
| Cell     | Cell     |
```

### Code Examples

Always include language identifier:

````markdown
```typescript
const example = "typed";
```

```bash
npm run dev
```
````

### File References

Use relative paths from docs folder:

```markdown
See [architecture](./developer/architecture.md) for details.
```

### Commands

Show both the command and expected output when helpful:

```markdown
```bash
npm run dev
# Output:
# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```
```

## Documentation Structure

```
docs/
├── developer/              # Developer base role
│   ├── README.md           # Developer guidelines
│   ├── architecture.md     # Tech stack, structure
│   ├── firebase.md         # Database & auth
│   └── third-party.md      # Library guidelines
│
├── code-reviewer/          # Code review role
│   ├── README.md           # Review checklist
│   └── style-guide.md      # Code standards
│
├── qa-tester/              # QA role
│   ├── README.md           # Testing strategy
│   ├── playwright-mcp.md   # Visual testing
│   └── coverage.md         # Coverage guidelines
│
├── ux-reviewer/            # UX role
│   ├── README.md           # UX review process
│   └── playwright-mcp.md   # UX testing
│
├── documenter/             # This role
│   ├── README.md           # Documentation standards
│   └── templates.md        # Doc templates
│
├── devops/                 # DevOps role
│   ├── README.md           # Deployment process
│   ├── cicd.md             # CI/CD pipeline
│   ├── versioning.md       # Version management
│   └── monitoring.md       # Error monitoring
│
└── future-features.md      # Feature backlog
```

## Documentation Report Format

After review, report findings:

```
## Documentation Review

### Status: [UP TO DATE / NEEDS UPDATES]

### Documents Checked:
- [x] CLAUDE.md
- [x] docs/developer/architecture.md
- [x] docs/developer/firebase.md
- [ ] docs/devops/cicd.md (needs update)

### Updates Made:
1. Added new API endpoint to architecture.md
2. Updated environment variables list
3. Fixed broken link in CLAUDE.md

### Updates Needed:
1. [File] - [What needs updating]

### Suggested Improvements:
- Consider adding diagram for new feature
- Example code could be more detailed
```

## Pass Criteria

The feature can proceed to DevOps if:
1. All relevant docs are updated
2. No broken links in documentation
3. Commands in docs are accurate
4. New features are documented
