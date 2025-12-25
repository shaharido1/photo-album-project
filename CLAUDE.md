# Project: Hello World Full-Stack App

## Quick Links

- **Live App:** https://photo-album-project.onrender.com
- **GitHub:** https://github.com/shaharido1/photo-album-project
- **GHCR Image:** ghcr.io/shaharido1/photo-album-project:latest

## Documentation

- [Architecture Overview](docs/architecture.md) - Tech stack, project structure, and application flow
- [CI/CD Pipeline](docs/cicd.md) - GitHub Actions, Render deployment, and manual operations

## Tech Stack

- **Backend:** Node.js + Express
- **Frontend:** React + Redux Toolkit + Vite
- **Testing:** Jest + React Testing Library
- **Linting:** ESLint (v9 flat config) + Prettier
- **Container:** Docker
- **CI/CD:** GitHub Actions → GHCR → Render

## Key Commands

```bash
# Development
cd server && npm run dev    # Start server with hot reload
cd client && npm run dev    # Start Vite dev server

# Testing
cd server && npm test       # Run server tests
cd client && npm test       # Run client tests

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
Push → GitHub Actions (lint/test/build) → GHCR → Render (pull & deploy)
```

All pipeline configuration is in `.github/workflows/ci.yml`.
