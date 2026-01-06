import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { api, API_ENDPOINTS, streamSSE } from '@/services/apiClient';
import type {
  GooglePhotosAlbum,
  GooglePhotosMediaItem,
  GooglePhotosStatusResponse,
  GooglePhotosAlbumsResponse,
  GooglePhotosListResponse,
  OAuthStartResponse,
  ImportPhotosResponse,
  ImportOptions,
  ImportStreamEvent,
} from '@photo-album/types';
import { addPhoto } from '../photos/photosSlice';
import type { Photo } from '@/types';
import { signOut } from '../auth/authSlice';

interface GooglePhotosState {
  // Connection status
  isConnected: boolean;
  connectedEmail: string | null;
  connectedAt: string | null;
  connectionStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  connectionError: string | null;

  // Albums
  albums: GooglePhotosAlbum[];
  albumsNextPageToken: string | null;
  albumsStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  albumsError: string | null;

  // Photos
  photos: GooglePhotosMediaItem[];
  photosNextPageToken: string | null;
  photosStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  photosError: string | null;
  selectedAlbumId: string | null;

  // Import
  selectedPhotoIds: string[];
  importStatus: 'idle' | 'importing' | 'succeeded' | 'failed';
  importError: string | null;
  importProgress: { imported: number; failed: number; total: number } | null;

  // Dialog
  isDialogOpen: boolean;

  // Picker
  pickerSessionId: string | null;
  pickerStatus: 'idle' | 'creating' | 'polling' | 'succeeded' | 'failed';
  pickerError: string | null;
}


const initialState: GooglePhotosState = {
  isConnected: false,
  connectedEmail: null,
  connectedAt: null,
  connectionStatus: 'idle',
  connectionError: null,

  albums: [],
  albumsNextPageToken: null,
  albumsStatus: 'idle',
  albumsError: null,

  photos: [],
  photosNextPageToken: null,
  photosStatus: 'idle',
  photosError: null,
  selectedAlbumId: null,

  selectedPhotoIds: [],
  importStatus: 'idle',
  importError: null,
  importProgress: null,

  isDialogOpen: false,

  pickerSessionId: null,
  pickerStatus: 'idle',
  pickerError: null,
};


// Check connection status
export const checkGooglePhotosStatus = createAsyncThunk<GooglePhotosStatusResponse>(
  'googlePhotos/checkStatus',
  async () => {
    return await api.get<GooglePhotosStatusResponse>(API_ENDPOINTS.GOOGLE_PHOTOS_STATUS, {
      authenticated: true,
    });
  }
);

// Start OAuth flow
export const startGooglePhotosAuth = createAsyncThunk<string>(
  'googlePhotos/startAuth',
  async () => {
    const response = await api.get<OAuthStartResponse>(API_ENDPOINTS.GOOGLE_PHOTOS_AUTH_START, {
      authenticated: true,
    });
    return response.authUrl;
  }
);

// Disconnect Google Photos
export const disconnectGooglePhotos = createAsyncThunk<void>(
  'googlePhotos/disconnect',
  async () => {
    await api.post(API_ENDPOINTS.GOOGLE_PHOTOS_DISCONNECT, undefined, {
      authenticated: true,
    });
  }
);

// Fetch albums
export const fetchGooglePhotosAlbums = createAsyncThunk<
  GooglePhotosAlbumsResponse,
  { pageToken?: string } | undefined
>('googlePhotos/fetchAlbums', async (params) => {
  const url = params?.pageToken
    ? `${API_ENDPOINTS.GOOGLE_PHOTOS_ALBUMS}?pageToken=${params.pageToken}`
    : API_ENDPOINTS.GOOGLE_PHOTOS_ALBUMS;

  return await api.get<GooglePhotosAlbumsResponse>(url, {
    authenticated: true,
  });
});

// Fetch photos
export const fetchGooglePhotosPhotos = createAsyncThunk<
  GooglePhotosListResponse,
  { albumId?: string; pageToken?: string } | undefined
