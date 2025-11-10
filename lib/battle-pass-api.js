/**
 * BATTLE PASS API MODULE
 *
 * Provides battle pass functionality without creating a new endpoint.
 * Used by /api/stats.js with ?type=battle-pass parameter
 *
 * Version: 1.0
 * Created: November 2025
 */

const pool = require('./db-pool');
const { getCached, invalidateCache, CACHE_DURATIONS } = require('./cache');
const {
  calculatePuzzleXP,
  calculateAchievementXP,
  calculateTutorialXP,
  getXPSourceName,
  calculateTierFromXP,
  getProgressToNextTier,
  getCumulativeXPRequired
} = require('./battle-pass-xp');

// =====================================================
// DATABASE HELPERS
// =====================================================

/**
 * Get active battle pass season
 */
async function getActiveSeason() {
  const result = await pool.query(`
    SELECT * FROM battle_pass_seasons
    WHERE is_active = true
    AND CURRENT_DATE BETWEEN start_date AND end_date
    LIMIT 1
  `);

  if (result.rows.length === 0) {
    return null;
  }

  const season = result.rows[0];
  return {
    ...season,
    days_elapsed: Math.floor((new Date() - new Date(season.start_date)) / (1000 * 60 * 60 * 24)),
    days_remaining: Math.floor((new Date(season.end_date) - new Date()) / (1000 * 60 * 60 * 24))
  };
}

/**
 * Get user's battle pass progress for a season
 */
async function getUserProgress(userId, seasonId) {
  const result = await pool.query(`
    SELECT * FROM user_battle_pass_progress
    WHERE user_id = $1 AND season_id = $2
  `, [userId, seasonId]);

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
}

/**
 * Initialize user's battle pass progress for current season
 */
async function initializeUserProgress(userId, seasonId, hasPremium) {
  const result = await pool.query(`
    INSERT INTO user_battle_pass_progress (user_id, season_id, has_premium_pass, first_xp_gain_at)
    VALUES ($1, $2, $3, NOW())
    ON CONFLICT (user_id, season_id) DO NOTHING
    RETURNING *
  `, [userId, seasonId, hasPremium]);

  return result.rows[0];
}

/**
 * Get tier rewards for a specific tier
 */
async function getTierRewards(seasonId, tierNumber) {
  const result = await pool.query(`
    SELECT * FROM battle_pass_tiers
    WHERE season_id = $1 AND tier_number = $2
  `, [seasonId, tierNumber]);

  if (result.rows.length === 0) {
    return null;
  }

  const tier = result.rows[0];
  return {
    tierNumber: tier.tier_number,
    xpRequired: tier.xp_required,
    freeRewards: tier.free_reward_type ? [{
      type: tier.free_reward_type,
      id: tier.free_reward_id,
      amount: tier.free_reward_amount
    }] : [],
    premiumRewards: tier.premium_reward_type ? [{
      type: tier.premium_reward_type,
      id: tier.premium_reward_id,
      amount: tier.premium_reward_amount
    }] : []
  };
}

/**
 * Get all tiers for a season (with caching)
 */
async function getAllTiers(seasonId) {
  const cacheKey = `battle_pass_tiers:${seasonId}`;

  return await getCached(
    cacheKey,
    async () => {
      const result = await pool.query(`
        SELECT * FROM battle_pass_tiers
        WHERE season_id = $1
        ORDER BY tier_number ASC
      `, [seasonId]);

      return result.rows.map(tier => ({
        tierNumber: tier.tier_number,
        xpRequired: tier.xp_required,
        freeRewards: tier.free_reward_type ? [{
          type: tier.free_reward_type,
          id: tier.free_reward_id,
          amount: tier.free_reward_amount
        }] : [],
        premiumRewards: tier.premium_reward_type ? [{
          type: tier.premium_reward_type,
          id: tier.premium_reward_id,
          amount: tier.premium_reward_amount
        }] : []
      }));
    },
    86400 // 24 hours
  );
}

// =====================================================
// CORE FUNCTIONS
// =====================================================

/**
 * Add XP to user's battle pass progress
 */
