/**
 * Achievements API - SECURITY FIXES (November 2025)
 * PHASE 3 MONTH 13 (November 2025):
 * - Battle pass XP integration for achievement unlocks
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const battlePass = require('../lib/battle-pass-api');

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

  try {
    switch (req.method) {
      case 'GET':
        const result = await sql`
          SELECT achievement_id, player, unlocked_at, data
          FROM achievements
          ORDER BY unlocked_at DESC
        `;

        const achievements = result.rows.map(row => ({
          id: row.achievement_id,
          player: row.player,
          unlockedAt: row.unlocked_at.toISOString(),
          ...row.data
        }));

        return res.status(200).json(achievements);

      case 'POST':
        const { id, player, unlockedAt, rarity, ...data } = req.body;

        if (!id || !player || !unlockedAt) {
          return res.status(400).json({ error: 'Achievement ID, player, and unlockedAt are required' });
        }

        await sql`
          INSERT INTO achievements (achievement_id, player, unlocked_at, data)
          VALUES (${id}, ${player}, ${unlockedAt}, ${JSON.stringify(data)})
          ON CONFLICT (achievement_id, player, unlocked_at) DO NOTHING
        `;

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

              console.log(`✨ Awarded ${xpResult.total} XP to ${player} for ${rarity} achievement: ${id}`);
            }
          } catch (error) {
            console.error('Failed to award achievement XP:', error);
            // Don't fail the achievement save if XP award fails
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Achievement saved successfully'
        });

      case 'DELETE':
        await sql`DELETE FROM achievements`;

        return res.status(200).json({
          success: true,
          message: 'All achievements cleared successfully'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
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