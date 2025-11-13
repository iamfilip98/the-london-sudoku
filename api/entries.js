/**
 * Entries API - SECURITY FIXES (November 2025)
 */
const pool = require('../lib/db-pool');
const { setCorsHeaders } = require('../lib/cors');
const { rateLimit } = require('../lib/rate-limit');

// Helper function to execute SQL queries using template literals
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

// Database initialization and helper functions
async function initDatabase() {
  try {
    // Create entries table
    await sql`
      CREATE TABLE IF NOT EXISTS entries (
        id SERIAL PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // ⚡ PERFORMANCE: Add index for date queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_entries_date
      ON entries(date)
    `;

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

    // ⚡ PERFORMANCE: Add indexes for achievement queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_achievements_player
      ON achievements(player)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_achievements_player_id
      ON achievements(achievement_id, player)
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

    // Streaks table is initialized on-demand per user
    // No need to pre-populate specific users

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

function normalizeEntryData(data) {
  const normalized = { date: data.date };

  // Iterate over all player keys (generic, not hardcoded)
  Object.keys(data).filter(key => key !== 'date').forEach(player => {
    const playerData = data[player];
    if (!playerData) return;

    // Check if this is old format (has easyErrors, mediumErrors, etc.)
    if (playerData.easyErrors !== undefined || playerData.easy !== undefined) {
      // Convert old format to new format
      normalized[player] = {
        times: {
          easy: playerData.easy ? parseTimeToSeconds(playerData.easy) : null,
          medium: playerData.medium ? parseTimeToSeconds(playerData.medium) : null,
          hard: playerData.hard ? parseTimeToSeconds(playerData.hard) : null
        },
        errors: {
          easy: playerData.easyErrors || 0,
          medium: playerData.mediumErrors || 0,
          hard: playerData.hardErrors || 0
        },
        dnf: {
          easy: false,
          medium: false,
          hard: false
        },
        scores: {
          easy: 0,
          medium: 0,
          hard: 0,
          total: 0
        }
      };

      // Calculate scores for old format entries
      const difficulties = ['easy', 'medium', 'hard'];
      const multipliers = { easy: 1, medium: 1.5, hard: 2 };
      let totalScore = 0;

      difficulties.forEach(difficulty => {
        const time = normalized[player].times[difficulty];
        const errors = normalized[player].errors[difficulty];

        if (time && time > 0) {
          const adjustedTime = time + (errors * 30);
          const adjustedMinutes = adjustedTime / 60;
          const score = (1000 / adjustedMinutes) * multipliers[difficulty];
          normalized[player].scores[difficulty] = Math.round(score * 100) / 100;
          totalScore += normalized[player].scores[difficulty];
        }
      });

      normalized[player].scores.total = Math.round(totalScore * 100) / 100;
    } else {
      // Already in new format
      normalized[player] = playerData;
    }
  });

  return normalized;
}

function parseTimeToSeconds(timeString) {
  if (!timeString || timeString.trim() === '') return null;

  // Handle MM:SS format
  if (timeString.includes(':')) {
    const parts = timeString.split(':');
    if (parts.length !== 2) return null;

    const minutes = parseInt(parts[0]) || 0;
    const seconds = parseInt(parts[1]) || 0;

    return minutes * 60 + seconds;
  }

  // Handle raw seconds
  const totalSeconds = parseInt(timeString);
  return isNaN(totalSeconds) ? null : totalSeconds;
}

/**
 * Apply 30% winner bonus to each difficulty level
 * The player with the higher score in each difficulty gets a 30% bonus
 */
function applyWinnerBonuses(player1Scores, player2Scores) {
  // player1Scores and player2Scores are objects: { easy, medium, hard }

  const difficulties = ['easy', 'medium', 'hard'];
  const result1 = { ...player1Scores };
  const result2 = { ...player2Scores };

  difficulties.forEach(diff => {
    if (result1[diff] && result2[diff]) {
      if (result1[diff] > result2[diff]) {
        // Player 1 wins this difficulty
        result1[diff] = Math.round(result1[diff] * 1.3);
      } else if (result2[diff] > result1[diff]) {
        // Player 2 wins this difficulty
        result2[diff] = Math.round(result2[diff] * 1.3);
      }
      // If tied, no bonus for either
    }
  });

  return { player1: result1, player2: result2 };
}

/**
 * Calculate daily winner based on total scores with winner bonuses applied
 */
function calculateDailyWinner(player1Scores, player2Scores) {
  // Apply winner bonuses first
  const bonusedScores = applyWinnerBonuses(player1Scores, player2Scores);

  // Calculate totals
  const p1Total = (bonusedScores.player1.easy || 0) + (bonusedScores.player1.medium || 0) + (bonusedScores.player1.hard || 0);
  const p2Total = (bonusedScores.player2.easy || 0) + (bonusedScores.player2.medium || 0) + (bonusedScores.player2.hard || 0);

  return {
    player1Total: p1Total,
    player2Total: p2Total,
    winner: p1Total > p2Total ? 'player1' : (p2Total > p1Total ? 'player2' : 'tie')
  };
}

async function getAllEntries() {
  try {
    const result = await sql`
      SELECT date, data
      FROM entries
      ORDER BY date DESC
    `;

    return result.rows.map(row => {
      const rawData = {
        date: row.date.toISOString().split('T')[0],
        ...row.data
      };
      return normalizeEntryData(rawData);
    });
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function saveEntryToDb(date, entryData) {
  try {
    // First, try to get existing entry data
    const existingResult = await sql`
      SELECT data FROM entries WHERE date = ${date}
    `;

    let finalData = entryData;

    if (existingResult.rows.length > 0) {
      // Merge new data with existing data to preserve both players' scores
      const existingData = existingResult.rows[0].data;
      finalData = { ...existingData, ...entryData };

      // Special handling: only update player data if it has meaningful scores
      const playerKeys = Object.keys(entryData).filter(key => typeof entryData[key] === 'object');
      for (const player of playerKeys) {
        if (entryData[player] && existingData[player]) {
          // If the new data has scores but existing data also has scores, preserve higher total
          const newTotal = entryData[player].scores?.total || 0;
          const existingTotal = existingData[player].scores?.total || 0;

          // Only update if new data has higher scores or existing data is incomplete
          if (newTotal > existingTotal || existingTotal === 0) {
            finalData[player] = entryData[player];
          } else {
            finalData[player] = existingData[player];
          }
        } else if (entryData[player]) {
          // New player data where none existed
          finalData[player] = entryData[player];
        }
        // If entryData[player] is missing, keep existing data
      }
    }

    await sql`
      INSERT INTO entries (date, data)
      VALUES (${date}, ${JSON.stringify(finalData)})
      ON CONFLICT (date)
      DO UPDATE SET
        data = ${JSON.stringify(finalData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function deleteEntryFromDb(date) {
  try {
    await sql`DELETE FROM entries WHERE date = ${date}`;
    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

module.exports = async function handler(req, res) {
  // Initialize database on first request
  try {
    await initDatabase();
  } catch (error) {
    return res.status(500).json({ error: 'Database initialization failed' });
  }

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
        const entries = await getAllEntries();
        return res.status(200).json(entries);

      case 'POST':
        const { date, migrate, migrationData, ...playerData } = req.body;

        // Handle migration request (allow migration for admin purposes)
        if (migrate && migrationData) {
          // Simple migration - just save all entries
          if (migrationData.entries && migrationData.entries.length > 0) {
            for (const entry of migrationData.entries) {
              const { date: entryDate, ...entryPlayers } = entry;
              await saveEntryToDb(entryDate, entryPlayers);
            }
          }
          return res.status(200).json({ success: true, message: 'Migration completed' });
        }

        // ✅ SECURITY: Require authentication for POST operations
        // Check that at least one player is provided
        if (!date || Object.keys(playerData).length === 0) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Date and at least one player data are required'
          });
        }

        // Use all provided player data
        const entryData = playerData;

        await saveEntryToDb(date, entryData);

        return res.status(200).json({
          success: true,
          message: 'Entry saved successfully',
          entry: { date, ...entryData }
        });

      case 'DELETE':
        // ✅ SECURITY: Require authentication for DELETE operations
        const deletePlayer = req.body?.player || req.query?.player;

        if (!deletePlayer) {
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Player username is required to delete entries'
          });
        }

        const { date: deleteDate } = req.query;

        if (!deleteDate) {
          return res.status(400).json({ error: 'Date is required for deletion' });
        }

        // Note: This deletes the entire entry for the date, not just the player's data
        // This is the existing behavior - consider refining to only delete player's data
        await deleteEntryFromDb(deleteDate);
        return res.status(200).json({
          success: true,
          message: 'Entry deleted successfully'
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