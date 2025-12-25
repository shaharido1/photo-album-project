import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import greetingReducer from './features/greeting/greetingSlice';
import fooReducer from './features/foo/fooSlice';
import versionReducer from './features/version/versionSlice';
import photosReducer from './features/photos/photosSlice';
import albumReducer from './features/album/albumSlice';
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
    },
    preloadedState,
  });
};

describe('App', () => {
  it('renders the editor layout', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: { items: [], selectedIds: [], status: 'idle', error: null },
      album: {
        album: {
          id: null,
          name: 'Untitled Album',
          size: '10x10',
          pages: [],
          currentPageIndex: 0,
        },
        selectedSlot: null,
        status: 'idle',
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    // Check that the main layout elements are rendered
    expect(screen.getByText('Photo Album')).toBeInTheDocument();
    expect(screen.getByText('Photo Library')).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
  });

  it('renders the New Album button', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: { items: [], selectedIds: [], status: 'idle', error: null },
      album: {
        album: {
          id: null,
          name: 'Untitled Album',
          size: '10x10',
          pages: [],
          currentPageIndex: 0,
        },
        selectedSlot: null,
        status: 'idle',
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByRole('button', { name: /new album/i })).toBeInTheDocument();
  });

  it('shows empty state message when no album is created', () => {
    const store = createTestStore({
      greeting: { message: '', status: 'idle', error: null },
      foo: { value: '', status: 'idle', error: null },
      version: { value: '1.0.0', status: 'succeeded', error: null },
      photos: { items: [], selectedIds: [], status: 'idle', error: null },
      album: {
        album: {
          id: null,
          name: 'Untitled Album',
          size: '10x10',
          pages: [],
          currentPageIndex: 0,
        },
        selectedSlot: null,
        status: 'idle',
        error: null,
      },
    });

    render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(screen.getByText('Create an album to start')).toBeInTheDocument();
  });
});
