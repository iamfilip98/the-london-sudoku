# Development Guidelines for Claude

⚠️ **DO NOT REMOVE THE CRITICAL RULES SECTION** ⚠️
This section contains essential workflow rules. Add new rules, but never delete existing ones without explicit user approval.

## Critical Rules
1. **README is Source of Truth**: Every code change MUST be reflected in README.md
2. **Update README with Every Change**: Algorithm, scoring, features, API - document everything
3. **No Hardcoding**: All puzzles come from pre-generated database, zero fallbacks
4. **Gameplay-Driven Validation**: Validation must match actual gameplay experience
5. **Pre-Generation Pattern**: Never generate puzzles on-demand for users
6. **Professional Git Workflow**: Follow branch-based development workflow (see Git Workflow section below)
7. **Efficient Testing**: For complex features, use Playwright tests. For simple CSS/visual fixes, verify with grep/manual inspection. If server/test setup fails once, STOP - don't debug infrastructure, just verify the code fix is correct and commit
8. **Root Cause Analysis**: Always seek the root cause of issues - don't just fix symptoms
9. **Rule Protection**: Never remove or modify existing Critical Rules without explicit user approval - only add new ones
10. **Token Efficiency**: Don't waste tokens debugging test infrastructure. If automated testing fails, fall back to code inspection and move on
11. **Automatic PR Creation**: After each meaningful change, automatically create a PR with a clear, descriptive message. Use curl with GitHub API directly (token in .github-token file). Never wait for user to create PRs
12. **Full Autonomy**: You must solve ALL issues yourself without user help. If you need access, tokens, or permissions, explicitly ask for them. Never give up or ask user to do manual work
13. **Ultrathinking for Solutions**: When facing any issue or blocker, think deeply about alternative approaches. Try multiple solutions, research documentation, analyze error messages thoroughly. Persistence is required
14. **Ultrathink Every Implementation**: Before implementing ANY feature or fix, spend significant time thinking through:
    - Architecture and design patterns
    - Edge cases and potential bugs
    - Security implications
    - Performance impact
    - Backward compatibility
    - Testing strategy
    - Documentation needs
    - Multiple implementation approaches and trade-offs
    - Never rush to code - think first, code second

## Git Workflow - Professional Branch Strategy

This project follows a professional multi-person development workflow. **NEVER push directly to `main`**.

### Branch Structure
- **`main`**: Production-ready code only. Protected branch.
- **`develop`**: Integration branch for features. All feature branches merge here first.
- **`feat/*`**: Feature branches (e.g., `feat/performance-optimization`)
- **`fix/*`**: Bug fix branches (e.g., `fix/authentication-bug`)
- **`chore/*`**: Maintenance branches (e.g., `chore/code-cleanup`)
- **`docs/*`**: Documentation branches (e.g., `docs/phase5-readme-update`)

### Workflow Process
1. **Create Feature Branch**: Branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

2. **Develop & Test**: Make changes, commit frequently with meaningful messages
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

3. **Push & Create PR**: Push to remote and create Pull Request to `develop`
   ```bash
   git push -u origin feat/your-feature-name
   gh pr create --base develop --title "Feature: Description" --body "Details..."
   ```

4. **Merge to Develop**: After review/testing, merge PR to `develop`
   ```bash
   gh pr merge --merge
   ```

5. **Merge to Main**: Periodically merge `develop` to `main` for production releases
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

### Commit Message Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `test:` - Test additions/modifications
- `perf:` - Performance improvements

### Testing Requirements
- All changes must be tested before creating PR
- Use appropriate testing method (Playwright, manual, code inspection)
- Document test results in PR description

### Automated PR Creation
Claude MUST create PRs automatically after meaningful changes. Use this exact method:

```bash
# Method: Direct GitHub API call with curl
GITHUB_TOKEN=$(cat /home/user/the-london-sudoku/.github-token) && curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/iamfilip98/the-london-sudoku/pulls" \
  -d '{
    "title": "feat: Your Feature Title",
    "head": "your-branch-name",
    "base": "main",
    "body": "## Summary\n- Changes made\n\n## Impact\nDescription"
  }'
```

**Why this method:**
- Git remote uses local proxy (127.0.0.1:17187) which breaks node scripts
- Direct curl to api.github.com bypasses proxy issues
- Token stored in .github-token file (already configured)
- Works reliably in this environment

**When to create PRs:**
- After implementing a feature
- After fixing a bug
- After meaningful refactoring
- After documentation updates
- When work on current branch is complete and ready for review

## Clue Counts - Single Source of Truth

These values are FINAL and should NEVER be changed without explicit user approval:

