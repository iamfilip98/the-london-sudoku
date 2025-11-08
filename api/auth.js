/**
 * Authentication API
 * SECURITY FIXES (November 2025):
 * - Fixed TLS certificate verification
 * - Fixed CORS configuration
 * - Using shared database pool
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const bcrypt = require('bcryptjs');

module.exports = async function handler(req, res) {
  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
      return;
    }

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
