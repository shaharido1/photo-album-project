import { createSlice, createSelector, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type {
  Album,
  AlbumPage,
  AlbumState,
  AlbumSizeKey,
  AlbumSizePresets,
  CreateAlbumPayload,
  UpdatePageLayoutPayload,
  SetPageBackgroundPayload,
  AssignPhotoToSlotPayload,
  RemovePhotoFromSlotPayload,
  UpdateSlotPositionPayload,
  UpdateSlotScalePayload,
  UpdateSlotRotationPayload,
  PageSlot,
  SelectedSlotRef,
  LayoutTemplateRefs,
  ViewMode,
  SpreadInfo,
} from '@/types';
import { api, API_ENDPOINTS } from '@/services/apiClient';

// Simple UUID generator
const generateId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Album size presets (from feature-plan.md)
export const ALBUM_SIZE_PRESETS: AlbumSizePresets = {
  '8x8': {
    name: '8x8"',
    dimensions: { width: 2400, height: 2400 },
    unit: 'inches',
    inches: { width: 8, height: 8 },
    cm: { width: 20, height: 20 },
  },
  '10x10': {
    name: '10x10"',
    dimensions: { width: 3000, height: 3000 },
    unit: 'inches',
    inches: { width: 10, height: 10 },
    cm: { width: 25, height: 25 },
  },
  '12x12': {
    name: '12x12"',
    dimensions: { width: 3600, height: 3600 },
    unit: 'inches',
    inches: { width: 12, height: 12 },
    cm: { width: 30, height: 30 },
  },
  'a4-landscape': {
    name: 'A4 Landscape',
    dimensions: { width: 3508, height: 2480 },
    unit: 'mm',
    inches: { width: 11.69, height: 8.27 },
    cm: { width: 29.7, height: 21 },
  },
  'a4-portrait': {
    name: 'A4 Portrait',
    dimensions: { width: 2480, height: 3508 },
    unit: 'mm',
    inches: { width: 8.27, height: 11.69 },
    cm: { width: 21, height: 29.7 },
  },
};

// Layout templates (basic slot counts)
export const LAYOUT_TEMPLATES: LayoutTemplateRefs = {
  single: { name: 'Single Photo', slots: 1 },
  'single-margin': { name: 'Single (Margin)', slots: 1 },
  '2-horizontal': { name: '2 Horizontal', slots: 2 },
  '2-vertical': { name: '2 Vertical', slots: 2 },
  '3-left': { name: '3 (Large Left)', slots: 3 },
  '3-top': { name: '3 (Large Top)', slots: 3 },
  '4-grid': { name: '4 Grid', slots: 4 },
  '6-grid': { name: '6 Grid', slots: 6 },
};

// Helper function to create page slots based on layout
const createSlots = (layoutId: string): PageSlot[] => {
  const template = LAYOUT_TEMPLATES[layoutId];
  if (!template) return [];

  const slots: PageSlot[] = [];
  for (let i = 0; i < template.slots; i++) {
    slots.push({
      id: generateId(),
      photoId: null,
      position: { x: 0, y: 0 },
      scale: 1,
      rotation: 0,
    });
  }
  return slots;
};

// Helper function to create a new page
const createPage = (layoutId: string = 'single'): AlbumPage => ({
  id: generateId(),
  layoutId,
  background: '#ffffff',
  slots: createSlots(layoutId),
});

const initialState: AlbumState = {
  album: {
    id: null,
    name: 'Untitled Album',
    size: '10x10',
    pages: [],
    currentPageIndex: 0,
  },
  selectedSlot: null,
  viewMode: 'book',
  currentSpread: 0,
  status: 'idle',
  error: null,
};

// ============================================
// Async Thunks for Firebase Operations
// ============================================

interface AlbumSummary {
  id: string;
  name: string;
  size: AlbumSizeKey;
  currentPageIndex: number;
}

/**
 * Fetch all albums for the current user (summary list)
 */
export const fetchAlbums = createAsyncThunk<
  AlbumSummary[],
  void,
  { rejectValue: string }
>('album/fetchAlbums', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<{ albums: AlbumSummary[] }>(
      API_ENDPOINTS.ALBUMS,
      { authenticated: true }
    );
    return response.albums;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch albums'
    );
  }
});

/**
 * Fetch a single album by ID (with pages)
 */
