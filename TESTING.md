# Testing Guide - The London Sudoku

Comprehensive testing documentation for unit tests and E2E tests.

---

## Testing Strategy

This project uses a two-tier testing approach:
1. **Unit Tests (Jest)** - Library functions, utilities, business logic
2. **E2E Tests (Playwright)** - Critical user workflows

### Coverage Goals
- Unit Tests: 80%+ code coverage
- E2E Tests: 100% critical user journeys

## Running Tests

```bash
# All tests (unit + E2E)
npm test

# Unit tests only
npm run test:unit

# Unit tests with coverage
npm run test:unit:coverage

# Unit tests in watch mode
npm run test:unit:watch

# E2E tests
npm run test:e2e

# E2E with UI
npm run test:ui

# E2E debug mode
npm run test:debug
```

## Unit Tests (Jest)

### Setup
- Configuration: `jest.config.js`
- Test files: `tests/unit/**/*.test.js`
- Setup file: `tests/unit/setup.js`
- Coverage: `coverage/` directory

### Test Utilities
Global utilities available via `global.testUtils`:
- `createMockUser()` - Mock user object
- `createMockPuzzle()` - Mock puzzle object
- `createMockAchievement()` - Mock achievement object
- `waitFor()` - Wait for async condition
- `mockConsole()` - Suppress console output

### Example Test
```javascript
const { getCached } = require('../../../lib/cache');

describe('lib/cache.js', () => {
  test('should return cached data', async () => {
    const result = await getCached('key', () => ({ data: 'test' }), 300);
    expect(result).toEqual({ data: 'test' });
  });
});
```

## E2E Tests (Playwright)

### Setup
- Configuration: `playwright.config.js`
- Test files: `tests/e2e/**/*.spec.js`
- Browsers: Chromium, Firefox, WebKit
- Mobile: Chrome Mobile, Safari Mobile

### Example Test
```javascript
const { test, expect } = require('@playwright/test');

test('should complete puzzle', async ({ page }) => {
  await page.goto('/');
  await page.click('[data-testid="easy-puzzle"]');
  await expect(page.locator('[data-testid="grid"]')).toBeVisible();
});
```

## Coverage

View coverage report:
```bash
npm run test:unit:coverage
open coverage/index.html
```

Current coverage: Run tests to generate.

## CI/CD Integration

Tests run automatically on push/PR via GitHub Actions.

For more details, see individual test files and Jest/Playwright documentation.
