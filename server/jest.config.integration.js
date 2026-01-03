/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Integration tests run sequentially - they share Firebase state
  maxWorkers: 1,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Integration test setup - real Firebase
  setupFiles: ['<rootDir>/tests/integration/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: './tsconfig.test.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js'],
  // Only run integration tests
  testMatch: ['**/tests/integration/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  // Longer timeouts for integration tests (Firebase calls)
  testTimeout: 30000,
};
