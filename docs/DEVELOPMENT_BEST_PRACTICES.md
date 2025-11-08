# 🛠️ DEVELOPMENT BEST PRACTICES

**Purpose**: Code quality, deployment safety, and operational excellence
**Version**: 1.0
**Last Updated**: November 2025

---

## 🎯 CORE PRINCIPLES

1. **Quality Over Speed**: Better to ship working code slowly than broken code quickly
2. **Test Before Deploy**: Every deployment must pass automated tests
3. **Document Everything**: Code, APIs, decisions - write it down
4. **Security First**: Never compromise on security for convenience
5. **Monitor Everything**: If you can't measure it, you can't improve it
6. **Fail Gracefully**: Errors will happen - handle them well

---

## 📁 PROJECT STRUCTURE

```
the-london-sudoku/
├── .env.local                 # Local environment variables (NEVER commit)
├── .env.production            # Production env template (no secrets)
├── .github/
│   └── workflows/
│       ├── test.yml           # Run tests on every PR
│       └── deploy.yml         # Deploy to production
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   └── migrations/            # Database migrations
│       └── 20251108_xxx/
│           ├── migration.sql
│           └── rollback.sql   # ALWAYS create rollback
├── lib/
│   ├── db.js                  # Database connection
│   ├── errors.js              # Standardized errors
│   ├── errorHandler.js        # Error handling middleware
│   ├── logger.js              # Structured logging
│   ├── rateLimit.js           # Rate limiting
│   ├── validators.js          # Input validation (Zod schemas)
│   └── utils/
│       ├── scoring.js         # Score calculation
│       ├── xp.js              # XP calculation
│       └── generators/        # Puzzle generators
│           ├── classic.js
│           ├── xsudoku.js
│           └── killer.js
├── pages/
│   ├── api/                   # API routes
│   │   ├── daily-puzzles/
│   │   │   ├── index.js       # GET daily puzzles
│   │   │   └── complete.js    # POST completion
│   │   ├── auth/
│   │   ├── subscription/
│   │   └── admin/
│   └── [UI pages]
├── components/
├── docs/                      # COMPREHENSIVE DOCUMENTATION
│   ├── TECHNICAL_SPEC.md
│   ├── DATABASE_SCHEMA.sql
│   ├── CONFIGURATION_SYSTEM.md
│   ├── ERROR_HANDLING_LOGGING.md
│   ├── RATE_LIMITING_SECURITY.md
│   ├── DATA_MIGRATION_STRATEGY.md
│   └── [all other specs]
├── tests/
│   ├── unit/                  # Jest unit tests
│   ├── integration/           # API integration tests
│   └── e2e/                   # Playwright E2E tests
└── migrations/
    └── scripts/               # Data migration scripts
        └── backfill_xxx.js
```

---

## 💻 CODE QUALITY STANDARDS

### 1. TypeScript (Recommended for Month 3+)

```javascript
// BEFORE (JavaScript - okay for MVP)
function calculateXP(completion) {
  const baseXP = completion.difficulty === 'easy' ? 50 : 100;
  return baseXP;
}

// AFTER (TypeScript - safer, better DX)
interface PuzzleCompletion {
  variant: 'classic' | 'xsudoku' | 'killer';
  difficulty: 'easy' | 'medium' | 'hard';
  errors: number;
  hints: number;
  isPremium: boolean;
}

function calculateXP(completion: PuzzleCompletion): number {
  const baseXP = completion.difficulty === 'easy' ? 50 : 100;
  return baseXP;
}
```

### 2. Naming Conventions

```javascript
// ✅ GOOD: Clear, descriptive names
const userCompletionCount = await getUserPuzzleCount(userId);
const isPremiumUser = user.subscription_tier === 'premium';
const dailyPuzzleData = await fetchDailyPuzzles(today);

// ❌ BAD: Ambiguous, abbreviated names
const cnt = await getCount(userId);
const prem = user.sub === 'premium';
const data = await fetch(today);
```

### 3. Function Design

