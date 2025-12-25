import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Async thunk to fetch photos from API
export const fetchPhotos = createAsyncThunk('photos/fetchPhotos', async () => {
  const response = await fetch('/api/photos');
  const data = await response.json();
  return data.photos;
});

const initialState = {
  items: [],
  selectedIds: [],
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    addPhotos: (state, action) => {
      // Add uploaded photos to the beginning of the array
      state.items.unshift(...action.payload);
    },
    deletePhoto: (state, action) => {
      const photoId = action.payload;
      state.items = state.items.filter((photo) => photo.id !== photoId);
      state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
    },
    selectPhoto: (state, action) => {
      const photoId = action.payload;
      if (!state.selectedIds.includes(photoId)) {
        state.selectedIds.push(photoId);
      }
    },
    deselectPhoto: (state, action) => {
      const photoId = action.payload;
      state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
    },
    togglePhotoSelection: (state, action) => {
      const photoId = action.payload;
      if (state.selectedIds.includes(photoId)) {
        state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
      } else {
        state.selectedIds.push(photoId);
      }
    },
    clearSelection: (state) => {
      state.selectedIds = [];
    },
    selectAll: (state) => {
      state.selectedIds = state.items.map((photo) => photo.id);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPhotos.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPhotos.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPhotos.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      });
  },
});

export const {
  addPhotos,
  deletePhoto,
  selectPhoto,
  deselectPhoto,
  togglePhotoSelection,
  clearSelection,
  selectAll,
} = photosSlice.actions;

// Selectors
export const selectAllPhotos = (state) => state.photos.items;
export const selectPhotosStatus = (state) => state.photos.status;
export const selectPhotosError = (state) => state.photos.error;
export const selectSelectedPhotoIds = (state) => state.photos.selectedIds;
export const selectSelectedPhotos = (state) =>
  state.photos.items.filter((photo) =>
    state.photos.selectedIds.includes(photo.id)
  );

export default photosSlice.reducer;
