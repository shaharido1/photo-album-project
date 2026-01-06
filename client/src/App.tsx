import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { EditorLayout } from '@/components/layout';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useGooglePhotosCallback } from '@/features/googlePhotos/useGooglePhotosCallback';
import { useUrlSync } from '@/hooks/useUrlSync';
import { useLastVisited } from '@/hooks/useLastVisited';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/authSlice';
import { selectAlbumId } from '@/features/album/albumSlice';
import { ExportPreview } from '@/components/debug/ExportPreview';

function AppContent(): JSX.Element {
  // Handle Google Photos OAuth callback
  useGooglePhotosCallback();

  // Sync URL with Redux state
  useUrlSync();

  // Debug mode: Press Ctrl+Shift+D to toggle export preview
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebug((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <EditorLayout />
      {showDebug && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-auto">
          <div className="min-h-screen flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full">
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="font-semibold">Export Debug Preview</h2>
                <button
                  onClick={() => setShowDebug(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  Close (Ctrl+Shift+D)
                </button>
              </div>
              <ExportPreview />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Redirect from root to last visited album (if authenticated and has history)
 * Only redirects once on initial page load, not on subsequent navigations
 */
function RootRedirect(): JSX.Element {
  const { getLastVisited } = useLastVisited();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentAlbumId = useAppSelector(selectAlbumId);
  const [hasCheckedRedirect, setHasCheckedRedirect] = useState(false);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    // Only check once on mount
    if (hasCheckedRedirect) return;

    // If already viewing an album, no need to redirect
    if (currentAlbumId) {
      setHasCheckedRedirect(true);
      return;
    }

    // Only redirect if authenticated and has last visited album
    if (isAuthenticated) {
      const lastVisited = getLastVisited();
      if (lastVisited) {
        const path =
          lastVisited.pageIndex !== undefined && lastVisited.pageIndex > 0
            ? `/album/${lastVisited.albumId}/page/${lastVisited.pageIndex}`
            : `/album/${lastVisited.albumId}`;
        setRedirectPath(path);
      }
    }

    setHasCheckedRedirect(true);
  }, [isAuthenticated, currentAlbumId, getLastVisited, hasCheckedRedirect]);

  // Perform the redirect if we have a path
  if (redirectPath) {
    return <Navigate to={redirectPath} replace />;
  }

  return <AppContent />;
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Album editor with optional page index */}
        <Route path="/album/:albumId/page/:pageIndex" element={<AppContent />} />
        <Route path="/album/:albumId" element={<AppContent />} />

        {/* Dashboard / Home - with redirect to last visited */}
        <Route path="/" element={<RootRedirect />} />

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
