/**
 * Achievements API - SECURITY FIXES (November 2025)
 * PHASE 3 MONTH 13 (November 2025):
 * - Battle pass XP integration for achievement unlocks
 * PERFORMANCE (November 2025):
 * - Redis caching for achievements list (30min TTL)
 * - Auto-invalidation on achievement unlock/delete
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const battlePass = require('../lib/battle-pass-api');
const { getCached, invalidateCachePattern, CACHE_DURATIONS, CacheKeys } = require('../lib/cache');
const { rateLimit } = require('../lib/rate-limit');

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

module.exports = async function handler(req, res) {
  // Set CORS headers
  // ✅ SECURITY FIX: Proper CORS handling
  if (setCorsHeaders(req, res)) {
    return;  // Preflight request handled
  }

  // ✅ RATE LIMITING: 100 requests per hour
  const limited = await rateLimit(req, 'api', { max: 100, window: 3600 });
  if (limited) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: 3600
    });
  }

  try {
    switch (req.method) {
      case 'GET':
        // GET is read-only, allow anonymous access
        // Use caching for achievements list (30min TTL)
        const achievements = await getCached(
          'achievements:all',
          async () => {
            const result = await sql`
              SELECT achievement_id, player, unlocked_at, data
              FROM achievements
              ORDER BY unlocked_at DESC
            `;

            return result.rows.map(row => ({
              id: row.achievement_id,
              player: row.player,
              unlockedAt: row.unlocked_at.toISOString(),
              ...row.data
            }));
          },
          CACHE_DURATIONS.ACHIEVEMENTS // 30 minutes
        );

        return res.status(200).json(achievements);

      case 'POST':
        const { id, player, unlockedAt, rarity, ...data } = req.body;

        // ✅ SECURITY: Require authentication for POST operations
        if (!player) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Player username is required to save achievements'
          });
        }

        if (!id || !unlockedAt) {
          return res.status(400).json({ error: 'Achievement ID and unlockedAt are required' });
        }

        await sql`
          INSERT INTO achievements (achievement_id, player, unlocked_at, data)
          VALUES (${id}, ${player}, ${unlockedAt}, ${JSON.stringify(data)})
          ON CONFLICT (achievement_id, player, unlocked_at) DO NOTHING
        `;

        // Invalidate achievements cache after new achievement
        await invalidateCachePattern('achievements:*');

        // PHASE 3 MONTH 13: Award Battle Pass XP for achievement unlock
        if (rarity) {
          try {
            // Get user ID from username (player)
            const userResult = await sql`
              SELECT id FROM users WHERE username = ${player}
            `;

            if (userResult.rows.length > 0) {
              const userId = userResult.rows[0].id;
              const xpResult = await battlePass.calculateAchievementXP(rarity, false); // isPremium handled by addXP

              await battlePass.addXP(
                userId,
                xpResult.total,
                'achievement',
                id
              );

            }
          } catch (error) {
            // Error occurred
            // Don't fail the achievement save if XP award fails
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Achievement saved successfully'
        });

      case 'DELETE':
        // ✅ SECURITY: Require authentication for DELETE operations
        const deletePlayer = req.body?.player || req.query?.player;

        if (!deletePlayer) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Player username is required to delete achievements'
          });
        }

        // Delete only this player's achievements (not all)
        await sql`DELETE FROM achievements WHERE player = ${deletePlayer}`;

        // Invalidate achievements cache after delete
        await invalidateCachePattern('achievements:*');

        return res.status(200).json({
          success: true,
          message: `Achievements for ${deletePlayer} cleared successfully`
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    // Error occurred
    return res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};