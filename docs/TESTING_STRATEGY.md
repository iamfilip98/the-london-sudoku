# 🧪 TESTING STRATEGY

**Goal**: Ensure quality, prevent regressions, enable rapid development
**Version**: 1.0
**Last Updated**: November 2025

---

## 📋 TESTING PYRAMID

```
        ┌──────────────┐
        │  E2E Tests   │  ← 20% (critical user flows)
        │  (Playwright)│
        ├──────────────┤
        │ Integration  │  ← 30% (API + DB)
        │    Tests     │
        ├──────────────┤
        │  Unit Tests  │  ← 50% (pure functions, logic)
        │   (Jest)     │
        └──────────────┘
```

---

## 🔧 UNIT TESTS (Jest)

### What to Test

**Puzzle Generators**:
```javascript
// lib/generators/classic.test.js
describe('Classic Sudoku Generator', () => {
  test('generates valid 9x9 grid', () => {
    const puzzle = generateClassicPuzzle('easy');
    expect(puzzle.grid).toHaveLength(9);
    expect(puzzle.grid[0]).toHaveLength(9);
  });

  test('easy puzzle has 42 clues', () => {
    const puzzle = generateClassicPuzzle('easy');
    const clues = countClues(puzzle.grid);
    expect(clues).toBe(42);
  });

  test('generated puzzle has unique solution', () => {
    const puzzle = generateClassicPuzzle('medium');
    const solutions = countSolutions(puzzle.grid);
    expect(solutions).toBe(1);
  });
});
```

**Scoring Logic**:
```javascript
// lib/scoring.test.js
describe('Score Calculation', () => {
  test('perfect game gets bonus', () => {
    const score = calculateScore({ time: 180, errors: 0, hints: 0, difficulty: 'easy' });
    expect(score).toBeGreaterThan(500);
  });

  test('errors reduce score', () => {
    const perfect = calculateScore({ time: 180, errors: 0, hints: 0, difficulty: 'easy' });
    const withErrors = calculateScore({ time: 180, errors: 3, hints: 0, difficulty: 'easy' });
    expect(withErrors).toBeLessThan(perfect);
  });
});
```

**XP Calculation**:
```javascript
// lib/battle-pass.test.js
describe('XP Calculation', () => {
  test('premium users get 50% bonus', () => {
    const freeXP = calculateXP({ difficulty: 'easy', isPremium: false, errors: 0, hints: 0 });
    const premiumXP = calculateXP({ difficulty: 'easy', isPremium: true, errors: 0, hints: 0 });
    expect(premiumXP).toBe(Math.floor(freeXP * 1.5));
  });

  test('perfect game grants bonus XP', () => {
    const normal = calculateXP({ difficulty: 'easy', isPremium: false, errors: 1, hints: 0 });
    const perfect = calculateXP({ difficulty: 'easy', isPremium: false, errors: 0, hints: 0 });
    expect(perfect).toBeGreaterThan(normal);
  });
});
```

### Run Unit Tests

```bash
npm run test:unit
# or
jest --watch
```

---

## 🔗 INTEGRATION TESTS

### API Endpoints

```javascript
// tests/api/daily-puzzles.test.js
describe('GET /api/daily-puzzles', () => {
  test('returns puzzles for today', async () => {
    const res = await fetch('/api/daily-puzzles');
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.classic.easy).toBeDefined();
    expect(data.classic.medium).toBeDefined();
    expect(data.classic.hard).toBeDefined();
  });

  test('caches puzzles (Redis)', async () => {
    const res1 = await fetch('/api/daily-puzzles');
    const res2 = await fetch('/api/daily-puzzles');

    // Second request should be faster (cached)
    expect(res2.headers.get('x-cache')).toBe('HIT');
  });
});

describe('POST /api/daily-puzzles/complete', () => {
  test('records completion and updates leaderboard', async () => {
    const res = await fetch('/api/daily-puzzles/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${testToken}` },
      body: JSON.stringify({
        daily_puzzle_id: 123,
        variant: 'classic',
        difficulty: 'easy',
        time_seconds: 187,
        errors: 0,
        hints: 1
      })
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.score).toBeGreaterThan(0);
    expect(data.rank).toBeDefined();
    expect(data.xp_earned).toBeGreaterThan(0);
  });

  test('prevents duplicate completions', async () => {
    // First completion
    await completeDaily Puzzle(123);

    // Second attempt
    const res = await completeDailyPuzzle(123);
    expect(res.status).toBe(400);
    expect(res.json().error).toContain('already completed');
  });
});
```

### Database Operations

```javascript
// tests/db/subscriptions.test.js
describe('Subscription Management', () => {
  test('creates subscription on webhook', async () => {
    const webhookEvent = mockStripeEvent('customer.subscription.created');
    await handleWebhook(webhookEvent);

    const user = await getUser(testUserId);
    expect(user.subscription_tier).toBe('premium');
    expect(user.subscription_status).toBe('active');
  });

  test('expires subscription after period end', async () => {
    // Fast-forward time
    const expiredSub = { ...testSubscription, current_period_end: Date.now() - 1000 };
    await checkExpiredSubscriptions();

    const user = await getUser(testUserId);
    expect(user.subscription_tier).toBe('free');
  });
});
```

---

## 🌐 E2E TESTS (Playwright)

### Critical User Flows

**Flow 1: Sign Up → Play Daily → Complete**:
```javascript
// tests/e2e/daily-puzzle-flow.spec.js
import { test, expect } from '@playwright/test';

