/// <reference types="jest" />
/**
 * Settings Slice Unit Tests
 *
 * Tests for the settings Redux slice - reducers, actions, and selectors.
 */

import settingsReducer, {
  clearError,
  resetSettings,
  selectSettings,
  selectAutoImageTagging,
  selectSettingsStatus,
  selectSettingsError,
  fetchSettings,
  updateSettings,
  toggleAutoImageTagging,
} from './settingsSlice';
import { DEFAULT_USER_SETTINGS } from '@photo-album/types';

// Mock the apiClient
jest.mock('@/services/apiClient', () => ({
  api: {
    get: jest.fn(),
    patch: jest.fn(),
  },
  API_ENDPOINTS: {
    SETTINGS: '/api/settings',
  },
}));

describe('settingsSlice', () => {
  interface SettingsState {
    settings: {
      autoImageTagging: boolean;
    };
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
  }

  const initialState: SettingsState = {
    settings: DEFAULT_USER_SETTINGS,
    status: 'idle',
    error: null,
  };

  describe('synchronous reducers', () => {
    describe('clearError', () => {
      it('should clear the error', () => {
        const stateWithError: SettingsState = {
          ...initialState,
          error: 'Some error message',
        };

        const newState = settingsReducer(stateWithError, clearError());

        expect(newState.error).toBeNull();
      });

      it('should not affect other state', () => {
        const stateWithError: SettingsState = {
          settings: { autoImageTagging: true },
          status: 'failed',
          error: 'Some error',
        };

        const newState = settingsReducer(stateWithError, clearError());

        expect(newState.settings.autoImageTagging).toBe(true);
        expect(newState.status).toBe('failed');
      });
    });

    describe('resetSettings', () => {
      it('should reset to default settings', () => {
        const modifiedState: SettingsState = {
          settings: { autoImageTagging: true },
          status: 'succeeded',
          error: null,
        };

        const newState = settingsReducer(modifiedState, resetSettings());

        expect(newState.settings).toEqual(DEFAULT_USER_SETTINGS);
        expect(newState.status).toBe('idle');
        expect(newState.error).toBeNull();
      });

      it('should clear error when resetting', () => {
        const stateWithError: SettingsState = {
          settings: { autoImageTagging: true },
          status: 'failed',
          error: 'Some error',
        };

        const newState = settingsReducer(stateWithError, resetSettings());

        expect(newState.error).toBeNull();
      });
    });
  });

  describe('async thunk extra reducers', () => {
    describe('fetchSettings', () => {
      it('should set loading state on pending', () => {
        const action = { type: fetchSettings.pending.type };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should set settings on fulfilled', () => {
        const action = {
          type: fetchSettings.fulfilled.type,
          payload: { autoImageTagging: true },
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.settings.autoImageTagging).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: fetchSettings.rejected.type,
          payload: 'Failed to fetch settings',
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Failed to fetch settings');
      });

      it('should set default error if payload is undefined', () => {
        const action = {
          type: fetchSettings.rejected.type,
          payload: undefined,
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.error).toBe('Unknown error');
      });
    });

    describe('updateSettings', () => {
      it('should set loading state on pending', () => {
        const action = { type: updateSettings.pending.type };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should update settings on fulfilled', () => {
        const action = {
          type: updateSettings.fulfilled.type,
          payload: { autoImageTagging: true },
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.settings.autoImageTagging).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: updateSettings.rejected.type,
          payload: 'Failed to update settings',
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Failed to update settings');
      });
    });

    describe('toggleAutoImageTagging', () => {
      it('should set loading state on pending', () => {
        const action = { type: toggleAutoImageTagging.pending.type };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should toggle settings on fulfilled', () => {
        const stateWithTagging: SettingsState = {
          ...initialState,
          settings: { autoImageTagging: false },
        };

        const action = {
          type: toggleAutoImageTagging.fulfilled.type,
          payload: { autoImageTagging: true },
        };
        const newState = settingsReducer(stateWithTagging, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.settings.autoImageTagging).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: toggleAutoImageTagging.rejected.type,
          payload: 'Failed to toggle auto image tagging',
        };
        const newState = settingsReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Failed to toggle auto image tagging');
      });
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      settings: {
        settings: { autoImageTagging: true },
        status: 'succeeded' as const,
        error: null,
      },
    };

    it('selectSettings should return settings object', () => {
      // @ts-expect-error - partial state for testing
      expect(selectSettings(mockRootState)).toEqual({ autoImageTagging: true });
    });

    it('selectAutoImageTagging should return boolean value', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAutoImageTagging(mockRootState)).toBe(true);

      const stateWithFalse = {
        settings: {
          ...mockRootState.settings,
          settings: { autoImageTagging: false },
        },
      };
      // @ts-expect-error - partial state for testing
      expect(selectAutoImageTagging(stateWithFalse)).toBe(false);
    });

    it('selectSettingsStatus should return status', () => {
      // @ts-expect-error - partial state for testing
      expect(selectSettingsStatus(mockRootState)).toBe('succeeded');

      const loadingState = {
        settings: { ...mockRootState.settings, status: 'loading' as const },
      };
      // @ts-expect-error - partial state for testing
      expect(selectSettingsStatus(loadingState)).toBe('loading');
    });

    it('selectSettingsError should return error', () => {
      // @ts-expect-error - partial state for testing
      expect(selectSettingsError(mockRootState)).toBeNull();

      const stateWithError = {
        settings: { ...mockRootState.settings, error: 'Test error' },
      };
      // @ts-expect-error - partial state for testing
      expect(selectSettingsError(stateWithError)).toBe('Test error');
    });
  });
});
