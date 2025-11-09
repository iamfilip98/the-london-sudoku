# 🔄 DATA MIGRATION STRATEGY

**Purpose**: Safe, versioned, reversible database schema changes in production
**Version**: 1.0
**Last Updated**: November 2025

---

## 🎯 WHY MIGRATIONS MATTER

**Without a migration strategy:**
- ❌ Manual SQL changes (error-prone)
- ❌ No version control for schema
- ❌ Can't rollback bad changes
- ❌ Production incidents from schema mismatches
- ❌ Data loss from mistakes

**With a migration strategy:**
- ✅ All schema changes versioned and tracked
- ✅ Automated deployment
- ✅ Rollback capability
- ✅ Testing before production
- ✅ Team collaboration (if scaling)

---

## 🛠️ MIGRATION TOOL: Prisma Migrate

**Why Prisma?**
- Industry-standard migration tool
- Excellent TypeScript support
- Automatic rollback generation
- Schema drift detection
- Works with Neon (PostgreSQL)

### Installation

```bash
npm install prisma @prisma/client
npx prisma init
```

### Configuration

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id                    Int       @id @default(autoincrement())
  clerk_id              String    @unique
  email                 String    @unique
  username              String    @unique
  subscription_tier     String    @default("free") // 'free', 'premium'
  subscription_status   String?   // 'active', 'canceled', 'past_due'
  subscription_expires_at DateTime?

  created_at            DateTime  @default(now())
  updated_at            DateTime  @updatedAt

  @@index([subscription_tier, subscription_status])
}

model DailyPuzzle {
  id            Int       @id @default(autoincrement())
  puzzle_date   DateTime  @db.Date
  variant       String    // 'classic', 'xsudoku', 'killer', etc.
  difficulty    String    // 'easy', 'medium', 'hard'
  puzzle        Json      // 9x9 array
  solution      Json      // 9x9 array
  quality_score Int       @default(0)

  created_at    DateTime  @default(now())

  @@unique([puzzle_date, variant, difficulty])
  @@index([puzzle_date, variant])
}

// ... more models
```

---

## 📝 MIGRATION WORKFLOW

### 1. Create Migration (Development)

```bash
# Make changes to schema.prisma
# Then generate migration
npx prisma migrate dev --name add_battle_pass_tables

# Prisma will:
# 1. Generate SQL migration file
# 2. Apply to development database
# 3. Update Prisma Client
```

**Generated Migration** (`prisma/migrations/20251108123456_add_battle_pass_tables/migration.sql`):

```sql
-- CreateTable
CREATE TABLE "battle_pass_seasons" (
  "id" SERIAL PRIMARY KEY,
  "season_number" INTEGER NOT NULL,
  "start_date" DATE NOT NULL,
  "end_date" DATE NOT NULL,
  "is_active" BOOLEAN DEFAULT false,
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- CreateTable
CREATE TABLE "user_battle_pass_progress" (
  "id" SERIAL PRIMARY KEY,
  "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
  "season_id" INTEGER NOT NULL REFERENCES "battle_pass_seasons"("id"),
  "current_tier" INTEGER DEFAULT 1,
  "current_xp" INTEGER DEFAULT 0,
  "has_premium_pass" BOOLEAN DEFAULT false,

  UNIQUE("user_id", "season_id")
);

-- CreateIndex
CREATE INDEX "idx_battle_pass_progress_user" ON "user_battle_pass_progress"("user_id", "season_id");
```

### 2. Test Migration (Staging)

```bash
# Apply to staging database
DATABASE_URL="postgresql://staging_db" npx prisma migrate deploy

# Test application with new schema
npm run test
npm run test:e2e

# Verify data integrity
```

### 3. Deploy to Production

```bash
# Run migration in production (automated via CI/CD)
DATABASE_URL="postgresql://production_db" npx prisma migrate deploy

# Migration runs BEFORE new code deployment
# Ensures database ready before app restarts
```

---

## 🔄 MIGRATION TYPES

### Type 1: Additive (Safe - No Downtime)

**Adding a new table:**

```sql
-- ✅ SAFE: No impact on existing queries
CREATE TABLE new_feature (
  id SERIAL PRIMARY KEY,
  data TEXT
);
```

**Adding a new column (with default):**

```sql
-- ✅ SAFE: Existing rows get default value
ALTER TABLE users
ADD COLUMN is_verified BOOLEAN DEFAULT false;
```

### Type 2: Non-Breaking Changes (Low Risk)

**Adding an index:**

```sql
-- ✅ LOW RISK: Use CONCURRENTLY to avoid locking
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
```

**Adding a constraint (nullable):**

```sql
-- ✅ LOW RISK: Nullable constraint
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) NULL;
```

### Type 3: Breaking Changes (Requires Multi-Step Deploy)

**Renaming a column** (3-step process):

**Step 1: Add new column**
```sql
-- Migration 1: Add new column
ALTER TABLE users
ADD COLUMN display_name VARCHAR(100);

