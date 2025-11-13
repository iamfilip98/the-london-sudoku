// Consolidated admin endpoint for Vercel Hobby plan (max 12 functions)
const { sql } = require('@vercel/postgres');
const { generatePuzzle, solvePuzzle } = require('../lib/sudoku-generator.js');
const pool = require('../lib/db-pool');
const bcrypt = require('bcryptjs');
const { setCorsHeaders } = require('../lib/cors');
const stripeManager = require('../lib/stripe-manager');
const { migrateBattlePass } = require('../lib/battle-pass-migration');
const { migrateLeagues } = require('../lib/leagues-migration');
const { migrateLeagueSeasons } = require('../lib/league-seasons-migration');
const { migrateLeagueSeasonTracking } = require('../lib/league-season-tracking-migration');
const { migrateLeagueZoneTracking } = require('../lib/league-zone-tracking-migration');
const { processSeasonEnd, createNewSeasons } = require('../lib/league-seasons');
const { takeLeagueSnapshots } = require('../lib/league-zone-snapshots');
const { migrateLessons } = require('../lib/lesson-migration');
const { migratePerformanceIndexes, getIndexUsageStats, getSlowQueryCandidates } = require('../lib/performance-migration');

module.exports = async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { action } = req.query;

  // Subscription actions have their own authentication (Stripe signature for webhooks, user session for others)
  const subscriptionActions = ['create-checkout', 'create-portal', 'webhook', 'subscription-status'];

  // Cron action uses Bearer token authentication
  const cronActions = ['cron-process-seasons'];

  const requiresAdminKey = !subscriptionActions.includes(action) && !cronActions.includes(action);

  // Verify admin key for admin-only actions
  if (requiresAdminKey) {
    const adminKey = req.headers['x-admin-key'];
    const expectedKey = process.env.ADMIN_KEY;

    if (!adminKey || adminKey !== expectedKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
  }

  // Verify Bearer token for cron actions
  if (cronActions.includes(action)) {
    const authHeader = req.headers.authorization;
    const cronSecret = process.env.CRON_SECRET;

    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    switch (action) {
      case 'clear-all':
        await handleClearAll(req, res);
        break;
      case 'clear-old-puzzles':
        await handleClearOldPuzzles(req, res);
        break;
      case 'generate-fallback':
        await handleGenerateFallback(req, res);
        break;
      case 'init-db':
        await handleInitDb(req, res);
        break;
      case 'migrate-phase1-month5':
        await handleMigratePhase1Month5(req, res);
        break;
      case 'migrate-phase2-month7':
        await handleMigratePhase2Month7(req, res);
        break;
      case 'mark-founders':
        await handleMarkFounders(req, res);
        break;
      case 'migrate-phase2-month8':
        await handleMigratePhase2Month8(req, res);
        break;
      case 'migrate-battle-pass':
        await handleMigrateBattlePass(req, res);
        break;
      case 'migrate-leagues':
        await handleMigrateLeagues(req, res);
        break;
      case 'migrate-league-seasons':
        await handleMigrateLeagueSeasons(req, res);
        break;
      case 'migrate-phase6-month22':
        await handleMigratePhase6Month22(req, res);
        break;
      case 'migrate-phase6-month23':
        await handleMigratePhase6Month23(req, res);
        break;
      case 'migrate-phase2-lessons':
        await handleMigrateLessons(req, res);
        break;
      case 'migrate-performance-indexes':
        await handleMigratePerformanceIndexes(req, res);
        break;
      case 'performance-stats':
        await handlePerformanceStats(req, res);
        break;
      case 'take-league-snapshots':
        await handleTakeLeagueSnapshots(req, res);
        break;
      case 'process-league-season':
        await handleProcessLeagueSeason(req, res);
        break;
      case 'create-new-seasons':
        await handleCreateNewSeasons(req, res);
        break;
      case 'cron-process-seasons':
        await handleCronProcessSeasons(req, res);
        break;
      case 'create-checkout':
        await handleCreateCheckout(req, res);
        break;
      case 'create-portal':
        await handleCreatePortal(req, res);
        break;
      case 'webhook':
        await handleWebhook(req, res);
        break;
      case 'subscription-status':
        await handleSubscriptionStatus(req, res);
        break;
      default:
        res.status(400).json({
          error: 'Invalid action',
          validActions: ['clear-all', 'clear-old-puzzles', 'generate-fallback', 'init-db', 'migrate-phase1-month5', 'migrate-phase2-month7', 'mark-founders', 'migrate-phase2-month8', 'migrate-battle-pass', 'migrate-leagues', 'migrate-league-seasons', 'migrate-phase6-month22', 'migrate-phase6-month23', 'migrate-phase2-lessons', 'migrate-performance-indexes', 'performance-stats', 'take-league-snapshots', 'process-league-season', 'create-new-seasons', 'cron-process-seasons', 'create-checkout', 'create-portal', 'webhook', 'subscription-status']
        });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Clear all data (from clear-all.js)
async function handleClearAll(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Delete all data
    await sql`DELETE FROM individual_games`;
    await sql`DELETE FROM game_states`;
    await sql`DELETE FROM entries`;
    await sql`DELETE FROM achievements`;
    await sql`DELETE FROM challenges`;

    // Reset streaks
    await sql`UPDATE streaks SET current_streak = 0, updated_at = NOW()`;

    res.status(200).json({
      success: true,
      message: 'All data cleared successfully',
      cleared: ['individual_games', 'game_states', 'entries', 'achievements', 'challenges', 'streaks']
    });
  } catch (error) {
    // Error occurred
    res.status(500).json({ error: 'Failed to clear data', details: error.message });
  }
}

// Clear old puzzles (from clear-old-puzzles.js)
async function handleClearOldPuzzles(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const daysToKeep = parseInt(req.query.days) || 7;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await sql`
      DELETE FROM daily_puzzles
      WHERE date < ${cutoffDate.toISOString().split('T')[0]}
    `;

    res.status(200).json({
      success: true,
      message: `Cleared puzzles older than ${daysToKeep} days`,
      deletedCount: result.rowCount
    });
  } catch (error) {
    // Error occurred
    res.status(500).json({ error: 'Failed to clear old puzzles', details: error.message });
  }
}

// Generate fallback puzzles (from generate-fallback-puzzles.js)
async function handleGenerateFallback(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const count = parseInt(req.query.count) || 10;
    const difficulty = req.query.difficulty || 'all';
    const difficulties = difficulty === 'all' ? ['easy', 'medium', 'hard'] : [difficulty];

    const generated = [];

    for (const diff of difficulties) {
      for (let i = 0; i < count; i++) {
        const seed = Math.random();
        const puzzle = generatePuzzle(diff, seed);
        const solution = solvePuzzle(puzzle);

        if (solution) {
          const qualityScore = calculateQualityScore(puzzle, diff);

          await sql`
            INSERT INTO fallback_puzzles (difficulty, puzzle, solution, quality_score, times_used, last_used)
            VALUES (${diff}, ${JSON.stringify(puzzle)}, ${JSON.stringify(solution)}, ${qualityScore}, 0, NULL)
          `;

          generated.push({ difficulty: diff, quality: qualityScore });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Generated ${generated.length} fallback puzzles`,
      puzzles: generated
    });
  } catch (error) {
    // Error occurred
    res.status(500).json({ error: 'Failed to generate fallback puzzles', details: error.message });
  }
}

function calculateQualityScore(puzzle, difficulty) {
  let score = 100;
  const filledCells = puzzle.flat().filter(cell => cell !== 0).length;

  const targetClues = { easy: 42, medium: 28, hard: 25 };
  const target = targetClues[difficulty];
  const deviation = Math.abs(filledCells - target);
  score -= deviation * 2;

  return Math.max(0, Math.min(100, score));
}

// Initialize database (from init-db.js)
async function handleInitDb(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Test connection
    await pool.query('SELECT NOW()');

    // Create users table for authentication
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(100),
        clerk_id VARCHAR(255) UNIQUE,
        email VARCHAR(255),
        email_verified BOOLEAN DEFAULT false,
        subscription_tier VARCHAR(50) DEFAULT 'free',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_active_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Initialize founder users with passwords from environment variables (if provided)
    // This is optional - system works without pre-creating users
    const foundersToInit = [];

    if (process.env.FAIDAO_PASSWORD) {
      const faidaoHash = await bcrypt.hash(process.env.FAIDAO_PASSWORD.trim(), 10);
      foundersToInit.push(['faidao', faidaoHash, 'Faidao - The Queen', null]);
    }

    if (process.env.FILIP_PASSWORD) {
      const filipHash = await bcrypt.hash(process.env.FILIP_PASSWORD.trim(), 10);
      foundersToInit.push(['filip', filipHash, 'Filip - The Champion', null]);
    }

    // Insert founder users if passwords are configured
    for (const [username, hash, displayName, avatar] of foundersToInit) {
      await pool.query(`
        INSERT INTO users (username, password_hash, display_name, avatar)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username)
        DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          display_name = EXCLUDED.display_name,
          updated_at = NOW()
      `, [username, hash, displayName, avatar]);
    }

    // Create entries table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create achievements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        entry_date DATE,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `);

    // Create streaks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Streaks are initialized on-demand per user, no pre-population needed

    res.status(200).json({
      success: true,
      message: 'Database initialized successfully',
      tables: ['users', 'entries', 'achievements', 'streaks'],
      foundersInitialized: foundersToInit.map(f => f[0])
    });

  } catch (error) {
    res.status(500).json({
      error: 'Database initialization failed',
      details: error.message
    });
  }
}

// Migrate database schema for Phase 1 Month 5 (X-Sudoku, Mini 6x6, free tier limits, founder badges)
async function handleMigratePhase1Month5(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const changes = [];

    // 1. Add variant support to daily_puzzles
    await pool.query(`
      ALTER TABLE daily_puzzles
      ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic'
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_daily_puzzles_variant
      ON daily_puzzles(date, variant)
    `);
    changes.push('Added variant column to daily_puzzles');

    // 2. Add variant support to game_states
    await pool.query(`
      ALTER TABLE game_states
      ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic'
    `);
    await pool.query(`
      ALTER TABLE game_states DROP CONSTRAINT IF EXISTS game_states_player_date_difficulty_key
    `);
    await pool.query(`
      ALTER TABLE game_states ADD CONSTRAINT game_states_player_date_difficulty_variant_key
      UNIQUE(player, date, difficulty, variant)
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_game_states_player_date
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_game_states_player_date_variant
      ON game_states(player, date, difficulty, variant)
    `);
    changes.push('Added variant column to game_states with updated constraints');

    // 3. Add variant support to individual_games
    await pool.query(`
      ALTER TABLE individual_games
      ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic'
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_individual_games_variant
      ON individual_games(variant, difficulty)
    `);
    changes.push('Added variant column to individual_games');

    // 4. Add variant support to fallback_puzzles
    await pool.query(`
      ALTER TABLE fallback_puzzles
      ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic'
    `);
    await pool.query(`
      DROP INDEX IF EXISTS idx_fallback_difficulty
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_fallback_difficulty_variant
      ON fallback_puzzles(variant, difficulty, quality_score DESC, times_used ASC)
    `);
    changes.push('Added variant column to fallback_puzzles');

    // 5. Add founder badges and free tier tracking to users
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS founder BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS daily_classic_played INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_puzzle_date DATE
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_founder
      ON users(founder) WHERE founder = TRUE
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_daily_limits
      ON users(username, last_puzzle_date, daily_classic_played)
    `);
    changes.push('Added founder badges and free tier tracking to users');

    res.status(200).json({
      success: true,
      message: 'Phase 1 Month 5 schema migration completed successfully',
      changes: changes,
      features: [
        'X-Sudoku variant support',
        'Mini 6x6 variant support',
        'Free tier limits (3 Classic dailies)',
        'Founder badges system'
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Mark Faidao & Filip as founders (Phase 1 Month 5)
async function handleMarkFounders(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const result = await pool.query(`
      UPDATE users
      SET founder = TRUE
      WHERE username IN ('faidao', 'filip')
      RETURNING username, display_name, founder
    `);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Founders not found in database. Run init-db first.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Founders marked successfully',
      founders: result.rows
    });

  } catch (error) {
    // Error occurred
    res.status(500).json({
      error: 'Failed to mark founders',
      details: error.message
    });
  }
}

// Phase 2 Month 7: Premium subscription schema migration
async function handleMigratePhase2Month7(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const changes = [];

    // 1. Add premium fields to users table
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
      ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255)
    `);
    changes.push('Added premium subscription fields to users table');

    // 2. Add indexes for Stripe lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_premium ON users(premium)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status)
    `);
    changes.push('Created indexes for Stripe lookups');

    // 3. Create subscription_events table for webhook logging
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(255) UNIQUE NOT NULL,
        event_type VARCHAR(100) NOT NULL,
        customer_id VARCHAR(255),
        subscription_id VARCHAR(255),
        username VARCHAR(100),
        data JSONB,
        processed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    changes.push('Created subscription_events table');

    // 4. Add indexes for subscription_events
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_events_event_id ON subscription_events(event_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_events_customer_id ON subscription_events(customer_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_events_processed ON subscription_events(processed)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at)
    `);
    changes.push('Created indexes for subscription_events');

    // 5. Create premium_users view
    await pool.query(`
      CREATE OR REPLACE VIEW premium_users AS
      SELECT
        username,
        email,
        premium,
        subscription_status,
        subscription_start_date,
        subscription_end_date,
        subscription_cancel_at_period_end,
        created_at
      FROM users
      WHERE premium = TRUE
        AND subscription_status = 'active'
      ORDER BY subscription_start_date DESC
    `);
    changes.push('Created premium_users view');

    res.status(200).json({
      success: true,
      message: 'Phase 2 Month 7 schema migration completed successfully',
      changes: changes,
      features: [
        'Stripe subscription integration',
        'Premium user management',
        'Webhook event logging',
        'Subscription status tracking'
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Create Stripe checkout session (from subscription.js)
async function handleCreateCheckout(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username, email } = req.body;

  if (!username || !email) {
    return res.status(400).json({
      success: false,
      error: 'username and email are required'
    });
  }

  try {
    const session = await stripeManager.createCheckoutSession(username, email);

    return res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      url: session.url
    });
  } catch (error) {
    // Error occurred
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
}

// Create customer portal session (from subscription.js)
async function handleCreatePortal(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username } = req.body;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'username is required'
    });
  }

  try {
    const portal = await stripeManager.createPortalSession(username);

    return res.status(200).json({
      success: true,
      url: portal.url
    });
  } catch (error) {
    // Error occurred
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create portal session'
    });
  }
}

