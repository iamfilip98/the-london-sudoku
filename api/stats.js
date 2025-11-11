/**
 * Stats API - SECURITY FIXES (November 2025)
 * PHASE 1 MONTH 4 (November 2025):
 * - Extended for global leaderboards
 * - Supports daily, weekly, monthly, all-time rankings
 * PHASE 3 MONTH 12 (November 2025):
 * - Battle pass integration (progress, leaderboard, claim rewards)
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { getCached, CACHE_DURATIONS } = require('../lib/cache');
const battlePass = require('../lib/battle-pass-api');
const leagues = require('../lib/leagues-api');
const { getCurrentSeasonInfo, getUserSeasonHistory, getSeasonLeaderboard } = require('../lib/league-seasons');

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

        // PHASE 3 MONTH 12: Battle Pass Progress
        if (type === 'battle-pass') {
          const { userId } = req.query;

          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }

          const status = await battlePass.getBattlePassStatus(parseInt(userId));

          if (!status.success && status.error) {
            return res.status(404).json({ error: status.error });
          }

          return res.status(200).json(status);
        }

        // PHASE 3 MONTH 12: Battle Pass Leaderboard
        if (type === 'battle-pass-leaderboard') {
          const { limit } = req.query;
          const leaderboard = await battlePass.getLeaderboard(parseInt(limit) || 100);

          return res.status(200).json({
            leaderboard
          });
        }

        // PHASE 3 MONTH 12: Battle Pass All Tiers
        if (type === 'battle-pass-tiers') {
          const season = await battlePass.getActiveSeason();
          if (!season) {
            return res.status(404).json({ error: 'No active season' });
          }

          const tiers = await battlePass.getAllTiers(season.id);

          return res.status(200).json({
            season: {
              id: season.id,
              name: season.name,
              seasonNumber: season.season_number
            },
            tiers
          });
        }

        // PHASE 4 MONTH 15: Official Leagues
        if (type === 'leagues-official') {
          const result = await leagues.getOfficialLeagues();
          if (!result.success) {
            return res.status(500).json({ error: result.error });
          }
          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: League Rankings
        if (type === 'leagues-rankings') {
          const { leagueId, limit } = req.query;
          if (!leagueId) {
            return res.status(400).json({ error: 'leagueId is required' });
          }
          const result = await leagues.getLeagueRankings(parseInt(leagueId), parseInt(limit) || 100);
          if (!result.success) {
            return res.status(500).json({ error: result.error });
          }
          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: User League Status
        if (type === 'leagues-user-status') {
          const { userId } = req.query;
          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }
          const result = await leagues.getUserLeagueStatus(parseInt(userId));
          if (!result.success) {
            return res.status(500).json({ error: result.error });
          }
          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: Custom Leagues
        if (type === 'leagues-custom') {
          const { userId } = req.query;
          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }
          const result = await leagues.getCustomLeagues(parseInt(userId));
          if (!result.success) {
            return res.status(500).json({ error: result.error });
          }
          return res.status(200).json(result);
        }

        // PHASE 6 MONTH 19: Current Season Info
        if (type === 'leagues-current-season') {
          const { userId } = req.query;
          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }
          try {
            const result = await getCurrentSeasonInfo(parseInt(userId));
            if (!result) {
              return res.status(404).json({ error: 'No active season found' });
            }
            return res.status(200).json({ success: true, data: result });
          } catch (error) {
            console.error('Failed to get current season:', error);
            return res.status(500).json({ error: 'Failed to get season info' });
          }
        }

        // PHASE 6 MONTH 19: Season History
        if (type === 'leagues-season-history') {
          const { userId, limit } = req.query;
          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }
          try {
            const result = await getUserSeasonHistory(parseInt(userId), parseInt(limit) || 10);
            return res.status(200).json({ success: true, data: result });
          } catch (error) {
            console.error('Failed to get season history:', error);
            return res.status(500).json({ error: 'Failed to get season history' });
          }
        }

        // PHASE 6 MONTH 19: Season Leaderboard
        if (type === 'leagues-season-leaderboard') {
          const { seasonId, limit } = req.query;
          if (!seasonId) {
            return res.status(400).json({ error: 'seasonId is required' });
          }
          try {
            const result = await getSeasonLeaderboard(parseInt(seasonId), parseInt(limit) || 100);
            if (!result) {
              return res.status(404).json({ error: 'Season not found' });
            }
            return res.status(200).json({ success: true, data: result });
          } catch (error) {
            console.error('Failed to get season leaderboard:', error);
            return res.status(500).json({ error: 'Failed to get leaderboard' });
          }
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

      case 'POST':
        const { type: postType, userId, tier, track } = req.body;

        // PHASE 3 MONTH 12: Claim Battle Pass Reward
        if (postType === 'battle-pass-claim') {
          if (!userId || !tier) {
            return res.status(400).json({ error: 'userId and tier are required' });
          }

          const result = await battlePass.claimReward(
            parseInt(userId),
            parseInt(tier),
            track || 'free'
          );

          if (!result.success) {
            return res.status(400).json({ error: result.error });
          }

          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: Join League
        if (postType === 'leagues-join') {
          const { userId, leagueId } = req.body;
          if (!userId || !leagueId) {
            return res.status(400).json({ error: 'userId and leagueId are required' });
          }

          const result = await leagues.joinLeague(parseInt(userId), parseInt(leagueId));
          if (!result.success) {
            return res.status(400).json({ error: result.error });
          }

          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: Leave League
        if (postType === 'leagues-leave') {
          const { userId } = req.body;
          if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
          }

          const result = await leagues.leaveLeague(parseInt(userId));
          if (!result.success) {
            return res.status(400).json({ error: result.error });
          }

          return res.status(200).json(result);
        }

        // PHASE 4 MONTH 15: Create Custom League (Premium)
        if (postType === 'leagues-create') {
          const { creatorId, name, description, isPublic, maxMembers } = req.body;
          if (!creatorId || !name) {
            return res.status(400).json({ error: 'creatorId and name are required' });
          }

          const result = await leagues.createCustomLeague(
            parseInt(creatorId),
            name,
            description || '',
            isPublic !== false, // default to true
            parseInt(maxMembers) || 100
          );

          if (!result.success) {
            return res.status(400).json({ error: result.error });
          }

          return res.status(200).json(result);
        }

        return res.status(400).json({ error: 'Invalid type for POST request' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'POST']);
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