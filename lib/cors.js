/**
 * CORS (Cross-Origin Resource Sharing) Configuration
 *
 * SECURITY FIX (November 2025):
 * - Removed wildcard (*) CORS (CRITICAL SECURITY FIX)
 * - Whitelist only allowed origins
 * - Prevents CSRF attacks from malicious websites
 *
 * Usage:
 *   const { setCorsHeaders } = require('../lib/cors');
 *
 *   module.exports = async function handler(req, res) {
 *     setCorsHeaders(req, res);
 *     // ... your API logic
 *   }
 */

// ✅ SECURITY FIX: Whitelist allowed origins (no wildcards)
const allowedOrigins = [
  'https://thelondonsudoku.com',
  'https://www.thelondonsudoku.com',
  'https://the-london-sudoku.vercel.app',  // Vercel preview deployments
  'https://the-new-london-times.vercel.app',  // Legacy Vercel URL
  process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:3000' : null,
].filter(Boolean);  // Remove null values

/**
 * Set CORS headers for API responses
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
function setCorsHeaders(req, res) {
  const origin = req.headers.origin;

  // ✅ SECURITY: Only allow whitelisted origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (!origin) {
    // Same-origin requests (no origin header) are always allowed
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }
  // If origin is not in whitelist, CORS headers are NOT set (request will fail)

  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;  // Indicate that request was handled
  }

  return false;
}

module.exports = {
  setCorsHeaders,
  allowedOrigins
};
