/**
 * Mock AuthProvider for tests
 * Avoids import.meta.env issues with Jest
 */

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  return <>{children}</>;
}
