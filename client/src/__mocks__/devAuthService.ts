// Mock for @/services/devAuthService
export const isDevAuthEnabled = jest.fn(() => false);
export const devSignIn = jest.fn(() =>
  Promise.resolve({
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
  })
);
export const devSignOut = jest.fn(() => Promise.resolve());
export const devCreateAccount = jest.fn(() =>
  Promise.resolve({
    uid: 'test-uid',
    email: 'test@test.com',
    displayName: 'Test User',
  })
);
export const devGetCurrentUser = jest.fn(() => null);
export const devOnAuthStateChanged = jest.fn(
  (callback: (user: null) => void) => {
    callback(null);
    return () => {};
  }
);
