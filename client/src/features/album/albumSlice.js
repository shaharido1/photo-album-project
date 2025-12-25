import { createSlice } from '@reduxjs/toolkit';

// Simple UUID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Album size presets (from feature-plan.md)
export const ALBUM_SIZE_PRESETS = {
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
export const LAYOUT_TEMPLATES = {
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
const createSlots = (layoutId) => {
  const template = LAYOUT_TEMPLATES[layoutId];
  if (!template) return [];

  const slots = [];
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
const createPage = (layoutId = 'single') => ({
  id: generateId(),
  layoutId,
  background: '#ffffff',
  slots: createSlots(layoutId),
});

const initialState = {
  album: {
    id: null,
    name: 'Untitled Album',
    size: '10x10',
    pages: [],
    currentPageIndex: 0,
  },
  selectedSlot: null, // { pageIndex, slotIndex }
  status: 'idle',
  error: null,
};

const albumSlice = createSlice({
  name: 'album',
  initialState,
  reducers: {
    createAlbum: (state, action) => {
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

    setAlbumName: (state, action) => {
      state.album.name = action.payload;
    },

    setAlbumSize: (state, action) => {
      state.album.size = action.payload;
    },

    addPage: (state, action) => {
      const layoutId = action.payload || 'single';
      state.album.pages.push(createPage(layoutId));
    },

    removePage: (state, action) => {
      const pageIndex = action.payload;
      if (state.album.pages.length > 1) {
        state.album.pages.splice(pageIndex, 1);
        if (state.album.currentPageIndex >= state.album.pages.length) {
          state.album.currentPageIndex = state.album.pages.length - 1;
        }
      }
    },

    setCurrentPage: (state, action) => {
      const pageIndex = action.payload;
      if (pageIndex >= 0 && pageIndex < state.album.pages.length) {
        state.album.currentPageIndex = pageIndex;
        state.selectedSlot = null;
      }
    },

    updatePageLayout: (state, action) => {
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

    setPageBackground: (state, action) => {
      const { pageIndex, color } = action.payload;
      if (state.album.pages[pageIndex]) {
        state.album.pages[pageIndex].background = color;
      }
    },

    assignPhotoToSlot: (state, action) => {
      const { pageIndex, slotIndex, photoId } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].photoId = photoId;
      }
    },

    removePhotoFromSlot: (state, action) => {
      const { pageIndex, slotIndex } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].photoId = null;
        page.slots[slotIndex].position = { x: 0, y: 0 };
        page.slots[slotIndex].scale = 1;
        page.slots[slotIndex].rotation = 0;
      }
    },

    updateSlotPosition: (state, action) => {
      const { pageIndex, slotIndex, position } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].position = position;
      }
    },

    updateSlotScale: (state, action) => {
      const { pageIndex, slotIndex, scale } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].scale = scale;
      }
    },

    updateSlotRotation: (state, action) => {
      const { pageIndex, slotIndex, rotation } = action.payload;
      const page = state.album.pages[pageIndex];
      if (page && page.slots[slotIndex]) {
        page.slots[slotIndex].rotation = rotation;
      }
    },

    selectSlot: (state, action) => {
      state.selectedSlot = action.payload; // { pageIndex, slotIndex } or null
    },

    clearAlbum: (state) => {
      state.album = initialState.album;
      state.selectedSlot = null;
      state.status = 'idle';
      state.error = null;
    },
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
} = albumSlice.actions;

// Selectors
export const selectAlbum = (state) => state.album.album;
export const selectAlbumId = (state) => state.album.album.id;
export const selectAlbumName = (state) => state.album.album.name;
export const selectAlbumSize = (state) => state.album.album.size;
export const selectPages = (state) => state.album.album.pages;
export const selectCurrentPageIndex = (state) =>
  state.album.album.currentPageIndex;
export const selectCurrentPage = (state) =>
  state.album.album.pages[state.album.album.currentPageIndex];
export const selectSelectedSlot = (state) => state.album.selectedSlot;
export const selectAlbumStatus = (state) => state.album.status;

export default albumSlice.reducer;
