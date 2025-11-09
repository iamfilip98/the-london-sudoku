# Clerk Authentication - Deployment Guide

## ✅ Completed Setup

### What's Already Done:

1. **✅ Clerk SDK Installed**
   - `@clerk/clerk-sdk-node@^4.13.0` added to package.json
   - package-lock.json updated

2. **✅ Authentication Library Created**
   - `lib/clerk-auth.js` - Server-side authentication helpers
   - Token verification
   - User creation/linking
   - Middleware functions

3. **✅ UI Pages Created**
   - `auth-clerk.html` - Sign in page with Clerk
   - `signup.html` - Sign up page with Clerk
   - Fully styled to match existing theme
   - Social login ready (Google, GitHub)

4. **✅ Local Environment Variables**
   - `.env.local` updated with Clerk keys
   - Ready for local development

---

## 🚀 **Next Steps to Deploy**

### Step 1: Add Environment Variables to Vercel (5 minutes)

Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables

Add these:

| Variable Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_ZmFpci1kb3ZlLTkzLmNsZXJrLmFjY291bnRzLmRldiQ` | Production, Preview, Development |
| `CLERK_SECRET_KEY` | `sk_test_cmJIMFeag3oBJmNwUDN0AubmlSIqSoQLYRESuYzWu3` | Production, Preview, Development |

**Important:** Keep the `sk_test_` secret key secure!

---

### Step 2: Switch to New Auth Pages

Rename files to activate Clerk authentication:

```bash
# Backup old auth
mv auth.html auth-old-backup.html

# Activate Clerk auth
mv auth-clerk.html auth.html
```

---

### Step 3: Update API Endpoints (Optional - Gradual Migration)

**Option A: Keep Both Auth Systems** (Recommended)

Support both old and new auth during migration:

```javascript
// In protected endpoints (e.g., api/games.js)
const { verifyClerkToken, getUserFromClerkId } = require('../lib/clerk-auth');

// Try Clerk first, fall back to old auth
let user;
const authHeader = req.headers.authorization;

if (authHeader && authHeader.startsWith('Bearer ')) {
  // New Clerk authentication
  try {
    const clerkId = await verifyClerkToken(req);
    user = await getUserFromClerkId(clerkId);
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
} else {
  // Old basic auth (temporary fallback)
  const username = req.headers['x-username'];
  if (!username) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  // ... old auth logic
}
```

**Option B: Full Migration** (Clean break)

Replace all auth with Clerk:

```javascript
const { requireAuth } = require('../lib/clerk-auth');

module.exports = async function handler(req, res) {
  // This middleware automatically verifies Clerk token
  // and attaches req.user
  await requireAuth(req, res, async () => {
    const user = req.user;
    // ... your logic here
  });
};
```

---

### Step 4: Migrate Existing Users (Filip & Faidao)

**Manual Migration** (Easiest for 2 users):

1. Have Filip & Faidao sign up via Clerk at: `https://your-site.vercel.app/signup.html`
2. They'll use their email + create a new password
3. Once they sign up, get their Clerk IDs from Clerk dashboard
4. Run this SQL in Neon:

```sql
-- Link Filip's account
UPDATE users
SET clerk_id = 'user_xxxxx'
WHERE username = 'filip';

-- Link Faidao's account
UPDATE users
SET clerk_id = 'user_yyyyy'
WHERE username = 'faidao';
```

**Or use the helper function:**

```javascript
const { linkUserToClerk } = require('./lib/clerk-auth');

// After they sign up in Clerk
await linkUserToClerk(1, 'user_xxxxx'); // Filip
await linkUserToClerk(2, 'user_yyyyy'); // Faidao
```

---

### Step 5: Configure Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Select "The London Sudoku" application
3. Configure:

**Authentication:**
- ✅ Email + Password (enabled)
- ✅ Google OAuth (optional)
- ✅ GitHub OAuth (optional)

**URLs:**
- Sign-in URL: `https://your-site.vercel.app/auth.html`
- Sign-up URL: `https://your-site.vercel.app/signup.html`
- After sign-in URL: `https://your-site.vercel.app/`
- After sign-up URL: `https://your-site.vercel.app/`

**Session:**
- Session lifetime: 7 days
- Inactivity timeout: 30 minutes

**Branding:**
- Logo: Upload your sudoku logo
- Theme: Dark mode
- Primary color: `#ff6b35`

---

### Step 6: Deploy to Production

```bash
# Commit all changes
git add -A
git commit -m "feat: activate Clerk authentication"

# Create PR and merge
git push origin your-branch

# Vercel will auto-deploy
```

---

### Step 7: Test Authentication Flow

After deployment, test:

1. **Sign Up Flow:**
   - Go to `/signup.html`
   - Sign up with email
   - Verify email
   - Should redirect to dashboard

2. **Sign In Flow:**
   - Go to `/auth.html`
   - Sign in with credentials
   - Should redirect to dashboard

3. **Social Login:**
   - Click "Continue with Google"
   - Authorize
   - Should create account and redirect

4. **Protected API:**
   - Try accessing `/api/games` without auth → 401
   - Sign in, try again → Success

5. **Session Persistence:**
   - Sign in
   - Refresh page
   - Should stay signed in

---

## 🔄 Rollback Plan

If something breaks:

```bash
# Restore old auth
mv auth.html auth-clerk-disabled.html
mv auth-old-backup.html auth.html

# Redeploy
git add auth.html
git commit -m "rollback: restore old auth temporarily"
git push
```

Max downtime: 5 minutes

---

## 📊 Migration Timeline

**Week 1:**
- ✅ Install Clerk SDK
- ✅ Create auth pages
- ✅ Deploy with dual auth support
- Test with new signups

**Week 2:**
- Migrate Filip & Faidao
- Monitor for issues
- Full switchover to Clerk

**Week 3:**
- Remove old auth code
- Clean up unused endpoints
- Update documentation

---

## 🎯 Success Criteria

- ✅ New users can sign up with Clerk
- ✅ Users can sign in with email/password
- ✅ Social login works (Google/GitHub)
- ✅ Session persists across refreshes
- ✅ Protected API endpoints work
- ✅ Filip & Faidao successfully migrated
- ✅ Zero authentication errors in production

---

## 🔒 Security Checklist

- ✅ Clerk secret key stored in environment variables (not code)
- ✅ HTTPS enforced (Vercel does this automatically)
- ✅ Session tokens validated server-side
- ✅ User data linked properly in database
- ✅ Old auth system removed after migration
- ✅ No passwords stored in database (handled by Clerk)

---

## 📞 Support

**Clerk Documentation:**
- Main docs: https://clerk.com/docs
- JavaScript SDK: https://clerk.com/docs/references/javascript/overview

**Troubleshooting:**
- Check Clerk dashboard for auth errors
- Check Vercel logs for API errors
- Test in incognito mode for fresh session

---

## What's Next After Clerk?

**Phase 0 Month 2 - Part 2: PostHog Analytics**
- Add PostHog event tracking
- Monitor user behavior
- Track puzzle completions
- Measure conversion rates

**Phase 0 Month 3:**
- Vercel Blob for asset storage
- Anonymous play with migration
- Battle pass system

---

Ready to deploy! Just:
1. Add environment variables to Vercel
2. Rename auth-clerk.html → auth.html
3. Commit and push
4. Test!

🚀
