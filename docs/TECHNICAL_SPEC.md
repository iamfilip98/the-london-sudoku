# 🏗️ TECHNICAL SPECIFICATION
## The London Sudoku - Complete Architecture

**Version**: 1.0
**Last Updated**: November 2025
**Status**: Master Reference Document

---

## 📋 TABLE OF CONTENTS

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [API Design](#api-design)
5. [Authentication Flow](#authentication-flow)
6. [Daily Puzzle System](#daily-puzzle-system)
7. [Battle Pass System](#battle-pass-system)
8. [Monetization](#monetization)
9. [Leaderboard System](#leaderboard-system)
10. [Frontend Architecture](#frontend-architecture)
11. [Caching Strategy](#caching-strategy)
12. [Analytics & Tracking](#analytics--tracking)
13. [Security](#security)
14. [Deployment](#deployment)

---

## 🏛️ SYSTEM ARCHITECTURE

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│              (Desktop, Mobile Web, PWA)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VERCEL EDGE NETWORK                           │
│                  (CDN, SSL, DDoS Protection)                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Frontend   │ │  Serverless  │ │   Vercel     │
│   (Static)   │ │     APIs     │ │     Blob     │
│   HTML/CSS   │ │   /api/*     │ │   (Assets)   │
│     JS       │ │  Node.js     │ │   Avatars    │
└──────────────┘ └──────┬───────┘ └──────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│     Neon     │ │  Vercel KV   │ │   PostHog    │
│  PostgreSQL  │ │   (Redis)    │ │  Analytics   │
│   Database   │ │  Leaderboards│ │   Tracking   │
└──────────────┘ └──────────────┘ └──────────────┘
        │
        ▼
┌──────────────┐
│    Clerk     │
│     Auth     │
│  Users/Auth  │
└──────────────┘
        │
        ▼
┌──────────────┐
│    Stripe    │
│   Payments   │
│Subscriptions │
└──────────────┘
```

---

## 🛠️ TECHNOLOGY STACK

### Frontend
```javascript
{
  "core": "Vanilla JavaScript (ES6+)",
  "styling": "CSS3 (Glassmorphism, CSS Variables)",
  "bundler": "None (direct deployment)",
  "responsiveness": "CSS Media Queries",
  "compatibility": "Modern browsers (Chrome, Firefox, Safari, Edge)"
}
```

**Why Vanilla JS?**
- ✅ Zero dependencies (fast, no bloat)
- ✅ Easy to maintain
- ✅ No build step needed
- ✅ Perfect for our use case

### Backend
```javascript
{
  "runtime": "Node.js 18+",
  "hosting": "Vercel Serverless Functions",
  "api_style": "RESTful",
  "authentication": "Clerk SDK",
  "payments": "Stripe SDK",
  "database_client": "@neondatabase/serverless",
  "redis_client": "@vercel/kv"
}
```

### Database & Infrastructure
```javascript
{
  "database": "Neon Postgres (Serverless)",
  "cache": "Vercel KV (Redis)",
  "storage": "Vercel Blob",
  "cdn": "Vercel Edge Network",
  "analytics": "PostHog",
  "auth": "Clerk",
  "payments": "Stripe",
  "ads": "Google AdMob (rewarded video)",
  "email": "Resend (future)"
}
```

---

## 🗄️ DATABASE ARCHITECTURE

See `DATABASE_SCHEMA.sql` for complete schema.

### Core Tables

**Users & Auth**:
- `users` - User accounts, profiles, subscription status
- `sessions` - Clerk manages sessions (not stored in DB)

**Puzzles**:
- `daily_puzzles` - Official daily puzzles (everyone plays same)
- `puzzles` - Practice puzzle library (10K+ pre-generated)
- `user_puzzle_completions` - Track which puzzles solved
- `game_states` - In-progress games (auto-save)

**Leaderboards**:
- Redis for real-time leaderboards (sorted sets)
- `leaderboard_snapshots` - Daily/weekly/monthly winners (archived)

**Battle Pass**:
- `battle_pass_seasons` - Season metadata (start, end dates)
- `battle_pass_tiers` - Tier definitions and rewards
- `user_battle_pass_progress` - User XP and tier progress
- `user_inventory` - Owned themes, badges, avatars

**Social**:
- `friendships` - Friend relationships
- `leagues` - Official and custom leagues (future)
- `league_members` - League participation (future)

**Monetization**:
- `subscriptions` - Stripe subscription tracking
- `purchases` - One-time purchases (battle pass, tokens)
- `transactions` - Payment history

**Analytics**:
- `entries` - Daily competition results (legacy, keep for stats)
- `achievements` - Achievement tracking
- `streaks` - Win streak tracking
- `stats` - Flexible JSON storage

### Indexes

**Critical indexes for performance**:
```sql
-- User lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);

-- Daily puzzle fetching
CREATE INDEX idx_daily_puzzles_date_variant ON daily_puzzles(puzzle_date, variant, difficulty);

-- Practice puzzle selection
CREATE INDEX idx_puzzles_variant_difficulty ON puzzles(variant, difficulty) WHERE used_as_daily = false;

-- Leaderboard queries
CREATE INDEX idx_user_completions_date ON user_puzzle_completions(completed_at DESC);
CREATE INDEX idx_user_completions_user ON user_puzzle_completions(user_id, completed_at DESC);

-- Battle pass progress
CREATE INDEX idx_battle_pass_user_season ON user_battle_pass_progress(user_id, season_id);
```

---

## 🔌 API DESIGN

### RESTful Endpoints

All APIs in `/api/*.js` (Vercel serverless functions)

#### **Authentication** (Clerk Middleware)
```javascript
// Protected route example
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... rest of logic
}
```

#### **Daily Puzzles**
```
GET  /api/daily-puzzles
     → Returns today's official puzzles (all variants)
     → Response: { classic: {easy, medium, hard}, xsudoku: {...}, killer: {...} }
     → Cache: 1 hour

POST /api/daily-puzzles/complete
     → Submit daily puzzle completion
     → Body: { variant, difficulty, time_seconds, errors, hints }
     → Updates leaderboard + user stats
```

#### **Practice Puzzles** (Premium only)
```
GET  /api/practice-puzzle?variant=classic&difficulty=easy
     → Returns random practice puzzle
     → Checks Premium status
     → Returns unused puzzle from library

POST /api/practice-puzzle/complete
     → Submit practice puzzle completion
     → Does NOT update leaderboards
```

#### **Leaderboards**
```
GET  /api/leaderboards/daily?variant=classic&difficulty=easy
     → Top 100 for today's puzzle
     → Source: Redis sorted set

GET  /api/leaderboards/weekly?type=overall
     → Weekly combined leaderboard

GET  /api/leaderboards/friends
     → User's friends leaderboard
     → Requires: userId
```

#### **Battle Pass**
```
GET  /api/battle-pass/progress
     → User's current season progress
     → Returns: { season, tier, xp, next_reward }

POST /api/battle-pass/claim-reward
     → Claim tier reward
     → Body: { tier }
     → Adds item to user_inventory

GET  /api/battle-pass/season
     → Current season details + all tiers/rewards
```

#### **Subscriptions** (Stripe)
```
POST /api/subscription/create-checkout
     → Create Stripe checkout session
     → Returns: { checkout_url }

POST /api/subscription/webhook
     → Stripe webhook handler
     → Events: subscription.created, subscription.updated, subscription.deleted
     → Updates users.subscription_tier

GET  /api/subscription/portal
     → Create Stripe Customer Portal session
     → Returns: { portal_url }
```

#### **Rewarded Ads**
```
POST /api/ads/reward
     → Verify ad watched (server-side validation)
     → Grant bonus puzzle token
     → Track in user stats
```

### Error Handling

All APIs follow consistent error format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (Premium required)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

---

## 🔐 AUTHENTICATION FLOW

### Clerk Integration

**Sign Up Flow**:
```
1. User clicks "Sign Up"
2. Clerk modal opens (email + password or social)
3. Clerk creates user account
4. Webhook → /api/clerk/webhook (user.created event)
5. Create user record in our DB (users table)
6. Redirect to onboarding/profile setup
```

**Sign In Flow**:
```
1. User clicks "Sign In"
2. Clerk modal opens
3. Clerk authenticates
4. Session cookie set
5. Redirect to dashboard
```

**Session Management**:
- Clerk manages sessions (JWT tokens)
- All API routes check: `const { userId } = getAuth(req);`
- Frontend checks: `const user = await clerk.user.getCurrent();`

**Anonymous Play**:
```
1. User plays without account (session storage)
2. After first puzzle: Modal "Save your progress!"
3. If they sign up: Migrate session data to account
4. If they dismiss: Keep playing anonymous (3-day limit)
```

---

## 🎯 DAILY PUZZLE SYSTEM

See `DAILY_PUZZLE_SYSTEM.md` for complete spec.

### Generation (11 PM Daily Cron)

**Cron Job**: `/api/generate-tomorrow` (Vercel Cron)
```
Schedule: 0 23 * * * (11 PM UTC)

Process:
1. Generate 1 Easy Classic puzzle
2. Generate 1 Medium Classic puzzle
3. Generate 1 Hard Classic puzzle
4. Validate all puzzles (difficulty check)
5. Store in daily_puzzles table
6. Clear Redis cache for tomorrow
7. (Future) Generate X-Sudoku, Killer, etc.
```

### Serving Puzzles

**API**: `/api/daily-puzzles`
```javascript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Fetch from DB (cached 1 hour)
const puzzles = await db.query(`
  SELECT variant, difficulty, puzzle, id
  FROM daily_puzzles
  WHERE puzzle_date = $1
`, [today]);

// Group by variant
const response = {
  classic: {
    easy: puzzles.find(p => p.variant === 'classic' && p.difficulty === 'easy'),
    medium: puzzles.find(p => p.variant === 'classic' && p.difficulty === 'medium'),
    hard: puzzles.find(p => p.variant === 'classic' && p.difficulty === 'hard'),
  },
  xsudoku: { ... }, // when launched
  killer: { ... }    // when launched
};
```

### Completion Tracking

**API**: `/api/daily-puzzles/complete`
```javascript
POST /api/daily-puzzles/complete
{
  "puzzle_id": 12345,
  "variant": "classic",
  "difficulty": "easy",
  "time_seconds": 187,
  "errors": 0,
  "hints": 1,
  "final_state": "[[5,3,4,...]]"
}

Process:
1. Validate puzzle_id matches today's puzzle
2. Check if user already completed (prevent duplicates)
3. Calculate score
4. Update leaderboard (Redis sorted set)
5. Grant XP (battle pass)
6. Check for achievements
7. Update user stats
```

---

## 🎮 BATTLE PASS SYSTEM

See `BATTLE_PASS_MECHANICS.md` for complete spec.

### XP Calculation

```javascript
const XP_SOURCES = {
  // Puzzle completions
  puzzle_easy: 50,
  puzzle_medium: 100,
  puzzle_hard: 150,
  puzzle_killer: 200,

  // Bonuses
  perfect_game: 25,      // No errors, no hints
  daily_streak: 10,      // Per consecutive day
  first_daily: 20,       // First puzzle of the day

  // Achievements
  achievement_common: 10,
  achievement_rare: 25,
  achievement_epic: 50,
  achievement_legendary: 100,

  // Social
  friend_challenge_win: 50,

  // Educational
  tutorial_complete: 75,
  quiz_perfect: 50
};

// Premium multiplier
const xpMultiplier = user.isPremium ? 1.5 : 1.0;
const finalXP = baseXP * xpMultiplier;
```

### Tier Progression

**100 Tiers per Season** (90 days)
```javascript
// XP required per tier (exponential curve)
function getTierXP(tier) {
  if (tier <= 10) return 100 * tier;
  if (tier <= 50) return 150 * tier;
  if (tier <= 80) return 200 * tier;
  return 250 * tier;
}

// Total XP to max out: ~150,000 XP
// Casual player (5 puzzles/day): ~50 days to tier 100
// Hardcore player (15 puzzles/day): ~20 days to tier 100
```

---

## 💰 MONETIZATION

See `MONETIZATION_LOGIC.md` for complete spec.

### Premium Subscription ($4.99/mo)

**Includes**:
- ✅ Unlimited practice puzzles
- ✅ Ad-free experience
- ✅ Full battle pass (all rewards)
- ✅ +50% XP bonus
- ✅ All variants unlocked
- ✅ Advanced statistics
- ✅ Priority support

**Stripe Integration**:
```javascript
// Create checkout session
const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{
    price: process.env.STRIPE_PREMIUM_PRICE_ID,
    quantity: 1,
  }],
  success_url: 'https://thelondonsudoku.com/welcome-premium',
  cancel_url: 'https://thelondonsudoku.com/pricing',
});
```

**Webhook Handling**:
```javascript
// /api/subscription/webhook
stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

switch (event.type) {
  case 'customer.subscription.created':
  case 'customer.subscription.updated':
    await updateUserSubscription(customerId, 'premium', subscription.current_period_end);
    break;

  case 'customer.subscription.deleted':
    await updateUserSubscription(customerId, 'free', null);
    break;
}
```

### Ads (Free Users)

**Google AdMob** (rewarded video):
```html
<!-- AdMob SDK -->
<script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>

<!-- Rewarded video placement -->
<div id="rewarded-ad-container"></div>
```

**Placement Strategy**:
- Banner ad (top of page, persistent)
- Sidebar ad (desktop only)
- Rewarded video (opt-in after daily limit)

**Frequency**:
- Free users see ads on every page
- Rewarded video: Max 3 per day
- No interstitials (too intrusive)

### Ad Block Handling

```javascript
// Detection (non-invasive)
if (typeof window.adsbygoogle === 'undefined' && !user.isPremium) {
  showBanner({
    type: 'info',
    message: 'Ad blocker detected. Consider whitelisting us or upgrading to Premium!',
    dismissible: true
  });
}

// NO feature blocking, NO popups, just polite request
```

---

## 📊 LEADERBOARD SYSTEM

### Redis Implementation

**Data Structure**: Sorted Sets (Z-commands)
```javascript
// Daily leaderboard (classic easy)
Key: leaderboard:daily:2025-11-08:classic:easy
Score: time_seconds (lower is better)
Member: userId

// Add to leaderboard
await redis.zadd(
  `leaderboard:daily:${today}:${variant}:${difficulty}`,
  time_seconds,
  userId
);

// Get top 100
const topPlayers = await redis.zrange(
  `leaderboard:daily:${today}:classic:easy`,
  0,
  99,
  'WITHSCORES'
);

// Get user's rank
const rank = await redis.zrank(
  `leaderboard:daily:${today}:classic:easy`,
  userId
);
```

**Leaderboard Types**:
1. **Daily** - Reset at midnight UTC
2. **Weekly** - Reset Monday 00:00 UTC
3. **Monthly** - Reset 1st of month
4. **All-Time** - Never resets

**Archiving**:
- At end of day: snapshot top 100 to `leaderboard_snapshots` table
- Redis keys expire after 90 days (auto-cleanup)

---

## 🎨 FRONTEND ARCHITECTURE

### File Structure
```
/
├── index.html          # Dashboard
├── auth.html           # Login/signup (Clerk)
├── game.html           # Sudoku game board (variant-agnostic)
├── leaderboards.html   # Leaderboard display
├── battle-pass.html    # Battle pass UI
├── profile.html        # User profile
├── settings.html       # User settings
├── tutorials.html      # Educational content
├── pricing.html        # Premium upsell
├── css/
│   ├── main.css       # Global styles
│   ├── game.css       # Game board styles
│   └── themes/        # User-selectable themes
│       ├── default.css
│       ├── dark.css
│       └── ...
├── js/
│   ├── app.js         # Main app logic
│   ├── sudoku.js      # Game engine (all variants)
│   ├── achievements.js
│   ├── leaderboards.js
│   ├── battle-pass.js
│   └── utils.js
└── api/               # Serverless functions
```

### State Management

**Local Storage** (for persistence):
```javascript
const STORAGE_KEYS = {
  currentUser: 'tls_user',
  gameState: 'tls_game_state',
  settings: 'tls_settings',
  theme: 'tls_theme'
};

// Auto-save every 10 seconds
setInterval(() => {
  saveGameState(getCurrentGameState());
}, 10000);
```

**Session Storage** (for anonymous users):
```javascript
// Before sign-up
sessionStorage.setItem('anonymous_progress', JSON.stringify(progress));

// After sign-up
const progress = JSON.parse(sessionStorage.getItem('anonymous_progress'));
await migrateAnonymousData(userId, progress);
```

---

## 🚀 CACHING STRATEGY

### Redis Cache (Vercel KV)

**What to cache**:
- ✅ Daily puzzles (1 hour TTL)
- ✅ Leaderboards (5 min TTL)
- ✅ User session data (24 hour TTL)
- ✅ Battle pass season config (24 hour TTL)

**Cache Invalidation**:
```javascript
// On new daily puzzles (11 PM)
await redis.del(`daily_puzzles:${tomorrow}`);

// On subscription change
await redis.del(`user:${userId}:subscription`);

// On battle pass tier up
await redis.del(`user:${userId}:battle_pass`);
```

### CDN Cache (Vercel Edge)

**Static assets**:
- HTML: 1 hour
- CSS: 1 year (versioned)
- JS: 1 year (versioned)
- Images: 1 year

**Cache headers**:
```javascript
res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
```

---

## 📊 ANALYTICS & TRACKING

### PostHog Events

**Track everything**:
```javascript
// User actions
posthog.capture('puzzle_started', { variant, difficulty });
posthog.capture('puzzle_completed', { variant, difficulty, time, errors });
posthog.capture('premium_signup', { plan, price });
posthog.capture('ad_watched', { type: 'rewarded_video' });

// Funnels
posthog.capture('signup_started');
posthog.capture('signup_completed');
posthog.capture('first_puzzle_started');
posthog.capture('first_puzzle_completed');

// A/B testing
const variant = posthog.getFeatureFlag('pricing_test'); // 'control' or 'test'
```

**Session Replay**:
- Enabled for all users
- Privacy: Mask sensitive data (emails, passwords)
- Useful for debugging UX issues

---

## 🔒 SECURITY

### Authentication
- ✅ Clerk handles all auth (industry best practices)
- ✅ JWT tokens for session management
- ✅ HTTPS only (enforced by Vercel)

### API Security
```javascript
// Rate limiting (Vercel KV)
const userKey = `ratelimit:${userId}:${endpoint}`;
const requests = await redis.incr(userKey);
if (requests === 1) await redis.expire(userKey, 60); // 60 sec window
if (requests > 100) return res.status(429).json({ error: 'Rate limited' });

// Input validation
const { variant, difficulty } = req.body;
if (!['classic', 'xsudoku', 'killer'].includes(variant)) {
  return res.status(400).json({ error: 'Invalid variant' });
}

// SQL injection prevention
await db.query('SELECT * FROM users WHERE id = $1', [userId]); // Parameterized
```

### Payment Security
- ✅ Stripe handles all payment data (PCI compliant)
- ✅ Never store credit card info
- ✅ Webhook signature verification

### GDPR Compliance
- ✅ Privacy Policy + Terms of Service
- ✅ Cookie consent banner
- ✅ User data export (Clerk provides)
- ✅ User data deletion (Clerk provides)

---

## 🚀 DEPLOYMENT

### Vercel Configuration

**vercel.json**:
```json
{
  "crons": [{
    "path": "/api/generate-tomorrow",
    "schedule": "0 23 * * *"
  }],
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "X-Content-Type-Options", "value": "nosniff" }
    ]
  }]
}
```

### Environment Variables

**Required**:
```bash
# Database
DATABASE_URL=postgresql://...         # Neon connection string

# Redis
KV_REST_API_URL=https://...          # Vercel KV
KV_REST_API_TOKEN=...

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_WEBHOOK_SECRET=whsec_...

# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# AdMob
ADMOB_PUBLISHER_ID=ca-pub-...
```

### Deployment Process

```bash
# 1. Push to GitHub
git push origin main

# 2. Vercel auto-deploys (connected to GitHub)
# 3. Run migrations if needed
npm run migrate

# 4. Verify deployment
npm run test:e2e
```

---

## ✅ DESIGN PRINCIPLES

1. **Performance First**: <3s load time, <100ms API response
2. **Mobile-First**: 50%+ users on mobile
3. **Progressive Enhancement**: Works without JS (basic functionality)
4. **Accessibility**: WCAG 2.1 AA compliant
5. **Privacy-Focused**: Minimal data collection, GDPR compliant
6. **Scalable**: Handles 10K+ concurrent users
7. **Maintainable**: Clear code, comprehensive docs, automated tests

---

**This document is the master reference. All implementation must align with this spec.**
