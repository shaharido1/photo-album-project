# Firebase Integration

This document describes the Firebase Firestore and Authentication integration for the photo album application.

## Overview

The application uses Firebase for:
- **Firestore**: Document database for photos, albums, and user data
- **Authentication**: Google Sign-In via OAuth 2.0

## Architecture

```
┌─────────────────┐    1. Click "Sign in with Google"    ┌─────────────────┐
│                 │ ─────────────────────────────────────▶│   Firebase      │
│     Browser     │                                       │   Auth          │
│   (React App)   │◀───────────────────────────────────── │   (Google)      │
└──────┬──────────┘    2. Return ID Token + User Info    └─────────────────┘
       │
       │ 3. API Request with Bearer Token
       ▼
┌─────────────────┐    4. Verify Token                   ┌─────────────────┐
│     Express     │ ─────────────────────────────────────▶│   Firebase      │
│     Server      │◀───────────────────────────────────── │   Admin SDK     │
│                 │    5. Token Valid + User ID          └─────────────────┘
└──────┬──────────┘
       │ 6. Query with userId filter
       ▼
┌─────────────────┐
│    Firestore    │
│    (Database)   │
└─────────────────┘
```

## Firestore Collections

| Collection | Description | Fields |
|------------|-------------|--------|
| `users` | User profiles | `email`, `displayName`, `photoURL`, `createdAt`, `updatedAt` |
| `photos` | Photo metadata | `userId`, `name`, `thumbnail`, `fullSize`, `width`, `height`, `createdAt` |
| `albums` | Album documents | `userId`, `name`, `size`, `currentPageIndex`, `createdAt`, `updatedAt` |
| `albums/{id}/pages` | Album pages (subcollection) | `layoutId`, `background`, `order`, `slots[]` |

## Environment Variables

### Server (Firebase Admin SDK)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key (with `\n` escapes) |

### Client (Firebase JS SDK)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Auth domain (e.g., `project.firebaseapp.com`) |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | No | Storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | No | Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or select existing one
3. Enable **Firestore Database** (start in production mode)
4. Enable **Authentication** → Sign-in method → **Google** (enable)

### 2. Get Client Configuration

1. Go to Project Settings → General → Your apps
2. Add a Web App if not already added
3. Copy the Firebase configuration object values

### 3. Generate Service Account Key

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely (never commit to git)
4. Extract values for environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 4. Configure Environment

**Local Development:**

Create `.env` file in project root (copy from `.env.example`):

```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

**GitHub Actions:**

Add these secrets in GitHub → Settings → Secrets and variables → Actions:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

**Render Deployment:**

Add environment variables in Render Dashboard → Service → Environment.

## API Authentication

Protected endpoints require a Bearer token in the Authorization header:

```http
Authorization: Bearer <firebase-id-token>
```

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/auth/verify` | Verify token and get user info |
| `GET` | `/api/photos` | List user's photos |
| `POST` | `/api/photos` | Create photo metadata |
| `DELETE` | `/api/photos/:id` | Delete photo |
| `GET` | `/api/albums` | List user's albums |
| `POST` | `/api/albums` | Create album |
| `GET` | `/api/albums/:id` | Get album with pages |
| `PUT` | `/api/albums/:id` | Update album |
| `DELETE` | `/api/albums/:id` | Delete album |

### Public Endpoints (no auth required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/hello` | Hello World |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/version` | App version |

## Testing

### Test Bypass Header

In non-production environments, you can bypass authentication using:

```http
X-Test-User-Id: test-user-123
```

This is useful for E2E tests and local development without Firebase.

### Running Tests

```bash
# Server tests (includes auth tests)
cd server && npm test

# E2E tests (use test bypass)
npm run test:e2e
```

## Firestore Security Rules

Configure these rules in Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /photos/{photoId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
    }

    match /albums/{albumId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null
        && request.resource.data.userId == request.auth.uid;

      match /pages/{pageId} {
        allow read, write: if request.auth != null
          && get(/databases/$(database)/documents/albums/$(albumId)).data.userId == request.auth.uid;
      }
    }
  }
}
```

## Troubleshooting

### "Firebase credentials not configured"

The server runs without Firebase if credentials are missing. Check:
- Environment variables are set correctly
- Private key has proper `\n` escapes
- Service account has Firestore access

### "Invalid token" errors

- Token may have expired (tokens last 1 hour)
- Check that client and server use the same Firebase project
- Verify the user is signed in on client

### CORS issues

Ensure your domain is added to Firebase Auth authorized domains:
- Firebase Console → Authentication → Settings → Authorized domains

## Related Documentation

- [Architecture](./architecture.md) - Overall system design
- [CI/CD](./cicd.md) - Pipeline and secrets configuration
- [Playwright MCP Guide](./playwright-mcp.md) - E2E testing
