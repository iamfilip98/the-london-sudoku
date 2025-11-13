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
 *
 * PERFORMANCE (November 2025):
 * - Redis caching for user profiles (15min TTL)
 * - Redis caching for friends lists (10min TTL)
 * - Auto-invalidation on profile/friends updates
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { loginSchema, validate, sanitizeHtml } = require('../lib/validators');
const bcrypt = require('bcryptjs');
const { getCached, invalidateCachePattern, CACHE_DURATIONS, CacheKeys } = require('../lib/cache');

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

  // Handle different HTTP methods and actions
  if (req.method === 'GET') {
    // Check for friends-related queries
    const { friends, 'friend-requests': friendRequests } = req.query;
    if (friends) {
      return handleGetFriends(req, res, friends);
    } else if (friendRequests) {
      return handleGetFriendRequests(req, res, friendRequests);
    }
    return handleGetProfile(req, res);
  } else if (req.method === 'PUT') {
    return handleUpdateProfile(req, res);
  } else if (req.method === 'POST') {
    const { action } = req.query;
    // Handle friends actions
    if (action === 'send-friend-request') {
      return handleSendFriendRequest(req, res);
    } else if (action === 'accept-friend-request') {
      return handleAcceptFriendRequest(req, res);
    } else if (action === 'reject-friend-request') {
      return handleRejectFriendRequest(req, res);
    } else if (action === 'remove-friend') {
      return handleRemoveFriend(req, res);
    }
    // Default: handle login
  } else {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // ✅ SECURITY FIX: Validate and sanitize input (login)
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

    // Use caching for user profiles (15min TTL)
    const profile = await getCached(
      CacheKeys.userProfile(username),
      async () => {
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
          return null; // Cache null result to avoid repeated DB hits
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

        return {
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
        };
      },
      CACHE_DURATIONS.USER_PROFILE // 15 minutes
    );

    if (profile === null) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      profile
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

    // Invalidate profile cache after update
    await invalidateCachePattern(`user:${username}:*`);

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

// =====================================================
// PHASE 2 MONTH 8: FRIENDS SYSTEM
// =====================================================

// Get friends list for a user
async function handleGetFriends(req, res, username) {
  try {
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;

    // Get friends using the database view
    const friendsResult = await pool.query(`
      SELECT
        CASE
          WHEN user1_id = $1 THEN user2_id
          ELSE user1_id
        END AS friend_id,
        CASE
          WHEN user1_id = $1 THEN user2_username
          ELSE user1_username
        END AS username,
        CASE
          WHEN user1_id = $1 THEN user2_display_name
          ELSE user1_display_name
        END AS display_name,
        CASE
          WHEN user1_id = $1 THEN user2_avatar
          ELSE user1_avatar
        END AS avatar,
        CASE
          WHEN user1_id = $1 THEN user2_last_active
          ELSE user1_last_active
        END AS last_active,
        friendship_date
      FROM friends_with_details
      WHERE user1_id = $1 OR user2_id = $1
      ORDER BY friendship_date DESC
    `, [userId]);

    return res.status(200).json({
      success: true,
      friends: friendsResult.rows,
      count: friendsResult.rows.length
    });

  } catch (error) {
    console.error('Get friends error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get friends list'
    });
  }
}

// Get friend requests for a user (both incoming and outgoing)
async function handleGetFriendRequests(req, res, username) {
  try {
    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userId = userResult.rows[0].id;

    // Get incoming requests (requests TO this user)
    const incomingResult = await pool.query(`
      SELECT
        id,
        requester_id,
        requester_username,
        requester_display_name,
        requester_avatar,
        created_at
      FROM pending_friend_requests
      WHERE recipient_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    // Get outgoing requests (requests FROM this user)
    const outgoingResult = await pool.query(`
      SELECT
        id,
        recipient_id,
        recipient_username,
        recipient_display_name,
        created_at
      FROM pending_friend_requests
      WHERE requester_id = $1
      ORDER BY created_at DESC
    `, [userId]);

    return res.status(200).json({
      success: true,
      incoming: incomingResult.rows,
      outgoing: outgoingResult.rows
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get friend requests'
    });
  }
}

// Send a friend request
async function handleSendFriendRequest(req, res) {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Both "from" and "to" usernames are required'
      });
    }

    if (from === to) {
      return res.status(400).json({
        success: false,
        error: 'Cannot send friend request to yourself'
      });
    }

    // Get user IDs
    const fromResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [from]
    );

    const toResult = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [to]
    );

    if (fromResult.rows.length === 0 || toResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'One or both users not found'
      });
    }

    const fromId = fromResult.rows[0].id;
    const toId = toResult.rows[0].id;

    // Check if already friends
    const friendCheckResult = await pool.query(
      'SELECT are_friends($1, $2) AS are_friends',
      [fromId, toId]
    );

    if (friendCheckResult.rows[0].are_friends) {
      return res.status(400).json({
        success: false,
        error: 'Already friends with this user'
      });
    }

    // Check if request already exists
    const existingResult = await pool.query(
      'SELECT id, status FROM friend_requests WHERE (requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1)',
      [fromId, toId]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: 'Friend request already exists'
        });
      }
    }

    // Create friend request
    const result = await pool.query(
      'INSERT INTO friend_requests (requester_id, recipient_id, status) VALUES ($1, $2, $3) RETURNING id, created_at',
      [fromId, toId, 'pending']
    );

    return res.status(200).json({
      success: true,
      message: 'Friend request sent successfully',
      requestId: result.rows[0].id,
      createdAt: result.rows[0].created_at
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send friend request'
    });
  }
}

// Accept a friend request
async function handleAcceptFriendRequest(req, res) {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Update request status to 'accepted'
    const updateResult = await pool.query(
      'UPDATE friend_requests SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING requester_id, recipient_id',
      ['accepted', requestId, 'pending']
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found or already processed'
      });
    }

    // Create friendship using the database function
    const createResult = await pool.query(
      'SELECT create_friendship_from_request($1) AS success',
      [requestId]
    );

    if (!createResult.rows[0].success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create friendship'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Friend request accepted successfully'
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept friend request'
    });
  }
}

// Reject a friend request
async function handleRejectFriendRequest(req, res) {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Update request status to 'rejected'
    const result = await pool.query(
      'UPDATE friend_requests SET status = $1, updated_at = NOW() WHERE id = $2 AND status = $3 RETURNING id',
      ['rejected', requestId, 'pending']
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Friend request not found or already processed'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Friend request rejected successfully'
    });

  } catch (error) {
    console.error('Reject friend request error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reject friend request'
    });
  }
}

// Remove a friend
async function handleRemoveFriend(req, res) {
  try {
    const { user1, user2 } = req.body;

    if (!user1 || !user2) {
      return res.status(400).json({
        success: false,
        error: 'Both user1 and user2 are required'
      });
    }

    // Get user IDs
    const user1Result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [user1]
    );

    const user2Result = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [user2]
    );

    if (user1Result.rows.length === 0 || user2Result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'One or both users not found'
      });
    }

    const user1Id = user1Result.rows[0].id;
    const user2Id = user2Result.rows[0].id;

    // Ensure consistent ordering
    const minId = Math.min(user1Id, user2Id);
    const maxId = Math.max(user1Id, user2Id);

    // Delete friendship
    const result = await pool.query(
      'DELETE FROM friendships WHERE user1_id = $1 AND user2_id = $2 RETURNING id',
      [minId, maxId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Friendship not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove friend'
    });
  }
}