test('complete user journey: signup to puzzle completion', async ({ page }) => {
  // 1. Sign up
  await page.goto('/auth');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpass123');
  await page.click('button:has-text("Sign Up")');

  // 2. Should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // 3. Click "Play Classic Easy"
  await page.click('[data-testid="classic-easy-play"]');

  // 4. Complete puzzle (simulate)
  await solvePuzzle(page, 'easy');

  // 5. Check completion modal
  await expect(page.locator('[data-testid="completion-modal"]')).toBeVisible();
  await expect(page.locator('[data-testid="completion-time"]')).toContainText(':');
  await expect(page.locator('[data-testid="xp-earned"]')).toContainText('XP');

  // 6. Check leaderboard updated
  await page.click('[data-testid="view-leaderboard"]');
  await expect(page.locator('[data-testid="my-rank"]')).toBeDefined();
});
```

**Flow 2: Free User → Daily Limit → Upsell**:
```javascript
test('free user hits daily limit and sees upsell', async ({ page }) => {
  await loginAsFreeUser(page);

  // Complete 3 daily puzzles
  for (let i = 0; i < 3; i++) {
    await completeDailyPuzzle(page, 'easy');
  }

  // Try to play 4th puzzle
  await page.click('[data-testid="classic-easy-play"]');

  // Should see upsell modal
  await expect(page.locator('[data-testid="upsell-modal"]')).toBeVisible();
  await expect(page.locator('text=Daily Limit Reached')).toBeVisible();
  await expect(page.locator('text=Upgrade to Premium')).toBeVisible();
});
```

**Flow 3: Premium Signup → Checkout → Access**:
```javascript
test('premium signup flow', async ({ page }) => {
  await loginAsFreeUser(page);

  // Click upgrade
  await page.click('[data-testid="upgrade-premium"]');

  // Should redirect to Stripe
  await expect(page).toHaveURL(/checkout.stripe.com/);

  // Complete payment (using Stripe test mode)
  await fillStripeTestCard(page);
  await page.click('[data-testid="submit-payment"]');

  // Redirect back to success page
  await expect(page).toHaveURL(/welcome-premium/);

  // Check premium features unlocked
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="premium-badge"]')).toBeVisible();
  await expect(page.locator('[data-testid="play-practice"]')).toBeEnabled();
});
```

**Flow 4: Battle Pass Progress**:
```javascript
test('battle pass XP and tier progression', async ({ page }) => {
  await loginAsPremiumUser(page);

  // Check initial tier
  await page.goto('/battle-pass');
  const initialTier = await page.locator('[data-testid="current-tier"]').textContent();
  expect(parseInt(initialTier)).toBeGreaterThanOrEqual(1);

  // Complete a puzzle
  await completeDailyPuzzle(page, 'hard'); // +150 XP base + 75 premium boost = 225 XP

  // Check XP increased
  await page.goto('/battle-pass');
  await expect(page.locator('[data-testid="xp-earned-today"]')).toContainText('225');

  // Check tier up (if applicable)
  const newTier = await page.locator('[data-testid="current-tier"]').textContent();
  expect(parseInt(newTier)).toBeGreaterThanOrEqual(parseInt(initialTier));
});
```

### Mobile E2E Tests

```javascript
// tests/e2e/mobile.spec.js
test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

test('mobile: play puzzle on small screen', async ({ page }) => {
  await page.goto('/');
  await loginAsFreeUser(page);

  // Mobile navigation
  await page.click('[data-testid="mobile-menu"]');
  await page.click('text=Play');

  // Puzzle should be responsive
  const grid = await page.locator('[data-testid="sudoku-grid"]');
  await expect(grid).toBeVisible();

  // Tap cell and enter number
  await page.tap('[data-testid="cell-0-0"]');
  await page.tap('[data-testid="number-pad-5"]');

  // Check cell updated
  await expect(page.locator('[data-testid="cell-0-0"]')).toContainText('5');
});
```

### Run E2E Tests

```bash
# All browsers
npx playwright test

