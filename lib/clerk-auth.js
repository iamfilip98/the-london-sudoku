/**
 * Clerk Authentication Library
 * Server-side authentication and user management with Clerk
 *
 * Phase 0 Month 2 - Migration from basic auth to Clerk
 */

const { createClerkClient } = require('@clerk/clerk-sdk-node');
const pool = require('./db-pool');

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Verify Clerk session token from request
 * @param {Object} req - Express request object
 * @returns {Promise<string>} Clerk user ID
 * @throws {Error} If token is invalid or missing
 */
async function verifyClerkToken(req) {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No authentication token provided');
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    // Verify the session token with Clerk
    const sessionClaims = await clerk.verifyToken(token);
    return sessionClaims.sub; // Clerk user ID
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    throw new Error('Invalid authentication token');
  }
}

/**
 * Get user from database by Clerk ID
 * Creates user if they don't exist in our database
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object>} User object from database
 */
async function getUserFromClerkId(clerkId) {
  // Try to find user in our database
  const result = await pool.query(
    'SELECT * FROM users WHERE clerk_id = $1',
    [clerkId]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // User exists in Clerk but not in our DB - create them
  console.log(`Creating new user in database for Clerk ID: ${clerkId}`);
  return await createUserFromClerk(clerkId);
}

/**
 * Create user in our database from Clerk user data
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object>} Newly created user
 */
async function createUserFromClerk(clerkId) {
  try {
    // Fetch user details from Clerk
    const clerkUser = await clerk.users.getUser(clerkId);

    // Extract user data
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;
    const username = clerkUser.username ||
                     email?.split('@')[0] ||
                     `user_${clerkUser.id.substring(0, 8)}`;
    const displayName = clerkUser.firstName ||
                        clerkUser.username ||
                        username;
    const emailVerified = clerkUser.emailAddresses?.[0]?.verification?.status === 'verified';

    // Create user in our database
    const result = await pool.query(
      `INSERT INTO users (
        clerk_id,
        username,
        email,
        display_name,
        email_verified,
        subscription_tier,
        created_at,
        last_active_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (clerk_id) DO UPDATE
      SET
        email = EXCLUDED.email,
        email_verified = EXCLUDED.email_verified,
        last_active_at = NOW()
      RETURNING *`,
      [
        clerkId,
        username,
        email,
        displayName,
        emailVerified,
        'free' // Default tier
      ]
    );

    console.log(`✅ Created user: ${username} (Clerk ID: ${clerkId})`);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating user from Clerk:', error);
    throw new Error('Failed to create user in database');
  }
}

/**
 * Middleware to protect routes with Clerk authentication
 * Usage: app.use(requireAuth)
 */
async function requireAuth(req, res, next) {
  try {
    const clerkId = await verifyClerkToken(req);
    const user = await getUserFromClerkId(clerkId);

    // Attach user to request
    req.user = user;
    req.clerkId = clerkId;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: error.message || 'Unauthorized'
    });
  }
}

/**
 * Link existing database user to Clerk account
 * Used for migrating Filip & Faidao
 * @param {number} userId - Database user ID
 * @param {string} clerkId - Clerk user ID
 */
async function linkUserToClerk(userId, clerkId) {
  try {
    const result = await pool.query(
      `UPDATE users
       SET clerk_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [clerkId, userId]
    );

    if (result.rows.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }

    console.log(`✅ Linked user ID ${userId} to Clerk ID ${clerkId}`);
    return result.rows[0];
  } catch (error) {
    console.error('Error linking user to Clerk:', error);
    throw error;
  }
}

/**
 * Get Clerk user details
 * @param {string} clerkId - Clerk user ID
 * @returns {Promise<Object>} Clerk user object
 */
async function getClerkUser(clerkId) {
  try {
    return await clerk.users.getUser(clerkId);
  } catch (error) {
    console.error('Error fetching Clerk user:', error);
    throw new Error('Failed to fetch user from Clerk');
  }
}

module.exports = {
  clerk,
  verifyClerkToken,
  getUserFromClerkId,
  createUserFromClerk,
  requireAuth,
  linkUserToClerk,
  getClerkUser
};
