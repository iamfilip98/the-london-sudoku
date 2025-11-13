/**
 * Jest Setup File
 *
 * Runs before all tests to set up the testing environment
 */

// Set environment to test
process.env.NODE_ENV = 'test';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.KV_REST_API_URL = 'http://localhost:8080';
process.env.KV_REST_API_TOKEN = 'test-token';
process.env.CLERK_SECRET_KEY = 'test-clerk-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_123';
process.env.NEXT_PUBLIC_POSTHOG_KEY = 'test-posthog-key';

// Global test utilities
global.testUtils = {
  /**
   * Create a mock user object
   */
  createMockUser: (overrides = {}) => ({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    created_at: new Date('2025-01-01'),
    subscription_tier: 'free',
    subscription_status: 'inactive',
    ...overrides
  }),

  /**
   * Create a mock puzzle object
   */
  createMockPuzzle: (overrides = {}) => ({
    id: 1,
    date: '2025-11-13',
    difficulty: 'easy',
    puzzle: '0'.repeat(81),
    solution: '123456789'.repeat(9),
    clue_count: 42,
    ...overrides
  }),

  /**
   * Create a mock achievement object
   */
  createMockAchievement: (overrides = {}) => ({
    id: 'first_puzzle',
    name: 'First Steps',
    description: 'Complete your first puzzle',
    category: 'milestone',
    rarity: 'common',
    xp: 10,
    tokens: 0,
    ...overrides
  }),

  /**
   * Wait for a promise with timeout
   */
  waitFor: async (fn, timeout = 1000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (e) {
        // Ignore and retry
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error('waitFor timeout');
  },

  /**
   * Mock console methods to avoid cluttering test output
   */
  mockConsole: () => {
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
  },

  /**
   * Restore console methods
   */
  restoreConsole: () => {
    global.console = require('console');
  }
};

// Suppress console output in tests by default
beforeAll(() => {
  global.testUtils.mockConsole();
});

afterAll(() => {
  global.testUtils.restoreConsole();
});

// Clear all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