# Specific browser
npx playwright test --project=chromium

# Headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

---

## 🔄 REGRESSION TESTS

### After Each Deployment

**Critical Paths** (must pass before deploy):
1. ✅ User can sign up
2. ✅ User can log in
3. ✅ Daily puzzles load
4. ✅ User can complete puzzle
5. ✅ Leaderboard updates
6. ✅ Premium signup works
7. ✅ Battle pass tracks XP
8. ✅ Ads show for free users (not Premium)

**Automated Smoke Tests**:
```javascript
// tests/smoke.spec.js
test.describe('Smoke Tests (Critical Paths)', () => {
  test('homepage loads', async ({ page }) => {
    const res = await page.goto('/');
    expect(res.status()).toBe(200);
  });

  test('API health check', async ({ request }) => {
    const res = await request.get('/api/health');
    expect(res.status()).toBe(200);
  });

  test('daily puzzles exist', async ({ request }) => {
    const res = await request.get('/api/daily-puzzles');
    const data = await res.json();
    expect(data.classic.easy).toBeDefined();
  });
});
```

---

## 📊 PERFORMANCE TESTS

### Load Testing

**Simulate 1,000 concurrent users**:
```javascript
// tests/load/artillery.yml
config:
  target: 'https://thelondonsudoku.com'
  phases:
    - duration: 60
      arrivalRate: 10 # 10 users/sec = 600 users/min
    - duration: 120
      arrivalRate: 50 # Ramp to 50 users/sec

scenarios:
  - name: 'Complete daily puzzle'
    flow:
      - get:
          url: '/api/daily-puzzles'
      - think: 180 # Simulate 3min to solve
      - post:
          url: '/api/daily-puzzles/complete'
          json:
            daily_puzzle_id: 123
            time_seconds: 180
            errors: 0
```

**Run load test**:
```bash
artillery run tests/load/artillery.yml
```

**Metrics to monitor**:
- Response time p95 < 500ms
- Response time p99 < 1000ms
- Error rate < 1%
- Database connection pool not exhausted

---

## 🔐 SECURITY TESTS

### SQL Injection

```javascript
test('API prevents SQL injection', async ({ request }) => {
  const malicious = "'; DROP TABLE users; --";

  const res = await request.post('/api/daily-puzzles/complete', {
    data: { variant: malicious }
  });

  expect(res.status()).toBe(400); // Validation error, not SQL error
});
```

### XSS Prevention

```javascript
test('user input is sanitized', async ({ page }) => {
  await page.goto('/profile/edit');
  await page.fill('[name="bio"]', '<script>alert("XSS")</script>');
  await page.click('button:has-text("Save")');

  // Check script tags escaped
  const bio = await page.locator('[data-testid="profile-bio"]').innerHTML();
  expect(bio).not.toContain('<script>');
  expect(bio).toContain('&lt;script&gt;');
});
```

### Rate Limiting

```javascript
test('API rate limits excessive requests', async ({ request }) => {
  const requests = [];

  // Send 150 requests (limit is 100/min)
  for (let i = 0; i < 150; i++) {
    requests.push(request.get('/api/daily-puzzles'));
  }

  const responses = await Promise.all(requests);
  const rateLimited = responses.filter(r => r.status() === 429);

  expect(rateLimited.length).toBeGreaterThan(0);
});
```

---

## 🤖 CI/CD INTEGRATION

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  deploy:
    needs: [unit-tests, e2e-tests]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: vercel deploy --prod
```

---

## ✅ TESTING CHECKLIST (Before Each Release)

- [ ] All unit tests pass (`npm run test:unit`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] Smoke tests pass on staging
- [ ] Load test completed (1K concurrent users)
- [ ] Security scan (no vulnerabilities)
- [ ] Mobile tests pass (iOS Safari, Android Chrome)
- [ ] Cross-browser tests pass (Chrome, Firefox, Safari, Edge)
- [ ] Subscription flow tested (test mode Stripe)
- [ ] Webhook handling tested
- [ ] Battle pass XP calculation verified
- [ ] Leaderboard accuracy confirmed

---

## 📝 MANUAL TESTING CHECKLIST

### New Variant Launch

- [ ] Generate 100 puzzles for each difficulty
- [ ] Solve 10 puzzles manually (ensure solvable)
- [ ] Check difficulty feels correct
- [ ] Verify UI displays correctly
- [ ] Test on mobile
- [ ] Check leaderboard tracks correctly

### New Feature Launch

- [ ] Test happy path
- [ ] Test error cases
- [ ] Test as free user
- [ ] Test as Premium user
- [ ] Test on mobile
- [ ] Check analytics tracking
- [ ] Verify database updates

---

**Testing is not optional. Every feature must have tests. Every deployment must pass tests. Quality over speed.**