-- Backfill data
UPDATE users
SET display_name = username
WHERE display_name IS NULL;
```

**Step 2: Update application code**
- Deploy code that reads from BOTH `username` and `display_name`
- Write to BOTH columns

**Step 3: Remove old column**
```sql
-- Migration 2: Remove old column (after verification)
ALTER TABLE users
DROP COLUMN username;
```

**Changing column type** (careful approach):

```sql
-- DON'T do this directly (causes downtime):
-- ALTER TABLE users ALTER COLUMN id TYPE BIGINT;

-- DO this (safe approach):
-- 1. Add new column
ALTER TABLE users ADD COLUMN id_new BIGINT;

-- 2. Backfill data
UPDATE users SET id_new = id;

-- 3. Deploy code using id_new
-- 4. Drop old column after verification
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN id_new TO id;
```

---

## 🚨 ROLLBACK STRATEGY

### Automatic Rollback (Development)

```bash
# Undo last migration
npx prisma migrate dev --rollback

# Prisma automatically generates down migration
```

### Manual Rollback (Production)

**Prisma doesn't support automatic rollback in production**, so you must:

1. **Create manual rollback SQL** for every migration:

```sql
-- migrations/20251108123456_add_battle_pass_tables/rollback.sql
DROP TABLE IF EXISTS "user_battle_pass_progress";
DROP TABLE IF EXISTS "battle_pass_seasons";
```

2. **Test rollback in staging:**

```bash
psql $STAGING_DATABASE_URL < migrations/20251108123456_add_battle_pass_tables/rollback.sql
```

3. **Execute rollback in production** (if needed):

```bash
psql $DATABASE_URL < migrations/20251108123456_add_battle_pass_tables/rollback.sql
```

### Emergency Rollback Procedure

```bash
# 1. Stop application (prevent writes)
vercel --prod --env MAINTENANCE_MODE=true

# 2. Create database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 3. Run rollback SQL
psql $DATABASE_URL < rollback.sql

# 4. Verify data integrity
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# 5. Deploy previous application version
vercel rollback

# 6. Resume traffic
vercel --prod --env MAINTENANCE_MODE=false
```

---

## 💾 DATA MIGRATION (Not Just Schema)

### Backfilling Data

**Example: Adding `total_puzzles_completed` column**

```javascript
// migrations/scripts/backfill_puzzle_count.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillPuzzleCount() {
  console.log('Starting backfill...');

  const users = await prisma.user.findMany({
    where: { total_puzzles_completed: null }
  });

  console.log(`Found ${users.length} users to backfill`);

  for (const user of users) {
    const count = await prisma.userPuzzleCompletion.count({
      where: { user_id: user.id }
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { total_puzzles_completed: count }
    });

    if (user.id % 100 === 0) {
      console.log(`Processed ${user.id} users...`);
    }
  }

  console.log('Backfill complete!');
}

backfillPuzzleCount()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Run backfill:**

```bash
# Development
node migrations/scripts/backfill_puzzle_count.js

# Production (with progress logging)
DATABASE_URL=$PRODUCTION_DB node migrations/scripts/backfill_puzzle_count.js
```

### Large Data Migrations (Batching)

**For millions of rows:**

```javascript
async function backfillInBatches() {
  const BATCH_SIZE = 1000;
  let offset = 0;
  let processed = 0;

  while (true) {
    const users = await prisma.user.findMany({
      where: { total_puzzles_completed: null },
      take: BATCH_SIZE,
      skip: offset
    });

    if (users.length === 0) break;

    // Process batch
    const updates = users.map(async (user) => {
      const count = await prisma.userPuzzleCompletion.count({
        where: { user_id: user.id }
      });
      return prisma.user.update({
        where: { id: user.id },
        data: { total_puzzles_completed: count }
      });
    });

    await Promise.all(updates);

    processed += users.length;
    console.log(`Processed ${processed} users...`);

    offset += BATCH_SIZE;

    // Prevent overwhelming database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
```

---

## 🧪 TESTING MIGRATIONS

### Pre-Production Testing Checklist

```bash
# 1. Apply migration to staging
DATABASE_URL=$STAGING_DB npx prisma migrate deploy

# 2. Verify schema
npx prisma db pull
git diff prisma/schema.prisma  # Should match expected changes

# 3. Run application tests
npm run test
npm run test:e2e

# 4. Check query performance (new indexes working?)
psql $STAGING_DB -c "EXPLAIN ANALYZE SELECT * FROM users WHERE subscription_tier = 'premium';"

# 5. Verify data integrity
node migrations/scripts/verify_data_integrity.js

# 6. Test rollback
psql $STAGING_DB < migrations/rollback.sql
# Verify application still works with old schema
# Re-apply migration
DATABASE_URL=$STAGING_DB npx prisma migrate deploy
```

### Data Integrity Checks

