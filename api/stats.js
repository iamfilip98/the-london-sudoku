/**
 * Stats API - SECURITY FIXES (November 2025)
 * PHASE 1 MONTH 4 (November 2025):
 * - Extended for global leaderboards
 * - Supports daily, weekly, monthly, all-time rankings
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { getCached, CACHE_DURATIONS } = require('../lib/cache');

// Helper function to execute SQL queries
async function sql(strings, ...values) {
  let query = '';
  const params = [];
  let paramIndex = 1;

  for (let i = 0; i < strings.length; i++) {
    query += strings[i];
    if (i < values.length) {
      query += `$${paramIndex}`;
      params.push(values[i]);
      paramIndex++;
    }
  }

  const result = await pool.query(query, params);
  return { rows: result.rows };
}

// Database initialization
async function initDatabase() {
  try {
    // Create achievements table
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        achievement_id VARCHAR(255) NOT NULL,
        player VARCHAR(50) NOT NULL,
        unlocked_at TIMESTAMP NOT NULL,
        data JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(achievement_id, player, unlocked_at)
      )
    `;

    // Create streaks table
    await sql`
      CREATE TABLE IF NOT EXISTS streaks (
        id SERIAL PRIMARY KEY,
        player VARCHAR(50) UNIQUE NOT NULL,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create challenges table
    await sql`
      CREATE TABLE IF NOT EXISTS challenges (
        id SERIAL PRIMARY KEY,
        challenge_id VARCHAR(255) UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Initialize default streak records for both players
    await sql`
      INSERT INTO streaks (player, current_streak, best_streak)
      VALUES ('faidao', 0, 0), ('filip', 0, 0)
      ON CONFLICT (player) DO NOTHING
    `;

    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
    return res.status(500).json({ error: 'Database initialization failed' });
  }

  // Set CORS headers
  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }

  try {
    switch (req.method) {
      case 'GET':
        const { type } = req.query;

        if (type === 'streaks') {
          const result = await sql`
            SELECT player, current_streak, best_streak
            FROM streaks
          `;

          const streaks = {};
          result.rows.forEach(row => {
            streaks[row.player] = {
              current: row.current_streak,
              best: row.best_streak
            };
          });

          return res.status(200).json(streaks);
        }

        if (type === 'challenges') {
          const result = await sql`
            SELECT challenge_id, data
            FROM challenges
            ORDER BY created_at DESC
          `;

          return res.status(200).json(result.rows.map(row => ({
            id: row.challenge_id,
            ...row.data
          })));
        }

        if (type === 'all') {
          // Fetch all data in parallel for better performance
          const [streaksResult, challengesResult, achievementsResult] = await Promise.all([
            sql`SELECT player, current_streak, best_streak FROM streaks`,
            sql`SELECT challenge_id, data FROM challenges ORDER BY created_at DESC`,
            sql`SELECT achievement_id, player, unlocked_at, data FROM achievements ORDER BY unlocked_at DESC`
          ]);

          const streaks = {};
          streaksResult.rows.forEach(row => {
            streaks[row.player] = {
              current: row.current_streak,
              best: row.best_streak
            };
          });

          const challenges = challengesResult.rows.map(row => ({
            id: row.challenge_id,
            ...row.data
          }));

          const achievements = achievementsResult.rows.map(row => ({
            id: row.achievement_id,
            player: row.player,
            unlockedAt: row.unlocked_at.toISOString(),
            ...row.data
          }));

          return res.status(200).json({
            streaks,
            challenges,
            achievements
          });
        }

        // PHASE 1 MONTH 4: Global Leaderboards
        if (type === 'leaderboards') {
          const { period, difficulty, limit } = req.query;
          const cacheKey = `leaderboard:${period || 'all'}:${difficulty || 'all'}`;

          // Use cache with 5-minute TTL for leaderboards
          const leaderboard = await getCached(
            cacheKey,
            async () => {
              let dateFilter = '';
              const params = [];
              let paramIndex = 1;

              // Apply date filter based on period
              if (period === 'daily') {
                const today = new Date().toISOString().split('T')[0];
                dateFilter = `AND date = $${paramIndex}`;
                params.push(today);
                paramIndex++;
              } else if (period === 'weekly') {
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                dateFilter = `AND date >= $${paramIndex}`;
                params.push(weekAgo.toISOString().split('T')[0]);
                paramIndex++;
              } else if (period === 'monthly') {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                dateFilter = `AND date >= $${paramIndex}`;
                params.push(monthAgo.toISOString().split('T')[0]);
                paramIndex++;
              }

              // Apply difficulty filter if specified
              let difficultyFilter = '';
              if (difficulty && ['easy', 'medium', 'hard'].includes(difficulty)) {
                difficultyFilter = `AND difficulty = $${paramIndex}`;
                params.push(difficulty);
                paramIndex++;
              }

              // Get top players by score
              const limitValue = parseInt(limit) || 100;
              const query = `
                SELECT
                  player,
                  COUNT(*) as games_played,
                  AVG(score) as avg_score,
                  MAX(score) as best_score,
                  MIN(time) as fastest_time,
                  AVG(time) as avg_time,
                  SUM(errors) as total_errors
                FROM individual_games
                WHERE 1=1 ${dateFilter} ${difficultyFilter}
                GROUP BY player
                ORDER BY avg_score DESC, fastest_time ASC
                LIMIT $${paramIndex}
              `;
              params.push(limitValue);

              const result = await pool.query(query, params);

              return result.rows.map((row, index) => ({
                rank: index + 1,
                player: row.player,
                gamesPlayed: parseInt(row.games_played),
                avgScore: parseFloat(row.avg_score).toFixed(2),
                bestScore: parseFloat(row.best_score),
                fastestTime: parseInt(row.fastest_time),
                avgTime: parseFloat(row.avg_time).toFixed(0),
                totalErrors: parseInt(row.total_errors) || 0
              }));
            },
            CACHE_DURATIONS.LEADERBOARD  // 5 minutes
          );

          return res.status(200).json({
            period: period || 'all-time',
            difficulty: difficulty || 'all',
            leaderboard
          });
        }

        // Return empty for other types for now
        return res.status(200).json({});

      case 'PUT':
        const { type: putType, data: putData } = req.body;

        if (putType === 'streaks') {
          if (!putData || typeof putData !== 'object') {
            return res.status(400).json({ error: 'Valid streaks data is required' });
          }

          for (const [player, data] of Object.entries(putData)) {
            await sql`
              UPDATE streaks
              SET
                current_streak = ${data.current},
                best_streak = ${data.best},
                updated_at = NOW()
              WHERE player = ${player}
            `;
          }

          return res.status(200).json({
            success: true,
            message: 'Streaks updated successfully'
          });
        }

        return res.status(400).json({ error: 'Invalid type for PUT request' });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};