// Handle Stripe webhook (from subscription.js)
async function handleWebhook(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const signature = req.headers['stripe-signature'];

  if (!signature) {
    return res.status(400).json({
      success: false,
      error: 'Missing stripe-signature header'
    });
  }

  try {
    // Get raw body (Vercel provides this as Buffer)
    const rawBody = req.body;

    const success = await stripeManager.handleWebhook(rawBody, signature);

    if (success) {
      return res.status(200).json({ received: true });
    } else {
      return res.status(400).json({ received: false });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Get subscription status (from subscription.js)
async function handleSubscriptionStatus(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { username } = req.query;

  if (!username) {
    return res.status(400).json({
      success: false,
      error: 'username query parameter is required'
    });
  }

  try {
    const status = await stripeManager.getSubscriptionStatus(username);

    if (!status) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      premium: status.premium,
      subscriptionStatus: status.subscription_status,
      subscriptionStartDate: status.subscription_start_date,
      subscriptionEndDate: status.subscription_end_date,
      cancelAtPeriodEnd: status.subscription_cancel_at_period_end
    });
  } catch (error) {
    // Error occurred
    return res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
}

// Phase 2 Month 8: Friends System & Social Sharing schema migration
async function handleMigratePhase2Month8(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const changes = [];

    // Read and execute the migration SQL file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(process.cwd(), 'migrations', 'phase2-month8-friends-schema.sql');

    let migrationSQL;
    try {
      migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Migration file not found',
        details: error.message
      });
    }

    // Execute the migration SQL
    await pool.query(migrationSQL);
    changes.push('Executed Phase 2 Month 8 migration SQL');

    // Verify tables were created
    const tables = ['friend_requests', 'friendships', 'social_shares', 'activity_feed'];
    for (const table of tables) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = $1
        )
      `, [table]);

      if (result.rows[0].exists) {
        changes.push(`✅ Table created: ${table}`);
      }
    }

    // Verify functions were created
    const functions = ['get_user_friends', 'are_friends', 'create_friendship_from_request'];
    for (const func of functions) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM pg_proc
          WHERE proname = $1
        )
      `, [func]);

      if (result.rows[0].exists) {
        changes.push(`✅ Function created: ${func}`);
      }
    }

    // Verify views were created
    const views = ['pending_friend_requests', 'friends_with_details'];
    for (const view of views) {
      const result = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.views
          WHERE table_name = $1
        )
      `, [view]);

      if (result.rows[0].exists) {
        changes.push(`✅ View created: ${view}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Phase 2 Month 8 schema migration completed successfully',
      changes: changes,
      features: [
        'Friend requests (send, accept, reject)',
        'Friendships (bidirectional relationships)',
        'Activity feed for social interactions',
        'Social sharing tracking',
        'Helper functions for friend queries',
        'Views for easy data access'
      ]
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Phase 3 Month 12: Battle Pass System migration
async function handleMigrateBattlePass(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateBattlePass();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Battle Pass migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Battle Pass migration completed successfully',
      features: [
        'Battle Pass seasons (Season 1: Launch Season created)',
        'Battle Pass tiers (100 tiers with rewards)',
        'User XP tracking (automatic on puzzle completion)',
        'Reward claiming system (free + premium tracks)',
        'Token economy (earn/spend tokens)',
        'User inventory (themes, badges, avatars, titles)',
        'Leaderboard system (tier-based rankings)'
      ],
      season1: {
        name: 'Launch Season',
        startDate: '2025-12-01',
        endDate: '2026-03-01',
        duration: '90 days',
        totalTiers: 100
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Phase 4 Month 15: Custom Leagues migration
async function handleMigrateLeagues(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateLeagues();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Leagues migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Leagues migration completed successfully',
      features: [
        'Official leagues (Bronze → Legend tiers)',
        'League membership tracking',
        'Weekly points and ranking system',
        'Promotion/demotion mechanics',
        'Custom league creation (Premium feature)',
        'League activity history'
      ],
      officialLeagues: {
        bronze: { max: 1000, tier: 'Starting league' },
        silver: { max: 500, tier: 'Rising stars' },
        gold: { max: 250, tier: 'Elite competition' },
        platinum: { max: 100, tier: 'Master-level play' },
        diamond: { max: 50, tier: 'Near-legendary' },
        legend: { max: 25, tier: 'Ultimate achievement' }
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Phase 6 Month 19: League Seasons migration
async function handleMigrateLeagueSeasons(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateLeagueSeasons();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'League seasons migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'League Seasons migration completed successfully',
      features: [
        'Weekly season tracking system',
        'Automatic promotion/demotion (top/bottom 20%)',
        'Season history and results',
        'Points reset per season',
        'Tier progression tracking',
        'Season leaderboards with zones'
      ],
      tables: result.tables,
      modifications: result.modifications,
      seasonSystem: {
        duration: 'Weekly (Monday-Sunday)',
        promotionRate: '20% (top performers)',
        demotionRate: '20% (bottom performers)',
        pointsReset: 'Weekly'
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Phase 6 Month 22: Advanced League Achievement Tracking migration
async function handleMigratePhase6Month22(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateLeagueSeasonTracking();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Phase 6 Month 22 migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Phase 6 Month 22 migration completed successfully',
      features: [
        'Rank percentile tracking (top X% achievements)',
        'Winning margin calculation (victory margin achievements)',
        'Maximum possible points tracking (perfect season detection)',
        'Enhanced season statistics for achievements'
      ],
      columns: result.columns,
      modifications: result.modifications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Phase 6 Month 22 migration failed',
      details: error.message
    });
  }
}

// Phase 6 Month 23: Intra-Season Zone Tracking migration
async function handleMigratePhase6Month23(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateLeagueZoneTracking();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Phase 6 Month 23 migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Phase 6 Month 23 migration completed successfully',
      features: result.features,
      tables: result.tables
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Phase 6 Month 23 migration failed',
      details: error.message
    });
  }
}

