const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

// Database initialization and schema creation
async function initDatabase() {
  try {
    // Create users table for secure authentication
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        avatar VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

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

    // Streaks table is ready (individual user streaks created on first game completion)

    // Create indexes for better query performance
    await sql`CREATE INDEX IF NOT EXISTS idx_entries_date ON entries (date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_challenges_created_at ON challenges (created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_achievements_unlocked_at ON achievements (unlocked_at DESC)`;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

// Entries operations
async function getAllEntries() {
  try {
    const result = await sql`
      SELECT date, data
      FROM entries
      ORDER BY date DESC
    `;

    return result.rows.map(row => ({
      date: row.date.toISOString().split('T')[0],
      ...row.data
    }));
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function saveEntry(date, entryData) {
  try {
    await sql`
      INSERT INTO entries (date, data)
      VALUES (${date}, ${JSON.stringify(entryData)})
      ON CONFLICT (date)
      DO UPDATE SET
        data = ${JSON.stringify(entryData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function deleteEntry(date) {
  try {
    await sql`DELETE FROM entries WHERE date = ${date}`;
    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

// Achievements operations
async function getAllAchievements() {
  try {
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
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function saveAchievement(achievementId, player, unlockedAt, data = {}) {
  try {
    await sql`
      INSERT INTO achievements (achievement_id, player, unlocked_at, data)
      VALUES (${achievementId}, ${player}, ${unlockedAt}, ${JSON.stringify(data)})
      ON CONFLICT (achievement_id, player, unlocked_at) DO NOTHING
    `;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

// Streaks operations
async function getStreaks() {
  try {
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

    return streaks;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function updateStreaks(streaksData) {
  try {
    for (const [player, data] of Object.entries(streaksData)) {
      await sql`
        UPDATE streaks
        SET
          current_streak = ${data.current},
          best_streak = ${data.best},
          updated_at = NOW()
        WHERE player = ${player}
      `;
    }

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

// Challenges operations
async function getAllChallenges() {
  try {
    const result = await sql`
      SELECT challenge_id, data
      FROM challenges
      ORDER BY created_at DESC
    `;

    return result.rows.map(row => ({
      id: row.challenge_id,
      ...row.data
    }));
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function saveChallenge(challengeId, challengeData) {
  try {
    await sql`
      INSERT INTO challenges (challenge_id, data)
      VALUES (${challengeId}, ${JSON.stringify(challengeData)})
      ON CONFLICT (challenge_id)
      DO UPDATE SET
        data = ${JSON.stringify(challengeData)},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

// Migration helper - import localStorage data
async function migrateLocalStorageData(localData) {
  try {

    // Migrate entries (convert from old battle format to new personal format)
    if (localData.entries && localData.entries.length > 0) {
      for (const entry of localData.entries) {
        // Convert old format to new format (preserve data structure as-is for now)
        const entryData = {
          times: entry.times || {},
          scores: entry.scores || {},
          errors: entry.errors || {},
          hints: entry.hints || {},
          dnf: entry.dnf || {}
        };
        await saveEntry(entry.date, entryData);
      }
    }

    // Migrate achievements
    if (localData.achievements && localData.achievements.length > 0) {
      for (const achievement of localData.achievements) {
        await saveAchievement(
          achievement.id,
          achievement.player,
          achievement.unlockedAt,
          achievement
        );
      }
    }

    // Migrate streaks
    if (localData.streaks) {
      await updateStreaks(localData.streaks);
    }

    // Migrate challenges
    if (localData.challenges && localData.challenges.length > 0) {
      for (const challenge of localData.challenges) {
        await saveChallenge(challenge.id, challenge);
      }
    }

    return true;
  } catch (error) {
    throw error;
  }
}

// User authentication operations
async function createUser(username, password, displayName, avatar = null) {
  try {
    const passwordHash = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, password_hash, display_name, avatar)
      VALUES (${username}, ${passwordHash}, ${displayName}, ${avatar})
      ON CONFLICT (username)
      DO UPDATE SET
        password_hash = ${passwordHash},
        display_name = ${displayName},
        avatar = ${avatar},
        updated_at = NOW()
    `;

    return true;
  } catch (error) {
    // Error occurred
    throw error;
  }
}

async function authenticateUser(username, password) {
  try {
    const result = await sql`
      SELECT id, username, password_hash, display_name, avatar
      FROM users
      WHERE username = ${username}
    `;

    if (result.rows.length === 0) {
      return null; // User not found
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      return null; // Invalid password
    }

    // Return user data without password hash
    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
      avatar: user.avatar
    };
  } catch (error) {
    throw error;
  }
}

async function getAllUsers() {
  try {
    const result = await sql`
      SELECT id, username, display_name, avatar, created_at
      FROM users
      ORDER BY created_at ASC
    `;

    return result.rows.map(row => ({
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      avatar: row.avatar,
      createdAt: row.created_at.toISOString()
    }));
  } catch (error) {
    // Error occurred
    throw error;
  }
}
// CommonJS exports
module.exports = {
  initDatabase,
  createUser,
  authenticateUser,
  getAllUsers,
  getAllEntries,
  saveEntry,
  deleteEntry,
  getAllAchievements,
  saveAchievement,
  getStreaks,
  updateStreaks,
  getAllChallenges,
  saveChallenge,
  migrateLocalStorageData
};
