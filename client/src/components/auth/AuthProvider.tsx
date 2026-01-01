/**
 * Auth Provider Component
 *
 * Listens to Firebase auth state and syncs with Redux store
 */

import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setUser, setToken } from '@/features/auth/authSlice';
import {
  subscribeToAuthChanges,
  getIdToken,
  isAuthAvailable,
  signInWithEmail,
} from '@/services/authService';

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
      } else {
        // If no user, check for auto-login credentials in .env
        const email = import.meta.env.VITE_DEV_AUTH_EMAIL;
        const password = import.meta.env.VITE_DEV_AUTH_PASSWORD;

        if (email && password && import.meta.env.VITE_DEV_AUTH_AUTO_LOGIN !== 'false') {
          try {
            // eslint-disable-next-line no-console
            console.log(`[Dev Auth] Attempting auto-login for ${email}...`);
            await signInWithEmail(email, password);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[Dev Auth] Auto-login failed:', (e as Error).message);
          }
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}
