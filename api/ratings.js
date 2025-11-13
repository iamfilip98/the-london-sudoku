/**
 * Ratings API - SECURITY FIXES (November 2025)
 * PERFORMANCE (November 2025):
 * - Redis caching for ratings queries (1-hour TTL)
 * - Auto-invalidation on new rating submission
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { getCached, invalidateCachePattern, CACHE_DURATIONS } = require('../lib/cache');
const { rateLimit } = require('../lib/rate-limit');

module.exports = async function handler(req, res) {
  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }

  // ✅ RATE LIMITING: 20 requests per hour
  const limited = await rateLimit(req, 'api', { max: 20, window: 3600 });
  if (limited) {
    return res.status(429).json({
      error: 'Too many rating requests. Please try again later.',
      retryAfter: 3600
    });
  }

  try {
    // Ensure ratings table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS puzzle_ratings (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        timestamp TIMESTAMP NOT NULL,
        difficulty VARCHAR(10) NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
        time INTEGER NOT NULL,
        errors INTEGER NOT NULL,
        hints INTEGER NOT NULL,
        score DECIMAL(10,2) NOT NULL,
        puzzle_grid TEXT NOT NULL,
        puzzle_solution TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ratings_player_date
      ON puzzle_ratings(player, date)
    `);

    if (req.method === 'GET') {
      // GET is read-only, allow anonymous access
      // Retrieve ratings
      const { player, startDate, endDate, limit } = req.query;

      // Build cache key from query parameters
      const cacheKey = `ratings:${player || 'all'}:${startDate || 'start'}:${endDate || 'end'}:${limit || 'all'}`;

      // Use caching for ratings queries (1-hour TTL)
      const ratings = await getCached(
        cacheKey,
        async () => {
          let query = 'SELECT * FROM puzzle_ratings WHERE 1=1';
          const params = [];
          let paramIndex = 1;

          if (player) {
            query += ` AND player = $${paramIndex}`;
            params.push(player);
            paramIndex++;
          }

          if (startDate) {
            query += ` AND date >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
          }

          if (endDate) {
            query += ` AND date <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
          }

          query += ' ORDER BY timestamp DESC';

          if (limit) {
            query += ` LIMIT $${paramIndex}`;
            params.push(parseInt(limit));
          }

          const result = await pool.query(query, params);

          return {
            success: true,
            ratings: result.rows,
            count: result.rows.length
          };
        },
        CACHE_DURATIONS.PUZZLE_RATING // 1 hour
      );

      return res.status(200).json(ratings);

    } else if (req.method === 'POST') {
      // Store new rating
      const { player, date, timestamp, difficulty, rating, time, errors, hints, score, puzzle } = req.body;

      // ✅ SECURITY: Require authentication for POST operations
      if (!player) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'Player username is required to submit ratings'
        });
      }

      // Validate required fields
      if (!date || !timestamp || !difficulty || !rating || time === undefined || errors === undefined || hints === undefined || score === undefined || !puzzle) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['player', 'date', 'timestamp', 'difficulty', 'rating', 'time', 'errors', 'hints', 'score', 'puzzle']
        });
      }

      // Validate rating range
      if (rating < 1 || rating > 10) {
        return res.status(400).json({
          error: 'Rating must be between 1 and 10'
        });
      }

      // Insert rating
      const result = await pool.query(`
        INSERT INTO puzzle_ratings (
          player, date, timestamp, difficulty, rating,
          time, errors, hints, score, puzzle_grid, puzzle_solution
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        player,
        date,
        timestamp,
        difficulty,
        rating,
        time,
        errors,
        hints,
        score,
        puzzle.grid,
        puzzle.solution
      ]);

      // Invalidate ratings cache after new rating
      await invalidateCachePattern('ratings:*');

      return res.status(201).json({
        success: true,
        message: 'Rating saved successfully',
        rating: result.rows[0]
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
};
