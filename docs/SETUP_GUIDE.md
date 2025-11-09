# 🚀 SETUP GUIDE

**Complete setup instructions for The London Sudoku**

---

## 📋 PREREQUISITES

Before starting, ensure you have:

- [ ] Node.js 18.20.0+ installed
- [ ] npm 9.0.0+ installed
- [ ] Git installed
- [ ] GitHub account
- [ ] Vercel account
- [ ] Neon database account (PostgreSQL)

---

## 1️⃣ LOCAL DEVELOPMENT SETUP

### Clone Repository

```bash
git clone https://github.com/iamfilip98/the-london-sudoku.git
cd the-london-sudoku
```

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create `.env.local` file:

```bash
# Database
POSTGRES_PRISMA_URL="postgresql://user:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Node Environment
NODE_ENV="development"

# Vercel (optional for local dev)
VERCEL="0"
```

### Run Locally

```bash
npm run dev
# Opens at http://localhost:3000
```

### Run Tests

```bash
npm test
```

---

## 2️⃣ DATABASE SETUP (Neon PostgreSQL)

### Create Neon Database

1. Go to https://neon.tech
2. Create new project: `the-london-sudoku`
3. Copy connection string
4. Add to `.env.local` as `POSTGRES_PRISMA_URL`

### Initialize Database

```bash
# Run database initialization
curl http://localhost:3000/api/init-db
```

### Verify Database

```bash
# Check health
curl http://localhost:3000/api/health

# Should return: {"status":"healthy","checks":{"database":{"status":"healthy"}}}
```

---

## 3️⃣ VERCEL DEPLOYMENT

### Install Vercel CLI

```bash
npm install -g vercel
```

### Link Project

```bash
vercel link
```

### Add Environment Variables to Vercel

```bash
# Production database
vercel env add POSTGRES_PRISMA_URL production

# Node environment
vercel env add NODE_ENV production
```

Paste your production database URL when prompted.

### Deploy to Production

```bash
vercel --prod
```

---

## 4️⃣ GITHUB ACTIONS CI/CD SETUP

### Required Secrets

Go to **GitHub Repository → Settings → Secrets and variables → Actions**

Add these secrets:

#### VERCEL_TOKEN
1. Go to https://vercel.com/account/tokens
2. Create new token: "GitHub Actions"
3. Copy token
4. Add as `VERCEL_TOKEN` secret

#### VERCEL_ORG_ID
1. Go to Vercel project settings
2. Copy Team ID (or Personal Account ID)
3. Add as `VERCEL_ORG_ID` secret

#### VERCEL_PROJECT_ID
1. Go to Vercel project settings
2. Copy Project ID
3. Add as `VERCEL_PROJECT_ID` secret

### Verify CI/CD

1. Push to main branch
2. Check **Actions** tab in GitHub
3. Should see: ✅ Tests passing, ✅ Deployment successful

---

## 5️⃣ POSTHOG ANALYTICS SETUP

### Create PostHog Account

1. Go to https://posthog.com (free tier: 1M events/month)
2. Create organization: "The London Sudoku"
3. Create project: "Production"

### Get API Key

1. Go to **Project Settings → Project API Key**
2. Copy the API key (starts with `phc_`)

### Add PostHog to HTML

In your `index.html` or layout file, add:

```html
<!-- PostHog Analytics -->
<script>
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init('YOUR_PROJECT_API_KEY_HERE', {
    api_host: 'https://app.posthog.com',
    autocapture: false,
    disable_session_recording: true
  })
</script>

<!-- Load monitoring library -->
<script src="/lib/monitoring.js"></script>
<script>
  // Initialize monitoring
  Monitoring.initMonitoring();
</script>
```

Replace `YOUR_PROJECT_API_KEY_HERE` with your actual PostHog API key.

### Verify PostHog

1. Load your website
2. Check PostHog dashboard → Live events
3. Should see events appearing

---

## 6️⃣ STRIPE PAYMENT SETUP (For Premium Subscriptions)

### Create Stripe Account