>('googlePhotos/fetchPhotos', async (params) => {
  const searchParams = new URLSearchParams();
  if (params?.albumId) searchParams.set('albumId', params.albumId);
  if (params?.pageToken) searchParams.set('pageToken', params.pageToken);

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ENDPOINTS.GOOGLE_PHOTOS_PHOTOS}?${queryString}`
    : API_ENDPOINTS.GOOGLE_PHOTOS_PHOTOS;

  return await api.get<GooglePhotosListResponse>(url, {
    authenticated: true,
  });
});

// Start Picker Session
export const startGooglePhotosPicker = createAsyncThunk<{
  sessionId: string;
  pickerUri: string;
}>('googlePhotos/startPicker', async () => {
  return await api.post<{ sessionId: string; pickerUri: string }>(
    API_ENDPOINTS.GOOGLE_PHOTOS_PICKER_START,
    {},
    { authenticated: true }
  );
});

// Check Picker Status
export const checkGooglePhotosPickerStatus = createAsyncThunk<
  { ready: boolean; items?: GooglePhotosMediaItem[] },
  string
>('googlePhotos/checkPickerStatus', async (sessionId, { dispatch }) => {
  const response = await api.get<{ ready: boolean; items?: GooglePhotosMediaItem[] }>(
    `${API_ENDPOINTS.GOOGLE_PHOTOS_PICKER_STATUS}?sessionId=${sessionId}`,
    { authenticated: true }
  );

  if (response.ready && response.items && response.items.length > 0) {
    void dispatch(
      importGooglePhotos({
        items: response.items,
        options: { storageType: 'local' }, // Default to local storage for now
      })
    );
  }

  return response;
});


// Import selected photos with streaming (photos appear as they're imported)
export const importGooglePhotos = createAsyncThunk<
  ImportPhotosResponse,
  { items: GooglePhotosMediaItem[]; options: ImportOptions },
  { dispatch: ReturnType<typeof import('@/app/store').store.dispatch>; rejectValue: string }
>('googlePhotos/importPhotos', async ({ items, options }, { dispatch, rejectWithValue }) => {
  return new Promise<ImportPhotosResponse>((resolve, reject) => {
    const results: ImportPhotosResponse['results'] = [];
    let imported = 0;
    let failed = 0;

    streamSSE<ImportStreamEvent>(
      API_ENDPOINTS.GOOGLE_PHOTOS_IMPORT_STREAM,
      { items, options },
      (event) => {
        if (event.type === 'photo') {
          // Update progress in Redux state
          dispatch(updateImportProgress({
            imported: event.imported,
            failed: event.failed,
            total: event.total,
          }));

          // Add result to our collection
          results.push({
            googlePhotoId: event.googlePhotoId,
            success: event.success,
            photoId: event.photoId,
            error: event.error,
          });

          // If photo was imported successfully and we have the full photo data, add it immediately
          if (event.success && event.photo) {
            dispatch(addPhoto(event.photo as Photo));
          }

          imported = event.imported;
          failed = event.failed;
        } else if (event.type === 'complete') {
          // All done
          resolve({
            results,
            imported: event.imported,
            failed: event.failed,
          });
        } else if (event.type === 'error') {
          reject(new Error(event.error));
        }
      },
      (error) => {
        reject(error);
      },
      () => {
        // If stream ends without complete event, resolve with what we have
        if (results.length > 0) {
          resolve({ results, imported, failed });
        }
      }
    ).catch(reject);
  }).catch((error) => {
    return rejectWithValue(error instanceof Error ? error.message : 'Import failed');
  }) as Promise<ImportPhotosResponse>;
});

const googlePhotosSlice = createSlice({
  name: 'googlePhotos',
  initialState,
  reducers: {
    openDialog: (state) => {
      state.isDialogOpen = true;
    },
    closeDialog: (state) => {
      state.isDialogOpen = false;
      // Reset selection when closing
      state.selectedPhotoIds = [];
    },
    selectAlbum: (state, action: PayloadAction<string | null>) => {
      state.selectedAlbumId = action.payload;
      // Reset photos when changing album
      state.photos = [];
      state.photosNextPageToken = null;
      state.photosStatus = 'idle';
      state.photosError = null;
    },
    togglePhotoSelection: (state, action: PayloadAction<string>) => {
      const photoId = action.payload;
      if (state.selectedPhotoIds.includes(photoId)) {
        state.selectedPhotoIds = state.selectedPhotoIds.filter((id) => id !== photoId);
      } else {
        state.selectedPhotoIds.push(photoId);
      }
    },
    selectAllPhotos: (state) => {
      state.selectedPhotoIds = state.photos.map((p) => p.id);
    },
    clearPhotoSelection: (state) => {
      state.selectedPhotoIds = [];
    },
    resetImportState: (state) => {
      state.importStatus = 'idle';
      state.importError = null;
      state.importProgress = null;
    },
    updateImportProgress: (state, action: PayloadAction<{ imported: number; failed: number; total: number }>) => {
      state.importProgress = action.payload;
    },
    resetPickerState: (state) => {
      state.pickerStatus = 'idle';
      state.pickerSessionId = null;
      state.pickerError = null;
    },
    setConnectedFromCallback: (state) => {
      // Called when OAuth callback succeeds
      state.isConnected = true;
      state.connectionStatus = 'succeeded';
    },
  },
  extraReducers: (builder) => {
    builder
      // Check status
      .addCase(checkGooglePhotosStatus.pending, (state) => {
        state.connectionStatus = 'loading';
      })
      .addCase(checkGooglePhotosStatus.fulfilled, (state, action) => {
        state.connectionStatus = 'succeeded';
        state.isConnected = action.payload.connected;
        state.connectedEmail = action.payload.email ?? null;
        state.connectedAt = action.payload.connectedAt ?? null;
      })
      .addCase(checkGooglePhotosStatus.rejected, (state, action) => {
        state.connectionStatus = 'failed';
        state.connectionError = action.error.message ?? 'Failed to check status';
      })

      // Start auth - just opens the OAuth URL
      .addCase(startGooglePhotosAuth.fulfilled, (_, action) => {
        // Redirect to Google OAuth
        window.location.href = action.payload;
      })
      .addCase(startGooglePhotosAuth.rejected, (state, action) => {
        state.connectionError = action.error.message ?? 'Failed to start authentication';
      })

      // Disconnect
      .addCase(disconnectGooglePhotos.fulfilled, (state) => {
        state.isConnected = false;
        state.connectedEmail = null;
        state.connectedAt = null;
        state.albums = [];
        state.photos = [];
        state.selectedPhotoIds = [];
      })

      // Fetch albums
      .addCase(fetchGooglePhotosAlbums.pending, (state) => {
        state.albumsStatus = 'loading';
      })
      .addCase(fetchGooglePhotosAlbums.fulfilled, (state, action) => {
        state.albumsStatus = 'succeeded';
        // If no pageToken was used, replace albums; otherwise append
        if (!action.meta.arg?.pageToken) {
          state.albums = action.payload.albums;
        } else {
          state.albums = [...state.albums, ...action.payload.albums];
        }
        state.albumsNextPageToken = action.payload.nextPageToken;
      })
      .addCase(fetchGooglePhotosAlbums.rejected, (state, action) => {
        state.albumsStatus = 'failed';
        state.albumsError = action.error.message ?? 'Failed to fetch albums';
      })

      // Fetch photos
      .addCase(fetchGooglePhotosPhotos.pending, (state) => {
        state.photosStatus = 'loading';
      })
      .addCase(fetchGooglePhotosPhotos.fulfilled, (state, action) => {
        state.photosStatus = 'succeeded';
        // If no pageToken was used, replace photos; otherwise append
        if (!action.meta.arg?.pageToken) {
          state.photos = action.payload.photos;
        } else {
          state.photos = [...state.photos, ...action.payload.photos];
        }
        state.photosNextPageToken = action.payload.nextPageToken;
      })
      .addCase(fetchGooglePhotosPhotos.rejected, (state, action) => {
        state.photosStatus = 'failed';
        state.photosError = action.error.message ?? 'Failed to fetch photos';
      })

      // Import photos
      .addCase(importGooglePhotos.pending, (state, action) => {
        state.importStatus = 'importing';
        state.importError = null;
        state.importProgress = {
          imported: 0,
          failed: 0,
          total: action.meta.arg.items.length,
        };
      })
      .addCase(importGooglePhotos.fulfilled, (state, action) => {
        state.importStatus = 'succeeded';
        state.importProgress = {
          imported: action.payload.imported,
          failed: action.payload.failed,
          total: action.payload.imported + action.payload.failed,
        };
        // Clear selection after successful import
        state.selectedPhotoIds = [];
      })
      .addCase(importGooglePhotos.rejected, (state, action) => {
        state.importStatus = 'failed';
        state.importError = (action.payload as string) ?? 'Import failed';
      })

      // Start Picker
      .addCase(startGooglePhotosPicker.pending, (state) => {
        state.pickerStatus = 'creating';
        state.pickerError = null;
      })
      .addCase(startGooglePhotosPicker.fulfilled, (state, action) => {
        state.pickerStatus = 'polling';
        state.pickerSessionId = action.payload.sessionId;
        // Open the picker URI in a new window
        window.open(action.payload.pickerUri + '/autoclose', '_blank', 'width=800,height=600');
      })
      .addCase(startGooglePhotosPicker.rejected, (state, action) => {
        state.pickerStatus = 'failed';
        state.pickerError = action.error.message ?? 'Failed to start picker';
      })

      // Check Picker Status
      .addCase(checkGooglePhotosPickerStatus.fulfilled, (state, action) => {
        if (action.payload.ready && action.payload.items) {
          state.pickerStatus = 'succeeded';
          state.photos = action.payload.items;
          state.photosStatus = 'succeeded';
          state.selectedAlbumId = 'picker'; // Mark as picker results
          // We'll handle the auto-import in a middleware or a separate action
          // because we shouldn't dispatch from an extraReducer.
          // Wait, I can actually just dispatch it from the thunk itself!
        }
      })
      .addCase(checkGooglePhotosPickerStatus.rejected, (state, action) => {
        state.pickerStatus = 'failed';
        state.pickerError = action.error.message ?? 'Failed to check picker status';
      })

      // Clear state on sign out
      .addCase(signOut.fulfilled, () => {
        return initialState;
      });
  },
});


export const {
  openDialog,
  closeDialog,
  selectAlbum,
  togglePhotoSelection,
  selectAllPhotos,
  clearPhotoSelection,
  resetImportState,
  updateImportProgress,
  resetPickerState,
  setConnectedFromCallback,
} = googlePhotosSlice.actions;


// Selectors
export const selectGooglePhotosIsConnected = (state: RootState) => state.googlePhotos.isConnected;
export const selectGooglePhotosConnectionStatus = (state: RootState) =>
  state.googlePhotos.connectionStatus;
export const selectGooglePhotosConnectedEmail = (state: RootState) =>
  state.googlePhotos.connectedEmail;
export const selectGooglePhotosAlbums = (state: RootState) => state.googlePhotos.albums;
export const selectGooglePhotosAlbumsStatus = (state: RootState) => state.googlePhotos.albumsStatus;
export const selectGooglePhotosPhotos = (state: RootState) => state.googlePhotos.photos;
export const selectGooglePhotosPhotosStatus = (state: RootState) => state.googlePhotos.photosStatus;
export const selectGooglePhotosSelectedAlbumId = (state: RootState) =>
  state.googlePhotos.selectedAlbumId;
export const selectGooglePhotosSelectedPhotoIds = (state: RootState) =>
  state.googlePhotos.selectedPhotoIds;
export const selectGooglePhotosImportStatus = (state: RootState) => state.googlePhotos.importStatus;
export const selectGooglePhotosImportProgress = (state: RootState) =>
  state.googlePhotos.importProgress;
export const selectGooglePhotosImportError = (state: RootState) => state.googlePhotos.importError;
export const selectGooglePhotosIsDialogOpen = (state: RootState) => state.googlePhotos.isDialogOpen;
export const selectGooglePhotosHasMoreAlbums = (state: RootState) =>
  state.googlePhotos.albumsNextPageToken !== null;
export const selectGooglePhotosHasMorePhotos = (state: RootState) =>
  state.googlePhotos.photosNextPageToken !== null;

export const selectGooglePhotosPickerStatus = (state: RootState) => state.googlePhotos.pickerStatus;
export const selectGooglePhotosPickerSessionId = (state: RootState) =>
  state.googlePhotos.pickerSessionId;


export default googlePhotosSlice.reducer;
