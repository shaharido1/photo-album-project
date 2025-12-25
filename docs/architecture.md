# Architecture Overview

This document describes the architecture of the Hello World full-stack application.

## Tech Stack

| Layer            | Technology                       | Purpose                               |
| ---------------- | -------------------------------- | ------------------------------------- |
| Backend          | Node.js + Express                | REST API server & static file serving |
| Frontend         | React + Redux Toolkit + Vite     | Single-page application               |
| Testing          | Jest + React Testing Library     | Unit & component tests                |
| Linting          | ESLint + Prettier                | Code quality & formatting             |
| Containerization | Docker                           | Production deployment                 |
| CI/CD            | GitHub Actions                   | Automated testing & deployment        |
| Hosting          | Render                           | Cloud hosting (free tier)             |
| Registry         | GitHub Container Registry (GHCR) | Docker image storage                  |

## Project Structure

```
photo-album-project/
├── client/                     # React frontend
│   ├── src/
│   │   ├── app/
│   │   │   └── store.js        # Redux store configuration
│   │   ├── features/
│   │   │   └── greeting/
│   │   │       ├── greetingSlice.js   # Redux slice with async thunk
│   │   │       └── Greeting.jsx       # Main component
│   │   ├── App.jsx             # App root component
│   │   ├── App.test.jsx        # Component tests
│   │   └── main.jsx            # React entry point
│   ├── package.json
│   ├── vite.config.js          # Vite bundler config
│   ├── jest.config.js          # Jest test config
│   ├── Dockerfile              # Production image (nginx)
│   └── Dockerfile.dev          # Development image
│
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── index.js            # Express server entry point
│   │   └── routes/
│   │       └── api.js          # API route handlers
│   ├── tests/
│   │   └── api.test.js         # API endpoint tests
│   ├── package.json
│   ├── jest.config.js
│   └── Dockerfile              # Server-only image
│
├── docs/                       # Documentation
│   ├── architecture.md         # This file
│   ├── cicd.md                 # CI/CD documentation
│   └── versioning.md           # Version management
│
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions pipeline
│
├── scripts/                    # Utility scripts
│   ├── bump-version.js         # Version bumping script
│   ├── install-hooks.js        # Git hooks installer
│   ├── hooks/
│   │   └── pre-push            # Auto version bump hook
│   ├── check-deployment.js     # Deployment checker
│   ├── debug-versions.js       # Version comparison tool
│   └── debug-render.js         # Render debug tool
│
├── Dockerfile                  # Production combined image
├── docker-compose.yml          # Local development setup
├── render.yaml                 # Render deployment config
├── eslint.config.js            # ESLint flat config (v9)
├── .prettierrc                 # Prettier formatting rules
└── .env.example                # Environment variables template
```

## Application Flow

```
┌─────────────────┐     HTTP Request      ┌─────────────────┐
│                 │ ───────────────────▶  │                 │
│     Browser     │                       │  Express Server │
│   (React App)   │  ◀───────────────────  │   (Node.js)     │
│                 │     JSON Response     │                 │
└─────────────────┘                       └─────────────────┘
        │                                         │
        │ Redux                                   │ Routes
        ▼                                         ▼
┌─────────────────┐                       ┌─────────────────┐
│  Redux Store    │                       │   /api/hello    │
│  - greeting     │                       │   /api/health   │
│    - message    │                       │   /* (static)   │
│    - status     │                       └─────────────────┘
│    - error      │
└─────────────────┘
```

## API Endpoints

| Endpoint      | Method | Description                     | Response                                 |
| ------------- | ------ | ------------------------------- | ---------------------------------------- |
| `/api/hello`  | GET    | Returns greeting message        | `{ "message": "Hello World" }`           |
| `/api/health` | GET    | Health check                    | `{ "status": "ok", "timestamp": "..." }` |
| `/*`          | GET    | Serves React app (static files) | HTML/JS/CSS                              |

## Redux State Structure

```javascript
{
  greeting: {
    message: string,      // The greeting message from API
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: string | null  // Error message if fetch failed
  }
}
```

## Docker Images

### Production Image (root `Dockerfile`)

Multi-stage build that:

1. Builds React client with Vite
2. Compiles TypeScript server code
3. Creates minimal Node.js image with server + client dist

```dockerfile
FROM node:22-alpine AS client-builder
# ... builds client

FROM node:22-alpine
# ... builds server TypeScript, copies client/dist
```

**Image Tags:**

| Tag           | Description                        | Example                                          |
| ------------- | ---------------------------------- | ------------------------------------------------ |
| `<version>`   | Semantic version from package.json | `ghcr.io/shaharido1/photo-album-project:1.0.1`   |
| `<sha>`       | Git commit SHA                     | `ghcr.io/shaharido1/photo-album-project:abc1234` |
| `latest`      | Always points to newest build      | `ghcr.io/shaharido1/photo-album-project:latest`  |

See [Versioning](versioning.md) for version management details.

### Development (docker-compose.yml)

Runs client and server separately with hot reload:

- Client: Vite dev server on port 3000
- Server: Node.js with `--watch` on port 3001

## Environment Variables

| Variable   | Default     | Description                     |
| ---------- | ----------- | ------------------------------- |
| `PORT`     | 3001        | Server port (Render uses 10000) |
| `NODE_ENV` | development | Environment mode                |

See [.env.example](../.env.example) for full list including CI/CD secrets.

## Related Documentation

- [CI/CD Pipeline](./cicd.md) - Detailed CI/CD documentation
- [Versioning](./versioning.md) - Version management and git hooks
- [Environment Setup](../.env.example) - Environment variables reference
