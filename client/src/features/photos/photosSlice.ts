import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { Photo, PhotosState } from '@/types';
import { api, API_ENDPOINTS } from '@/services/apiClient';

const initialState: PhotosState = {
  items: [],
  selectedIds: [],
  status: 'idle',
  error: null,
};

// Async thunk to fetch photos from API
export const fetchPhotos = createAsyncThunk<Photo[]>(
  'photos/fetchPhotos',
  async () => {
    const data = await api.get<{ photos: Photo[] }>(API_ENDPOINTS.PHOTOS, {
      authenticated: true,
    });
    return data.photos;
  }
);

const photosSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    addPhotos: (state, action: PayloadAction<Photo[]>) => {
      // Add uploaded photos to the beginning of the array
      state.items.unshift(...action.payload);
    },
    deletePhoto: (state, action: PayloadAction<string>) => {
      const photoId = action.payload;
      state.items = state.items.filter((photo) => photo.id !== photoId);
      state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
    },
    deleteSelectedPhotos: (state) => {
      state.items = state.items.filter(
        (photo) => !state.selectedIds.includes(photo.id)
      );
      state.selectedIds = [];
    },
    selectPhoto: (state, action: PayloadAction<string>) => {
      const photoId = action.payload;
      if (!state.selectedIds.includes(photoId)) {
        state.selectedIds.push(photoId);
      }
    },
    deselectPhoto: (state, action: PayloadAction<string>) => {
      const photoId = action.payload;
      state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
    },
    togglePhotoSelection: (state, action: PayloadAction<string>) => {
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
        state.error = action.error.message ?? 'Unknown error';
      });
  },
});

export const {
  addPhotos,
  deletePhoto,
  deleteSelectedPhotos,
  selectPhoto,
  deselectPhoto,
  togglePhotoSelection,
  clearSelection,
  selectAll,
} = photosSlice.actions;

// Selectors
export const selectAllPhotos = (state: RootState): Photo[] =>
  state.photos.items;
export const selectPhotosStatus = (state: RootState): PhotosState['status'] =>
  state.photos.status;
export const selectPhotosError = (state: RootState): string | null =>
  state.photos.error;
export const selectSelectedPhotoIds = (state: RootState): string[] =>
  state.photos.selectedIds;
export const selectSelectedPhotos = (state: RootState): Photo[] =>
  state.photos.items.filter((photo) =>
    state.photos.selectedIds.includes(photo.id)
  );

export default photosSlice.reducer;
