# 🔐 RATE LIMITING & SECURITY STRATEGY

**Purpose**: Prevent abuse, protect infrastructure, ensure security best practices
**Version**: 1.0
**Last Updated**: November 2025

---

## 🎯 WHY RATE LIMITING IS CRITICAL

**Without rate limiting:**
- ❌ Bots can scrape all daily puzzles
- ❌ Malicious users can spam API endpoints
- ❌ DDoS attacks can take down the site
- ❌ Database gets overwhelmed
- ❌ Hosting costs explode

**With rate limiting:**
- ✅ Legitimate users unaffected
- ✅ Bots and scrapers blocked
- ✅ Infrastructure protected
- ✅ Predictable costs

---

## 📊 RATE LIMIT TIERS

### Global Limits (Per IP Address)

```javascript
const GLOBAL_RATE_LIMITS = {
  // General browsing
  web_requests: {
    window: '15 minutes',
    max: 1000,           // 1000 requests per 15 min = ~1 req/sec avg
    message: 'Too many requests. Please slow down.'
  },

  // API requests (stricter)
  api_requests: {
    window: '15 minutes',
    max: 300,            // 300 API calls per 15 min
    message: 'API rate limit exceeded. Please wait before retrying.'
  }
};
```

### Endpoint-Specific Limits (Per User)

```javascript
const ENDPOINT_RATE_LIMITS = {
  // Authentication (prevent brute force)
  '/api/auth/login': {
    window: '15 minutes',
    max: 5,              // 5 login attempts per 15 min
    block_duration: '1 hour',
    message: 'Too many login attempts. Try again in 1 hour.'
  },

  '/api/auth/signup': {
    window: '1 hour',
    max: 3,              // 3 signups per hour per IP
    message: 'Too many signup attempts. Please try again later.'
  },

  '/api/auth/reset-password': {
    window: '1 hour',
    max: 3,
    message: 'Too many password reset requests.'
  },

  // Daily puzzles (business logic + rate limit)
  '/api/daily-puzzles': {
    window: '1 minute',
    max: 10,             // Prevent rapid polling
    message: 'Please wait before refreshing puzzles.'
  },

  '/api/daily-puzzles/complete': {
    window: '1 minute',
    max: 5,              // Max 5 completions per minute (suspicious if higher)
    message: 'Too many puzzle completions. Please slow down.'
  },

  // Practice puzzles (prevent scraping)
  '/api/practice/generate': {
    window: '1 minute',
    max: 10,             // Premium users can generate quickly, but not infinite
    message: 'Generating puzzles too quickly. Please wait.'
  },

  // Leaderboards
  '/api/leaderboards': {
    window: '1 minute',
    max: 30,             // Allow frequent checking (competitive users)
    message: 'Leaderboard updates limited. Please wait.'
  },

  // Subscriptions (expensive Stripe calls)
  '/api/subscription/create-checkout': {
    window: '5 minutes',
    max: 5,              // 5 checkout attempts per 5 min
    message: 'Too many checkout attempts. Please try again shortly.'
  },

  // Admin endpoints (strictest)
  '/api/admin/*': {
    window: '1 minute',
    max: 60,
    message: 'Admin rate limit exceeded.'
  }
};
```

---

## 🛠️ RATE LIMITING IMPLEMENTATION

### Using Vercel KV (Redis)

```javascript
// lib/rateLimit.js
import { kv } from '@vercel/kv';

export async function rateLimit(identifier, limit, windowSeconds) {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);

  // Remove old entries
  await kv.zremrangebyscore(key, 0, windowStart);

  // Count requests in current window
  const count = await kv.zcard(key);

  if (count >= limit) {
    const oldest = await kv.zrange(key, 0, 0, { withScores: true });
    const resetTime = oldest[1] + (windowSeconds * 1000);
    const retryAfter = Math.ceil((resetTime - now) / 1000);

    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
      retryAfter
    };
  }

  // Add current request
  await kv.zadd(key, { score: now, member: now });
  await kv.expire(key, windowSeconds);

  return {
    success: true,
    limit,
    remaining: limit - count - 1,
    reset: now + (windowSeconds * 1000)
  };
}

// Middleware wrapper
export function withRateLimit(limit, windowSeconds) {
  return async (req, res, next) => {
    const identifier = `${req.ip || req.headers['x-forwarded-for']}:${req.url}`;
    const result = await rateLimit(identifier, limit, windowSeconds);

    // Add rate limit headers (standard practice)
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', result.reset);

    if (!result.success) {
      res.setHeader('Retry-After', result.retryAfter);
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests',
          retry_after: result.retryAfter
        }
      });
    }

    next();
  };
}
```

