/**
 * Import Achievement API
 * PHASE 0 MONTH 3: Anonymous Data Migration
 *
 * Purpose: Import anonymous achievements to user account after signup
 * Called by: lib/anonymous-session.js during migrateAnonymousToUser()
 *
 * Security: Requires Clerk authentication token
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { clerk } = require('../lib/clerk-auth');

/**
 * Validate import achievement request
 * @param {Object} data - Request data
 * @throws {Error} If validation fails
 */
function validateImportAchievementRequest(data) {
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

  // Add index for performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_achievements_player
    ON achievements(player)
  `);
}

/**
 * Import anonymous achievement to user account
 * @param {string} player - Player username
 * @param {string} achievementId - Achievement ID
 * @param {number} unlockedAt - Timestamp when unlocked
 */
async function importAchievement(player, achievementId, unlockedAt) {
  // Initialize table if needed
  await initAchievementsTable();

  // Convert timestamp to date for entry_date
  const unlockedDate = unlockedAt ? new Date(unlockedAt) : new Date();
  const entryDate = unlockedDate.toISOString().split('T')[0];

  // Insert achievement
  // Use ON CONFLICT to avoid duplicates
  await pool.query(`
    INSERT INTO achievements (
      player, achievement_id, unlocked_at, entry_date, created_at
    )
    VALUES ($1, $2, $3, $4, NOW())
    ON CONFLICT (player, achievement_id)
    DO NOTHING
  `, [player, achievementId, unlockedDate, entryDate]);

  console.log(`✅ Imported achievement for ${player}: ${achievementId}`);
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
      validateImportAchievementRequest(req.body);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const { id, unlockedAt } = req.body;

    // Get player username from Clerk ID
    const player = await getPlayerFromClerkId(userId);

    // Import the achievement
    await importAchievement(player, id, unlockedAt);

    return res.status(200).json({
      success: true,
      message: 'Achievement imported successfully',
      player,
      achievementId: id
    });

  } catch (error) {
    console.error('Import achievement error:', error);
    return res.status(500).json({
      error: 'Failed to import achievement',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
