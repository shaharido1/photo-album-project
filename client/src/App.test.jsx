import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from './features/greeting/greetingSlice';
import fooReducer from './features/foo/fooSlice';
import versionReducer from './features/version/versionSlice';
import photosReducer from './features/photos/photosSlice';
import albumReducer from './features/album/albumSlice';
import authReducer from './features/auth/authSlice';
import googlePhotosReducer from './features/googlePhotos/googlePhotosSlice';
import App from './App';

// Mock canvas for Konva
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: [] })),
  putImageData: jest.fn(),
  createImageData: jest.fn(() => []),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

const createTestStore = (preloadedState) => {
  return configureStore({
    reducer: {
      greeting: greetingReducer,
      foo: fooReducer,
      version: versionReducer,
      photos: photosReducer,
      album: albumReducer,
      auth: authReducer,
      googlePhotos: googlePhotosReducer,
    },
    preloadedState,
  });
};

const defaultAuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  isInitialized: true,
};

const defaultPhotosState = {
  items: [],
  selectedIds: [],
  status: 'idle',
  error: null,
  uploadStatus: 'idle',
  uploadProgress: null,
  uploadError: null,
};

const defaultGooglePhotosState = {
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
};

describe('App', () => {
  it('renders the editor layout', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: defaultPhotosState,
      album: {
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
      },
      auth: defaultAuthState,
      googlePhotos: defaultGooglePhotosState,
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Check that the main layout elements are rendered
    expect(screen.getByText('Photo Album')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /new album/i })
    ).toBeInTheDocument();
  });

  it('renders the New Album button', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: defaultPhotosState,
      album: {
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
      },
      auth: defaultAuthState,
      googlePhotos: defaultGooglePhotosState,
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(
      screen.getByRole('button', { name: /new album/i })
    ).toBeInTheDocument();
  });

  it('shows landing page when no album is created', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: defaultPhotosState,
      album: {
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
      },
      auth: defaultAuthState,
      googlePhotos: defaultGooglePhotosState,
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText(/keeping forever/i)).toBeInTheDocument();
  });
});
