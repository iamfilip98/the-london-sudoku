/**
 * Jest Configuration
 *
 * Unit testing configuration for The London Sudoku
 * Tests library functions, utilities, and business logic
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/tests/unit/**/*.test.js',
    '**/tests/unit/**/*.spec.js'
  ],

  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.js',
    '!lib/**/*.test.js',
    '!lib/**/*.spec.js',
    '!lib/db-pool.js', // Exclude database connection (requires real DB)
    '!lib/*-migration.js' // Exclude migrations (require real DB)
  ],

  // Coverage thresholds (aim for 80%+)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/unit/setup.js'],

  // Module paths
  modulePaths: ['<rootDir>'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Verbose output
  verbose: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/visual/',
    '/tests/accessibility/',
    '/tests/performance/'
  ],

  // Transform (no transformation needed for pure Node.js code)
  transform: {},

  // Global variables
  globals: {
    'NODE_ENV': 'test'
  }
};
