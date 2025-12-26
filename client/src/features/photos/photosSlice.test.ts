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
});
