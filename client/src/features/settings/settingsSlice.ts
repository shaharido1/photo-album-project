/**
 * User Settings Redux Slice
 *
 * Manages user settings/preferences state
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import { api, API_ENDPOINTS } from '@/services/apiClient';
import {
  type UserSettings,
  type SettingsResponse,
  type UpdateSettingsRequest,
  DEFAULT_USER_SETTINGS,
} from '@photo-album/types';

/**
 * Settings state shape
 */
interface SettingsState {
  settings: UserSettings;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SettingsState = {
  settings: DEFAULT_USER_SETTINGS,
  status: 'idle',
  error: null,
};

/**
 * Fetch user settings
 */
export const fetchSettings = createAsyncThunk<
  UserSettings,
  void,
  { rejectValue: string }
>('settings/fetchSettings', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<SettingsResponse>(API_ENDPOINTS.SETTINGS, {
      authenticated: true,
    });
    return response.settings;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to fetch settings'
    );
  }
});

/**
 * Update user settings
 */
export const updateSettings = createAsyncThunk<
  UserSettings,
  UpdateSettingsRequest,
  { rejectValue: string }
>('settings/updateSettings', async (updates, { rejectWithValue }) => {
  try {
    const response = await api.patch<SettingsResponse>(
      API_ENDPOINTS.SETTINGS,
      updates,
      { authenticated: true }
    );
    return response.settings;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to update settings'
    );
  }
});

/**
 * Toggle auto image tagging setting
 */
export const toggleAutoImageTagging = createAsyncThunk<
  UserSettings,
  void,
  { state: RootState; rejectValue: string }
>('settings/toggleAutoImageTagging', async (_, { getState, rejectWithValue }) => {
  try {
    const currentValue = getState().settings.settings.autoImageTagging;
    const response = await api.patch<SettingsResponse>(
      API_ENDPOINTS.SETTINGS,
      { autoImageTagging: !currentValue },
      { authenticated: true }
    );
    return response.settings;
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Failed to toggle auto image tagging'
    );
  }
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    /**
     * Clear settings error
     */
    clearError: (state) => {
      state.error = null;
    },
    /**
     * Reset settings to defaults (used on logout)
     */
    resetSettings: (state) => {
      state.settings = DEFAULT_USER_SETTINGS;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // Toggle auto image tagging
      .addCase(toggleAutoImageTagging.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(toggleAutoImageTagging.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(toggleAutoImageTagging.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearError, resetSettings } = settingsSlice.actions;

// Selectors
export const selectSettings = (state: RootState): UserSettings =>
  state.settings.settings;
export const selectAutoImageTagging = (state: RootState): boolean =>
  state.settings.settings.autoImageTagging;
export const selectSettingsStatus = (state: RootState): SettingsState['status'] =>
  state.settings.status;
export const selectSettingsError = (state: RootState): string | null =>
  state.settings.error;

export default settingsSlice.reducer;
