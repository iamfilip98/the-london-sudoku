# Phase 0 Month 2: Clerk Authentication + PostHog Analytics

## Overview
Migrate from basic auth to Clerk (enterprise authentication) and add PostHog analytics.

**Timeline:** 2-3 weeks
**Effort:** 20-30 hours

---

## Part 1: Clerk Authentication Setup

### Why Clerk?
- ✅ 10,000 free users (vs 2 with current system)
- ✅ Social login (Google, GitHub, etc.)
- ✅ Email verification
- ✅ Password reset
- ✅ Session management
- ✅ Security built-in

### Step 1: Create Clerk Account (5 minutes)

1. Go to https://clerk.com
2. Sign up with GitHub
3. Create application: "The London Sudoku"
4. Choose authentication methods:
   - ✅ Email/Password
   - ✅ Google
   - ✅ GitHub
5. Copy API keys (we'll need these)

---

### Step 2: Install Clerk SDK

**For vanilla JavaScript projects**, use `@clerk/clerk-js`:

```bash
npm install @clerk/clerk-js
```

**NOT** `@clerk/nextjs` (that's for Next.js only)

---

### Step 3: Frontend Integration

#### Update `auth.html`:

Replace current login form with Clerk's pre-built components:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login - The London Sudoku</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="auth-container">
    <h1>Welcome to The London Sudoku</h1>

    <!-- Clerk Sign In Component -->
    <div id="clerk-signin"></div>
  </div>

  <!-- Clerk SDK -->
  <script src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"></script>

  <script>
    // Initialize Clerk
    const clerk = window.Clerk;

    clerk.load({
      publishableKey: 'pk_live_YOUR_KEY_HERE'
    }).then(() => {
      // Mount sign-in component
      clerk.mountSignIn(document.getElementById('clerk-signin'), {
        afterSignInUrl: '/',
        signUpUrl: '/signup.html'
      });
    });
  </script>
</body>
</html>
```

#### Create `signup.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Sign Up - The London Sudoku</title>
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <div class="auth-container">
    <h1>Create Your Account</h1>

    <!-- Clerk Sign Up Component -->
    <div id="clerk-signup"></div>
  </div>

  <script src="https://[your-clerk-frontend-api].clerk.accounts.dev/npm/@clerk/clerk-js@latest/dist/clerk.browser.js"></script>

  <script>
    const clerk = window.Clerk;

    clerk.load({
      publishableKey: 'pk_live_YOUR_KEY_HERE'
    }).then(() => {
      clerk.mountSignUp(document.getElementById('clerk-signup'), {
        afterSignUpUrl: '/',
        signInUrl: '/auth.html'
      });
    });
  </script>
</body>
</html>
```

---

### Step 4: Protect API Routes

Create `lib/clerk-auth.js` for server-side verification:

```javascript
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const clerk = ClerkExpressWithAuth({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Verify Clerk session token
 */
async function verifyClerkToken(req) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const session = await clerk.sessions.verifySession(token);
    return session.userId;
  } catch (error) {
    throw new Error('Invalid authentication token');
  }
}

/**
 * Get user from Clerk ID
 */
async function getUserFromClerkId(clerkId) {
  const pool = require('./db-pool');

  const result = await pool.query(
    'SELECT * FROM users WHERE clerk_id = $1',
    [clerkId]
  );

  if (result.rows.length === 0) {
    // User exists in Clerk but not in our DB - create them
    const user = await createUserFromClerk(clerkId);
    return user;
  }

  return result.rows[0];
}

/**
 * Create user in our database from Clerk user
 */
async function createUserFromClerk(clerkId) {
  const pool = require('./db-pool');
  const clerkUser = await clerk.users.getUser(clerkId);

  const result = await pool.query(
    `INSERT INTO users (
      clerk_id,
      username,
      email,
      display_name,
      email_verified,
      subscription_tier
    ) VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      clerkId,
      clerkUser.username || clerkUser.id.substring(0, 12),
      clerkUser.emailAddresses[0]?.emailAddress,
      clerkUser.firstName || clerkUser.username,
      clerkUser.emailAddresses[0]?.verification?.status === 'verified',
      'free'
    ]
  );

  return result.rows[0];
}

module.exports = {
  verifyClerkToken,
  getUserFromClerkId,
  createUserFromClerk
};
```

---

### Step 5: Update Protected API Endpoints

Example: `api/games.js`

**BEFORE:**
```javascript
// Old basic auth
const username = req.headers['x-username'];
if (!username) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

**AFTER:**
```javascript
const { verifyClerkToken, getUserFromClerkId } = require('../lib/clerk-auth');

try {
  const clerkId = await verifyClerkToken(req);
  const user = await getUserFromClerkId(clerkId);

  // Now you have the authenticated user
  // ... rest of your logic
} catch (error) {
  return res.status(401).json({ error: 'Unauthorized' });
}
```

---

### Step 6: Migration Strategy

**For existing users (Filip & Faidao):**

Option A: **Manual Migration** (Recommended for 2 users)
1. Have them sign up with Clerk using their email
2. You manually link their Clerk ID to existing database records
3. Run: `UPDATE users SET clerk_id = 'user_xxx' WHERE username = 'filip'`

Option B: **Automated Migration** (Overkill for 2 users)
- Create script to invite users via Clerk API
- Send password reset emails
- They complete setup

**For new users:**
- They sign up via Clerk
- Auto-created in database on first login

---

## Part 2: PostHog Analytics

### Step 1: Create PostHog Account (5 minutes)

1. Go to https://posthog.com
2. Sign up (free tier: 1M events/month)
3. Create project: "The London Sudoku"
4. Copy API key

---

### Step 2: Frontend Integration

The monitoring library is already created (`lib/monitoring.js`), just need to initialize it:

#### Update `index.html`:

```html
<head>
  <!-- Existing head content -->

  <!-- PostHog -->
  <script>
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys onSessionId".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init('phc_YOUR_API_KEY_HERE', {
      api_host: 'https://app.posthog.com',
      autocapture: false,
      disable_session_recording: true,
      persistence: 'localStorage'
    });
  </script>

  <script src="/lib/monitoring.js"></script>
</head>
```

---

### Step 3: Track Key Events

**Already implemented in `lib/monitoring.js`!** Just use it:

```javascript
// On puzzle completion
Monitoring.trackPuzzleCompletion({
  variant: 'classic',
  difficulty: 'medium',
  time: 234,
  errors: 2,
  hints: 1,
  score: 876
});

// On user action
Monitoring.trackEvent('hint_used', {
  difficulty: 'hard',
  cell_position: 'A5'
});

// On errors
Monitoring.trackError(new Error('Failed to load puzzle'), {
  difficulty: 'easy',
  date: '2025-11-09'
});
```

---

## Environment Variables Needed

Add to Vercel:

```bash
# Clerk
CLERK_PUBLISHABLE_KEY=pk_live_xxxxx
CLERK_SECRET_KEY=sk_live_xxxxx

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

---

## Testing Checklist

### Clerk Authentication:
- [ ] User can sign up with email
- [ ] User can sign up with Google
- [ ] User can sign up with GitHub
- [ ] User can log in
- [ ] User can reset password
- [ ] Session persists across page reloads
- [ ] Protected API endpoints reject unauthenticated requests
- [ ] Filip & Faidao can migrate their accounts

### PostHog Analytics:
- [ ] Events appear in PostHog dashboard
- [ ] Puzzle completions tracked
- [ ] Errors tracked
- [ ] User properties set correctly
- [ ] No PII (passwords, emails) in events

---

## Rollback Plan

If Clerk breaks:
1. Revert `auth.html` to old version
2. Revert API endpoints to basic auth
3. Redeploy
4. Max downtime: 10 minutes

---

## Success Criteria

✅ Users can sign up with social login
✅ Users can log in/out seamlessly
✅ Protected routes work correctly
✅ PostHog tracking all key events
✅ Zero security vulnerabilities
✅ Filip & Faidao migrated successfully

---

## Next Steps

**After completion:**
- Phase 0 Month 3: Vercel Blob + Anonymous Play
- Phase 1: Soft Launch (100 users)
- Phase 2: Monetization ($4.99/month Premium)
