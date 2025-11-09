/**
 * Authentication & Profile API
 *
 * SECURITY FIXES (November 2025):
 * - Fixed TLS certificate verification
 * - Fixed CORS configuration
 * - Using shared database pool
 * - Added Zod input validation
 *
 * PHASE 1 MONTH 4 (November 2025):
 * - Extended for user profiles (GET/PUT)
 * - Supports bio, avatar, display name updates
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { loginSchema, validate, sanitizeHtml } = require('../lib/validators');
const bcrypt = require('bcryptjs');

// Ensure bio column exists in users table
async function ensureUserSchema() {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS bio TEXT
    `);
  } catch (error) {
    // Column might already exist, ignore error
    console.log('Bio column check:', error.message);
  }
}

module.exports = async function handler(req, res) {
  // Ensure database schema
  await ensureUserSchema();

  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }

  // Handle different HTTP methods
  if (req.method === 'GET') {
    return handleGetProfile(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateProfile(req, res);
  } else if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // ✅ SECURITY FIX: Validate and sanitize input
    const validation = validate(req.body, loginSchema);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.message,
        details: validation.error.issues
      });
    }

    const { username, password } = validation.data;

    // Query user from database
    const result = await pool.query(
      'SELECT id, username, password_hash, display_name, avatar FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Return success with user data
    res.status(200).json({
      success: true,
      player: user.username,
      displayName: user.display_name,
      avatar: user.avatar
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

/**
 * GET Profile - Retrieve user profile data
 * Query params: username (required)
 */
async function handleGetProfile(req, res) {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Get user profile with stats
    const userResult = await pool.query(`
      SELECT
        id,
        username,
        display_name,
        avatar,
        bio,
        founder,
        created_at,
        last_active_at
      FROM users
      WHERE username = $1
    `, [username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get user stats (total games, best scores, etc.)
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_games,
        COUNT(*) FILTER (WHERE difficulty = 'easy') as easy_games,
        COUNT(*) FILTER (WHERE difficulty = 'medium') as medium_games,
        COUNT(*) FILTER (WHERE difficulty = 'hard') as hard_games,
        AVG(score) as avg_score,
        MAX(score) as best_score,
        MIN(time) as fastest_time
      FROM individual_games
      WHERE player = $1
    `, [username]);

    const stats = statsResult.rows[0];

    // Get current streak
    const streakResult = await pool.query(`
      SELECT current_streak, best_streak
      FROM streaks
      WHERE player = $1
    `, [username]);

    const streak = streakResult.rows[0] || { current_streak: 0, best_streak: 0 };

    return res.status(200).json({
      success: true,
      profile: {
        username: user.username,
        displayName: user.display_name,
        avatar: user.avatar,
        bio: user.bio,
        founder: user.founder || false,  // Phase 1 Month 5: Founder badge
        createdAt: user.created_at,
        lastActiveAt: user.last_active_at,
        stats: {
          totalGames: parseInt(stats.total_games) || 0,
          easyGames: parseInt(stats.easy_games) || 0,
          mediumGames: parseInt(stats.medium_games) || 0,
          hardGames: parseInt(stats.hard_games) || 0,
          avgScore: parseFloat(stats.avg_score) || 0,
          bestScore: parseFloat(stats.best_score) || 0,
          fastestTime: parseInt(stats.fastest_time) || 0
        },
        streak: {
          current: streak.current_streak,
          best: streak.best_streak
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
}

/**
 * PUT Profile - Update user profile
 * Body: { username, bio?, avatar?, displayName? }
 */
async function handleUpdateProfile(req, res) {
  try {
    const { username, bio, avatar, displayName } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    // Validate and sanitize inputs
    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (bio !== undefined) {
      // Sanitize HTML and limit length
      const sanitizedBio = sanitizeHtml(bio).substring(0, 500);
      updates.push(`bio = $${paramIndex}`);
      params.push(sanitizedBio);
      paramIndex++;
    }

    if (avatar !== undefined) {
      // Validate avatar URL (optional)
      if (avatar && avatar.length > 0 && !avatar.match(/^https?:\/\/.+/)) {
        return res.status(400).json({
          success: false,
          error: 'Avatar must be a valid URL'
        });
      }
      updates.push(`avatar = $${paramIndex}`);
      params.push(avatar);
      paramIndex++;
    }

    if (displayName !== undefined) {
      // Sanitize and limit length
      const sanitizedName = sanitizeHtml(displayName).substring(0, 100);
      if (sanitizedName.length < 1) {
        return res.status(400).json({
          success: false,
          error: 'Display name cannot be empty'
        });
      }
      updates.push(`display_name = $${paramIndex}`);
      params.push(sanitizedName);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Update last_active_at
    updates.push(`last_active_at = NOW()`);

    // Add username as last parameter
    params.push(username);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE username = $${paramIndex}
      RETURNING id, username, display_name, avatar, bio
    `;

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      profile: {
        username: result.rows[0].username,
        displayName: result.rows[0].display_name,
        avatar: result.rows[0].avatar,
        bio: result.rows[0].bio
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}
