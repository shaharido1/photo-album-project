// Mock for @/services/authService
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const signInWithGoogle = jest.fn(() =>
  Promise.resolve({
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
  })
);
export const signInWithEmail = jest.fn(() =>
  Promise.resolve({
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
  })
);
export const createAccountWithEmail = jest.fn(() =>
  Promise.resolve({
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
  })
);
export const resetPassword = jest.fn(() => Promise.resolve());
export const signOut = jest.fn(() => Promise.resolve());
export const getCurrentUser = jest.fn(() => null);
export const onAuthChange = jest.fn((callback: (user: null) => void) => {
  callback(null);
  return () => {};
});
export const getIdToken = jest.fn(() => Promise.resolve(null));
