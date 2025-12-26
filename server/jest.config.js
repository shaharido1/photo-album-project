/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  // Run tests sequentially to avoid port conflicts with shared server
  maxWorkers: 1,
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // Setup file that manages server lifecycle (runs once before all test files)
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
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
  testMatch: ['**/tests/**/*.test.ts'],
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