```javascript
// ✅ GOOD: Single responsibility, pure function
function calculateScore(timeSeconds, errors, hints) {
  const baseScore = 1000;
  const timePenalty = Math.floor(timeSeconds / 10);
  const errorPenalty = errors * 50;
  const hintPenalty = hints * 25;

  return Math.max(0, baseScore - timePenalty - errorPenalty - hintPenalty);
}

// ❌ BAD: Too many responsibilities, side effects
async function calculateScoreAndUpdate(userId, timeSeconds, errors, hints) {
  const score = calculateScore(timeSeconds, errors, hints);
  await updateUserScore(userId, score);
  await logScoreCalculation(userId, score);
  await sendScoreNotification(userId, score);
  return score;
}
```

### 4. Error Handling

```javascript
// ✅ GOOD: Specific error handling
try {
  const user = await getUser(userId);
  if (!user) {
    throw Errors.NOT_FOUND('User');
  }

  if (user.subscription_tier !== 'premium') {
    throw Errors.SUBSCRIPTION_REQUIRED('This variant');
  }

  return processRequest(user);
} catch (error) {
  if (error.isOperational) {
    throw error;  // Re-throw expected errors
  }

  logger.error('Unexpected error', { error, userId });
  throw Errors.DATABASE_ERROR();
}

// ❌ BAD: Silent failures, generic errors
try {
  const user = await getUser(userId);
  return processRequest(user);
} catch (error) {
  console.log('Error:', error);
  return null;  // Silent failure
}
```

### 5. Async/Await Best Practices

```javascript
// ✅ GOOD: Parallel execution when possible
const [user, dailyPuzzles, leaderboard] = await Promise.all([
  getUser(userId),
  getDailyPuzzles(today),
  getLeaderboard('daily', 'classic')
]);

// ❌ BAD: Sequential execution (3x slower)
const user = await getUser(userId);
const dailyPuzzles = await getDailyPuzzles(today);
const leaderboard = await getLeaderboard('daily', 'classic');
```

---

## 🧪 TESTING STRATEGY

### Test Coverage Targets

```
Unit Tests:       70%+ coverage
Integration Tests: Critical paths (auth, payments, puzzle completion)
E2E Tests:        Core user journeys (signup → play → complete)
```

### Example Unit Test

```javascript
// tests/unit/scoring.test.js
import { calculateScore } from '@/lib/utils/scoring';

describe('Score Calculation', () => {
  test('perfect game gets max score', () => {
    const score = calculateScore(180, 0, 0);
    expect(score).toBeGreaterThan(800);
  });

  test('errors reduce score', () => {
    const perfect = calculateScore(180, 0, 0);
    const withErrors = calculateScore(180, 3, 0);
    expect(withErrors).toBeLessThan(perfect);
    expect(withErrors).toBe(perfect - 150); // 3 errors * 50
  });

  test('minimum score is 0', () => {
    const score = calculateScore(10000, 100, 100);
    expect(score).toBe(0);
  });
});
```

### Example Integration Test

```javascript
// tests/integration/daily-puzzles.test.js
describe('POST /api/daily-puzzles/complete', () => {
  test('completes puzzle and updates leaderboard', async () => {
    const { userId, token } = await createTestUser();
    const puzzle = await createTestDailyPuzzle();

    const res = await fetch('/api/daily-puzzles/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        daily_puzzle_id: puzzle.id,
        time_seconds: 187,
        errors: 0,
        hints: 1
      })
    });

    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.score).toBeGreaterThan(0);
    expect(data.rank).toBeDefined();

    // Verify leaderboard updated
    const leaderboard = await getLeaderboard('daily', 'classic');
    expect(leaderboard.some(entry => entry.user_id === userId)).toBe(true);
  });

  test('prevents duplicate completion', async () => {
    const { userId, token } = await createTestUser();
    const puzzle = await createTestDailyPuzzle();

    // First completion
    await completeDailyPuzzle(userId, puzzle.id, 187);

    // Second attempt
    const res = await fetch('/api/daily-puzzles/complete', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        daily_puzzle_id: puzzle.id,
        time_seconds: 150
      })
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('PUZZLE_ALREADY_COMPLETED');
  });
});
```

---

## 🚀 DEPLOYMENT WORKFLOW

