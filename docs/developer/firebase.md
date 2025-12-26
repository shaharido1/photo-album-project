# Firebase Integration

This document describes the Firebase Firestore and Authentication integration.

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

| Collection | Description | Key Fields |
|------------|-------------|------------|
| `users` | User profiles | `email`, `displayName`, `photoURL`, `createdAt` |
| `photos` | Photo metadata | `userId`, `name`, `thumbnail`, `fullSize`, `width`, `height` |
| `albums` | Album documents | `userId`, `name`, `size`, `currentPageIndex` |
| `albums/{id}/pages` | Album pages (subcollection) | `layoutId`, `background`, `order`, `slots[]` |

## Environment Variables

### Server (Firebase Admin SDK)

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email |
| `FIREBASE_PRIVATE_KEY` | Yes | Service account private key |

### Client (Firebase JS SDK)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase app ID |

## Authentication Flow

### Client Side

```typescript
// Sign in with Google
import { signInWithGoogle } from '@/services/authService';

const handleLogin = async () => {
  const user = await signInWithGoogle();
  // User is now authenticated
};
```

### Server Side

Protected routes use the auth middleware:

```typescript
// All requests must include:
// Authorization: Bearer <firebase-id-token>

app.get('/api/albums', authMiddleware, async (req, res) => {
  const userId = req.user.uid; // Available after auth
  // Query Firestore with userId filter
});
```

## Test Bypass

In non-production environments, you can bypass auth using:

```http
X-Test-User-Id: test-user-123
```

This is used by E2E tests and local development.

## Firestore Security Rules

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
    }

    match /albums/{albumId} {
      allow read, write: if request.auth != null
        && resource.data.userId == request.auth.uid;

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
- Check environment variables are set correctly
- Verify private key has proper `\n` escapes
- Ensure service account has Firestore access

### "Invalid token" errors
- Token may have expired (tokens last 1 hour)
- Verify client and server use the same Firebase project

### CORS issues
- Add your domain to Firebase Auth authorized domains
- Firebase Console → Authentication → Settings → Authorized domains
