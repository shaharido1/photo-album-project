/// <reference types="jest" />
import authReducer, {
  setUser,
  setToken,
  clearError,
  selectUser,
  selectToken,
  selectAuthStatus,
  selectAuthError,
  selectIsAuthenticated,
  selectIsAuthInitialized,
  signInWithGoogle,
  signOut,
  refreshToken,
  signInWithEmail,
  createAccount,
  resetPassword,
} from './authSlice';
import type { AuthUser } from '@/services/authService';

// Mock the authService
jest.mock('@/services/authService', () => ({
  signInWithGoogle: jest.fn(),
  signOut: jest.fn(),
  getIdToken: jest.fn(),
  signInWithEmail: jest.fn(),
  createAccountWithEmail: jest.fn(),
  resetPassword: jest.fn(),
}));

describe('authSlice', () => {
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

  const mockUser: AuthUser = {
    uid: 'user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
  };

  const mockToken = 'mock-id-token-123';

  describe('synchronous reducers', () => {
    describe('setUser', () => {
      it('should set user and mark as initialized', () => {
        const newState = authReducer(initialState, setUser(mockUser));

        expect(newState.user).toEqual(mockUser);
        expect(newState.isInitialized).toBe(true);
      });

      it('should clear token when user is set to null', () => {
        const stateWithUser: AuthState = {
          ...initialState,
          user: mockUser,
          token: mockToken,
          isInitialized: true,
        };

        const newState = authReducer(stateWithUser, setUser(null));

        expect(newState.user).toBeNull();
        expect(newState.token).toBeNull();
        expect(newState.isInitialized).toBe(true);
      });

      it('should not clear token when user is set', () => {
        const stateWithToken: AuthState = {
          ...initialState,
          token: mockToken,
        };

        const newState = authReducer(stateWithToken, setUser(mockUser));

        expect(newState.user).toEqual(mockUser);
        expect(newState.token).toBe(mockToken);
      });
    });

    describe('setToken', () => {
      it('should set token', () => {
        const newState = authReducer(initialState, setToken(mockToken));

        expect(newState.token).toBe(mockToken);
      });

      it('should clear token when null is passed', () => {
        const stateWithToken: AuthState = {
          ...initialState,
          token: mockToken,
        };

        const newState = authReducer(stateWithToken, setToken(null));

        expect(newState.token).toBeNull();
      });
    });

    describe('clearError', () => {
      it('should clear error', () => {
        const stateWithError: AuthState = {
          ...initialState,
          error: 'Some error message',
        };

        const newState = authReducer(stateWithError, clearError());

        expect(newState.error).toBeNull();
      });

      it('should not affect other state', () => {
        const stateWithError: AuthState = {
          ...initialState,
          user: mockUser,
          token: mockToken,
          error: 'Some error',
          status: 'failed',
        };

        const newState = authReducer(stateWithError, clearError());

        expect(newState.user).toEqual(mockUser);
        expect(newState.token).toBe(mockToken);
        expect(newState.status).toBe('failed');
      });
    });
  });

  describe('async thunk extra reducers', () => {
    describe('signInWithGoogle', () => {
      it('should set loading state on pending', () => {
        const action = { type: signInWithGoogle.pending.type };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should set user and token on fulfilled', () => {
        const action = {
          type: signInWithGoogle.fulfilled.type,
          payload: { user: mockUser, token: mockToken },
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.user).toEqual(mockUser);
        expect(newState.token).toBe(mockToken);
        expect(newState.isInitialized).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: signInWithGoogle.rejected.type,
          payload: 'Sign in failed',
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Sign in failed');
      });

      it('should set default error if payload is undefined', () => {
        const action = {
          type: signInWithGoogle.rejected.type,
          payload: undefined,
        };
        const newState = authReducer(initialState, action);

        expect(newState.error).toBe('Unknown error');
      });
    });

    describe('signOut', () => {
      it('should set loading state on pending', () => {
        const stateWithUser: AuthState = {
          ...initialState,
          user: mockUser,
          token: mockToken,
        };
        const action = { type: signOut.pending.type };
        const newState = authReducer(stateWithUser, action);

        expect(newState.status).toBe('loading');
      });

      it('should clear user and token on fulfilled', () => {
        const stateWithUser: AuthState = {
          ...initialState,
          user: mockUser,
          token: mockToken,
          status: 'succeeded',
        };
        const action = { type: signOut.fulfilled.type };
        const newState = authReducer(stateWithUser, action);

        expect(newState.status).toBe('idle');
        expect(newState.user).toBeNull();
        expect(newState.token).toBeNull();
      });

      it('should set error on rejected', () => {
        const action = {
          type: signOut.rejected.type,
          payload: 'Sign out failed',
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Sign out failed');
      });
    });

    describe('refreshToken', () => {
      it('should update token on fulfilled', () => {
        const stateWithToken: AuthState = {
          ...initialState,
          token: 'old-token',
        };
        const action = {
          type: refreshToken.fulfilled.type,
          payload: 'new-token',
        };
        const newState = authReducer(stateWithToken, action);

        expect(newState.token).toBe('new-token');
      });

      it('should handle null token on fulfilled', () => {
        const stateWithToken: AuthState = {
          ...initialState,
          token: 'old-token',
        };
        const action = {
          type: refreshToken.fulfilled.type,
          payload: null,
        };
        const newState = authReducer(stateWithToken, action);

        expect(newState.token).toBeNull();
      });
    });

    describe('signInWithEmail', () => {
      it('should set loading state on pending', () => {
        const action = { type: signInWithEmail.pending.type };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should set user and token on fulfilled', () => {
        const action = {
          type: signInWithEmail.fulfilled.type,
          payload: { user: mockUser, token: mockToken },
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.user).toEqual(mockUser);
        expect(newState.token).toBe(mockToken);
        expect(newState.isInitialized).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: signInWithEmail.rejected.type,
          payload: 'Invalid credentials',
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Invalid credentials');
      });
    });

    describe('createAccount', () => {
      it('should set loading state on pending', () => {
        const action = { type: createAccount.pending.type };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should set user and token on fulfilled', () => {
        const newUser = { ...mockUser, displayName: 'New User' };
        const action = {
          type: createAccount.fulfilled.type,
          payload: { user: newUser, token: mockToken },
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
        expect(newState.user).toEqual(newUser);
        expect(newState.token).toBe(mockToken);
        expect(newState.isInitialized).toBe(true);
      });

      it('should set error on rejected', () => {
        const action = {
          type: createAccount.rejected.type,
          payload: 'Email already in use',
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('Email already in use');
      });
    });

    describe('resetPassword', () => {
      it('should set loading state on pending', () => {
        const action = { type: resetPassword.pending.type };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('loading');
        expect(newState.error).toBeNull();
      });

      it('should set succeeded status on fulfilled', () => {
        const action = { type: resetPassword.fulfilled.type };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('succeeded');
      });

      it('should set error on rejected', () => {
        const action = {
          type: resetPassword.rejected.type,
          payload: 'User not found',
        };
        const newState = authReducer(initialState, action);

        expect(newState.status).toBe('failed');
        expect(newState.error).toBe('User not found');
      });
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      auth: {
        user: mockUser,
        token: mockToken,
        status: 'succeeded' as const,
        error: null,
        isInitialized: true,
      },
    };

    it('selectUser should return user', () => {
      // @ts-expect-error - partial state for testing
      expect(selectUser(mockRootState)).toEqual(mockUser);
    });

    it('selectToken should return token', () => {
      // @ts-expect-error - partial state for testing
      expect(selectToken(mockRootState)).toBe(mockToken);
    });

    it('selectAuthStatus should return status', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAuthStatus(mockRootState)).toBe('succeeded');
    });

    it('selectAuthError should return error', () => {
      // @ts-expect-error - partial state for testing
      expect(selectAuthError(mockRootState)).toBeNull();

      const stateWithError = {
        auth: { ...mockRootState.auth, error: 'Test error' },
      };
      // @ts-expect-error - partial state for testing
      expect(selectAuthError(stateWithError)).toBe('Test error');
    });

    it('selectIsAuthenticated should return true when user exists', () => {
      // @ts-expect-error - partial state for testing
      expect(selectIsAuthenticated(mockRootState)).toBe(true);
    });

    it('selectIsAuthenticated should return false when user is null', () => {
      const stateNoUser = {
        auth: { ...mockRootState.auth, user: null },
      };
      // @ts-expect-error - partial state for testing
      expect(selectIsAuthenticated(stateNoUser)).toBe(false);
    });

    it('selectIsAuthInitialized should return isInitialized', () => {
      // @ts-expect-error - partial state for testing
      expect(selectIsAuthInitialized(mockRootState)).toBe(true);

      const uninitializedState = {
        auth: { ...mockRootState.auth, isInitialized: false },
      };
      // @ts-expect-error - partial state for testing
      expect(selectIsAuthInitialized(uninitializedState)).toBe(false);
    });
  });
});
