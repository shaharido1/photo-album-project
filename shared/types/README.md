# @photo-album/types

Shared type definitions and Zod schemas for the Photo Album project. This package provides a single source of truth for data models used across the client, server, and database layers.

## Installation

The package is installed locally in both client and server:

```bash
# From project root
cd client && npm install ../shared/types
cd server && npm install ../shared/types
```

## Usage

### Basic Type Usage

```typescript
import { Photo, Album, User } from '@photo-album/types';

// Type annotations
const photo: Photo = {
  id: 'photo-123',
  name: 'Sunset Beach',
  thumbnail: 'https://example.com/thumb.jpg',
  fullSize: 'https://example.com/full.jpg',
  width: 1200,
  height: 800,
  createdAt: '2024-12-20T10:30:00.000Z',
};
```

### Runtime Validation

```typescript
import { PhotoSchema, parsePhoto, safeParsePhoto } from '@photo-album/types';

// Throws ZodError if invalid
const validPhoto = parsePhoto(apiResponse);

// Returns { success: boolean, data?: Photo, error?: ZodError }
const result = safeParsePhoto(apiResponse);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.issues);
}
```

### Firestore Transformations

```typescript
import { firestorePhotoToApi, firestoreAlbumToApi } from '@photo-album/types';

// In server code
const apiPhoto = firestorePhotoToApi(firestoreDoc, docId);
const apiAlbum = firestoreAlbumToApi(firestoreAlbumWithPages, albumId);
```

## Exported Types

### Photo Types

| Type | Description |
|------|-------------|
| `Photo` | Photo as returned by API |
| `ClientPhoto` | Photo with optional `isUploaded` field |
| `PhotosResponse` | `{ photos: Photo[] }` |
| `PhotoResponse` | `{ photo: Photo }` |
| `FirestorePhoto` | Firestore document shape |

### Album Types

| Type | Description |
|------|-------------|
| `Album` | Album with pages |
| `AlbumPage` | Single page in album |
| `PageSlot` | Photo slot in a page |
| `Position` | `{ x: number, y: number }` |
| `AlbumSizeKey` | `'8x8' \| '10x10' \| '12x12' \| 'a4-landscape' \| 'a4-portrait'` |
| `AlbumSizePreset` | Size preset configuration |
| `LayoutTemplate` | Page layout definition |
| `LayoutSlot` | Slot in layout (percentage-based) |

### User Types

| Type | Description |
|------|-------------|
| `User` | User as returned by API |
| `FirestoreUser` | Firestore document shape |

### API Response Types

| Type | Description |
|------|-------------|
| `ErrorResponse` | `{ error: string }` |
| `HelloResponse` | `{ message: string }` |
| `HealthResponse` | `{ status: 'ok', timestamp: string }` |
| `VersionResponse` | `{ version: string }` |

## Schemas

Every type has a corresponding Zod schema:

```typescript
import {
  PhotoSchema,
  AlbumSchema,
  UserSchema,
  // etc.
} from '@photo-album/types';

// Use for validation
PhotoSchema.parse(data);
PhotoSchema.safeParse(data);

// Get schema shape
PhotoSchema.shape.id; // z.string().min(1)
```

## Helper Functions

### Parsing Functions

| Function | Description |
|----------|-------------|
| `parsePhoto(data)` | Parse and validate photo (throws) |
| `safeParsePhoto(data)` | Safe parse photo (returns result) |
| `parsePhotosResponse(data)` | Parse photos array response |
| `parseAlbum(data)` | Parse and validate album |
| `parseUser(data)` | Parse and validate user |

### Transformation Functions

| Function | Description |
|----------|-------------|
| `firestorePhotoToApi(doc, id)` | Convert Firestore photo to API |
| `firestoreAlbumToApi(doc, id)` | Convert Firestore album to API |
| `firestoreUserToApi(doc, id)` | Convert Firestore user to API |
| `firestorePageToApi(page)` | Convert Firestore page to API |

### Type Guards

| Function | Description |
|----------|-------------|
| `isErrorResponse(data)` | Check if response is an error |

## Development

```bash
# Build
npm run build

# Type check
npm run typecheck

# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Architecture

```
src/
├── index.ts           # Barrel exports
├── photo.ts           # Photo schemas & types
├── album.ts           # Album schemas & types
├── user.ts            # User schemas & types
├── api.ts             # API response schemas
├── firestore-types.ts # Firestore document interfaces
└── __tests__/         # Unit tests
    ├── photo.test.ts
    ├── album.test.ts
    ├── user.test.ts
    └── api.test.ts
```

## Why Zod?

1. **Single source of truth**: Types are derived from schemas, not duplicated
2. **Runtime validation**: Catch type errors at API boundaries
3. **Type inference**: `z.infer<typeof Schema>` generates TypeScript types
4. **Composable**: Extend and combine schemas easily
5. **Error messages**: Clear, actionable validation errors
