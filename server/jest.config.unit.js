/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Unit tests can run in parallel - they're mocked and isolated
  maxWorkers: '50%',
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Unit test setup - mocks Firebase
  setupFiles: ['<rootDir>/tests/unit/setupEnv.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.ts'],
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
  // Only run unit tests
  testMatch: ['**/tests/unit/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  // Faster timeouts for unit tests
  testTimeout: 10000,
};