```javascript
const CLUE_COUNTS = {
  easy: 42,    // 39 empty cells - PERFECT, do not change
  medium: 28,  // 53 empty cells - requires candidates, forces thinking
  hard: 25     // 56 empty cells - challenging but fair (adjusted from 24)
};
```

## Gameplay Requirements (Never Compromise)

### Easy Difficulty
**Goal**: "Playable without candidates, challenging but smooth"

**MUST**:
- Be solvable WITHOUT candidate tracking
- Have smooth progression (1-3 obvious moves always available)
- Have 15+ naked singles throughout the solve
- Have 0-2 hidden techniques (adds slight challenge)
- Have 0 bottlenecks (smooth flow)

### Medium Difficulty
**Goal**: "Requires candidates, forces thinking, smooth but not trivial"

**MUST**:
- REQUIRE candidate tracking to solve
- Have moderate candidate density early (avg 2.5-3.3 candidates per cell in first 20 moves)
- Have decent naked singles early (6-15 in first 20 moves - progress without being easy)
- Have 2-4 immediate naked singles at any point (consistent options)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Requires candidates but provides smooth progression
- Forces thinking without getting stuck
- Clear separation from Easy (requires candidates) and Hard (harder metrics)

### Hard Difficulty
**Goal**: "Requires heavy candidate work, significantly harder than Medium"

**MUST**:
- REQUIRE candidate tracking to solve
- Have HIGH candidate density early (avg 3.4-5.0 candidates per cell in first 20 moves)
- Have VERY FEW naked singles early (max 5 in first 20 moves - forces candidate work)
- Have limited total naked singles (max 12 total - requires more thinking)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Significantly harder than Medium (3.4+ candidates vs 3.3 max)
- Forces heavy candidate work (max 5 naked singles vs min 6 for Medium)
- Challenging but fair (playable within 7-minute target)
- Clear separation: Hard always has higher candidate density AND fewer naked singles

## Pre-Generation System

### Architecture
**OLD**: Generate puzzles on-demand when user requests (causes timeouts)
**NEW**: Generate puzzles at 11 PM daily for NEXT day (allows strict quality control)

### Flow
1. **11:00 PM**: Scheduled job starts
2. **11:00-11:10 PM**: Generate and validate 100-200 candidates per difficulty
3. **11:10 PM**: Select best puzzles, store in database
4. **12:00 AM**: New puzzles available to players instantly

## Target Solve Times

```javascript
const targetTimes = {
  easy: 210,    // 3:30
  medium: 180,  // 3:00
  hard: 420     // 7:00
};
```

## Success Criteria

- ✅ Puzzles pre-generated at 11 PM daily
- ✅ Zero hardcoded puzzles
- ✅ Zero dead code
- ✅ Validation matches gameplay experience
- ✅ Users get instant load times
- ✅ README is 100% accurate
- ✅ Easy: Playable without candidates (comprehensive validation)
- ✅ Medium: Requires candidates and thinking (comprehensive validation)
- ✅ Hard: Challenging but fair (comprehensive validation)
- ✅ All clue counts match targets (42/28/25)
- ✅ Day-to-day consistency guaranteed across all difficulties

## Security & Infrastructure Constraints

### **Vercel Free Tier Limit: Maximum 12 API Endpoints**
⚠️ **CRITICAL CONSTRAINT**: Vercel Hobby plan allows EXACTLY 12 serverless functions per deployment.

**Current Endpoint Count**: 12/12 (✅ AT LIMIT)

**Current API Endpoints**:
1. `/api/achievements.js` - Achievement management
2. `/api/admin.js` - Consolidated admin operations (clear-all, clear-old-puzzles, generate-fallback, init-db, **migrate-phase1-month5, migrate-phase2-month7, mark-founders**, **create-checkout, create-portal, webhook, subscription-status** *[Phase 1-2, Subscription]*) - **SUBSCRIPTION CONSOLIDATED HERE**
3. `/api/auth.js` - Authentication (bcrypt + Clerk) + **User Profiles** (GET/PUT for bio, avatar, displayName, founder badge) *[Phase 1 Month 4-5]*
4. `/api/cron-verify-puzzles.js` - Scheduled puzzle verification
5. `/api/entries.js` - Daily battle results
6. `/api/games.js` - Game state management + **Free Tier Limits** (3 Classic dailies/day) *[Phase 1 Month 5]*
7. `/api/generate-tomorrow.js` - Scheduled puzzle generation
8. `/api/health.js` - Health check endpoint
9. `/api/import.js` - **CONSOLIDATED** anonymous data migration (completion + achievement)
10. `/api/puzzles.js` - Puzzle fetching (with Redis caching) + **Practice Mode** (?mode=practice&variant=classic|x-sudoku|mini) *[Phase 1 Month 4-5]*
11. `/api/ratings.js` - Puzzle rating system
12. `/api/stats.js` - User statistics + **Global Leaderboards** (?type=leaderboards) *[Phase 1 Month 4]*

