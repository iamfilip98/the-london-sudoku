# 🚀 PHASE 0: GETTING STARTED

**Welcome to Phase 0!** This document will guide you through the infrastructure migration process.

---

## ⏱️ ESTIMATED TIME: 60-90 hours over 3 months

**Current Status**: 🟡 In Progress
**Started**: November 8, 2025
**Target Completion**: February 2026

---

## 📋 PREREQUISITES

Before starting Phase 0 implementation:

- [x] All security issues fixed (TLS, CORS, rate limiting)
- [x] Input validation implemented (Zod)
- [x] Privacy Policy & Terms of Service published
- [x] CI/CD pipeline configured
- [x] Error monitoring ready (PostHog)
- [x] Phase 0 implementation plan created

---

## 🗓️ MONTH-BY-MONTH GUIDE

### **MONTH 1: Database & Caching** (20-30 hours)

#### Week 1-2: Neon Migration

**Goal**: Migrate from Vercel Postgres to Neon

**Steps**:

1. **Create Neon Account**
   ```bash
   # Go to: https://neon.tech
   # Create account
   # Create new project: "the-london-sudoku"
   # Note: Free tier includes 10GB storage, 100 compute hours/month
   ```

2. **Provision Database**
   ```bash
   # In Neon dashboard:
   # - Create database: "sudoku_production"
   # - Copy connection string
   # - Add to .env.local as NEON_DATABASE_URL
   ```

3. **Create Schema in Neon**
   ```bash
   # Copy schema from docs/DATABASE_SCHEMA.sql
   psql $NEON_DATABASE_URL < docs/DATABASE_SCHEMA.sql
   ```

4. **Run Migration**
   ```bash
   # Migrate data from Vercel Postgres to Neon
   node scripts/migrate-to-neon.js
   ```

5. **Verify Migration**
   ```bash
   # Check row counts match
   psql $NEON_DATABASE_URL -c "SELECT COUNT(*) FROM users;"
   psql $NEON_DATABASE_URL -c "SELECT COUNT(*) FROM entries;"

   # Verify Faidao & Filip data
   psql $NEON_DATABASE_URL -c "SELECT username, display_name FROM users;"
   ```

6. **Update Environment Variables**
   ```bash
   # Local
   # Update POSTGRES_PRISMA_URL in .env.local to Neon URL

   # Production
   vercel env add POSTGRES_PRISMA_URL production
   # Paste Neon connection string when prompted
   ```

7. **Deploy to Staging**
   ```bash
   vercel --env=preview
   # Test thoroughly
   npm test
   ```

8. **Deploy to Production**
   ```bash
   vercel --prod
   # Monitor for 24 hours
   # Check /api/health
   # Verify existing users can log in
   ```

**Success Criteria**:
- ✅ Neon database live in production
- ✅ All data migrated (no data loss)
- ✅ Faidao & Filip can still log in
- ✅ Puzzle completions intact
- ✅ No errors in production logs

---

#### Week 3-4: Redis Caching

**Goal**: Implement Vercel KV caching for 10-50x performance improvement

**Steps**:

1. **Create Vercel KV Store**
   ```bash
   # Go to: https://vercel.com/dashboard/stores
   # Click "Create Database"
   # Select "KV (Redis)"
   # Name: "sudoku-cache"
   # Select region: Same as Neon (us-east-2)
   # Create
   ```

2. **Link KV to Project**
   ```bash
   # In Vercel KV dashboard:
   # Click "Connect to Project"
   # Select "the-london-sudoku"
   # Environment variables auto-added (KV_URL, KV_REST_API_*, etc.)
   ```

3. **Install Vercel KV SDK**
   ```bash
   npm install @vercel/kv
   ```

4. **Update package.json**
   ```json
   {
     "dependencies": {
       "@vercel/kv": "^1.0.1",
       ...
     }
   }
   ```

5. **Test Caching Locally**
   ```bash
   # Add KV environment variables to .env.local
   # (Copy from Vercel dashboard)

   npm run dev
   # Test cache endpoints
   curl http://localhost:3000/api/puzzles
   # Should cache daily puzzles for 24 hours
   ```

