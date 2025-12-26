# Code Style Guide

This document defines the coding standards for the Photo Album project.

## TypeScript

### Type Definitions

```typescript
// Prefer interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type for unions, intersections, or primitives
type Status = 'idle' | 'loading' | 'succeeded' | 'failed';
type UserWithRole = User & { role: string };
```

### Function Typing

```typescript
// Always type parameters and return values
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// Arrow functions
const formatDate = (date: Date): string => {
  return date.toISOString();
};

// Async functions
async function fetchUser(id: string): Promise<User> {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
```

### Avoid `any`

```typescript
// Bad
function process(data: any) { ... }

// Good - use unknown and narrow
function process(data: unknown) {
  if (isValidData(data)) {
    // data is now typed
  }
}

// Good - define the type
function process(data: ProcessInput) { ... }
```

## React Components

### Component Structure

```typescript
// 1. Imports (React, external, internal, styles)
import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from '@/components/ui/button';
import styles from './PhotoCard.module.css';

// 2. Types/Interfaces
interface PhotoCardProps {
  photo: Photo;
  onDelete?: (id: string) => void;
}

// 3. Component
export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  // 3a. Hooks
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  // 3b. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3c. Handlers
  const handleDelete = () => {
    onDelete?.(photo.id);
  };

  // 3d. Render
  return (
    <div className={styles.card}>
      {/* ... */}
    </div>
  );
}
```

### Props

```typescript
// Destructure props in function signature
function Button({ label, onClick, disabled = false }: ButtonProps) {
  // ...
}

// Use optional chaining for optional callbacks
onClick?.();
```

### Hooks

```typescript
// Custom hooks start with "use"
function useAuth() {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  // ...
  return { user, login, logout };
}
```

## Redux

### Slice Structure

```typescript
// features/albums/albumsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// 1. Types
interface AlbumsState {
  items: Album[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

// 2. Initial state
const initialState: AlbumsState = {
  items: [],
  status: 'idle',
  error: null,
};

// 3. Async thunks
export const fetchAlbums = createAsyncThunk(
  'albums/fetchAlbums',
  async (_, { rejectWithValue }) => {
    try {
      return await albumsApi.getAll();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// 4. Slice
const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {
    // synchronous reducers
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlbums.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

// 5. Exports
export const { } = albumsSlice.actions;
export default albumsSlice.reducer;

// 6. Selectors
export const selectAlbums = (state: RootState) => state.albums.items;
export const selectAlbumsStatus = (state: RootState) => state.albums.status;
```

## Express Routes

### Route Structure

```typescript
// routes/photos.ts
import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth to all routes in this file
router.use(authMiddleware);

// GET /api/photos
router.get('/', async (req, res, next) => {
  try {
    const photos = await photoService.getByUser(req.user.uid);
    res.json(photos);
  } catch (error) {
    next(error);
  }
});

export default router;
```

### Error Handling

```typescript
// Always use try/catch and pass errors to next()
router.post('/', async (req, res, next) => {
  try {
    const result = await service.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error); // Let error middleware handle it
  }
});
```

## File Organization

```
feature/
├── index.ts           # Public exports
├── FeatureComponent.tsx
├── FeatureComponent.test.tsx
├── featureSlice.ts
├── featureService.ts
├── types.ts           # Feature-specific types
└── utils.ts           # Feature-specific utilities
```

## Comments

```typescript
// Use comments to explain WHY, not WHAT
// Bad: Increment counter by 1
counter++;

// Good: Increment to account for 0-based index
counter++;

// Use JSDoc for public functions
/**
 * Fetches albums for the authenticated user
 * @returns Array of albums or empty array if none found
 */
async function fetchUserAlbums(): Promise<Album[]> {
  // ...
}
```

## Import Order

1. React imports
2. External library imports (alphabetical)
3. Internal absolute imports (alphabetical)
4. Relative imports (alphabetical)
5. Style imports

```typescript
import { useState, useEffect } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

import { PhotoCard } from './PhotoCard';
import { formatPhotoDate } from './utils';

import styles from './PhotoGallery.module.css';
```
