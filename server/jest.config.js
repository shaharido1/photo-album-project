/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Run tests sequentially for consistency
  maxWorkers: 1,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Setup files for both unit and integration tests
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
  // Match all tests in unit and integration folders
  testMatch: [
    '**/tests/unit/**/*.test.ts',
    '**/tests/integration/**/*.test.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 15,
      functions: 40,
      lines: 35,
      statements: 35,
    },
  },
};