### Usage in API Routes

```javascript
// /api/auth/login.js
import { withRateLimit } from '@/lib/rateLimit';

export default withRateLimit(5, 900)(async function handler(req, res) {
  // 5 requests per 15 minutes (900 seconds)
  const { email, password } = req.body;

  // Process login...
});
```

### IP-Based vs User-Based Rate Limiting

```javascript
// IP-based (before authentication)
const ipRateLimit = withRateLimit(getIdentifier(req, 'ip'), 100, 60);

// User-based (after authentication)
const userRateLimit = withRateLimit(getIdentifier(req, 'user'), 1000, 3600);

function getIdentifier(req, type) {
  if (type === 'ip') {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
  if (type === 'user') {
    const { userId } = getAuth(req);
    return userId ? `user:${userId}` : `ip:${req.ip}`;
  }
}
```

---

## 🛡️ SECURITY BEST PRACTICES

### 1. SQL Injection Prevention

**ALWAYS use parameterized queries:**

```javascript
// ✅ SAFE: Parameterized query
const result = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ❌ UNSAFE: String concatenation (SQL injection risk!)
const result = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

**Use an ORM or query builder** (Prisma, Drizzle, Kysely):

```javascript
// Prisma (automatically parameterized)
const user = await prisma.user.findUnique({
  where: { email }
});
```

### 2. XSS (Cross-Site Scripting) Prevention

**React handles most XSS automatically**, but be careful with:

```javascript
// ✅ SAFE: React auto-escapes
<div>{user.bio}</div>

// ❌ UNSAFE: dangerouslySetInnerHTML (use only with sanitization)
<div dangerouslySetInnerHTML={{ __html: user.bio }} />

// ✅ SAFE: Sanitize before rendering
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(user.bio) }} />
```

**Sanitize user input on the server:**

```javascript
import validator from 'validator';

function sanitizeUserInput(input) {
  return validator.escape(input.trim());
}

// Usage
const bio = sanitizeUserInput(req.body.bio);
await db.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId]);
```

### 3. CSRF (Cross-Site Request Forgery) Prevention

**Next.js API routes are CSRF-protected by default**, but ensure:

```javascript
// Verify origin header for state-changing requests
export default async function handler(req, res) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
    const origin = req.headers.origin || req.headers.referer;
    const allowedOrigins = [process.env.BASE_URL, 'https://thelondonsudoku.com'];

    if (!origin || !allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      return res.status(403).json({ error: 'Invalid origin' });
    }
  }

  // Process request...
}
```

### 4. Authentication & Authorization

**Clerk handles auth securely**, but always verify:

```javascript
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  // 1. Verify user is authenticated
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Verify user owns the resource
  const puzzle = await getPuzzle(req.query.puzzleId);
  if (puzzle.user_id !== userId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 3. Verify user has required subscription
  const user = await getUser(userId);
  if (!user.subscription_tier === 'premium' && puzzle.variant !== 'classic') {
    return res.status(403).json({ error: 'Premium subscription required' });
  }

  // Process request...
}
```

### 5. Environment Variables & Secrets

**NEVER commit secrets to git:**

```bash
# .env.local (NEVER commit this file!)
DATABASE_URL=postgresql://user:password@host/db
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx
```

**Use Vercel environment variables** (encrypted at rest):

```bash
# Deploy-time variables
vercel env add DATABASE_URL production
vercel env add STRIPE_SECRET_KEY production
```

**Access safely in code:**

```javascript
// ✅ SAFE: Server-side only
const stripeKey = process.env.STRIPE_SECRET_KEY;

