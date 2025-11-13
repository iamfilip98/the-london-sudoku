/**
 * BATTLE PASS DATABASE MIGRATION
 *
 * Initializes all battle pass tables and seeds Season 1 data
 * Run via: POST /api/admin?action=migrate-battle-pass
 *
 * Version: 1.0
 * Created: November 2025
 */

const pool = require('./db-pool');

/**
 * Run all battle pass migrations
 */
async function migrateBattlePass() {

  try {
    // Create all tables
    await createBattlePassTables();

    // Seed Season 1 data
    await seedSeason1();

    return { success: true };
  } catch (error) {
    throw error;
  }
}

/**
 * Create all battle pass tables
 */
async function createBattlePassTables() {

  // Battle Pass Seasons
  await pool.query(`
    CREATE TABLE IF NOT EXISTS battle_pass_seasons (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      season_number INTEGER NOT NULL UNIQUE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_tiers INTEGER NOT NULL DEFAULT 100,
      is_active BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT valid_season_dates CHECK (end_date > start_date),
      CONSTRAINT positive_tiers CHECK (total_tiers > 0)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_battle_pass_seasons_active
    ON battle_pass_seasons(is_active, end_date)
  `);

  // Battle Pass Tiers
  await pool.query(`
    CREATE TABLE IF NOT EXISTS battle_pass_tiers (
      id SERIAL PRIMARY KEY,
      season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,
      tier_number INTEGER NOT NULL,
      xp_required INTEGER NOT NULL,
      free_reward_type VARCHAR(50),
      free_reward_id VARCHAR(100),
      free_reward_amount INTEGER DEFAULT 0,
      premium_reward_type VARCHAR(50),
      premium_reward_id VARCHAR(100),
      premium_reward_amount INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_season_tier UNIQUE(season_id, tier_number),
      CONSTRAINT positive_xp CHECK (xp_required >= 0),
      CONSTRAINT positive_tier CHECK (tier_number > 0)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_battle_pass_tiers_season
    ON battle_pass_tiers(season_id, tier_number)
  `);

  // User Battle Pass Progress
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_battle_pass_progress (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,
      current_tier INTEGER NOT NULL DEFAULT 1,
      current_xp INTEGER NOT NULL DEFAULT 0,
      has_premium_pass BOOLEAN DEFAULT false,
      claimed_free_tiers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
      claimed_premium_tiers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
      first_xp_gain_at TIMESTAMP,
      last_xp_gain_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_season UNIQUE(user_id, season_id),
      CONSTRAINT positive_tier CHECK (current_tier > 0),
      CONSTRAINT positive_xp CHECK (current_xp >= 0)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_bp_progress_user
    ON user_battle_pass_progress(user_id, season_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_bp_progress_season
    ON user_battle_pass_progress(season_id, current_tier DESC)
  `);

  // User XP History
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_xp_history (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,
      xp_amount INTEGER NOT NULL,
      xp_source VARCHAR(100) NOT NULL,
      source_reference VARCHAR(255),
      tier_before INTEGER NOT NULL,
      tier_after INTEGER NOT NULL,
      had_premium_boost BOOLEAN DEFAULT false,
      earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT positive_xp CHECK (xp_amount > 0)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_xp_history_user
    ON user_xp_history(user_id, season_id)
  `);

  // User Inventory
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_inventory (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      item_type VARCHAR(50) NOT NULL,
      item_id VARCHAR(100) NOT NULL,
      acquired_from VARCHAR(50) NOT NULL,
      season_acquired INTEGER,
      tier_acquired INTEGER,
      acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT unique_user_item UNIQUE(user_id, item_id)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_inventory_user
    ON user_inventory(user_id, item_type)
  `);

  // User Tokens
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_tokens (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      balance INTEGER NOT NULL DEFAULT 0,
      lifetime_earned INTEGER NOT NULL DEFAULT 0,
      lifetime_spent INTEGER NOT NULL DEFAULT 0,
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT positive_balance CHECK (balance >= 0)
    )
  `);

  // Token Transactions
  await pool.query(`
    CREATE TABLE IF NOT EXISTS token_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      transaction_type VARCHAR(50) NOT NULL,
      source_reference VARCHAR(255),
      balance_before INTEGER NOT NULL,
      balance_after INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_token_transactions_user
    ON token_transactions(user_id, created_at DESC)
  `);

}

/**
 * Seed Season 1: "Launch Season"
 */
async function seedSeason1() {

  // Insert Season 1
  const seasonResult = await pool.query(`
    INSERT INTO battle_pass_seasons (name, description, season_number, start_date, end_date, is_active, total_tiers)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (season_number) DO UPDATE
    SET is_active = EXCLUDED.is_active
    RETURNING id
  `, [
    'Launch Season',
    'Celebrate the launch of The London Sudoku with exclusive rewards!',
    1,
    '2025-12-01',
    '2026-03-01', // 90 days
    true,
    100
  ]);

  const seasonId = seasonResult.rows[0].id;

  // Generate all 100 tiers
  const tiers = generateSeason1Tiers();

  // Insert all tiers
  for (const tier of tiers) {
    await pool.query(`
      INSERT INTO battle_pass_tiers (
        season_id, tier_number, xp_required,
        free_reward_type, free_reward_id, free_reward_amount,
        premium_reward_type, premium_reward_id, premium_reward_amount
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (season_id, tier_number) DO NOTHING
    `, [
      seasonId,
      tier.tier,
      tier.xpRequired,
      tier.freeReward?.type || null,
      tier.freeReward?.id || null,
      tier.freeReward?.amount || 0,
      tier.premiumReward?.type || null,
      tier.premiumReward?.id || null,
      tier.premiumReward?.amount || 0
    ]);
  }

}

/**
 * Generate Season 1 tier data
 */
function generateSeason1Tiers() {
  const tiers = [];

  // Helper function to calculate cumulative XP
  function getXPRequired(tier) {
    if (tier === 1) return 0;
    if (tier <= 10) return tier * 100;
    if (tier <= 30) return tier * 150;
    if (tier <= 60) return tier * 200;
    if (tier <= 90) return tier * 250;
    return tier * 300;
  }

  // Generate tiers 1-100
  for (let tier = 1; tier <= 100; tier++) {
    const tierData = {
      tier,
      xpRequired: getXPRequired(tier)
    };

    // Free track rewards (tiers 20, 40, 60, 80, 100 only)
    if (tier === 20) {
      tierData.freeReward = { type: 'tokens', amount: 100 };
    } else if (tier === 40) {
      tierData.freeReward = { type: 'tokens', amount: 200 };
    } else if (tier === 60) {
      tierData.freeReward = { type: 'tokens', amount: 200 };
    } else if (tier === 80) {
      tierData.freeReward = { type: 'tokens', amount: 200 };
    } else if (tier === 100) {
      tierData.freeReward = { type: 'tokens', amount: 500 };
    }

    // Premium track rewards (every 2-5 tiers)
    if (tier % 5 === 0) {
      // Every 5 tiers: token reward
      tierData.premiumReward = { type: 'tokens', amount: 50 + (tier / 5) * 10 };
    } else if (tier % 10 === 0 && tier <= 90) {
      // Every 10 tiers: theme reward
      tierData.premiumReward = { type: 'theme', id: `theme_season1_tier${tier}`, amount: 1 };
    } else if (tier % 25 === 0) {
      // Tiers 25, 50, 75: avatar frames
      tierData.premiumReward = { type: 'avatar', id: `avatar_frame_tier${tier}`, amount: 1 };
    }

    // Special rewards
    if (tier === 1) {
      tierData.premiumReward = { type: 'badge', id: 'badge_season1_starter', amount: 1 };
    } else if (tier === 100) {
      tierData.premiumReward = { type: 'bundle', id: 'ultimate_season1_pack', amount: 1 };
    }

    tiers.push(tierData);
  }

  return tiers;
}

module.exports = {
  migrateBattlePass,
  createBattlePassTables,
  seedSeason1
};
