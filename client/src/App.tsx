import { EditorLayout } from '@/components/layout';
import { AuthProvider } from '@/components/auth/AuthProvider';

function App(): JSX.Element {
  return (
    <AuthProvider>
      <EditorLayout />
    </AuthProvider>
  );
}

export default App;
