/**
 * Auth Provider Component
 *
 * Listens to Firebase auth state and syncs with Redux store
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser, setToken } from '@/features/auth/authSlice';
import { subscribeToAuthChanges, getIdToken, isAuthAvailable } from '@/services/authService';

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // If Firebase is not configured, mark as initialized with no user
    if (!isAuthAvailable()) {
      dispatch(setUser(null));
      return;
    }

    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      dispatch(setUser(user));

      // If user is logged in, get the ID token
      if (user) {
        const token = await getIdToken();
        dispatch(setToken(token));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
