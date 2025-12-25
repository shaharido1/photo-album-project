# Project: Hello World Full-Stack App

## Quick Links

- **Live App:** https://photo-album-project.onrender.com
- **GitHub:** https://github.com/shaharido1/photo-album-project
- **GHCR Image:** ghcr.io/shaharido1/photo-album-project:latest

## Documentation

- [Architecture Overview](docs/architecture.md) - Tech stack, project structure, and application flow
- [CI/CD Pipeline](docs/cicd.md) - GitHub Actions, Render deployment, and manual operations

## Development Guidelines

### IMPORTANT: For Every Feature/Change

1. **Update Documentation** - Keep `docs/` files in sync with any architectural or CI/CD changes
2. **Write/Update Tests** - Every feature must have corresponding tests
3. **Run All Tests Before Committing** - Unit, integration, and E2E tests must pass

### Testing Requirements

For any new feature or bug fix, you MUST:

1. **Write Unit Tests**
   - Server: Add tests in `server/tests/`
   - Client: Add tests in component files (`*.test.jsx`)

2. **Run Unit Tests**
   ```bash
   cd server && npm test       # Server unit tests
   cd client && npm test       # Client unit tests
   ```

3. **Run E2E Tests with Playwright**
   ```bash
   npm run test:e2e            # Run Playwright E2E tests
   ```

4. **Use Playwright MCP for Interactive Testing**
   - Use the `mcp__playwright__*` tools to interactively test the application
   - Navigate to pages, click elements, fill forms, and verify behavior
   - Example workflow:
     ```
     1. mcp__playwright__browser_navigate to http://localhost:3000
     2. mcp__playwright__browser_snapshot to see current state
     3. mcp__playwright__browser_click to interact with elements
     4. Verify expected behavior
     ```

### Test Files Location

| Type | Location | Framework |
|------|----------|-----------|
| Server Unit | `server/tests/*.test.js` | Jest |
| Client Unit | `client/src/**/*.test.jsx` | Jest + RTL |
| E2E | `e2e/*.spec.js` | Playwright |

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Redux Toolkit + Vite
- **Testing:** Jest + React Testing Library + Playwright
- **Linting:** ESLint (v9 flat config) + Prettier
- **Container:** Docker
- **CI/CD:** GitHub Actions → GHCR → Render

## Key Commands

```bash
# Development
cd server && npm run dev    # Start server with hot reload
cd client && npm run dev    # Start Vite dev server

# Unit Testing
cd server && npm test       # Run server tests
cd client && npm test       # Run client tests

# E2E Testing
npm run test:e2e            # Run Playwright E2E tests
npx playwright test --ui    # Run with Playwright UI

# All Tests
npm test                    # Run all unit tests
npm run test:e2e            # Run E2E tests

# Docker
docker-compose up           # Run full stack locally

# Deployment (via Render API)
curl -X POST 'https://api.render.com/v1/services/srv-d56juo6uk2gs73ci8bgg/deploys' \
  -H 'Authorization: Bearer $RENDER_API_KEY' \
  -d '{}'
```

## Project IDs

- **Render Service ID:** srv-d56juo6uk2gs73ci8bgg
- **Render Owner ID:** tea-d56jpkeuk2gs73ci5rdg

## CI/CD Flow

```
Push → GitHub Actions (lint/test/e2e/build) → GHCR → Render (pull & deploy)
```

Pipeline jobs:
1. **Lint** - ESLint + Prettier
2. **Test Server** - Jest unit tests
3. **Test Client** - Jest + RTL unit tests
4. **Test E2E** - Playwright browser tests
5. **Build & Push** - Docker image to GHCR
6. **Deploy** - Trigger Render (optional)

All pipeline configuration is in `.github/workflows/ci.yml`.
