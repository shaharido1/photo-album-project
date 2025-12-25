export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/*.test.{js,jsx}'],
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/main.jsx'],
  coverageDirectory: 'coverage',
};
