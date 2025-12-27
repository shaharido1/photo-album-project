/// <reference types="jest" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { PhotoLibraryPanel } from './PhotoLibraryPanel';
import photosReducer, {
  fetchPhotos,
  togglePhotoSelection,
  clearSelection,
  deleteSelectedPhotos,
} from '@/features/photos/photosSlice';
import albumReducer from '@/features/album/albumSlice';
import authReducer from '@/features/auth/authSlice';
import googlePhotosReducer from '@/features/googlePhotos/googlePhotosSlice';
import type { Photo } from '@/types';

// Mock the API client
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

describe('PhotoLibraryPanel', () => {
  const mockPhotos: Photo[] = [
    {
      id: 'photo-1',
      name: 'Photo 1',
      thumbnail: 'http://example.com/thumb1.jpg',
      fullSize: 'http://example.com/full1.jpg',
      width: 800,
      height: 600,
      createdAt: '2024-01-01T00:00:00Z',
      isUploaded: true,
    },
    {
      id: 'photo-2',
      name: 'Photo 2',
      thumbnail: 'http://example.com/thumb2.jpg',
      fullSize: 'http://example.com/full2.jpg',
      width: 1200,
      height: 800,
      createdAt: '2024-01-02T00:00:00Z',
      isUploaded: true,
    },
  ];

  const createTestStore = (preloadedState = {}) =>
    configureStore({
      reducer: {
        photos: photosReducer,
        album: albumReducer,
        auth: authReducer,
        googlePhotos: googlePhotosReducer,
      },
      preloadedState: {
        photos: {
          items: [],
          selectedIds: [],
          status: 'idle',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
        album: {
          album: {
            id: null,
            name: 'Untitled Album',
            size: '10x10',
            pages: [],
            currentPageIndex: 0,
          },
          albums: [],
          albumsStatus: 'idle',
          selectedSlot: null,
          viewMode: 'book',
          currentSpread: 0,
          status: 'idle',
          error: null,
        },
        auth: {
          user: null,
          token: null,
          status: 'idle',
          error: null,
          isInitialized: true,
        },
        googlePhotos: {
          albums: [],
          albumsStatus: 'idle',
          albumsNextPageToken: null,
          selectedAlbum: null,
          photos: [],
          photosStatus: 'idle',
          photosNextPageToken: null,
          importProgress: null,
          error: null,
          isDialogOpen: false,
        },
        ...preloadedState,
      },
    });

  const renderPanel = (storeOverrides = {}) => {
    const store = createTestStore(storeOverrides);
    return {
      ...render(
        <Provider store={store}>
          <PhotoLibraryPanel />
        </Provider>
      ),
      store,
    };
  };

  describe('basic rendering', () => {
    it('should render Photo Library heading', () => {
      renderPanel();
      expect(screen.getByText('Photo Library')).toBeInTheDocument();
    });

    it('should render Upload button', () => {
      renderPanel();
      expect(
        screen.getByRole('button', { name: /upload/i })
      ).toBeInTheDocument();
    });

    it('should render Google button', () => {
      renderPanel();
      expect(
        screen.getByRole('button', { name: /google/i })
      ).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show skeleton loaders when loading', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'loading',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      // Skeleton elements should be present
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'failed',
          error: 'Network error',
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(screen.getByText('Failed to load photos')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /try again/i })
      ).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no photos', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(screen.getByText('No photos yet')).toBeInTheDocument();
      expect(
        screen.getByText('Upload photos or connect Google Photos')
      ).toBeInTheDocument();
    });
  });

  describe('with photos', () => {
    it('should render photo thumbnails', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2);
      expect(images[0]).toHaveAttribute('src', 'http://example.com/thumb1.jpg');
      expect(images[1]).toHaveAttribute('src', 'http://example.com/thumb2.jpg');
    });

    it('should toggle photo selection on click', async () => {
      const { store } = renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      const images = screen.getAllByRole('img');
      fireEvent.click(images[0].parentElement!);

      // Check store was updated
      expect(store.getState().photos.selectedIds).toContain('photo-1');
    });
  });

  describe('selection', () => {
    it('should show selection count when photos are selected', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: ['photo-1', 'photo-2'],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(screen.getByText('2 photos selected')).toBeInTheDocument();
    });

    it('should show singular form for one photo selected', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: ['photo-1'],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(screen.getByText('1 photo selected')).toBeInTheDocument();
    });

    it('should show Clear and Delete buttons when photos are selected', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: ['photo-1'],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(
        screen.getByRole('button', { name: /clear/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete/i })
      ).toBeInTheDocument();
    });

    it('should clear selection when Clear button is clicked', async () => {
      const user = userEvent.setup();
      const { store } = renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: ['photo-1', 'photo-2'],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(store.getState().photos.selectedIds).toHaveLength(0);
    });
  });

  describe('upload', () => {
    it('should show upload progress when uploading', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'uploading',
          uploadProgress: { current: 2, total: 5, progress: 40 },
          uploadError: null,
        },
      });

      expect(screen.getByText('Uploading 2/5...')).toBeInTheDocument();
    });

    it('should disable upload button when uploading', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'uploading',
          uploadProgress: { current: 1, total: 2, progress: 50 },
          uploadError: null,
        },
      });

      const uploadButton = screen.getByRole('button', { name: /adding/i });
      expect(uploadButton).toBeDisabled();
    });

    it('should show success message after upload', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'succeeded',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(
        screen.getByText('Photos uploaded successfully!')
      ).toBeInTheDocument();
    });

    it('should show upload error message', () => {
      renderPanel({
        photos: {
          items: [],
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'failed',
          uploadProgress: null,
          uploadError: 'Upload failed: Network error',
        },
      });

      expect(
        screen.getByText('Upload failed: Network error')
      ).toBeInTheDocument();
    });
  });

  describe('with album loaded', () => {
    it('should show drag hint when album is loaded', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
        album: {
          album: {
            id: 'album-1',
            name: 'My Album',
            size: '10x10',
            pages: [
              {
                id: 'page-1',
                layoutId: 'single',
                background: '#ffffff',
                slots: [
                  {
                    id: 'slot-1',
                    photoId: null,
                    position: { x: 0, y: 0 },
                    scale: 1,
                    rotation: 0,
                  },
                ],
              },
            ],
            currentPageIndex: 0,
          },
          selectedSlot: null,
          viewMode: 'book',
          currentSpread: 0,
          status: 'idle',
          error: null,
        },
      });

      expect(
        screen.getByText('Drag photos to canvas or double-click to add')
      ).toBeInTheDocument();
    });

    it('should not show drag hint when no album is loaded', () => {
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: [],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      expect(
        screen.queryByText('Drag photos to canvas or double-click to add')
      ).not.toBeInTheDocument();
    });
  });

  describe('drag and drop files', () => {
    it('should show drop overlay when dragging files over', () => {
      renderPanel();

      const panel = screen.getByTestId('photo-library-panel');

      fireEvent.dragOver(panel, {
        dataTransfer: {
          types: ['Files'],
        },
      });

      expect(screen.getByText('Drop photos here')).toBeInTheDocument();
    });

    it('should hide drop overlay when drag leaves', () => {
      renderPanel();

      const panel = screen.getByTestId('photo-library-panel');

      fireEvent.dragOver(panel, {
        dataTransfer: {
          types: ['Files'],
        },
      });

      expect(screen.getByText('Drop photos here')).toBeInTheDocument();

      fireEvent.dragLeave(panel);

      expect(screen.queryByText('Drop photos here')).not.toBeInTheDocument();
    });
  });

  describe('delete confirmation', () => {
    it('should show delete confirmation dialog', async () => {
      const user = userEvent.setup();
      renderPanel({
        photos: {
          items: mockPhotos,
          selectedIds: ['photo-1'],
          status: 'succeeded',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
      });

      const deleteButton = screen.getByRole('button', { name: /delete/i });
      await user.click(deleteButton);

      expect(screen.getByText('Delete photos?')).toBeInTheDocument();
      expect(
        screen.getByText(/This will permanently delete 1 photo/)
      ).toBeInTheDocument();
    });
  });
});