export const fetchAlbum = createAsyncThunk<Album, string, { rejectValue: string }>(
  'album/fetchAlbum',
  async (albumId, { rejectWithValue }) => {
    try {
      const response = await api.get<{ album: Album }>(
        `${API_ENDPOINTS.ALBUMS}/${albumId}`,
        { authenticated: true }
      );
      return response.album;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch album'
      );
    }
  }
);

/**
 * Create a new album in Firebase
 */
export const createAlbumAsync = createAsyncThunk<
  Album,
  CreateAlbumPayload,
  { rejectValue: string }
>('album/createAlbumAsync', async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post<{ album: Album }>(
      API_ENDPOINTS.ALBUMS,
      { name: payload.name || 'Untitled Album', size: payload.size || '10x10' },
      { authenticated: true }
    );
    return response.album;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to create album'
    );
  }
});

/**
 * Save/update an album to Firebase
 */
export const saveAlbum = createAsyncThunk<
  void,
  void,
  { state: { album: AlbumState }; rejectValue: string }
>('album/saveAlbum', async (_, { getState, rejectWithValue }) => {
  try {
    const { album } = getState().album;
    if (!album.id) {
      return rejectWithValue('Cannot save album without ID');
    }

    // Update album metadata
    await api.put(
      `${API_ENDPOINTS.ALBUMS}/${album.id}`,
      {
        name: album.name,
        size: album.size,
        currentPageIndex: album.currentPageIndex,
      },
      { authenticated: true }
    );

    // Save each page
    for (let i = 0; i < album.pages.length; i++) {
      const page = album.pages[i];
      await api.put(
        `${API_ENDPOINTS.ALBUMS}/${album.id}/pages/${page.id}`,
        {
          layoutId: page.layoutId,
          background: page.background,
          order: i,
          slots: page.slots,
        },
        { authenticated: true }
      );
    }
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to save album'
    );
  }
});

/**
 * Delete an album from Firebase
 */
export const deleteAlbum = createAsyncThunk<void, string, { rejectValue: string }>(
  'album/deleteAlbum',
  async (albumId, { rejectWithValue }) => {
    try {
      await api.delete(`${API_ENDPOINTS.ALBUMS}/${albumId}`, {
        authenticated: true,
      });
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to delete album'
      );
    }
  }
);

/**
 * Add a page to an album in Firebase
 */
export const addPageAsync = createAsyncThunk<
  AlbumPage,
  { albumId: string; layoutId?: string },
  { state: { album: AlbumState }; rejectValue: string }
>(
  'album/addPageAsync',
  async ({ albumId, layoutId = 'single' }, { getState, rejectWithValue }) => {
    try {
      const { album } = getState().album;
      const order = album.pages.length;
      const slots = createSlots(layoutId);

      const response = await api.post<{ page: AlbumPage }>(
        `${API_ENDPOINTS.ALBUMS}/${albumId}/pages`,
        {
          layoutId,
          background: '#ffffff',
          order,
          slots,
        },
        { authenticated: true }
      );
      return response.page;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to add page'
      );
    }
  }
);

