/**
 * Authentication Redux Slice
 *
 * Manages auth state including user info and ID token
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import {
  signInWithGoogle as googleSignIn,
  signOut as authSignOut,
  getIdToken,
  AuthUser,
} from '@/services/authService';

/**
 * Auth state shape
 */
interface AuthState {
  user: AuthUser | null;
  token: string | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isInitialized: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  status: 'idle',
  error: null,
  isInitialized: false,
};

/**
 * Sign in with Google
 */
export const signInWithGoogle = createAsyncThunk<
  { user: AuthUser; token: string },
  void,
  { rejectValue: string }
>('auth/signInWithGoogle', async (_, { rejectWithValue }) => {
  try {
    const user = await googleSignIn();
    const token = await getIdToken();

    if (!token) {
      throw new Error('Failed to get ID token');
    }

    return { user, token };
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Sign in failed'
    );
  }
});

/**
 * Sign out
 */
export const signOut = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/signOut',
  async (_, { rejectWithValue }) => {
    try {
      await authSignOut();
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Sign out failed'
      );
    }
  }
);

/**
 * Refresh the ID token
 */
export const refreshToken = createAsyncThunk<
  string | null,
  void,
  { rejectValue: string }
>('auth/refreshToken', async (_, { rejectWithValue }) => {
  try {
    return await getIdToken();
  } catch (error) {
    return rejectWithValue(
      error instanceof Error ? error.message : 'Token refresh failed'
    );
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Set user from auth state listener
     */
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isInitialized = true;
      if (!action.payload) {
        state.token = null;
      }
    },
    /**
     * Set token after getting it from Firebase
     */
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    /**
     * Clear any auth errors
     */
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Sign in
      .addCase(signInWithGoogle.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signInWithGoogle.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isInitialized = true;
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // Sign out
      .addCase(signOut.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(signOut.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
      })
      .addCase(signOut.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? 'Unknown error';
      })
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload;
      });
  },
});

export const { setUser, setToken, clearError } = authSlice.actions;

// Selectors
export const selectUser = (state: RootState): AuthUser | null => state.auth.user;
export const selectToken = (state: RootState): string | null => state.auth.token;
export const selectAuthStatus = (state: RootState): AuthState['status'] =>
  state.auth.status;
export const selectAuthError = (state: RootState): string | null =>
  state.auth.error;
export const selectIsAuthenticated = (state: RootState): boolean =>
  !!state.auth.user;
export const selectIsAuthInitialized = (state: RootState): boolean =>
  state.auth.isInitialized;

export default authSlice.reducer;
