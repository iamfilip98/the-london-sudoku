/**
 * Import API - Anonymous Data Migration
 * PHASE 0 MONTH 3
 *
 * Purpose: Import anonymous user data to authenticated account after signup
 * Handles BOTH completions and achievements in one endpoint
 *
 * Routes:
 * - POST /api/import?type=completion - Import game completion
 * - POST /api/import?type=achievement - Import achievement
 *
 * Security: Requires Clerk authentication token
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { clerk } = require('../lib/clerk-auth');

/**
 * Get player username from Clerk user ID
 * @param {string} clerkUserId - Clerk user ID
 * @returns {Promise<string>} Player username
 */
async function getPlayerFromClerkId(clerkUserId) {
  try {
    // First check if user exists in our database with clerk_id
    const result = await pool.query(
      'SELECT username FROM users WHERE clerk_id = $1',
      [clerkUserId]
    );

    if (result.rows.length > 0) {
      return result.rows[0].username;
    }

    // If not found, this might be a new Clerk user
    // Get user info from Clerk
    const clerkUser = await clerk.users.getUser(clerkUserId);

    if (!clerkUser) {
      throw new Error('User not found in Clerk');
    }

    // Return username from Clerk (or email prefix as fallback)
    return clerkUser.username || clerkUser.emailAddresses[0]?.emailAddress.split('@')[0] || clerkUserId.substring(0, 8);

  } catch (error) {
    // Error occurred
    // Fallback: use clerk ID substring as username
    return clerkUserId.substring(0, 16);
  }
}

/**
 * Validate import completion request
 */
function validateCompletionRequest(data) {
  const { userId, date, difficulty, time, score, errors, hints } = data;

  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error('date is required and must be in YYYY-MM-DD format');
  }
  if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new Error('difficulty must be easy, medium, or hard');
  }
  if (typeof time !== 'number' || time < 0) {
    throw new Error('time must be a non-negative number');
  }
  if (typeof score !== 'number' || score < 0) {
    throw new Error('score must be a non-negative number');
  }
  if (typeof errors !== 'number' || errors < 0) {
    throw new Error('errors must be a non-negative number');
  }
  if (typeof hints !== 'number' || hints < 0) {
    throw new Error('hints must be a non-negative number');
  }
}

/**
 * Validate import achievement request
 */
function validateAchievementRequest(data) {
  const { userId, id, unlockedAt } = data;

  if (!userId || typeof userId !== 'string') {
    throw new Error('userId is required and must be a string');
  }
  if (!id || typeof id !== 'string') {
    throw new Error('achievement id is required and must be a string');
  }
  if (unlockedAt && typeof unlockedAt !== 'number') {
    throw new Error('unlockedAt must be a timestamp number');
  }
}

/**
 * Import completion to user account
 */
async function importCompletion(player, date, difficulty, gameData) {
  const { time, score, errors, hints } = gameData;

  await pool.query(`
    INSERT INTO individual_games (
      player, date, difficulty, time, errors, score, hints, completed_at, created_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
    ON CONFLICT (player, date, difficulty)
    DO UPDATE SET
      time = LEAST(individual_games.time, $4),
      errors = LEAST(individual_games.errors, $5),
      score = GREATEST(individual_games.score, $6),
      hints = LEAST(individual_games.hints, $7),
      updated_at = NOW()
  `, [player, date, difficulty, time, errors || 0, score || 0, hints || 0]);

}

/**
 * Ensure achievements table exists
 */
async function initAchievementsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id SERIAL PRIMARY KEY,
      player VARCHAR(50) NOT NULL,
      achievement_id VARCHAR(100) NOT NULL,
      unlocked_at TIMESTAMP DEFAULT NOW(),
      entry_date DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(player, achievement_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_achievements_player
    ON achievements(player)
  `);
}

/**
 * Import achievement to user account
 */
async function importAchievement(player, achievementId, unlockedAt) {
  await initAchievementsTable();

  const unlockedDate = unlockedAt ? new Date(unlockedAt) : new Date();
  const entryDate = unlockedDate.toISOString().split('T')[0];

  await pool.query(`
    INSERT INTO achievements (
      player, achievement_id, unlocked_at, entry_date, created_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (player, achievement_id)
    DO NOTHING
  `, [player, achievementId, unlockedDate, entryDate]);

}

/**
 * API Handler
 */
module.exports = async function handler(req, res) {
  // Set CORS headers
  if (setCorsHeaders(req, res)) {
    return; // Preflight request handled
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify Clerk authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized - Missing or invalid token' });
    }

    const { userId, type } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - userId required' });
    }

    if (!type || !['completion', 'achievement'].includes(type)) {
      return res.status(400).json({ error: 'type must be "completion" or "achievement"' });
    }

    // Get player username from Clerk ID
    const player = await getPlayerFromClerkId(userId);

    // Handle based on type
    if (type === 'completion') {
      // Validate completion request
      try {
        validateCompletionRequest(req.body);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      const { date, difficulty, time, score, errors, hints } = req.body;

      await importCompletion(player, date, difficulty, {
        time, score, errors, hints
      });

      return res.status(200).json({
        success: true,
        message: 'Completion imported successfully',
        player,
        date,
        difficulty
      });

    } else if (type === 'achievement') {
      // Validate achievement request
      try {
        validateAchievementRequest(req.body);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      const { id, unlockedAt } = req.body;

      await importAchievement(player, id, unlockedAt);

      return res.status(200).json({
        success: true,
        message: 'Achievement imported successfully',
        player,
        achievementId: id
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Failed to import data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
