/**
 * LEAGUES SYSTEM DATABASE MIGRATION
 *
 * Initializes league tables and seeds official tier-based leagues
 * Run via: POST /api/admin?action=migrate-leagues
 *
 * Version: 1.0
 * Created: November 2025
 */

const pool = require('./db-pool');

/**
 * Run all leagues migrations
 */
async function migrateLeagues() {
  console.log('Starting leagues migration...');

  try {
    // Create all tables
    await createLeagueTables();

    // Seed official leagues
    await seedOfficialLeagues();

    console.log('Leagues migration completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Leagues migration failed:', error);
    throw error;
  }
}

/**
 * Create leagues and league_members tables
 */
async function createLeagueTables() {
  console.log('Creating leagues tables...');

  // Leagues table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leagues (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,

      type VARCHAR(20) NOT NULL, -- 'official', 'custom', 'seasonal'
      tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'

      creator_id INTEGER REFERENCES users(id),
      icon_url TEXT,

      -- Settings
      is_public BOOLEAN DEFAULT true,
      max_members INTEGER DEFAULT 100,
      start_date DATE,
      end_date DATE,

      settings JSONB DEFAULT '{}',

      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leagues_type ON leagues(type, tier)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_leagues_creator ON leagues(creator_id)
  `);

  // League members table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS league_members (
      id SERIAL PRIMARY KEY,
      league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      rank INTEGER,
      points INTEGER DEFAULT 0,
      is_admin BOOLEAN DEFAULT false,

      -- Weekly stats for promotion/demotion
      week_start_date DATE,
      weekly_puzzles_completed INTEGER DEFAULT 0,
      weekly_points_earned INTEGER DEFAULT 0,

      -- Historical stats
      total_weeks_in_league INTEGER DEFAULT 0,
      times_promoted INTEGER DEFAULT 0,
      times_demoted INTEGER DEFAULT 0,

      CONSTRAINT unique_league_member UNIQUE(league_id, user_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id, rank)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_league_members_points ON league_members(league_id, points DESC)
  `);

  // League activity log (for tracking promotions/demotions)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS league_activity (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      from_league_id INTEGER REFERENCES leagues(id) ON DELETE SET NULL,
      to_league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
      activity_type VARCHAR(20) NOT NULL, -- 'join', 'promote', 'demote', 'leave'
      week_date DATE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_league_activity_user ON league_activity(user_id, created_at DESC)
  `);

  console.log('✅ Leagues tables created');
}

/**
 * Seed official tier-based leagues
 */
async function seedOfficialLeagues() {
  console.log('Seeding official leagues...');

  const officialLeagues = [
    {
      name: 'Bronze League',
      description: 'Starting league for all players. Complete puzzles to earn points and climb the ranks!',
      type: 'official',
      tier: 'bronze',
      max_members: 1000
    },
    {
      name: 'Silver League',
      description: 'For rising stars! Compete with skilled solvers and aim for the top.',
      type: 'official',
      tier: 'silver',
      max_members: 500
    },
    {
      name: 'Gold League',
      description: 'Elite competition! Only the best solvers reach Gold tier.',
      type: 'official',
      tier: 'gold',
      max_members: 250
    },
    {
      name: 'Platinum League',
      description: 'Master-level play. Exceptional speed and accuracy required.',
      type: 'official',
      tier: 'platinum',
      max_members: 100
    },
    {
      name: 'Diamond League',
      description: 'Near-legendary status. Only the most dedicated and skilled players compete here.',
      type: 'official',
      tier: 'diamond',
      max_members: 50
    },
    {
      name: 'Legend League',
      description: 'The ultimate achievement. Home of the world\'s best Sudoku solvers.',
      type: 'official',
      tier: 'legend',
      max_members: 25
    }
  ];

  for (const league of officialLeagues) {
    // Check if league already exists
    const existing = await pool.query(
      'SELECT id FROM leagues WHERE type = $1 AND tier = $2',
      [league.type, league.tier]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO leagues (name, description, type, tier, is_public, max_members, creator_id)
         VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
        [league.name, league.description, league.type, league.tier, true, league.max_members]
      );
      console.log(`  ✅ Created ${league.name}`);
    } else {
      console.log(`  ⏭️  ${league.name} already exists`);
    }
  }

  console.log('✅ Official leagues seeded');
}

module.exports = {
  migrateLeagues
};
