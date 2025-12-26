/// <reference types="jest" />
import photosReducer, {
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
  fetchPhotos,
  uploadPhotos,
  deletePhotoFromServer,
  selectAllPhotos,
  selectPhotosStatus,
  selectPhotosError,
  selectSelectedPhotoIds,
  selectSelectedPhotos,
  selectUploadStatus,
  selectUploadProgress,
  selectUploadError,
} from './photosSlice';
import type { PhotosState, Photo, UploadProgress } from '@/types';

// Mock the apiClient
jest.mock('@/services/apiClient', () => ({
  api: {
    get: jest.fn(),
    delete: jest.fn(),
  },
  uploadFiles: jest.fn(),
  API_ENDPOINTS: {
    PHOTOS: '/api/photos',
  },
}));

describe('photosSlice', () => {
  const initialState: PhotosState = {
    items: [],
    selectedIds: [],
    status: 'idle',
    error: null,
    uploadStatus: 'idle',
    uploadProgress: null,
    uploadError: null,
  };

  const mockPhoto: Photo = {
    id: 'photo-1',
    name: 'Test Photo',
    thumbnail: 'blob:http://localhost/test-thumb',
    fullSize: 'blob:http://localhost/test-full',
    width: 800,
    height: 600,
    createdAt: '2024-12-25T10:00:00Z',
    isUploaded: true,
  };

  const mockPhoto2: Photo = {
    id: 'photo-2',
    name: 'Test Photo 2',
    thumbnail: 'blob:http://localhost/test-thumb-2',
    fullSize: 'blob:http://localhost/test-full-2',
    width: 1200,
    height: 800,
    createdAt: '2024-12-25T11:00:00Z',
    isUploaded: true,
  };

  describe('addPhotos', () => {
    it('should add photos to the beginning of the items array', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto],
      };

      const newState = photosReducer(stateWithPhotos, addPhotos([mockPhoto2]));

      expect(newState.items).toHaveLength(2);
      expect(newState.items[0].id).toBe('photo-2'); // New photo at beginning
      expect(newState.items[1].id).toBe('photo-1'); // Existing photo after
    });

    it('should add multiple photos at once', () => {
      const newState = photosReducer(
        initialState,
        addPhotos([mockPhoto, mockPhoto2])
      );

      expect(newState.items).toHaveLength(2);
    });

    it('should add photos to empty state', () => {
      const newState = photosReducer(initialState, addPhotos([mockPhoto]));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0]).toEqual(mockPhoto);
    });
  });

  describe('deletePhoto', () => {
    it('should remove a photo from items', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
      };

      const newState = photosReducer(stateWithPhotos, deletePhoto('photo-1'));

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].id).toBe('photo-2');
    });

    it('should also remove the photo from selectedIds', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
        selectedIds: ['photo-1', 'photo-2'],
      };

      const newState = photosReducer(
        stateWithSelection,
        deletePhoto('photo-1')
      );

      expect(newState.selectedIds).toEqual(['photo-2']);
    });

    it('should handle deleting a non-existent photo gracefully', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto],
      };

      const newState = photosReducer(
        stateWithPhotos,
        deletePhoto('non-existent')
      );

      expect(newState.items).toHaveLength(1);
    });
  });

  describe('deleteSelectedPhotos', () => {
    const mockPhoto3: Photo = {
      id: 'photo-3',
      name: 'Test Photo 3',
      thumbnail: 'blob:http://localhost/test-thumb-3',
      fullSize: 'blob:http://localhost/test-full-3',
      width: 1000,
      height: 750,
      createdAt: '2024-12-25T12:00:00Z',
      isUploaded: true,
    };

    it('should delete all selected photos', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2, mockPhoto3],
        selectedIds: ['photo-1', 'photo-3'],
      };

      const newState = photosReducer(
        stateWithSelection,
        deleteSelectedPhotos()
      );

      expect(newState.items).toHaveLength(1);
      expect(newState.items[0].id).toBe('photo-2');
    });

    it('should clear selectedIds after deletion', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
        selectedIds: ['photo-1'],
      };

      const newState = photosReducer(
        stateWithSelection,
        deleteSelectedPhotos()
      );

      expect(newState.selectedIds).toEqual([]);
    });

    it('should handle empty selection gracefully', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
        selectedIds: [],
      };

      const newState = photosReducer(stateWithPhotos, deleteSelectedPhotos());

      expect(newState.items).toHaveLength(2);
      expect(newState.selectedIds).toEqual([]);
    });

    it('should delete all photos when all are selected', () => {
      const stateWithAllSelected: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
        selectedIds: ['photo-1', 'photo-2'],
      };

      const newState = photosReducer(
        stateWithAllSelected,
        deleteSelectedPhotos()
      );

      expect(newState.items).toHaveLength(0);
      expect(newState.selectedIds).toEqual([]);
    });
  });

  describe('selectPhoto', () => {
    it('should add a photo to selectedIds', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto],
      };

      const newState = photosReducer(stateWithPhotos, selectPhoto('photo-1'));

      expect(newState.selectedIds).toContain('photo-1');
    });

    it('should not add duplicate selection', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto],
        selectedIds: ['photo-1'],
      };

      const newState = photosReducer(
        stateWithSelection,
        selectPhoto('photo-1')
      );

      expect(newState.selectedIds).toEqual(['photo-1']);
    });
  });

  describe('deselectPhoto', () => {
    it('should remove a photo from selectedIds', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto],
        selectedIds: ['photo-1'],
      };

      const newState = photosReducer(
        stateWithSelection,
        deselectPhoto('photo-1')
      );

      expect(newState.selectedIds).not.toContain('photo-1');
    });
  });

  describe('togglePhotoSelection', () => {
    it('should select an unselected photo', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto],
      };

      const newState = photosReducer(
        stateWithPhotos,
        togglePhotoSelection('photo-1')
      );

      expect(newState.selectedIds).toContain('photo-1');
    });

    it('should deselect a selected photo', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto],
        selectedIds: ['photo-1'],
      };

      const newState = photosReducer(
        stateWithSelection,
        togglePhotoSelection('photo-1')
      );

      expect(newState.selectedIds).not.toContain('photo-1');
    });
  });

  describe('clearSelection', () => {
    it('should clear all selected photos', () => {
      const stateWithSelection: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
        selectedIds: ['photo-1', 'photo-2'],
      };

      const newState = photosReducer(stateWithSelection, clearSelection());

      expect(newState.selectedIds).toEqual([]);
    });
  });

  describe('selectAll', () => {
    it('should select all photos', () => {
      const stateWithPhotos: PhotosState = {
        ...initialState,
        items: [mockPhoto, mockPhoto2],
      };

      const newState = photosReducer(stateWithPhotos, selectAll());

      expect(newState.selectedIds).toEqual(['photo-1', 'photo-2']);
    });
  });

  describe('setUploadProgress', () => {
    it('should set upload progress', () => {
      const progress: UploadProgress = {
        current: 2,
        total: 5,
        progress: 40,
      };

      const newState = photosReducer(initialState, setUploadProgress(progress));

      expect(newState.uploadProgress).toEqual(progress);
    });
  });

  describe('resetUploadState', () => {
    it('should reset upload state', () => {
      const stateWithUpload: PhotosState = {
        ...initialState,
        uploadStatus: 'uploading',
        uploadProgress: { current: 2, total: 5, progress: 40 },
        uploadError: 'Some error',
      };

      const newState = photosReducer(stateWithUpload, resetUploadState());

      expect(newState.uploadStatus).toBe('idle');
      expect(newState.uploadProgress).toBeNull();
      expect(newState.uploadError).toBeNull();
    });
  });

  describe('async thunk extra reducers', () => {
    describe('fetchPhotos', () => {
      it('should set loading state on pending', () => {
        const action = { type: fetchPhotos.pending.type };
        const newState = photosReducer(initialState, action);

        expect(newState.status).toBe('loading');
      });

      it('should set items on fulfilled', () => {
        const photos = [mockPhoto, mockPhoto2];
        const action = {
          type: fetchPhotos.fulfilled.type,
          payload: photos,
        };
        const newState = photosReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.items).toEqual(photos);
      });

      it('should set error on rejected', () => {
        const action = {
          type: fetchPhotos.rejected.type,
          error: { message: 'Failed to fetch' },
        };
        const newState = photosReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Failed to fetch');
      });

      it('should set default error message if none provided', () => {
        const action = {
          type: fetchPhotos.rejected.type,
          error: {},
        };
        const newState = photosReducer(initialState, action);

        expect(newState.error).toBe('Unknown error');
      });
    });

    describe('uploadPhotos', () => {
      it('should set uploading state on pending', () => {
        const action = { type: uploadPhotos.pending.type };
        const newState = photosReducer(initialState, action);

        expect(newState.uploadStatus).toBe('uploading');
        expect(newState.uploadError).toBeNull();
        expect(newState.uploadProgress).toEqual({
          current: 0,
          total: 0,
          progress: 0,
        });
      });

      it('should add photos and reset progress on fulfilled', () => {
        const uploadedPhotos = [mockPhoto, mockPhoto2];
        const stateUploading: PhotosState = {
          ...initialState,
          uploadStatus: 'uploading',
          uploadProgress: { current: 2, total: 2, progress: 100 },
        };

        const action = {
          type: uploadPhotos.fulfilled.type,
          payload: { photos: uploadedPhotos },
        };
        const newState = photosReducer(stateUploading, action);

        expect(newState.uploadStatus).toBe('succeeded');
        expect(newState.uploadProgress).toBeNull();
        expect(newState.items).toHaveLength(2);
        expect(newState.items[0].id).toBe('photo-1');
      });

      it('should set error on rejected', () => {
        const action = {
          type: uploadPhotos.rejected.type,
          payload: 'Upload failed',
        };
        const newState = photosReducer(initialState, action);

        expect(newState.uploadStatus).toBe('failed');
        expect(newState.uploadError).toBe('Upload failed');
        expect(newState.uploadProgress).toBeNull();
      });
    });

    describe('deletePhotoFromServer', () => {
      it('should remove photo from items on fulfilled', () => {
        const stateWithPhotos: PhotosState = {
          ...initialState,
          items: [mockPhoto, mockPhoto2],
          selectedIds: ['photo-1'],
        };

        const action = {
          type: deletePhotoFromServer.fulfilled.type,
          payload: 'photo-1',
        };
        const newState = photosReducer(stateWithPhotos, action);

        expect(newState.items).toHaveLength(1);
        expect(newState.items[0].id).toBe('photo-2');
        expect(newState.selectedIds).not.toContain('photo-1');
      });
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      photos: {
        items: [mockPhoto, mockPhoto2],
        selectedIds: ['photo-1'],
        status: 'succeeded' as const,
        error: null,
        uploadStatus: 'idle' as const,
        uploadProgress: null,
        uploadError: null,
      },
    };

    it('selectAllPhotos should return all photos', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAllPhotos(mockRootState)).toEqual([mockPhoto, mockPhoto2]);
    });

    it('selectPhotosStatus should return status', () => {
      // @ts-expect-error - partial state for testing
      expect(selectPhotosStatus(mockRootState)).toBe('succeeded');
    });

    it('selectPhotosError should return error', () => {
      // @ts-expect-error - partial state for testing
      expect(selectPhotosError(mockRootState)).toBeNull();

      const stateWithError = {
        photos: { ...mockRootState.photos, error: 'Test error' },
      };
      // @ts-expect-error - partial state for testing
      expect(selectPhotosError(stateWithError)).toBe('Test error');
    });

    it('selectSelectedPhotoIds should return selected ids', () => {
      // @ts-expect-error - partial state for testing
      expect(selectSelectedPhotoIds(mockRootState)).toEqual(['photo-1']);
    });

    it('selectSelectedPhotos should return selected photos', () => {
      // @ts-expect-error - partial state for testing
      const selectedPhotos = selectSelectedPhotos(mockRootState);
      expect(selectedPhotos).toHaveLength(1);
      expect(selectedPhotos[0].id).toBe('photo-1');
    });

    it('selectUploadStatus should return upload status', () => {
      // @ts-expect-error - partial state for testing
      expect(selectUploadStatus(mockRootState)).toBe('idle');
    });

    it('selectUploadProgress should return upload progress', () => {
      // @ts-expect-error - partial state for testing
      expect(selectUploadProgress(mockRootState)).toBeNull();

      const stateWithProgress = {
        photos: {
          ...mockRootState.photos,
          uploadProgress: { current: 1, total: 3, progress: 33 },
        },
      };
      // @ts-expect-error - partial state for testing
      expect(selectUploadProgress(stateWithProgress)).toEqual({
        current: 1,
        total: 3,
        progress: 33,
      });
    });

    it('selectUploadError should return upload error', () => {
      // @ts-expect-error - partial state for testing
      expect(selectUploadError(mockRootState)).toBeNull();

      const stateWithError = {
        photos: { ...mockRootState.photos, uploadError: 'Upload failed' },
      };
      // @ts-expect-error - partial state for testing
      expect(selectUploadError(stateWithError)).toBe('Upload failed');
    });
  });
});
