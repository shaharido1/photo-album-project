import { EditorLayout } from '@/components/layout';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { useGooglePhotosCallback } from '@/features/googlePhotos/useGooglePhotosCallback';

function AppContent(): JSX.Element {
  // Handle Google Photos OAuth callback
  useGooglePhotosCallback();

  return <EditorLayout />;
}

function App(): JSX.Element {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
