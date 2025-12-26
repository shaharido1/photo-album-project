# Architecture Overview

This document describes the architecture of the Photo Album full-stack application.

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Backend | Node.js + Express + TypeScript | REST API server & static file serving |
| Frontend | React + Redux Toolkit + Vite + TypeScript | Single-page application |
| Database | Firebase Firestore | Document database |
| Authentication | Firebase Auth | Google Sign-In |
| Testing | Jest + React Testing Library + Playwright | Unit, component & E2E tests |
| Linting | ESLint (v9) + Prettier | Code quality & formatting |
| Containerization | Docker | Production deployment |
| CI/CD | GitHub Actions | Automated testing & deployment |
| Hosting | Render | Cloud hosting |
| Registry | GitHub Container Registry (GHCR) | Docker image storage |

## Project Structure

```
photo-album-project/
├── client/                     # React frontend
│   ├── src/
│   │   ├── app/
│   │   │   └── store.ts        # Redux store configuration
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/           # Authentication components
│   │   │   ├── layout/         # Header, Footer, etc.
│   │   │   └── ui/             # Generic UI components
│   │   ├── features/           # Feature-based modules
│   │   │   ├── auth/           # Auth slice and logic
│   │   │   └── albums/         # Album management
│   │   ├── services/           # API service functions
│   │   ├── config/             # Configuration (Firebase, etc.)
│   │   ├── App.tsx             # App root component
│   │   └── main.tsx            # React entry point
│   ├── package.json
│   ├── vite.config.ts          # Vite bundler config
│   └── tsconfig.json           # TypeScript config
│
├── server/                     # Node.js backend
│   ├── src/
│   │   ├── index.ts            # Express server entry point
│   │   ├── middleware/         # Express middleware
│   │   ├── routes/             # API route handlers
│   │   │   ├── api.ts          # Main API routes
│   │   │   ├── auth.ts         # Auth routes
│   │   │   ├── photos.ts       # Photo routes
│   │   │   └── albums.ts       # Album routes
│   │   └── services/           # Business logic
│   ├── tests/                  # Server tests
│   ├── package.json
│   └── tsconfig.json
│
├── e2e/                        # End-to-end tests
│   └── *.spec.ts               # Playwright test files
│
├── docs/                       # Documentation (role-based)
│   ├── developer/              # Developer role docs
│   ├── code-reviewer/          # Code reviewer docs
│   ├── qa-tester/              # QA tester docs
│   ├── ux-reviewer/            # UX reviewer docs
│   ├── documenter/             # Documenter docs
│   └── devops/                 # DevOps docs
│
├── .claude/                    # Claude Code configuration
│   └── skills/                 # Custom skills
│
├── scripts/                    # Utility scripts
│   ├── bump-version.js         # Version bumping
│   └── hooks/                  # Git hooks
│
├── Dockerfile                  # Production image
├── docker-compose.yml          # Local development
├── render.yaml                 # Render deployment config
├── eslint.config.js            # ESLint flat config
└── CLAUDE.md                   # Claude Code instructions
```

## Application Flow

```
┌─────────────────┐     HTTP Request      ┌─────────────────┐
│                 │ ───────────────────▶  │                 │
│     Browser     │                       │  Express Server │
│   (React App)   │ ◀──────────────────── │   (Node.js)     │
│                 │     JSON Response     │                 │
└─────────────────┘                       └─────────────────┘
        │                                         │
        │ Redux                                   │ Firestore
        ▼                                         ▼
┌─────────────────┐                       ┌─────────────────┐
│  Redux Store    │                       │    Firebase     │
│  - auth         │                       │   (Database +   │
│  - albums       │                       │    Auth)        │
│  - photos       │                       └─────────────────┘
└─────────────────┘
```

## API Endpoints

### Public (No Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/hello` | GET | Hello World greeting |
| `/api/health` | GET | Health check |
| `/api/version` | GET | App version |

### Protected (Auth Required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/verify` | GET | Verify token, get user info |
| `/api/photos` | GET | List user's photos |
| `/api/photos` | POST | Upload photo metadata |
| `/api/photos/:id` | DELETE | Delete photo |
| `/api/albums` | GET | List user's albums |
| `/api/albums` | POST | Create album |
| `/api/albums/:id` | GET | Get album with pages |
| `/api/albums/:id` | PUT | Update album |
| `/api/albums/:id` | DELETE | Delete album |

## Redux State Structure

```typescript
{
  auth: {
    user: User | null,
    isAuthenticated: boolean,
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: string | null
  },
  albums: {
    items: Album[],
    currentAlbum: Album | null,
    status: 'idle' | 'loading' | 'succeeded' | 'failed',
    error: string | null
  }
}
```

## Environment Variables

See `.env.example` for the full list of required environment variables.

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3001 | Server port |
| `NODE_ENV` | development | Environment mode |
| `VITE_*` | - | Client-side Firebase config |
| `FIREBASE_*` | - | Server-side Firebase admin |