**Consolidation Strategy**:
- **BEFORE Phase 0**: 14 endpoints (exceeded limit)
- **AFTER Phase 0**: 12 endpoints (at limit)
- **Phase 2 Month 7**: 12 endpoints (✅ **STILL AT LIMIT**)
- **Consolidation History**:
  - Phase 0: Merged `import-achievement.js` + `import-completion.js` → `import.js?type=completion|achievement`
  - Phase 0: Merged `init-db.js` → `admin.js?action=init-db`
  - Phase 2 Month 7: Merged `subscription.js` → `admin.js?action=create-checkout|create-portal|webhook|subscription-status`

**Subscription Consolidation Details**:
- Subscription actions added to `/api/admin.js` with conditional authentication
- Admin-only actions (clear-all, migrate, etc.) require `x-admin-key` header
- Subscription actions skip admin key check and use their own authentication:
  - `webhook`: Stripe signature verification via `stripe-signature` header
  - `create-checkout`, `create-portal`: User session authentication (frontend managed)
  - `subscription-status`: User session authentication (frontend managed)
- Clean separation achieved via `subscriptionActions` array in admin handler

**RULE**: Before adding ANY new API endpoint, you MUST consolidate existing endpoints first.

**How to Consolidate**:
1. Use query parameters: `/api/admin.js?action=init-db`
2. Use request body parameters: `{ type: 'completion' }` in POST body
3. Combine related operations into single endpoints

### **Security Best Practices (November 2025 Audit)**
All critical security issues have been fixed:

✅ **TLS Certificate Verification**
- `lib/db-pool.js`: Proper SSL configuration with `rejectUnauthorized: true` in production
- All utility scripts (wipe-user-data.js, reset_db.js, init-db-standalone.js, analyze-scoring-data.js) use environment-based SSL
- NO `NODE_TLS_REJECT_UNAUTHORIZED = '0'` in codebase

✅ **CORS Security**
- `lib/cors.js`: Whitelist-only CORS configuration (no wildcards)
- Allowed origins: thelondonsudoku.com, Vercel preview URLs, localhost (dev only)
- All API endpoints use `setCorsHeaders()` from centralized library
- Credentials support enabled for authenticated requests

✅ **Input Validation**
- `lib/validators.js`: Comprehensive Zod validation schemas
- All user input validated before database operations
- XSS protection via HTML sanitization
- SQL injection prevented via parameterized queries + validation

✅ **Rate Limiting**
- `lib/rate-limit.js`: Redis-based distributed rate limiting using Vercel KV
- Auth endpoint: 5 attempts per 15 minutes
- Game submissions: 100 per hour
- Puzzle fetching: 200 per hour
- Admin actions: 10 per 10 minutes
- Graceful fallback in development (no KV required)

✅ **Security Headers**
- `vercel.json`: All recommended security headers configured
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

✅ **Health Check Endpoint**
- `/api/health.js`: Database connectivity monitoring
- Returns service status, version, response times
- No authentication required (public health check)

✅ **LICENSE File**
- Proprietary license with "All Rights Reserved"
- Clear copyright ownership

### **Infrastructure Stack (Phase 0 Complete)**
- **Database**: Neon (serverless PostgreSQL with connection pooling)
- **Caching**: Vercel KV (Redis) with 24-hour TTL for puzzles
- **Authentication**: Clerk (10K free users) + bcrypt (legacy support)
- **Analytics**: PostHog (1M events/month)
- **Asset Storage**: Vercel Blob (deferred - not critical)
- **Deployment**: Vercel (12 API endpoints, free tier)

### **Free Tier Limitations (ALL SERVICES)**
⚠️ **CRITICAL**: All development must respect these hard limits. Exceeding any limit will break the application or require paid upgrades.

#### **Vercel Hobby Plan (Free Tier)**
**Hard Limits**:
- ✅ **12 serverless functions maximum** (CURRENTLY AT LIMIT: 12/12)
- 100GB bandwidth per month
- 100 hours serverless function execution per month
- 6,000 build minutes per month
- 1GB storage for static assets
- 10-second function timeout (cannot be increased on free tier)
- 50MB maximum function size

**Mitigation Strategies**:
- **Endpoint consolidation**: Use query/body parameters instead of new endpoints
- **Efficient functions**: Optimize code to reduce execution time
- **Static optimization**: Minimize dynamic requests where possible
- **Caching**: Use Redis to reduce function executions