async function addXP(userId, xpAmount, source, reference = null) {
  const season = await getActiveSeason();
  if (!season) {
    return { success: false, error: 'No active season' };
  }

  // Get or create user progress
  let progress = await getUserProgress(userId, season.id);
  if (!progress) {
    // Get user's premium status
    const userResult = await pool.query('SELECT premium FROM users WHERE id = $1', [userId]);
    const hasPremium = userResult.rows[0]?.premium || false;

    progress = await initializeUserProgress(userId, season.id, hasPremium);
  }

  const oldTier = progress.current_tier;
  const oldXP = progress.current_xp;
  const newXP = oldXP + xpAmount;
  const newTier = Math.min(100, calculateTierFromXP(newXP));

  // Update progress
  await pool.query(`
    UPDATE user_battle_pass_progress
    SET current_xp = $1,
        current_tier = $2,
        last_xp_gain_at = NOW(),
        updated_at = NOW()
    WHERE user_id = $3 AND season_id = $4
  `, [newXP, newTier, userId, season.id]);

  // Log XP gain
  await pool.query(`
    INSERT INTO user_xp_history (user_id, season_id, xp_amount, xp_source, source_reference, tier_before, tier_after, had_premium_boost)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [userId, season.id, xpAmount, source, reference, oldTier, newTier, progress.has_premium_pass]);

  // Invalidate user's battle pass cache
  await invalidateCache(`battle_pass_progress:${userId}`);

  return {
    success: true,
    oldTier,
    newTier,
    tierUp: newTier > oldTier,
    xpGained: xpAmount,
    totalXP: newXP
  };
}

/**
 * Claim reward for a specific tier
 */
async function claimReward(userId, tierNumber, track = 'free') {
  const season = await getActiveSeason();
  if (!season) {
    return { success: false, error: 'No active season' };
  }

  const progress = await getUserProgress(userId, season.id);
  if (!progress) {
    return { success: false, error: 'No progress found' };
  }

  // Check if tier is reached
  if (progress.current_tier < tierNumber) {
    return { success: false, error: 'Tier not reached yet' };
  }

  // Check if already claimed
  const claimedTiers = track === 'premium' ? progress.claimed_premium_tiers : progress.claimed_free_tiers;
  if (claimedTiers && claimedTiers.includes(tierNumber)) {
    return { success: false, error: 'Reward already claimed' };
  }

  // For premium track, check if user has premium
  if (track === 'premium' && !progress.has_premium_pass) {
    return { success: false, error: 'Premium pass required' };
  }

  // Get tier rewards
  const tierRewards = await getTierRewards(season.id, tierNumber);
  if (!tierRewards) {
    return { success: false, error: 'Tier not found' };
  }

  const rewards = track === 'premium' ? tierRewards.premiumRewards : tierRewards.freeRewards;

  // Add rewards to user inventory
  const addedRewards = [];
  for (const reward of rewards) {
    if (reward.type === 'tokens') {
      // Add tokens
      await pool.query(`
        INSERT INTO user_tokens (user_id, balance, lifetime_earned)
        VALUES ($1, $2, $2)
        ON CONFLICT (user_id) DO UPDATE
        SET balance = user_tokens.balance + $2,
            lifetime_earned = user_tokens.lifetime_earned + $2,
            last_updated = NOW()
      `, [userId, reward.amount]);

      // Log transaction
      await pool.query(`
        INSERT INTO token_transactions (user_id, amount, transaction_type, source_reference, balance_before, balance_after)
        SELECT $1, $2, 'battle_pass_reward', $3,
               COALESCE((SELECT balance FROM user_tokens WHERE user_id = $1), 0) - $2,
               COALESCE((SELECT balance FROM user_tokens WHERE user_id = $1), 0)
      `, [userId, reward.amount, `tier_${tierNumber}`]);

      addedRewards.push({ type: 'tokens', amount: reward.amount });
    } else {
      // Add item to inventory (theme, badge, avatar, title)
      await pool.query(`
        INSERT INTO user_inventory (user_id, item_type, item_id, acquired_from, season_acquired, tier_acquired)
        VALUES ($1, $2, $3, 'battle_pass', $4, $5)
        ON CONFLICT (user_id, item_id) DO NOTHING
      `, [userId, reward.type, reward.id, season.season_number, tierNumber]);

      addedRewards.push({ type: reward.type, id: reward.id });
    }
  }

  // Mark tier as claimed
  const columnName = track === 'premium' ? 'claimed_premium_tiers' : 'claimed_free_tiers';
  await pool.query(`
    UPDATE user_battle_pass_progress
    SET ${columnName} = array_append(${columnName}, $1),
        updated_at = NOW()
    WHERE user_id = $2 AND season_id = $3
  `, [tierNumber, userId, season.id]);

  // Invalidate cache
  await invalidateCache(`battle_pass_progress:${userId}`);

  return {
    success: true,
    rewards: addedRewards,
    tier: tierNumber,
    track
  };
}

/**
 * Get user's complete battle pass status
 */
async function getBattlePassStatus(userId) {
  const season = await getActiveSeason();
  if (!season) {
    return { success: false, error: 'No active season' };
  }

  const cacheKey = `battle_pass_progress:${userId}`;

  return await getCached(
    cacheKey,
    async () => {
      let progress = await getUserProgress(userId, season.id);

      // Initialize if no progress yet
      if (!progress) {
        const userResult = await pool.query('SELECT premium FROM users WHERE id = $1', [userId]);
        const hasPremium = userResult.rows[0]?.premium || false;
        progress = await initializeUserProgress(userId, season.id, hasPremium);
      }

      const progressToNext = getProgressToNextTier(progress.current_xp, progress.current_tier);

      // Get next unclaimed rewards
      const nextFreeTier = [20, 40, 60, 80, 100].find(tier =>
        tier > progress.current_tier || !progress.claimed_free_tiers.includes(tier)
      );

      const nextPremiumTier = progress.current_tier + 1 <= 100 ? progress.current_tier + 1 : 100;

      return {
        season: {
          id: season.id,
          name: season.name,
          seasonNumber: season.season_number,
          startDate: season.start_date,
          endDate: season.end_date,
          daysRemaining: season.days_remaining,
          daysElapsed: season.days_elapsed
        },
        progress: {
          currentTier: progress.current_tier,
          currentXP: progress.current_xp,
          hasPremium: progress.has_premium_pass,
          claimedFreeTiers: progress.claimed_free_tiers || [],
          claimedPremiumTiers: progress.claimed_premium_tiers || []
        },
        nextTier: progressToNext,
        nextRewards: {
          freeTier: nextFreeTier,
          premiumTier: nextPremiumTier
        }
      };
    },
    300 // 5 minutes
  );
}

/**
 * Get battle pass leaderboard
 */
async function getLeaderboard(limit = 100) {
  const season = await getActiveSeason();
  if (!season) {
    return [];
  }

  const cacheKey = `battle_pass_leaderboard:${season.id}`;

  return await getCached(
    cacheKey,
    async () => {
      const result = await pool.query(`
        SELECT
          u.username,
          u.display_name,
          u.avatar,
          ubp.current_tier,
          ubp.current_xp,
          ubp.has_premium_pass,
          ubp.last_xp_gain_at,
          RANK() OVER (ORDER BY ubp.current_tier DESC, ubp.current_xp DESC) AS rank
        FROM user_battle_pass_progress ubp
        JOIN users u ON ubp.user_id = u.id
        WHERE ubp.season_id = $1
        ORDER BY ubp.current_tier DESC, ubp.current_xp DESC
        LIMIT $2
      `, [season.id, limit]);

      return result.rows.map(row => ({
        rank: parseInt(row.rank),
        username: row.username,
        displayName: row.display_name,
        avatar: row.avatar,
        tier: row.current_tier,
        xp: row.current_xp,
        hasPremium: row.has_premium_pass,
        lastActive: row.last_xp_gain_at
      }));
    },
    300 // 5 minutes
  );
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  getActiveSeason,
  getUserProgress,
  addXP,
  claimReward,
  getBattlePassStatus,
  getLeaderboard,
  getAllTiers,

  // Re-export XP calculation functions for convenience
  calculatePuzzleXP,
  calculateAchievementXP,
  calculateTutorialXP
};
