import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from '@/app/store';
import type { Photo, PhotosState, UploadProgress } from '@/types';
import { api, API_ENDPOINTS, uploadFiles } from '@/services/apiClient';
import type { BatchUploadResponse } from '@photo-album/types';

const initialState: PhotosState = {
  items: [],
  selectedIds: [],
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadProgress: null,
  uploadError: null,
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

// Async thunk to upload photos
export const uploadPhotos = createAsyncThunk<
  BatchUploadResponse,
  File[],
  { dispatch: AppDispatch; rejectValue: string }
>(
  'photos/uploadPhotos',
  async (files, { dispatch, rejectWithValue }) => {
    try {
      const response = await uploadFiles<BatchUploadResponse>(
        `${API_ENDPOINTS.PHOTOS}/upload/batch`,
        files,
        'photos',
        (progress) => {
          dispatch(
            setUploadProgress({
              current: Math.round((progress / 100) * files.length),
              total: files.length,
              progress,
            })
          );
        }
      );
      return response;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Upload failed'
      );
    }
  }
);

// Async thunk to delete a photo from server
export const deletePhotoFromServer = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>('photos/deletePhotoFromServer', async (photoId, { rejectWithValue }) => {
  try {
    await api.delete(`${API_ENDPOINTS.PHOTOS}/${photoId}`, {
      authenticated: true,
    });
    return photoId;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Delete failed'
    );
  }
});

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
    setUploadProgress: (state, action: PayloadAction<UploadProgress>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadState: (state) => {
      state.uploadStatus = 'idle';
      state.uploadProgress = null;
      state.uploadError = null;
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
      })
      // Upload photos cases
      .addCase(uploadPhotos.pending, (state) => {
        state.uploadStatus = 'uploading';
        state.uploadError = null;
        state.uploadProgress = { current: 0, total: 0, progress: 0 };
      })
      .addCase(uploadPhotos.fulfilled, (state, action) => {
        state.uploadStatus = 'succeeded';
        state.uploadProgress = null;
        // Add uploaded photos to the beginning
        state.items.unshift(...action.payload.photos);
      })
      .addCase(uploadPhotos.rejected, (state, action) => {
        state.uploadStatus = 'failed';
        state.uploadError = action.payload ?? 'Upload failed';
        state.uploadProgress = null;
      })
      // Delete photo from server cases
      .addCase(deletePhotoFromServer.fulfilled, (state, action) => {
        const photoId = action.payload;
        state.items = state.items.filter((photo) => photo.id !== photoId);
        state.selectedIds = state.selectedIds.filter((id) => id !== photoId);
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
  setUploadProgress,
  resetUploadState,
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
export const selectUploadStatus = (
  state: RootState
): PhotosState['uploadStatus'] => state.photos.uploadStatus;
export const selectUploadProgress = (
  state: RootState
): UploadProgress | null => state.photos.uploadProgress;
export const selectUploadError = (state: RootState): string | null =>
  state.photos.uploadError;

export default photosSlice.reducer;