#### **Neon Database (Free Tier)**
**Hard Limits**:
- 512MB storage (approximately 500K-1M game records depending on data)
- Unlimited compute hours (auto-suspends after 5 min inactivity)
- 1 project (1 database)
- 10 branches (for development/testing)
- 100 concurrent connections (with connection pooling)
- 1GB logical replication per month

**Mitigation Strategies**:
- **Data retention**: Archive old game data (older than 1 year)
- **Connection pooling**: Use `pg-pool` to manage connections efficiently
- **Efficient queries**: Index optimization, avoid SELECT *
- **Auto-suspend**: Accept 1-2 second cold start for first request after inactivity

**Storage Monitoring**:
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size(current_database()));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### **Vercel KV / Redis (Free Tier)**
**Hard Limits**:
- 256MB storage (approximately 100K-500K cached items depending on size)
- 100,000 operations per month (read + write combined)
- 30 requests per second
- 1 database

**Current Usage**:
- Puzzles cached with 24-hour TTL (~3 puzzles/day = minimal storage)
- Leaderboards cached with 5-minute TTL (frequent updates but small data)
- Rate limiting counters (ephemeral, auto-expire)

**Mitigation Strategies**:
- **Aggressive TTL**: Short cache durations for non-critical data
- **Selective caching**: Only cache high-traffic endpoints (puzzles, leaderboards)
- **Rate limit optimization**: Use sliding windows efficiently
- **Monitoring**: Track operations usage in Vercel dashboard

**Operations Estimate**:
- Daily puzzles: ~100 reads/day (assuming 100 users)
- Leaderboards: ~500 reads/day (cached for 5 min, ~100 users)
- Rate limiting: ~1000 operations/day (auth checks)
- **Total**: ~1,600 operations/day = ~50K/month (WELL WITHIN LIMIT)

#### **Clerk Authentication (Free Tier)**
**Hard Limits**:
- 10,000 monthly active users (MAUs)
- Unlimited total users (only actives count)
- Unlimited applications
- Basic email support
- Standard features only (no advanced features like SAML, custom flows)

**Current Usage**:
- Phase 0-1: Estimated 10-50 MAUs (friends/family testing)
- Phase 2-3: Estimated 100-500 MAUs (soft launch)
- Phase 4+: May approach 10K limit (requires upgrade)

**Mitigation Strategies**:
- **MAU definition**: Users who log in within 30-day period
- **Anonymous play**: Allows unlimited non-authenticated users
- **Grace period**: Clerk provides warnings before hard cutoff
- **Upgrade path**: $25/month for 100K MAUs when needed

#### **PostHog Analytics (Free Tier)**
**Hard Limits**:
- 1,000,000 events per month
- Unlimited tracked users (identified + anonymous)
- 1 year data retention
- All product features (analytics, session replay, feature flags)
- 1 project

**Current Usage** (estimated):
- Game start: ~100 events/day = 3K/month
- Game completion: ~80 events/day = 2.4K/month
- Puzzle generation: ~3 events/day = 90/month
- User actions: ~500 events/day = 15K/month
- **Total**: ~20K events/month (WELL WITHIN LIMIT)

**Mitigation Strategies**:
- **Event sampling**: Sample high-frequency events if usage increases
- **Event consolidation**: Batch related events
- **Selective tracking**: Only track business-critical events
- **Auto-capture**: Disable auto-capture if needed to reduce noise

**Scaling Considerations**:
- At 1000 daily active users × 50 events/user = 50K events/day = 1.5M/month
- Will need to implement event sampling before reaching 500+ DAU

#### **Summary: Free Tier Runway**
Based on current usage and expected growth:

| Service | Current Usage | Free Tier Limit | Buffer | Risk Level |
|---------|--------------|-----------------|--------|------------|
| Vercel Functions | 12/12 | 12 | 0% | 🔴 **AT LIMIT** |
| Vercel Execution | ~5 hrs/mo | 100 hrs/mo | 95% | 🟢 Safe |
| Vercel Bandwidth | ~1 GB/mo | 100 GB/mo | 99% | 🟢 Safe |
| Neon Storage | ~50 MB | 512 MB | 90% | 🟢 Safe |
| Vercel KV | ~50K ops/mo | 100K ops/mo | 50% | 🟡 Monitor |
| Clerk MAUs | ~50 | 10,000 | 99% | 🟢 Safe |
| PostHog Events | ~20K/mo | 1M/mo | 98% | 🟢 Safe |

**Critical Path**: Vercel Functions at limit requires endpoint consolidation for ALL future features.

**Growth Threshold**: When reaching 1000+ DAU, monitor Vercel KV and PostHog usage closely.
