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
      default:
        res.status(400).json({
          error: 'Invalid action',
          validActions: ['clear-all', 'clear-old-puzzles', 'generate-fallback', 'init-db']
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