const albumSlice = createSlice({
  name: 'album',
  initialState,
  reducers: {
    createAlbum: (state, action: PayloadAction<CreateAlbumPayload>) => {
      const { name, size } = action.payload;
      state.album = {
        id: generateId(),
        name: name || 'Untitled Album',
        size: size || '10x10',
        pages: [createPage('single')],
        currentPageIndex: 0,
      };
      state.selectedSlot = null;
      state.status = 'idle';
      state.error = null;
    },

    setAlbumName: (state, action: PayloadAction<string>) => {
      state.album.name = action.payload;
    },

    setAlbumSize: (state, action: PayloadAction<AlbumSizeKey>) => {
      state.album.size = action.payload;
    },

    addPage: (state, action: PayloadAction<string | undefined>) => {
      const layoutId = action.payload || 'single';
      state.album.pages.push(createPage(layoutId));
    },

    removePage: (state, action: PayloadAction<number>) => {
      const pageIndex = action.payload;
      if (state.album.pages.length > 1) {
        state.album.pages.splice(pageIndex, 1);
        if (state.album.currentPageIndex >= state.album.pages.length) {
          state.album.currentPageIndex = state.album.pages.length - 1;
        }
      }
    },

    setCurrentPage: (state, action: PayloadAction<number>) => {
      const pageIndex = action.payload;
      if (pageIndex >= 0 && pageIndex < state.album.pages.length) {
        state.album.currentPageIndex = pageIndex;
        state.selectedSlot = null;
      }
    },

    updatePageLayout: (state, action: PayloadAction<UpdatePageLayoutPayload>) => {
      const { pageIndex, layoutId } = action.payload;
      if (state.album.pages[pageIndex]) {
        const page = state.album.pages[pageIndex];
        const oldSlots = page.slots;
        page.layoutId = layoutId;
        page.slots = createSlots(layoutId);
        // Try to preserve existing photos
        for (let i = 0; i < Math.min(oldSlots.length, page.slots.length); i++) {
          if (oldSlots[i].photoId) {
            page.slots[i].photoId = oldSlots[i].photoId;
          }
        }
      }
    },

    setPageBackground: (state, action: PayloadAction<SetPageBackgroundPayload>) => {
      const { pageIndex, color } = action.payload;
      if (state.album.pages[pageIndex]) {
        state.album.pages[pageIndex].background = color;
      }
    },

    assignPhotoToSlot: (state, action: PayloadAction<AssignPhotoToSlotPayload>) => {
      const { pageIndex, slotIndex, photoId } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].photoId = photoId;
      }
    },

    removePhotoFromSlot: (state, action: PayloadAction<RemovePhotoFromSlotPayload>) => {
      const { pageIndex, slotIndex } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].photoId = null;
        page.slots[slotIndex].position = { x: 0, y: 0 };
        page.slots[slotIndex].scale = 1;
        page.slots[slotIndex].rotation = 0;
      }
    },

    updateSlotPosition: (state, action: PayloadAction<UpdateSlotPositionPayload>) => {
      const { pageIndex, slotIndex, position } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].position = position;
      }
    },

    updateSlotScale: (state, action: PayloadAction<UpdateSlotScalePayload>) => {
      const { pageIndex, slotIndex, scale } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].scale = scale;
      }
    },

    updateSlotRotation: (state, action: PayloadAction<UpdateSlotRotationPayload>) => {
      const { pageIndex, slotIndex, rotation } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].rotation = rotation;
      }
    },

    selectSlot: (state, action: PayloadAction<SelectedSlotRef | null>) => {
      state.selectedSlot = action.payload;
    },

    clearAlbum: (state) => {
      state.album = initialState.album;
      state.selectedSlot = null;
      state.viewMode = 'book';
      state.currentSpread = 0;
      state.status = 'idle';
      state.error = null;
    },

    // View mode actions
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
      // When switching to edit mode, sync currentPageIndex with the spread
      if (action.payload === 'edit') {
        const pages = state.album.pages;
        if (state.currentSpread === 0) {
          // Cover page
          state.album.currentPageIndex = 0;
        } else {
          // Spread pages: spread 1 = pages 1-2, spread 2 = pages 3-4, etc.
          const leftPageIndex = state.currentSpread * 2 - 1;
          if (leftPageIndex < pages.length) {
            state.album.currentPageIndex = leftPageIndex;
          }
        }
      }
    },

    setCurrentSpread: (state, action: PayloadAction<number>) => {
      const spreadIndex = action.payload;
      const maxSpread = Math.ceil((state.album.pages.length - 1) / 2);
      if (spreadIndex >= 0 && spreadIndex <= maxSpread) {
        state.currentSpread = spreadIndex;
      }
    },

    nextSpread: (state) => {
      const maxSpread = Math.ceil((state.album.pages.length - 1) / 2);
      if (state.currentSpread < maxSpread) {
        state.currentSpread += 1;
      }
    },

    prevSpread: (state) => {
      if (state.currentSpread > 0) {
        state.currentSpread -= 1;
      }
    },

    // Switch to edit mode for a specific page
    editPage: (state, action: PayloadAction<number>) => {
      const pageIndex = action.payload;
      if (pageIndex >= 0 && pageIndex < state.album.pages.length) {
        state.viewMode = 'edit';
        state.album.currentPageIndex = pageIndex;
      }
    },

    // Load album from API response
    loadAlbum: (state, action: PayloadAction<Album>) => {
      state.album = action.payload;
      state.selectedSlot = null;
      state.viewMode = 'book';
      state.currentSpread = 0;
      state.status = 'succeeded';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetchAlbum
    builder
      .addCase(fetchAlbum.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAlbum.fulfilled, (state, action) => {
        state.album = action.payload;
        state.selectedSlot = null;
        state.viewMode = 'book';
        state.currentSpread = 0;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(fetchAlbum.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to fetch album';
      });

    // createAlbumAsync
    builder
      .addCase(createAlbumAsync.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(createAlbumAsync.fulfilled, (state, action) => {
        state.album = {
          ...action.payload,
          pages:
            action.payload.pages.length > 0
              ? action.payload.pages
              : [createPage('single')],
        };
        state.selectedSlot = null;
        state.viewMode = 'book';
        state.currentSpread = 0;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(createAlbumAsync.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to create album';
      });

    // saveAlbum
    builder
      .addCase(saveAlbum.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(saveAlbum.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(saveAlbum.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to save album';
      });

    // deleteAlbum
    builder
      .addCase(deleteAlbum.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(deleteAlbum.fulfilled, (state) => {
        state.album = initialState.album;
        state.selectedSlot = null;
        state.viewMode = 'book';
        state.currentSpread = 0;
        state.status = 'idle';
        state.error = null;
      })
      .addCase(deleteAlbum.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Failed to delete album';
      });

    // addPageAsync
    builder
      .addCase(addPageAsync.fulfilled, (state, action) => {
        state.album.pages.push(action.payload);
      })
      .addCase(addPageAsync.rejected, (state, action) => {
        state.error = action.payload ?? 'Failed to add page';
      });
  },
});

export const {
  createAlbum,
  setAlbumName,
  setAlbumSize,
  addPage,
  removePage,
  setCurrentPage,
  updatePageLayout,
  setPageBackground,
  assignPhotoToSlot,
  removePhotoFromSlot,
  updateSlotPosition,
  updateSlotScale,
  updateSlotRotation,
  selectSlot,
  clearAlbum,
  setViewMode,
  setCurrentSpread,
  nextSpread,
  prevSpread,
  editPage,
  loadAlbum,
} = albumSlice.actions;

// Selectors
export const selectAlbum = (state: RootState): Album => state.album.album;
export const selectAlbumId = (state: RootState): string | null => state.album.album.id;
export const selectAlbumName = (state: RootState): string => state.album.album.name;
export const selectAlbumSize = (state: RootState): AlbumSizeKey => state.album.album.size;
export const selectPages = (state: RootState): AlbumPage[] => state.album.album.pages;
export const selectCurrentPageIndex = (state: RootState): number =>
  state.album.album.currentPageIndex;
export const selectCurrentPage = (state: RootState): AlbumPage | undefined =>
  state.album.album.pages[state.album.album.currentPageIndex];
export const selectSelectedSlot = (state: RootState): SelectedSlotRef | null =>
  state.album.selectedSlot;
export const selectAlbumStatus = (state: RootState): AlbumState['status'] =>
  state.album.status;
export const selectAlbumError = (state: RootState): string | null => state.album.error;

// View mode selectors
export const selectViewMode = (state: RootState): ViewMode => state.album.viewMode;
export const selectCurrentSpread = (state: RootState): number => state.album.currentSpread;

// Get the pages for the current spread (memoized)
export const selectSpreadInfo = createSelector(
  [selectPages, selectCurrentSpread],
  (pages, spreadIndex): SpreadInfo => {
    if (spreadIndex === 0) {
      // Cover page (first page alone)
      return {
        spreadIndex: 0,
        leftPage: pages[0] || null,
        rightPage: null,
        leftPageIndex: pages.length > 0 ? 0 : null,
        rightPageIndex: null,
        isCover: true,
      };
    }

    // Regular spreads: spread 1 = pages 1-2, spread 2 = pages 3-4, etc.
    const leftPageIndex = spreadIndex * 2 - 1;
    const rightPageIndex = spreadIndex * 2;

    return {
      spreadIndex,
      leftPage: pages[leftPageIndex] || null,
      rightPage: pages[rightPageIndex] || null,
      leftPageIndex: leftPageIndex < pages.length ? leftPageIndex : null,
      rightPageIndex: rightPageIndex < pages.length ? rightPageIndex : null,
      isCover: false,
    };
  }
);

// Get total number of spreads
export const selectTotalSpreads = (state: RootState): number => {
  const pageCount = state.album.album.pages.length;
  if (pageCount === 0) return 0;
  // First page is cover (spread 0), then pairs: (pageCount - 1) / 2 rounded up
  return 1 + Math.ceil((pageCount - 1) / 2);
};

export default albumSlice.reducer;