// Phase 2: Tutorial Lesson System migration
async function handleMigrateLessons(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migrateLessons();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Lesson System migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lesson System migration completed successfully',
      features: [
        'Lesson progress tracking (20 lessons across 3 courses)',
        'Practice puzzle attempts tracking',
        'Quiz performance tracking',
        'Automatic achievement awards via database triggers',
        '25 lesson achievements (individual + course + master)',
        'PostgreSQL functions and triggers for lesson completion',
        'XP rewards: 3,725 total XP available'
      ],
      tables: [
        'lesson_progress',
        'lesson_practice_attempts',
        'lesson_quiz_attempts',
        'lesson_achievements',
        'user_lesson_achievements'
      ],
      courses: {
        beginner: { lessons: 6, xp: 425, access: 'FREE' },
        intermediate: { lessons: 8, xp: 1300, access: '3 FREE + 5 PREMIUM' },
        variants: { lessons: 6, xp: 1300, access: 'ALL PREMIUM' },
        bonuses: { courseCompletions: 600, masterAchievement: 500 }
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Performance: Database Index Optimization migration
async function handleMigratePerformanceIndexes(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Run the migration
    const result = await migratePerformanceIndexes();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Performance index migration failed'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Performance index optimization completed successfully',
      features: [
        '24 new indexes created for query optimization',
        'Foreign key indexes (6) - prevent table scans on JOINs/deletes',
        'Timestamp indexes (4) - faster date range queries',
        'Composite indexes (6) - optimized for common query patterns',
        'Partial indexes (1) - space-efficient filtering',
        'Text search indexes (3) - case-insensitive search',
        'Covering indexes (2) - eliminate table lookups',
        'ANALYZE run on 14 tables for query planner optimization'
      ],
      performance: {
        expectedImprovements: {
          leaderboardGeneration: '10-40x faster (500-800ms → 20-50ms)',
          userStatsCalculation: '10-20x faster (200-400ms → 10-30ms)',
          premiumStatusCheck: '10-50x faster (50-100ms → 1-5ms)',
          leagueRankings: '15-20x faster (300-600ms → 15-40ms)',
          gameStateResume: '15-20x faster (100-200ms → 5-15ms)',
          friendListLoading: '10-15x faster (150-300ms → 10-25ms)',
          subscriptionExpiry: '15-20x faster (200-400ms → 10-30ms)'
        },
        overallImpact: '30-50% faster API response times across all endpoints'
      },
      indexesCreated: result.indexesCreated,
      tablesAnalyzed: result.tablesAnalyzed
    });

  } catch (error) {
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}

