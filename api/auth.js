/**
 * Authentication API
 * SECURITY FIXES (November 2025):
 * - Fixed TLS certificate verification
 * - Fixed CORS configuration
 * - Using shared database pool
 * - Added Zod input validation
 */

const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { loginSchema, validate } = require('../lib/validators');
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