1. Go to https://stripe.com
2. Create account
3. Complete business verification

### Get API Keys

1. Go to **Developers → API keys**
2. Copy:
   - **Publishable key** (starts with `pk_`)
   - **Secret key** (starts with `sk_`)

### Add to Vercel

```bash
vercel env add STRIPE_PUBLISHABLE_KEY production
# Paste pk_xxxxx

vercel env add STRIPE_SECRET_KEY production
# Paste sk_xxxxx
```

### Create Product & Price

1. Go to **Products → Add product**
2. Name: "Premium Subscription"
3. Price: $4.99/month
4. Copy Price ID (starts with `price_`)

### Add Price ID to Vercel

```bash
vercel env add STRIPE_PREMIUM_PRICE_ID production
# Paste price_xxxxx
```

### Set up Webhook

1. Go to **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://thelondonsudoku.com/api/subscription/webhook`
3. Events to send:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing secret** (starts with `whsec_`)

### Add Webhook Secret to Vercel

```bash
vercel env add STRIPE_WEBHOOK_SECRET production
# Paste whsec_xxxxx
```

---

## 7️⃣ CLERK AUTHENTICATION SETUP (For Phase 0+)

### Create Clerk Account

1. Go to https://clerk.com (free tier: 10K users)
2. Create application: "The London Sudoku"

### Get API Keys

1. Go to **API Keys**
2. Copy:
   - **Publishable Key**
   - **Secret Key**

### Add to Vercel

```bash
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
# Paste pk_xxxxx

vercel env add CLERK_SECRET_KEY production
# Paste sk_xxxxx
```

---

## 8️⃣ SECURITY CHECKLIST

Before going live:

- [ ] SSL certificate enabled (Vercel automatic)
- [ ] Environment variables secure (not in git)
- [ ] Database credentials rotated
- [ ] CORS configured (only your domain)
- [ ] Rate limiting enabled
- [ ] Security headers in `vercel.json`
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Stripe webhook signature verification working
- [ ] Input validation (Zod) on all API endpoints

---

## 9️⃣ MONITORING CHECKLIST

After deployment:

- [ ] Health check working: `https://thelondonsudoku.com/api/health`
- [ ] PostHog events appearing
- [ ] Error tracking working (test by triggering error)
- [ ] Database connection stable
- [ ] No CORS errors in browser console
- [ ] Stripe test payment successful

---

## 🔟 TROUBLESHOOTING

### Database Connection Fails

```bash
# Check connection string format
postgresql://user:password@host/database?sslmode=require

# Verify IP allowlist (Neon → Settings → IP Allowlist)
# Add: 0.0.0.0/0 (allow all IPs)
```

### Vercel Deployment Fails

```bash
# Check build logs
vercel logs

# Common issues:
# 1. Missing environment variables
# 2. Build command fails (check package.json scripts)
# 3. Node version mismatch (check .nvmrc)
```

### GitHub Actions Failing

```bash
# Check workflow file syntax
# .github/workflows/test.yml

# Verify secrets are set:
# GitHub → Settings → Secrets → Actions
```

### PostHog Not Tracking

```bash
# Check browser console for errors
# Verify API key is correct
# Check adblockers (PostHog may be blocked)
```

---

## 📚 ADDITIONAL RESOURCES

### Documentation
- [Neon Docs](https://neon.tech/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [PostHog Docs](https://posthog.com/docs)
- [Clerk Docs](https://clerk.com/docs)

### Project Documentation
- [Technical Spec](./TECHNICAL_SPEC.md)
- [Database Schema](./DATABASE_SCHEMA.sql)
- [API Documentation](./ERROR_HANDLING_LOGGING.md)
- [Security Guide](./RATE_LIMITING_SECURITY.md)

---

## ✅ SETUP COMPLETE!

Your development environment is ready. Next steps:

1. Run local tests: `npm test`
2. Start development: `npm run dev`
3. Deploy to Vercel: `vercel --prod`
4. Monitor: Check PostHog dashboard

**Questions?** Check the docs or create an issue on GitHub.
