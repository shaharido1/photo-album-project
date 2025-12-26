export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/config/firebase$': '<rootDir>/src/__mocks__/firebase-config.ts',
    '^@/services/apiClient$': '<rootDir>/src/__mocks__/apiClient.ts',
    '^@/services/authService$': '<rootDir>/src/__mocks__/authService.ts',
    '^@/services/devAuthService$': '<rootDir>/src/__mocks__/devAuthService.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-konva$': '<rootDir>/src/__mocks__/react-konva.tsx',
    '^konva$': '<rootDir>/src/__mocks__/konva.ts',
  },
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/*.test.{ts,tsx,js,jsx}'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/__mocks__/**',
    '!src/setupTests.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 3,
      lines: 2,
      statements: 2,
    },
  },
};
