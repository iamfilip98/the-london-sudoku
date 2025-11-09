// Consolidated admin endpoint for Vercel Hobby plan (max 12 functions)
const { sql } = require('@vercel/postgres');
const { generatePuzzle, solvePuzzle } = require('../lib/sudoku-generator.js');
const pool = require('../lib/db-pool');
const bcrypt = require('bcryptjs');
const { setCorsHeaders } = require('../lib/cors');

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

  // Verify admin key
  const adminKey = req.headers['x-admin-key'];
  const expectedKey = process.env.ADMIN_KEY;

  if (!adminKey || adminKey !== expectedKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const { action } = req.query;

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
      case 'mark-founders':
        await handleMarkFounders(req, res);
        break;
      case 'migrate-phase2-month8':
        await handleMigratePhase2Month8(req, res);
        break;
      default:
        res.status(400).json({
          error: 'Invalid action',
          validActions: ['clear-all', 'clear-old-puzzles', 'generate-fallback', 'init-db', 'migrate-phase1-month5', 'mark-founders', 'migrate-phase2-month8']
        });
    }
  } catch (error) {
    console.error('Admin action error:', error);
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
    console.error('Failed to clear data:', error);
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
    console.error('Failed to clear old puzzles:', error);
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
    console.error('Failed to generate fallback puzzles:', error);
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

    // Initialize users with passwords from environment variables
    const faidaoPassword = (process.env.FAIDAO_PASSWORD || 'sudoku2024').trim();
    const filipPassword = (process.env.FILIP_PASSWORD || 'sudoku2024').trim();

    const faidaoHash = await bcrypt.hash(faidaoPassword, 10);
    const filipHash = await bcrypt.hash(filipPassword, 10);

    await pool.query(`
      INSERT INTO users (username, password_hash, display_name, avatar)
      VALUES
        ('faidao', $1, 'Faidao - The Queen', NULL),
        ('filip', $2, 'Filip - The Champion', NULL)
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        display_name = EXCLUDED.display_name,
        updated_at = NOW()
    `, [faidaoHash, filipHash]);

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

    // Initialize default streak records for both players
    await pool.query(`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `);

    res.status(200).json({
      success: true,
      message: 'Database and users initialized successfully',
      tables: ['users', 'entries', 'achievements', 'streaks'],
      users: ['faidao', 'filip']
    });

  } catch (error) {
    console.error('Database initialization failed:', error);
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
    console.error('Phase 1 Month 5 migration failed:', error);
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
    console.error('Failed to mark founders:', error);
    res.status(500).json({
      error: 'Failed to mark founders',
      details: error.message
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
    console.log('Starting Phase 2 Month 8 migration...');
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
    console.error('Phase 2 Month 8 migration failed:', error);
    res.status(500).json({
      error: 'Migration failed',
      details: error.message
    });
  }
}
