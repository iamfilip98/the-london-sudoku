/**
 * Redis Caching Layer (Vercel KV)
 *
 * PHASE 0: Month 1
 * Purpose: Cache expensive database queries and computed data
 * Benefits: 10-50x faster API responses, reduced database load
 *
 * Setup Required:
 * 1. Create Vercel KV store: https://vercel.com/dashboard/stores
 * 2. Link to project: vercel link
 * 3. KV environment variables auto-added to project
 *
 * Usage:
 *   const puzzles = await getCached('daily_puzzles:2025-11-08', fetchPuzzles, 86400);
 */

// Vercel KV will be available after setup
// Import will work once environment is configured
let kv;

try {
  // Dynamic import (works in both Node and Edge runtime)
  kv = require('@vercel/kv').kv;
} catch (error) {
  console.warn('⚠️ Vercel KV not available. Caching disabled (development mode).');
  // Fallback: no caching in development
  kv = null;
}

/**
 * Cache duration constants (in seconds)
 */
const CACHE_DURATIONS = {
  DAILY_PUZZLE: 86400,        // 24 hours (puzzles don't change)
  LEADERBOARD: 300,           // 5 minutes (frequently updated)
  USER_PROFILE: 900,          // 15 minutes (moderate updates)
  PUZZLE_RATING: 3600,        // 1 hour (rating stats)
  ACHIEVEMENTS: 1800,         // 30 minutes (achievements unlock)
  STATS: 600,                 // 10 minutes (stats change often)
  HEALTH_CHECK: 60            // 1 minute (quick health status)
};

/**
 * Get data from cache or fetch and cache
 *
 * @param {string} key - Cache key (e.g., 'daily_puzzles:2025-11-08')
 * @param {Function} fetchFn - Async function to fetch data if cache miss
 * @param {number} duration - Cache duration in seconds
 * @returns {Promise<any>} Cached or freshly fetched data
 */
async function getCached(key, fetchFn, duration = 300) {
  // If KV not available (development), skip caching
  if (!kv) {
    return await fetchFn();
  }

  try {
    // Try to get from cache
    const cached = await kv.get(key);

    if (cached !== null && cached !== undefined) {
      // Cache hit
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    // Cache miss - fetch from source
    const data = await fetchFn();

    // Store in cache (fire and forget)
    kv.setex(key, duration, JSON.stringify(data)).catch(err => {
      console.error('Cache write error:', err);
    });

    return data;

  } catch (error) {
    console.error('Cache read error:', error);
    // Fallback to fetching data directly
    return await fetchFn();
  }
}

/**
 * Set data in cache
 *
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 * @param {number} duration - Cache duration in seconds
 */
async function setCache(key, value, duration = 300) {
  if (!kv) return;

  try {
    await kv.setex(key, duration, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

/**
 * Invalidate cache by key
 *
 * @param {string} key - Cache key to delete
 */
async function invalidateCache(key) {
  if (!kv) return;

  try {
    await kv.del(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate cache by pattern (e.g., 'user:123:*')
 *
 * @param {string} pattern - Cache key pattern
 */
async function invalidateCachePattern(pattern) {
  if (!kv) return;

  try {
    // Get all keys matching pattern
    const keys = await kv.keys(pattern);

    if (keys.length > 0) {
      // Delete all matching keys
      await kv.del(...keys);
      console.log(`Invalidated ${keys.length} cache keys matching: ${pattern}`);
    }
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}

/**
 * Get cache statistics
 *
 * @returns {Promise<Object>} Cache stats
 */
async function getCacheStats() {
  if (!kv) {
    return { available: false, message: 'KV not configured' };
  }

  try {
    // Get info about KV store
    const info = await kv.info();
    return {
      available: true,
      ...info
    };
  } catch (error) {
    return {
      available: false,
      error: error.message
    };
  }
}

/**
 * Clear all cache (use with caution!)
 */
async function clearAllCache() {
  if (!kv) return;

  try {
    // Get all keys
    const keys = await kv.keys('*');

    if (keys.length > 0) {
      await kv.del(...keys);
      console.log(`🗑️ Cleared ${keys.length} cache entries`);
    }
  } catch (error) {
    console.error('Cache clear error:', error);
  }
}

/**
 * Cache key builders
 * Standardized key naming convention
 */
const CacheKeys = {
  dailyPuzzle: (date, variant, difficulty) => `puzzle:daily:${date}:${variant}:${difficulty}`,
  dailyPuzzles: (date) => `puzzles:daily:${date}`,
  leaderboard: (type, variant, period) => `leaderboard:${type}:${variant}:${period}`,
  userProfile: (userId) => `user:${userId}:profile`,
  userStats: (userId) => `user:${userId}:stats`,
  userAchievements: (userId) => `user:${userId}:achievements`,
  puzzleRating: (puzzleId) => `puzzle:${puzzleId}:rating`,
  globalStats: () => 'stats:global',
  healthCheck: () => 'health:status'
};

// Export functions
module.exports = {
  // Core caching functions
  getCached,
  setCache,
  invalidateCache,
  invalidateCachePattern,

  // Utilities
  getCacheStats,
  clearAllCache,

  // Constants
  CACHE_DURATIONS,
  CacheKeys,

  // Direct KV access (for advanced use)
  kv
};
