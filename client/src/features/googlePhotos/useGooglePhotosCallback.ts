import { useEffect } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { setConnectedFromCallback, openDialog, checkGooglePhotosStatus } from './googlePhotosSlice';

/**
 * Hook to handle Google Photos OAuth callback
 * Checks URL parameters for google_photos_connected or google_photos_error
 */
export function useGooglePhotosCallback(): void {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get('google_photos_connected');
    const error = params.get('google_photos_error');

    if (connected === 'true') {
      // Update state and refresh connection status
      dispatch(setConnectedFromCallback());
      void dispatch(checkGooglePhotosStatus());

      // Open dialog to show connected state
      dispatch(openDialog());

      // Clean up URL
      params.delete('google_photos_connected');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }

    if (error) {
      // Log error for debugging
      console.error('Google Photos OAuth error:', error);

      // Clean up URL
      params.delete('google_photos_error');
      const newUrl = params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [dispatch]);
}