### Pre-Deploy Checklist

```bash
# 1. Run all tests
npm run test
npm run test:e2e

# 2. Run linter
npm run lint

# 3. Check for security vulnerabilities
npm audit

# 4. Build production bundle
npm run build

# 5. Test production build locally
npm run start

# 6. Verify environment variables set
vercel env ls

# 7. Create database backup (if needed)
# Neon handles automatic backups

# 8. Deploy to staging first
vercel --env=staging

# 9. Run smoke tests on staging
npm run test:smoke -- --env=staging

# 10. Deploy to production
vercel --prod
```

### Deployment Schedule

```
Development → Staging → Production

Staging Deployments: Anytime (automated on push to develop)
Production Deployments: Tuesday/Thursday 10 AM UTC
  - Never deploy on Fridays (no weekend support)
  - Never deploy during high-traffic hours
  - Always deploy with someone available to monitor

Emergency Hotfixes: Anytime (with approval)
```

### Rollback Procedure

```bash
# Option 1: Vercel instant rollback
vercel rollback

# Option 2: Redeploy previous commit
git log  # Find previous working commit
git checkout <commit-hash>
vercel --prod

# Option 3: Database rollback (if needed)
psql $DATABASE_URL < migrations/rollback.sql
```

---

## 📊 MONITORING & ALERTS

### Key Metrics to Monitor

**Performance**:
- API response time (p50, p95, p99)
- Database query time
- Page load time
- Time to first byte (TTFB)

**Business**:
- Daily active users (DAU)
- Daily puzzle completions
- Premium conversion rate
- Churn rate

**Errors**:
- API error rate (%)
- Failed payment rate
- 500 errors per hour
- Authentication failures

**Infrastructure**:
- Database connection pool usage
- Redis memory usage
- Vercel function execution time
- CDN cache hit rate

### PostHog Dashboards

**Dashboard 1: Core Metrics**
```javascript
// Tracked events
posthog.capture('puzzle_completed', { variant, difficulty, time_seconds, errors });
posthog.capture('user_signup', { source });
posthog.capture('premium_signup', { plan, price });
posthog.capture('daily_limit_reached', { puzzle_count });
```

**Dashboard 2: Errors**
```javascript
// Track errors
posthog.capture('error_occurred', {
  error_code,
  error_message,
  endpoint,
  user_tier
});
```

**Dashboard 3: Engagement**
```javascript
// Track engagement
posthog.capture('session_started');
posthog.capture('puzzle_abandoned', { time_elapsed, progress });
posthog.capture('hint_used', { puzzle_id, hint_type });
```

### Alerts (Month 6+)

```javascript
// Set up alerts for critical issues

// Error rate > 5%
if (errorRate > 0.05) {
  sendAlert('High error rate', { errorRate, time: Date.now() });
}

// Response time > 2 seconds (p95)
if (responseTimeP95 > 2000) {
  sendAlert('Slow API response', { responseTimeP95 });
}

// Premium signup failure
if (stripeWebhookFailed) {
  sendAlert('URGENT: Stripe webhook failed', { event_id });
}
```

---

## 🔒 SECURITY PRACTICES

### Never Commit Secrets

```bash
# .gitignore
.env.local
.env.production
*.key
*.pem
```

### Use Environment Variables

```javascript
// ✅ GOOD: Environment variables
const stripeKey = process.env.STRIPE_SECRET_KEY;

// ❌ BAD: Hardcoded secrets
const stripeKey = 'sk_live_abc123';  // NEVER do this!
```

### Validate All Inputs

```javascript
// Use Zod for validation
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(13).max(120)
});

const validated = schema.parse(req.body);
```

### Sanitize User Content

```javascript
import validator from 'validator';
import DOMPurify from 'dompurify';

// Sanitize text input
const bio = validator.escape(req.body.bio);

// Sanitize HTML (if allowing rich text)
const safeHTML = DOMPurify.sanitize(userHTML);
```

---

## 📝 DOCUMENTATION STANDARDS

### API Documentation