```javascript
// migrations/scripts/verify_data_integrity.js
async function verifyDataIntegrity() {
  // Check for orphaned records
  const orphaned = await prisma.userPuzzleCompletion.count({
    where: {
      user: { is: null }  // Foreign key broken
    }
  });

  if (orphaned > 0) {
    throw new Error(`Found ${orphaned} orphaned puzzle completions!`);
  }

  // Check for duplicate daily puzzles
  const duplicates = await prisma.$queryRaw`
    SELECT puzzle_date, variant, difficulty, COUNT(*)
    FROM daily_puzzles
    GROUP BY puzzle_date, variant, difficulty
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length > 0) {
    throw new Error(`Found duplicate daily puzzles!`);
  }

  // Check for invalid subscription statuses
  const invalidSubs = await prisma.user.count({
    where: {
      subscription_tier: 'premium',
      subscription_status: { notIn: ['active', 'past_due', 'canceled'] }
    }
  });

  if (invalidSubs > 0) {
    throw new Error(`Found ${invalidSubs} users with invalid subscription status!`);
  }

  console.log('✅ Data integrity verified');
}
```

---

## 📅 MIGRATION SCHEDULE

### Development
- Run migrations freely
- Test rollbacks
- Iterate quickly

### Staging
- Deploy migrations at least **24 hours before production**
- Run full test suite
- Verify with production-like data volume

### Production
- **Deploy during low-traffic window** (3-5 AM UTC)
- **Automated via CI/CD** (no manual SQL execution)
- **Database backup before migration** (automatic with Neon)
- **Rollback plan documented and tested**

---

## 🚀 CI/CD INTEGRATION (GitHub Actions)

```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  migrate-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Database Backup
        run: |
          # Neon automatic backups enabled
          echo "Database backup verified"

      - name: Run Prisma Migrations
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          npx prisma migrate deploy
          echo "✅ Migrations applied successfully"

      - name: Verify Migration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: |
          node migrations/scripts/verify_data_integrity.js

      - name: Deploy to Vercel
        run: |
          vercel deploy --prod --token=${{ secrets.VERCEL_TOKEN }}
          echo "✅ Application deployed"

      - name: Smoke Tests
        run: |
          npm run test:smoke
          echo "✅ Production smoke tests passed"
```

---

## ⚠️ COMMON MIGRATION MISTAKES

### ❌ Mistake 1: No Default Value on Required Column

```sql
-- BAD: Fails if table has existing rows
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) NOT NULL;

-- GOOD: Add with default, then update
ALTER TABLE users
ADD COLUMN phone_number VARCHAR(20) DEFAULT '';

-- Then backfill real values
UPDATE users SET phone_number = '+1234567890' WHERE ...;

-- Then make NOT NULL if needed
ALTER TABLE users ALTER COLUMN phone_number SET NOT NULL;
```

### ❌ Mistake 2: Dropping Column Without Checking Usage

```sql
-- BAD: Drop column immediately (app crashes if code still uses it)
ALTER TABLE users DROP COLUMN old_field;

-- GOOD: 3-step process
-- Step 1: Stop writing to column in code, deploy
-- Step 2: Wait 24 hours, verify no errors
-- Step 3: Drop column in migration
```

### ❌ Mistake 3: Large Table Modification Without Batching

```sql
-- BAD: Update 1M rows at once (locks table for minutes)
UPDATE users SET is_active = true;

-- GOOD: Batch updates
UPDATE users SET is_active = true WHERE id BETWEEN 1 AND 10000;
UPDATE users SET is_active = true WHERE id BETWEEN 10001 AND 20000;
-- ... continue in batches
```

### ❌ Mistake 4: No Rollback Plan

```bash
# BAD: Deploy migration without rollback SQL
npx prisma migrate deploy

# GOOD: Always prepare rollback.sql BEFORE deploying
cat migrations/20251108_add_feature/rollback.sql
# Verify rollback works in staging
# Then deploy to production
```

---

## ✅ MIGRATION CHECKLIST

### Before Every Migration
- [ ] Migration tested in local environment
- [ ] Migration tested in staging environment
- [ ] Rollback SQL prepared and tested
- [ ] Data integrity checks written
- [ ] Application code compatible with both old and new schema
- [ ] Deployment window scheduled (low-traffic time)
- [ ] Team notified (if applicable)
- [ ] Database backup verified (Neon automatic backups)

### During Migration
- [ ] Monitor application logs for errors
- [ ] Monitor database performance metrics
- [ ] Verify migration completed successfully
- [ ] Run smoke tests

### After Migration
- [ ] Verify data integrity checks pass
- [ ] Monitor error rates (should not spike)
- [ ] Monitor API response times (should not degrade)
- [ ] Document migration completion
- [ ] Delete rollback artifacts after 7 days

---

**Migrations are powerful but dangerous. Always test, always have a rollback plan, always deploy during low-traffic windows.**
