/**
 * Rate Limiting Middleware
 *
 * Uses Vercel KV (Redis) for distributed rate limiting
 * Protects against brute force attacks, spam, and API abuse
 *
 * SECURITY: Critical for production deployment
 *
 * Usage:
 *   const { rateLimit } = require('../lib/rate-limit');
 *
 *   module.exports = async function handler(req, res) {
 *     const limited = await rateLimit(req, 'auth', { max: 5, window: 900 });
 *     if (limited) {
 *       return res.status(429).json({ error: 'Too many requests' });
 *     }
 *     // ... rest of API logic
 *   }
 */

// Vercel KV will be available after setup
let kv;

try {
  kv = require('@vercel/kv').kv;
} catch (error) {
  console.warn('⚠️ Vercel KV not available. Rate limiting disabled (development mode).');
  kv = null;
}

/**
 * Rate limit configurations for different endpoints
 */
const RATE_LIMITS = {
  // Authentication endpoints - most restrictive
  auth: {
    max: 5,           // 5 attempts
    window: 900,      // per 15 minutes (900 seconds)
    message: 'Too many login attempts. Please try again in 15 minutes.'
  },

  // Game submissions - moderate limits
  game_submit: {
    max: 100,         // 100 submissions
    window: 3600,     // per hour
    message: 'Too many game submissions. Please try again later.'
  },

  // Puzzle fetching - generous limits
  puzzle_fetch: {
    max: 200,         // 200 requests
    window: 3600,     // per hour
    message: 'Too many puzzle requests. Please try again later.'
  },

  // Admin actions - very restrictive
  admin: {
    max: 10,          // 10 actions
    window: 600,      // per 10 minutes
    message: 'Too many admin actions. Please try again in 10 minutes.'
  },

  // General API - moderate limits
  api: {
    max: 300,         // 300 requests
    window: 3600,     // per hour
    message: 'Too many requests. Please try again later.'
  }
};

/**
 * Get client identifier from request
 * Uses IP address as identifier
 *
 * @param {Object} req - Request object
 * @returns {string} Client identifier
 */
function getClientId(req) {
  // Try to get real IP from various headers (Vercel sets these)
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];
  const ip = forwardedFor?.split(',')[0] || realIp || req.socket?.remoteAddress || 'unknown';

  return `rate_limit:${ip}`;
}

/**
 * Rate limit a request
 *
 * @param {Object} req - Request object
 * @param {string} endpoint - Endpoint name (e.g., 'auth', 'game_submit')
 * @param {Object} options - Custom rate limit options
 * @param {number} options.max - Maximum requests allowed
 * @param {number} options.window - Time window in seconds
 * @returns {Promise<boolean>} True if rate limited, false if allowed
 */
async function rateLimit(req, endpoint = 'api', options = {}) {
  // If KV not available (development), skip rate limiting
  if (!kv) {
    return false;
  }

  try {
    // Get rate limit config
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
    const max = options.max || config.max;
    const window = options.window || config.window;

    // Get client identifier
    const clientId = getClientId(req);
    const key = `${clientId}:${endpoint}`;

    // Get current count
    const current = await kv.get(key);
    const count = current ? parseInt(current) : 0;

    // Check if rate limited
    if (count >= max) {
      console.warn(`Rate limit exceeded for ${clientId} on ${endpoint} (${count}/${max})`);
      return true;
    }

    // Increment counter
    if (count === 0) {
      // First request - set with expiry
      await kv.setex(key, window, 1);
    } else {
      // Increment existing counter
      await kv.incr(key);
    }

    return false;

  } catch (error) {
    console.error('Rate limit error:', error);
    // On error, allow the request (fail open)
    return false;
  }
}

/**
 * Rate limit middleware (Express/Vercel style)
 *
 * @param {string} endpoint - Endpoint name
 * @param {Object} options - Custom rate limit options
 * @returns {Function} Middleware function
 */
function rateLimitMiddleware(endpoint = 'api', options = {}) {
  return async (req, res, next) => {
    const limited = await rateLimit(req, endpoint, options);

    if (limited) {
      const config = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
      const message = options.message || config.message;

      return res.status(429).json({
        error: message,
        retryAfter: config.window
      });
    }

    // Continue to next middleware or handler
    if (next) next();
    return false;
  };
}

/**
 * Get rate limit status for a client
 *
 * @param {Object} req - Request object
 * @param {string} endpoint - Endpoint name
 * @returns {Promise<Object>} Rate limit status
 */
async function getRateLimitStatus(req, endpoint = 'api') {
  if (!kv) {
    return { limited: false, remaining: 999, total: 999 };
  }

  try {
    const config = RATE_LIMITS[endpoint] || RATE_LIMITS.api;
    const clientId = getClientId(req);
    const key = `${clientId}:${endpoint}`;

    const current = await kv.get(key);
    const count = current ? parseInt(current) : 0;

    return {
      limited: count >= config.max,
      remaining: Math.max(0, config.max - count),
      total: config.max,
      resetIn: await kv.ttl(key) || config.window
    };
  } catch (error) {
    console.error('Get rate limit status error:', error);
    return { limited: false, remaining: 999, total: 999 };
  }
}

/**
 * Reset rate limit for a client (admin use only)
 *
 * @param {Object} req - Request object
 * @param {string} endpoint - Endpoint name
 * @returns {Promise<boolean>} Success status
 */
async function resetRateLimit(req, endpoint = 'api') {
  if (!kv) return true;

  try {
    const clientId = getClientId(req);
    const key = `${clientId}:${endpoint}`;
    await kv.del(key);
    return true;
  } catch (error) {
    console.error('Reset rate limit error:', error);
    return false;
  }
}

module.exports = {
  rateLimit,
  rateLimitMiddleware,
  getRateLimitStatus,
  resetRateLimit,
  RATE_LIMITS
};
