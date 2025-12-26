# Photo Album Project

## Quick Links

- **Live App:** https://photo-album-project.onrender.com
- **GitHub:** https://github.com/shaharido1/photo-album-project
- **Render Service ID:** srv-d56juo6uk2gs73ci8bgg

---

## Developer Role (Base)

You are the developer implementing features. Follow these guidelines:

### Before Implementation

1. **Use Context7 for third-party libraries** - Always fetch up-to-date docs before using React, Redux, Firebase, Playwright, or any external API
2. **Use TodoWrite** - Break down complex tasks, track progress
3. **Check existing patterns** - Look at how similar features are implemented

### During Implementation

1. **TypeScript** - Use proper types, avoid `any`
2. **Lint as you go** - Run `npx eslint . --fix` frequently
3. **Keep functions small** - Under 50 lines ideally

### Before Handoff

**CRITICAL: Run these before marking feature complete:**

```bash
# Type check
npx tsc --noEmit

# Lint
npx eslint .

# Format
npx prettier --check "**/*.{js,jsx,ts,tsx,json}"
```

Fix any issues before proceeding to review pipeline.

---

## Feature Pipeline

After implementation, features go through this sequential review:

```
Developer → /review → /qa → /ux → /docs → /deploy
```

Or run all at once:
```
/feature
```

### Skills

| Skill | Role | Documentation |
|-------|------|---------------|
| `/review` | Code Reviewer | [docs/code-reviewer/](docs/code-reviewer/) |
| `/qa` | QA Tester | [docs/qa-tester/](docs/qa-tester/) |
| `/ux` | UX Reviewer | [docs/ux-reviewer/](docs/ux-reviewer/) |
| `/docs` | Documenter | [docs/documenter/](docs/documenter/) |
| `/deploy` | DevOps | [docs/devops/](docs/devops/) |
| `/feature` | Full Pipeline | Runs all roles in sequence |

### Pipeline Rules

1. **Each role must pass before the next runs**
2. **Fast checks first** - Lint/type before slow Playwright MCP
3. **Block commits until pipeline passes**

---

## Role Documentation

| Role | Purpose | Docs |
|------|---------|------|
| Developer | Implementation guidelines | [docs/developer/](docs/developer/) |
| Code Reviewer | Code quality, types, style | [docs/code-reviewer/](docs/code-reviewer/) |
| QA Tester | Unit tests, E2E, coverage | [docs/qa-tester/](docs/qa-tester/) |
| UX Reviewer | Visual review, user flows | [docs/ux-reviewer/](docs/ux-reviewer/) |
| Documenter | Keep docs in sync | [docs/documenter/](docs/documenter/) |
| DevOps | Deploy, monitor, verify | [docs/devops/](docs/devops/) |

---

## Key Commands

```bash
# Development
npm run dev                 # Frontend: localhost:5173 | Backend: localhost:3001

# Quality Checks
npx tsc --noEmit            # Type check
npx eslint .                # Lint
npx prettier --write .      # Format

# Testing
npm test                    # All unit tests
npm run test:e2e            # Playwright E2E

# Local CI (run before pushing)
npm run ci:local            # Full pipeline in Docker

# Version
npm run version:bump        # Bump patch version

# Deploy
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H 'Authorization: Bearer $RENDER_API_KEY'
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + Redux Toolkit + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | Firebase Firestore |
| Auth | Firebase Auth (Google Sign-In) |
| Testing | Jest + RTL + Playwright |
| CI/CD | GitHub Actions → GHCR → Render |

---

## Project Structure

```
├── client/                 # React frontend
├── server/                 # Express backend
├── e2e/                    # Playwright tests
├── docs/                   # Role-based documentation
│   ├── developer/          # Developer docs
│   ├── code-reviewer/      # Review standards
│   ├── qa-tester/          # Testing guides
│   ├── ux-reviewer/        # UX review process
│   ├── documenter/         # Documentation standards
│   ├── devops/             # Deployment guides
│   └── future-features.md  # Feature backlog
├── .claude/skills/         # Claude Code skills
└── CLAUDE.md               # This file
```