// ❌ UNSAFE: Never expose secrets to client
// Public keys only (NEXT_PUBLIC_* prefix)
const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
```

### 6. Webhook Signature Verification (Stripe)

**ALWAYS verify webhook signatures:**

```javascript
// /api/subscription/webhook.js
import { buffer } from 'micro';
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    // Verify signature (prevents fake webhooks)
    event = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Process verified event...
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object);
      break;
  }

  return res.status(200).json({ received: true });
}
```

### 7. Input Validation (Zod)

**Validate all user input:**

```javascript
import { z } from 'zod';

const completePuzzleSchema = z.object({
  daily_puzzle_id: z.number().int().positive(),
  time_seconds: z.number().int().min(0).max(7200), // Max 2 hours
  errors: z.number().int().min(0).max(100),
  hints: z.number().int().min(0).max(81),
  solution: z.array(z.array(z.number().int().min(1).max(9))).length(9)
});

export default async function handler(req, res) {
  try {
    // Validate input
    const data = completePuzzleSchema.parse(req.body);

    // Process valid data...
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.errors
      });
    }
  }
}
```

### 8. Content Security Policy (CSP)

**Add CSP headers to prevent XSS:**

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.clerk.com https://js.stripe.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "connect-src 'self' https://api.stripe.com https://clerk.thelondonsudoku.com https://www.google-analytics.com"
            ].join('; ')
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

---

## 🚨 SECURITY MONITORING

### Track Suspicious Activity

```javascript
// lib/security.js
export async function trackSuspiciousActivity(type, details) {
  await db.query(`
    INSERT INTO security_events (type, ip_address, user_id, details, created_at)
    VALUES ($1, $2, $3, $4, NOW())
  `, [type, details.ip, details.userId || null, JSON.stringify(details)]);

  // Alert if critical
  if (type === 'brute_force' || type === 'sql_injection_attempt') {
    await sendSecurityAlert(type, details);
  }
}

// Usage
if (loginAttempts > 10) {
  await trackSuspiciousActivity('brute_force', {
    ip: req.ip,
    email,
    attempts: loginAttempts
  });
}
```

### Auto-Block Malicious IPs

```javascript
const BLOCKED_IPS = new Set();

export async function checkBlockedIP(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'];

  if (BLOCKED_IPS.has(ip)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}

export async function blockIP(ip, reason, duration = 86400) {
  BLOCKED_IPS.add(ip);
  await kv.setex(`blocked_ip:${ip}`, duration, reason);

  // Log
  logger.warn('IP blocked', { ip, reason, duration });
}
```

---

## ✅ SECURITY CHECKLIST

### Before Launch
- [ ] All database queries use parameterized statements
- [ ] All user input sanitized and validated
- [ ] Rate limiting enabled on all public endpoints
- [ ] CSRF protection verified
- [ ] Stripe webhook signature verification implemented
- [ ] Environment variables secured (never committed)
- [ ] Content Security Policy headers configured
- [ ] HTTPS enforced (Vercel handles this automatically)
- [ ] Authentication/authorization on all protected endpoints
- [ ] SQL injection test performed
- [ ] XSS test performed

### Monitoring
- [ ] Track failed login attempts
- [ ] Monitor rate limit violations
- [ ] Alert on unusual traffic patterns
- [ ] Review security events weekly
- [ ] Update dependencies monthly (npm audit)

---

## 🔒 PRODUCTION SECURITY HARDENING

### 1. Database Security

```sql
-- Use read-only user for SELECT queries
CREATE USER readonly_user WITH PASSWORD 'xxx';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- Use restricted user for API
CREATE USER api_user WITH PASSWORD 'xxx';
GRANT SELECT, INSERT, UPDATE ON specific_tables TO api_user;
-- DO NOT GRANT DELETE or DROP

-- Revoke public schema privileges
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

### 2. API Key Rotation

```javascript
// Rotate Stripe keys every 90 days
// Rotate database credentials every 180 days
// Rotate Clerk keys every 180 days

// Document rotation schedule:
// - Stripe: March 1, June 1, Sept 1, Dec 1
// - Database: March 1, Sept 1
// - Clerk: March 1, Sept 1
```

### 3. Dependency Scanning

```bash
# Run weekly
npm audit
npm audit fix

# Check for outdated packages
npm outdated

# Use Snyk or Dependabot (GitHub)
```

---

**Security is not a feature. It's a requirement. Build it in from day one.**
