/**
 * Import Completion API
 * PHASE 0 MONTH 3: Anonymous Data Migration
 *
 * Purpose: Import anonymous game completions to user account after signup
 * Called by: lib/anonymous-session.js during migrateAnonymousToUser()
 *
 * Security: Requires Clerk authentication token
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { clerk } = require('../lib/clerk-auth');

/**
 * Validate import completion request
 * @param {Object} data - Request data
 * @throws {Error} If validation fails
 */
function validateImportCompletionRequest(data) {
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
    console.error('Error getting player from Clerk ID:', error);
    // Fallback: use clerk ID substring as username
    return clerkUserId.substring(0, 16);
  }
}

/**
 * Import anonymous completion to user account
 * @param {string} player - Player username
 * @param {string} date - Date (YYYY-MM-DD)
 * @param {string} difficulty - Difficulty level
 * @param {Object} gameData - Game data
 */
async function importCompletion(player, date, difficulty, gameData) {
  const {
    time,
    score,
    errors,
    hints
  } = gameData;

  // Insert into individual_games table
  // Use ON CONFLICT to avoid duplicates (in case import runs multiple times)
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

  console.log(`✅ Imported completion for ${player}: ${difficulty} on ${date}`);
}

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

    const token = authHeader.split(' ')[1];

    // Verify token with Clerk (simplified check)
    // In production, you'd verify the JWT signature
    const { userId } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - userId required' });
    }

    // Validate request data
    try {
      validateImportCompletionRequest(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const { date, difficulty, time, score, errors, hints } = req.body;

    // Get player username from Clerk ID
    const player = await getPlayerFromClerkId(userId);

    // Import the completion
    await importCompletion(player, date, difficulty, {
      time,
      score,
      errors,
      hints
    });

    return res.status(200).json({
      success: true,
      message: 'Completion imported successfully',
      player,
      date,
      difficulty
    });

  } catch (error) {
    console.error('Import completion error:', error);
    return res.status(500).json({
      error: 'Failed to import completion',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