6. **Deploy Caching**
   ```bash
   vercel --prod
   # Monitor cache hit rates
   # Check PostHog for performance metrics
   ```

**Success Criteria**:
- ✅ Vercel KV operational
- ✅ Daily puzzles cached (24 hour TTL)
- ✅ Leaderboards cached (5 min TTL)
- ✅ API response time improved >10x
- ✅ Cache hit rate >80%

---

### **MONTH 2: Authentication & Analytics** (20-30 hours)

#### Week 1-2: Clerk Integration

**Goal**: Replace bcrypt with Clerk for enterprise-grade authentication

**Steps**:

1. **Create Clerk Account**
   ```bash
   # Go to: https://clerk.com
   # Create account
   # Create application: "The London Sudoku"
   # Note: Free tier includes 10,000 users
   ```

2. **Get API Keys**
   ```bash
   # In Clerk dashboard:
   # API Keys → Copy:
   #   - Publishable Key (starts with pk_)
   #   - Secret Key (starts with sk_)
   ```

3. **Install Clerk SDK**
   ```bash
   npm install @clerk/nextjs
   ```

4. **Configure Environment Variables**
   ```bash
   # Local (.env.local)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
   CLERK_SECRET_KEY=sk_test_xxx

   # Production
   vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
   vercel env add CLERK_SECRET_KEY production
   ```

5. **Migrate Existing Users** (Faidao & Filip)
   ```bash
   # Run migration script
   # This creates Clerk accounts for existing users
   # Note: Only 2 users to migrate (low risk)
   ```

6. **Test Authentication**
   ```bash
   npm run dev
   # Test login flow
   # Test signup flow
   # Verify Faidao & Filip can log in
   ```

**Success Criteria**:
- ✅ Clerk authentication working
- ✅ Existing users migrated successfully
- ✅ New signups work
- ✅ Anonymous sessions functional

---

#### Week 3-4: PostHog Analytics

**Goal**: Implement real-time analytics and error tracking

**Steps**:

1. **Create PostHog Account**
   ```bash
   # Go to: https://posthog.com
   # Create account
   # Create organization: "The London Sudoku"
   # Create project: "Production"
   # Note: Free tier includes 1M events/month
   ```

2. **Get API Key**
   ```bash
   # In PostHog dashboard:
   # Project Settings → Project API Key
   # Copy key (starts with phc_)
   ```

3. **Add PostHog to HTML**
   ```html
   <!-- In index.html <head> -->
   <script>
     !function(t,e){/* PostHog snippet */}(document,window.posthog||[]);
     posthog.init('phc_YOUR_KEY_HERE', {
       api_host: 'https://app.posthog.com'
     })
   </script>
   ```

4. **Configure Event Tracking**
   ```bash
   # Events already configured in lib/monitoring.js
   # Just need to initialize PostHog
   ```

5. **Test Analytics**
   ```bash
   npm run dev
   # Play a puzzle
   # Complete a puzzle
   # Check PostHog dashboard → Live Events
   # Should see events appearing
   ```

**Success Criteria**:
- ✅ PostHog tracking 100+ events/day
- ✅ Error tracking functional
- ✅ Dashboards created
- ✅ No PII being sent

---

### **MONTH 3: Asset Storage & Testing** (20-30 hours)

#### Week 1-2: Vercel Blob Storage

**Goal**: Scalable asset storage for avatars, badges, themes

**Steps**:

1. **Create Vercel Blob Store**
   ```bash
   # Go to: https://vercel.com/dashboard/stores
   # Click "Create Database"
   # Select "Blob"
   # Name: "sudoku-assets"
   # Create
   ```

2. **Install Blob SDK**
   ```bash
   npm install @vercel/blob
   ```

3. **Configure Upload Endpoint**
   ```javascript
   // api/upload-avatar.js
   // Allow users to upload avatars
   // Store in Blob, save URL to database
   ```