```javascript
/**
 * Complete a daily puzzle
 *
 * @route POST /api/daily-puzzles/complete
 * @access Protected (requires authentication)
 * @ratelimit 5 requests per minute
 *
 * @body {number} daily_puzzle_id - ID of the daily puzzle
 * @body {number} time_seconds - Time taken to complete (seconds)
 * @body {number} errors - Number of errors made
 * @body {number} hints - Number of hints used
 *
 * @returns {object} 200 - Completion data
 * @returns {number} 200.score - Calculated score
 * @returns {number} 200.xp_earned - XP awarded
 * @returns {number} 200.rank - User's rank on leaderboard
 *
 * @throws {409} PUZZLE_ALREADY_COMPLETED - User already completed this puzzle
 * @throws {403} DAILY_LIMIT_REACHED - User reached daily puzzle limit
 * @throws {401} UNAUTHENTICATED - User not logged in
 */
export default async function handler(req, res) {
  // Implementation...
}
```

### README Updates

**Every feature MUST update README.md with:**
- What changed
- How to use it
- Configuration options
- Examples

---

## ✅ PRE-LAUNCH CHECKLIST

### Weeks Before Launch

- [ ] All core features implemented and tested
- [ ] Database schema finalized (migrations tested)
- [ ] Authentication working (Clerk integration)
- [ ] Payment processing working (Stripe test mode)
- [ ] Error handling implemented across all endpoints
- [ ] Rate limiting enabled
- [ ] Security audit completed
- [ ] Performance testing done (1K concurrent users)
- [ ] Mobile responsiveness verified
- [ ] Cross-browser testing (Chrome, Safari, Firefox, Edge)
- [ ] Analytics configured (PostHog)
- [ ] Monitoring dashboards created
- [ ] Documentation complete (all specs up-to-date)
- [ ] Legal pages (Privacy Policy, Terms of Service)

### Week Before Launch

- [ ] Production environment variables configured
- [ ] Database backups verified (Neon automatic backups)
- [ ] DNS configured (domain pointing to Vercel)
- [ ] SSL certificate verified (Vercel automatic SSL)
- [ ] CDN cache configured
- [ ] Email notifications tested (SendGrid, Resend, etc.)
- [ ] Customer support system ready (email/Discord)
- [ ] Launch announcement drafted (Reddit, social media)
- [ ] Beta testers notified

### Day of Launch

- [ ] Final production deployment
- [ ] Smoke tests pass
- [ ] Monitoring dashboards live
- [ ] Support channels monitored
- [ ] Launch announcement posted
- [ ] Monitor error rates (should be <1%)
- [ ] Monitor sign-up flow (track drop-offs)

### Day After Launch

- [ ] Review analytics (signups, completions, errors)
- [ ] Check user feedback
- [ ] Fix critical bugs (if any)
- [ ] Thank beta testers
- [ ] Plan first iteration based on feedback

---

## 🎯 PERFORMANCE OPTIMIZATION

### Database Query Optimization

```javascript
// ❌ BAD: N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const completions = await prisma.userPuzzleCompletion.count({
    where: { user_id: user.id }
  });
}

// ✅ GOOD: Single query with aggregation
const users = await prisma.user.findMany({
  include: {
    _count: {
      select: { puzzle_completions: true }
    }
  }
});
```

### Caching Strategy

```javascript
// Cache expensive computations
import { kv } from '@vercel/kv';

async function getLeaderboard(type, variant) {
  const cacheKey = `leaderboard:${type}:${variant}`;

  // Check cache first
  const cached = await kv.get(cacheKey);
  if (cached) return cached;

  // Compute leaderboard (expensive)
  const leaderboard = await computeLeaderboard(type, variant);

  // Cache for 5 minutes
  await kv.setex(cacheKey, 300, JSON.stringify(leaderboard));

  return leaderboard;
}
```

### Image Optimization

```javascript
// Use Next.js Image component (automatic optimization)
import Image from 'next/image';

<Image
  src="/achievement-badge.png"
  width={64}
  height={64}
  alt="Achievement Badge"
  loading="lazy"
/>
```

---

**Quality is not an act, it is a habit. Build good habits early, and they'll carry you through the project.**
