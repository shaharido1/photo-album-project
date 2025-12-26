/// <reference types="jest" />
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from './Header';
import albumReducer from '@/features/album/albumSlice';
import photosReducer from '@/features/photos/photosSlice';
import authReducer from '@/features/auth/authSlice';

// Mock child components
jest.mock('@/components/album/CreateAlbumDialog', () => ({
  CreateAlbumDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="create-album-dialog">Create Album Dialog</div> : null,
}));

jest.mock('@/components/feedback/FeedbackDialog', () => ({
  FeedbackDialog: ({ open }: { open: boolean }) =>
    open ? <div data-testid="feedback-dialog">Feedback Dialog</div> : null,
}));

jest.mock('@/components/auth/LoginButton', () => ({
  LoginButton: () => <button data-testid="login-button">Sign In</button>,
}));

jest.mock('@/components/auth/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

jest.mock('./ViewModeToggle', () => ({
  ViewModeToggle: () => <div data-testid="view-mode-toggle">View Toggle</div>,
}));

describe('Header', () => {
  const createTestStore = (preloadedState = {}) =>
    configureStore({
      reducer: {
        album: albumReducer,
        photos: photosReducer,
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
          selectedSlot: null,
          viewMode: 'book',
          currentSpread: 0,
          status: 'idle',
          error: null,
        },
        photos: {
          items: [],
          selectedIds: [],
          status: 'idle',
          error: null,
          uploadStatus: 'idle',
          uploadProgress: null,
          uploadError: null,
        },
        auth: {
          user: null,
          token: null,
          status: 'idle',
          error: null,
          isInitialized: true,
        },
        ...preloadedState,
      },
    });

  const renderHeader = (storeOverrides = {}) => {
    const store = createTestStore(storeOverrides);
    return {
      ...render(
        <Provider store={store}>
          <Header />
        </Provider>
      ),
      store,
    };
  };

  describe('basic rendering', () => {
    it('should render app title', () => {
      renderHeader();
      expect(screen.getByText('Photo Album')).toBeInTheDocument();
    });

    it('should render "No album" when no album is loaded', () => {
      renderHeader();
      expect(screen.getByText('No album')).toBeInTheDocument();
    });

    it('should render album name when album is loaded', () => {
      renderHeader({
        album: {
          album: {
            id: 'album-1',
            name: 'My Test Album',
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
      });

      expect(screen.getByText('My Test Album')).toBeInTheDocument();
      expect(screen.queryByText('No album')).not.toBeInTheDocument();
    });

    it('should render New Album button', () => {
      renderHeader();
      expect(
        screen.getByRole('button', { name: /new album/i })
      ).toBeInTheDocument();
    });

    it('should render ViewModeToggle', () => {
      renderHeader();
      expect(screen.getByTestId('view-mode-toggle')).toBeInTheDocument();
    });
  });

  describe('dark mode toggle', () => {
    beforeEach(() => {
      // Reset document class before each test
      document.documentElement.classList.remove('dark');
    });

    it('should render dark mode toggle button', () => {
      renderHeader();
      expect(
        screen.getByRole('button', { name: /switch to dark mode/i })
      ).toBeInTheDocument();
    });

    it('should toggle dark mode on click', async () => {
      const user = userEvent.setup();
      renderHeader();

      const toggleButton = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(toggleButton);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Button should now say "Switch to light mode"
      expect(
        screen.getByRole('button', { name: /switch to light mode/i })
      ).toBeInTheDocument();
    });

    it('should toggle back to light mode after toggling dark', async () => {
      const user = userEvent.setup();
      renderHeader();

      // First toggle to dark mode
      const toggleButton = screen.getByRole('button', {
        name: /switch to dark mode/i,
      });
      await user.click(toggleButton);

      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Now toggle back to light mode
      const lightModeButton = screen.getByRole('button', {
        name: /switch to light mode/i,
      });
      await user.click(lightModeButton);

      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('album actions', () => {
    it('should show Save and Export buttons when album is loaded', () => {
      renderHeader({
        album: {
          album: {
            id: 'album-1',
            name: 'My Album',
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
      });

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /export/i })
      ).toBeInTheDocument();
      expect(screen.getByText('Saved')).toBeInTheDocument();
    });

    it('should not show Save and Export buttons when no album is loaded', () => {
      renderHeader();

      expect(
        screen.queryByRole('button', { name: /save/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /export/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Create Album dialog', () => {
    it('should open create album dialog when New Album button is clicked', async () => {
      const user = userEvent.setup();
      renderHeader();

      expect(
        screen.queryByTestId('create-album-dialog')
      ).not.toBeInTheDocument();

      const newAlbumButton = screen.getByRole('button', { name: /new album/i });
      await user.click(newAlbumButton);

      expect(screen.getByTestId('create-album-dialog')).toBeInTheDocument();
    });
  });

  describe('authentication', () => {
    it('should show login button when not authenticated', () => {
      renderHeader();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });

    it('should show user menu when authenticated', () => {
      renderHeader({
        auth: {
          user: {
            uid: 'user-1',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null,
          },
          token: 'mock-token',
          status: 'succeeded',
          error: null,
          isInitialized: true,
        },
      });

      expect(screen.getByTestId('user-menu')).toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
    });

    it('should show feedback button when authenticated', () => {
      renderHeader({
        auth: {
          user: {
            uid: 'user-1',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null,
          },
          token: 'mock-token',
          status: 'succeeded',
          error: null,
          isInitialized: true,
        },
      });

      expect(
        screen.getByRole('button', { name: /send feedback/i })
      ).toBeInTheDocument();
    });

    it('should not show feedback button when not authenticated', () => {
      renderHeader();
      expect(
        screen.queryByRole('button', { name: /send feedback/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('Feedback dialog', () => {
    it('should open feedback dialog when feedback button is clicked', async () => {
      const user = userEvent.setup();
      renderHeader({
        auth: {
          user: {
            uid: 'user-1',
            email: 'test@example.com',
            displayName: 'Test User',
            photoURL: null,
          },
          token: 'mock-token',
          status: 'succeeded',
          error: null,
          isInitialized: true,
        },
      });

      expect(screen.queryByTestId('feedback-dialog')).not.toBeInTheDocument();

      const feedbackButton = screen.getByRole('button', {
        name: /send feedback/i,
      });
      await user.click(feedbackButton);

      expect(screen.getByTestId('feedback-dialog')).toBeInTheDocument();
    });
  });
});