**Success Criteria**:
- ✅ Blob storage operational
- ✅ Avatar upload working
- ✅ URLs stored in database
- ✅ Fast image delivery

---

#### Week 3-4: Anonymous Play System

**Goal**: Frictionless onboarding (play without signup)

**Steps**:

1. **Implement Anonymous Sessions**
   ```javascript
   // Create UUID for anonymous users
   // Store progress in localStorage
   // Show "Sign up to save progress" after 5 games
   ```

2. **Build Migration Flow**
   ```javascript
   // On signup:
   //   1. Fetch localStorage data
   //   2. Migrate to database
   //   3. Clear localStorage
   //   4. Authenticate user
   ```

3. **Test Anonymous → Authenticated**
   ```bash
   # Play 5 games anonymously
   # Sign up
   # Verify progress migrated
   # Verify achievements unlocked
   ```

**Success Criteria**:
- ✅ Anonymous play functional
- ✅ Progress saved in localStorage
- ✅ Migration to account works
- ✅ No data loss during migration

---

## 🧪 TESTING CHECKLIST

After each month, test:

### Critical Flows
- [ ] Faidao can log in
- [ ] Filip can log in
- [ ] New users can sign up
- [ ] Anonymous users can play
- [ ] Puzzles load correctly
- [ ] Completions save to database
- [ ] Leaderboards display
- [ ] Achievements unlock

### Performance
- [ ] API response time <200ms
- [ ] Database queries <50ms
- [ ] Cache hit rate >80%
- [ ] No errors in PostHog

### Data Integrity
- [ ] All user data intact
- [ ] No data loss from migrations
- [ ] Backups working

---

## ⚠️ ROLLBACK PROCEDURES

### If Neon Migration Fails
```bash
# Revert to Vercel Postgres
vercel env add POSTGRES_PRISMA_URL production
# Paste Vercel Postgres URL
vercel --prod
# Max downtime: 5 minutes
```

### If Clerk Issues
```bash
# Keep bcrypt code for 30 days
# Can switch back to bcrypt auth temporarily
# Fix Clerk issues, then re-migrate
```

### If Caching Causes Stale Data
```bash
# Clear all cache
curl https://thelondonsudoku.com/api/cache/clear
# Or manually in Vercel KV dashboard
```

---

## 📈 PROGRESS TRACKING

Track progress in docs/PHASE_0_IMPLEMENTATION_PLAN.md

Update checkboxes as tasks complete:
- [ ] Task description

Mark validation gates:
- [ ] Month 1 complete (Neon + Redis)
- [ ] Month 2 complete (Clerk + PostHog)
- [ ] Month 3 complete (Blob + Anonymous)
- [ ] Phase 0 complete (All tasks done, stable for 2 weeks)

---

## 🚀 AFTER PHASE 0

Once Phase 0 is complete and stable:

1. **Review Metrics**
   - Database performance
   - Cache hit rates
   - API response times
   - User experience (Faidao & Filip feedback)

2. **Document Lessons Learned**
   - What went well
   - What could be improved
   - Gotchas and tips for future migrations

3. **Prepare for Phase 1**
   - Plan user profiles
   - Design leaderboards
   - Prototype X-Sudoku variant
   - Recruit 3 beta testers

4. **Celebrate! 🎉**
   - You've built a production-grade infrastructure!
   - Ready to scale to 10K+ users!

---

## 📚 REFERENCE DOCUMENTATION

- [Phase 0 Implementation Plan](./docs/PHASE_0_IMPLEMENTATION_PLAN.md)
- [Setup Guide](./docs/SETUP_GUIDE.md)
- [Database Schema](./docs/DATABASE_SCHEMA.sql)
- [Technical Spec](./docs/TECHNICAL_SPEC.md)
- [Neon Migration Script](./scripts/migrate-to-neon.js)
- [Cache Layer](./lib/cache.js)

---

**Questions?** Refer to the documentation or create an issue.

**Ready to start?** Begin with Month 1, Week 1: Neon Migration!

**Let's build something amazing! 🚀**
