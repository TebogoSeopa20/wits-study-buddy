// jest.config.js
module.exports = {
  verbose: true,
  rootDir: './',
  testEnvironment: 'jsdom',
  testMatch: ['**/test/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/'],

  // Let babel-jest handle JS files with import/export
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  collectCoverage: true,
  collectCoverageFrom: [
    'src/frontend/js/main.js',
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary'],

  globals: {
    fetch: true
  },

  reporters: [
    "default",
    "./test/custom-reporter.js"
  ],

  setupFilesAfterEnv: ['./test/setup.js'],
};
