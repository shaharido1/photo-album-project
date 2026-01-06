import { renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ReactNode } from 'react';
import { useUrlSync } from './useUrlSync';
import albumReducer from '@/features/album/albumSlice';
import authReducer from '@/features/auth/authSlice';

// Mock the useLastVisited hook
const mockSetLastVisited = jest.fn();
jest.mock('./useLastVisited', () => ({
  useLastVisited: () => ({
    setLastVisited: mockSetLastVisited,
    getLastVisited: jest.fn(),
    clearLastVisited: jest.fn(),
  }),
}));

// Mock the API client
jest.mock('@/services/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  API_ENDPOINTS: {
    ALBUMS: '/api/albums',
  },
}));

describe('useUrlSync', () => {
  const createTestStore = (initialState = {}) => {
    return configureStore({
      reducer: {
        album: albumReducer,
        auth: authReducer,
      },
      preloadedState: {
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
          selectedFreestyleItem: null,
          viewMode: 'edit',
          currentSpread: 0,
          status: 'idle',
          error: null,
          ...initialState,
        },
        auth: {
          user: null,
          isAuthenticated: false,
          status: 'idle',
          error: null,
        },
      },
    });
  };

  const createWrapper = (store: ReturnType<typeof createTestStore>, initialRoute = '/') => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return (
        <Provider store={store}>
          <MemoryRouter initialEntries={[initialRoute]}>
            <Routes>
              <Route path="/album/:albumId/page/:pageIndex" element={children} />
              <Route path="/album/:albumId" element={children} />
              <Route path="/" element={children} />
            </Routes>
          </MemoryRouter>
        </Provider>
      );
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('URL to Redux sync', () => {
    it('should not fetch album when not authenticated', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store, '/album/test-album-123');

      renderHook(() => useUrlSync(), { wrapper });

      // Should not have dispatched fetchAlbum
      const state = store.getState();
      expect(state.album.album.id).toBeNull();
    });

    it('should not update anything when URL and Redux already match', async () => {
      // When URL matches Redux state, no actions should be dispatched
      const store = configureStore({
        reducer: {
          album: albumReducer,
          auth: authReducer,
        },
        preloadedState: {
          album: {
            album: {
              id: 'album-123',
              name: 'Test Album',
              size: '10x10',
              pages: [{ id: 'page-1', layoutId: 'single', background: '#fff', slots: [] }],
              currentPageIndex: 0,
            },
            albums: [],
            albumsStatus: 'idle',
            selectedSlot: null,
            selectedFreestyleItem: null,
            viewMode: 'edit',
            currentSpread: 0,
            status: 'succeeded',
            error: null,
          },
          auth: {
            user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test' },
            isAuthenticated: true,
            status: 'idle',
            error: null,
          },
        },
      });

      const wrapper = createWrapper(store, '/album/album-123');

      renderHook(() => useUrlSync(), { wrapper });

      // Wait a tick to ensure no async actions
      await new Promise((r) => setTimeout(r, 100));

      // No setLastVisited should be called since URL matches Redux
      expect(mockSetLastVisited).not.toHaveBeenCalled();
    });

    it('should update page when URL page differs from Redux page', async () => {
      // When URL has different page than Redux, should dispatch setCurrentPage
      const store = configureStore({
        reducer: {
          album: albumReducer,
          auth: authReducer,
        },
        preloadedState: {
          album: {
            album: {
              id: 'album-456',
              name: 'Test Album',
              size: '10x10',
              pages: [
                { id: 'page-1', layoutId: 'single', background: '#fff', slots: [] },
                { id: 'page-2', layoutId: 'single', background: '#fff', slots: [] },
                { id: 'page-3', layoutId: 'single', background: '#fff', slots: [] },
              ],
              currentPageIndex: 0, // Redux has page 0
            },
            albums: [],
            albumsStatus: 'idle',
            selectedSlot: null,
            selectedFreestyleItem: null,
            viewMode: 'edit',
            currentSpread: 0,
            status: 'succeeded',
            error: null,
          },
          auth: {
            user: { uid: 'user-1', email: 'test@test.com', displayName: 'Test' },
            isAuthenticated: true,
            status: 'idle',
            error: null,
          },
        },
      });

      const wrapper = createWrapper(store, '/album/album-456/page/2'); // URL has page 2

      renderHook(() => useUrlSync(), { wrapper });

      await waitFor(() => {
        // Should save to localStorage with the new page index
        expect(mockSetLastVisited).toHaveBeenCalledWith('album-456', 2);
      });

      // Redux should be updated to page 2
      const state = store.getState();
      expect(state.album.album.currentPageIndex).toBe(2);
    });
  });

  describe('navigation integration', () => {
    it('hook should render without errors', () => {
      const store = createTestStore();
      const wrapper = createWrapper(store);

      expect(() => {
        renderHook(() => useUrlSync(), { wrapper });
      }).not.toThrow();
    });
  });
});
