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

  // Add transformIgnorePatterns to ensure node_modules are transformed if needed
  transformIgnorePatterns: [
    '/node_modules/(?!(your-module-name|another-module)/)',
  ],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/frontend/test_utils/participantsUtils.js',
    'src/frontend/test_utils/mainUtils.js',
    'src/frontend/test_utils/groupsUtils.js',
    'src/frontend/test_utils/weatherUtils.js',
    'src/frontend/test_utils/mapUtils.js',
    'src/frontend/test_utils/loginUtils.js',

  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'html'], // Add html for better visualization

  // Ensure coverage is collected from the correct files
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/',
    '/coverage/'
  ],

  globals: {
    fetch: true
  },

  reporters: [
    "default",
    "./test/custom-reporter.js"
  ],

  setupFilesAfterEnv: ['./test/setup.js'],
};