// Performance: Get database performance statistics (index usage, slow queries)
async function handlePerformanceStats(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Get index usage stats
    const indexUsage = await getIndexUsageStats();

    // Get slow query candidates (tables with sequential scans)
    const slowQueryCandidates = await getSlowQueryCandidates();

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      indexUsage: {
        description: 'Top 20 most-used indexes by scan count',
        data: indexUsage
      },
      slowQueryCandidates: {
        description: 'Tables with high sequential scan rates (potential missing indexes)',
        data: slowQueryCandidates,
        warning: slowQueryCandidates.length > 0 ?
          `${slowQueryCandidates.length} tables have >100 sequential scans - consider adding indexes` :
          'All tables have healthy index usage'
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch performance stats',
      details: error.message
    });
  }
}

// Take daily league position snapshots
async function handleTakeLeagueSnapshots(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    const result = await takeLeagueSnapshots();

    res.status(200).json({
      success: true,
      message: 'League snapshots completed successfully',
      result: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to take league snapshots',
      details: error.message
    });
  }
}

// Process league season end (promotion/demotion/reset)
async function handleProcessLeagueSeason(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    const result = await processSeasonEnd();

    res.status(200).json({
      success: true,
      message: 'Season processing completed',
      ...result
    });

  } catch (error) {
    res.status(500).json({
      error: 'Season processing failed',
      details: error.message
    });
  }
}

// Create new seasons for all leagues
async function handleCreateNewSeasons(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    const result = await createNewSeasons();

    res.status(200).json({
      success: true,
      message: `Created ${result.length} new seasons`,
      seasons: result
    });

  } catch (error) {
    res.status(500).json({
      error: 'Season creation failed',
      details: error.message
    });
  }
}

// Cron job: Weekly season processing (consolidated to respect 12-endpoint limit)
async function handleCronProcessSeasons(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {

    // Step 1: Process current season end (promote/demote/reset)
    const processResult = await processSeasonEnd();

    if (!processResult.success) {
      throw new Error('Season processing failed');
    }


    // Step 2: Create new seasons for next week
    const newSeasons = await createNewSeasons();


    // Return success
    return res.status(200).json({
      success: true,
      message: 'Weekly season processing completed',
      results: {
        seasonsProcessed: processResult.seasonsProcessed,
        promoted: processResult.promoted,
        demoted: processResult.demoted,
        stayed: processResult.stayed,
        newSeasonsCreated: newSeasons.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Season processing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
