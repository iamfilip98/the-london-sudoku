/**
 * BATTLE PASS XP SYSTEM
 *
 * Handles XP calculation for all sources:
 * - Puzzle completions
 * - Achievements
 * - Bonuses (perfect games, streaks, first daily)
 * - Premium multipliers
 *
 * Version: 1.0
 * Created: November 2025
 */

// =====================================================
// XP SOURCE DEFINITIONS
// =====================================================

const XP_SOURCES = {
  // Classic Sudoku
  puzzle_classic_easy: 50,
  puzzle_classic_medium: 100,
  puzzle_classic_hard: 150,

  // X-Sudoku (diagonal constraints = slightly harder)
  puzzle_xsudoku_easy: 60,
  puzzle_xsudoku_medium: 120,
  puzzle_xsudoku_hard: 180,

  // Mini 6x6 (faster but still valuable)
  puzzle_mini_easy: 40,
  puzzle_mini_medium: 80,
  puzzle_mini_hard: 120,

  // Anti-Knight (chess constraint)
  puzzle_antiknight_easy: 70,
  puzzle_antiknight_medium: 140,
  puzzle_antiknight_hard: 210,

  // Killer Sudoku (cage sums = most complex)
  puzzle_killer_easy: 100,
  puzzle_killer_medium: 200,
  puzzle_killer_hard: 300,

  // Hyper Sudoku (extra regions)
  puzzle_hyper_easy: 70,
  puzzle_hyper_medium: 140,
  puzzle_hyper_hard: 210,

  // Consecutive Sudoku (marker constraints)
  puzzle_consecutive_easy: 70,
  puzzle_consecutive_medium: 140,
  puzzle_consecutive_hard: 210,

  // Thermo Sudoku (thermometer constraints)
  puzzle_thermo_easy: 80,
  puzzle_thermo_medium: 160,
  puzzle_thermo_hard: 240,

  // Jigsaw Sudoku (irregular regions)
  puzzle_jigsaw_easy: 80,
  puzzle_jigsaw_medium: 160,
  puzzle_jigsaw_hard: 240,

  // Bonuses
  perfect_game: 25,            // No errors, no hints
  first_puzzle_today: 20,      // First puzzle of the day
  daily_streak_bonus: 10,      // Per consecutive day (cumulative)

  // Achievements (by rarity)
  achievement_common: 10,
  achievement_rare: 25,
  achievement_epic: 50,
  achievement_legendary: 100,

  // Social (future implementation)
  friend_challenge_win: 50,
  league_daily_win: 75,

  // Educational
  tutorial_complete: 75,
  quiz_perfect_score: 50,
  practice_technique: 15
};

// Premium XP multiplier
const PREMIUM_XP_MULTIPLIER = 1.5; // +50% XP

// Maximum streak bonus days (cap to prevent extreme values)
const MAX_STREAK_DAYS = 30;

// =====================================================
// XP CALCULATION FUNCTIONS
// =====================================================

/**
 * Calculate XP for a puzzle completion
 * @param {Object} completion - Puzzle completion details
 * @returns {Object} - XP breakdown with total
 */
function calculatePuzzleXP(completion) {
  const {
    variant = 'classic',
    difficulty = 'medium',
    errors = 0,
    hints = 0,
    isPremium = false,
    isFirstToday = false,
    streak = 0
  } = completion;

  const breakdown = {
    base: 0,
    perfect: 0,
    firstDaily: 0,
    streak: 0,
    subtotal: 0,
    premiumMultiplier: 1.0,
    total: 0
  };

  // Base XP from variant and difficulty
  const sourceKey = `puzzle_${variant.toLowerCase().replace(/-/g, '')}_${difficulty}`;
  breakdown.base = XP_SOURCES[sourceKey] || XP_SOURCES.puzzle_classic_medium;

  // Perfect game bonus (no errors, no hints)
  if (errors === 0 && hints === 0) {
    breakdown.perfect = XP_SOURCES.perfect_game;
  }

  // First puzzle today bonus
  if (isFirstToday) {
    breakdown.firstDaily = XP_SOURCES.first_puzzle_today;
  }

  // Streak bonus (cumulative, capped at 30 days)
  if (streak > 0) {
    const cappedStreak = Math.min(streak, MAX_STREAK_DAYS);
    breakdown.streak = XP_SOURCES.daily_streak_bonus * cappedStreak;
  }

  // Calculate subtotal
  breakdown.subtotal = breakdown.base + breakdown.perfect + breakdown.firstDaily + breakdown.streak;

  // Apply premium multiplier
  if (isPremium) {
    breakdown.premiumMultiplier = PREMIUM_XP_MULTIPLIER;
    breakdown.total = Math.floor(breakdown.subtotal * PREMIUM_XP_MULTIPLIER);
  } else {
    breakdown.total = breakdown.subtotal;
  }

  return breakdown;
}

/**
 * Calculate XP for achievement unlock
 * @param {string} rarity - Achievement rarity ('common', 'rare', 'epic', 'legendary')
 * @param {boolean} isPremium - Whether user has premium
 * @returns {Object} - XP breakdown
 */
function calculateAchievementXP(rarity, isPremium = false) {
  const sourceKey = `achievement_${rarity.toLowerCase()}`;
  const baseXP = XP_SOURCES[sourceKey] || XP_SOURCES.achievement_common;

  const breakdown = {
    base: baseXP,
    premiumMultiplier: isPremium ? PREMIUM_XP_MULTIPLIER : 1.0,
    total: isPremium ? Math.floor(baseXP * PREMIUM_XP_MULTIPLIER) : baseXP
  };

  return breakdown;
}

/**
 * Calculate XP for tutorial completion
 * @param {boolean} isPremium - Whether user has premium
 * @returns {Object} - XP breakdown
 */
function calculateTutorialXP(isPremium = false) {
  const baseXP = XP_SOURCES.tutorial_complete;

  const breakdown = {
    base: baseXP,
    premiumMultiplier: isPremium ? PREMIUM_XP_MULTIPLIER : 1.0,
    total: isPremium ? Math.floor(baseXP * PREMIUM_XP_MULTIPLIER) : baseXP
  };

  return breakdown;
}

/**
 * Get XP source name for logging
 * @param {Object} context - Context of XP gain
 * @returns {string} - Source identifier
 */
function getXPSourceName(context) {
  const { type, variant, difficulty, rarity } = context;

  switch (type) {
    case 'puzzle':
      return `puzzle_${variant}_${difficulty}`;
    case 'achievement':
      return `achievement_${rarity}`;
    case 'tutorial':
      return 'tutorial_complete';
    case 'perfect_game':
      return 'perfect_game';
    case 'first_daily':
      return 'first_puzzle_today';
    case 'streak':
      return 'daily_streak_bonus';
    default:
      return 'unknown';
  }
}

/**
 * Format XP breakdown for display
 * @param {Object} breakdown - XP breakdown object
 * @returns {string[]} - Array of human-readable strings
 */
function formatXPBreakdown(breakdown) {
  const lines = [];

  if (breakdown.base > 0) {
    lines.push(`Base XP: ${breakdown.base}`);
  }
  if (breakdown.perfect > 0) {
    lines.push(`Perfect Bonus: +${breakdown.perfect}`);
  }
  if (breakdown.firstDaily > 0) {
    lines.push(`First Daily: +${breakdown.firstDaily}`);
  }
  if (breakdown.streak > 0) {
    lines.push(`Streak Bonus: +${breakdown.streak}`);
  }
  if (breakdown.premiumMultiplier > 1.0) {
    lines.push(`Premium Boost: +${Math.round((breakdown.premiumMultiplier - 1) * 100)}%`);
  }

  return lines;
}

// =====================================================
// TIER CALCULATIONS
// =====================================================

/**
 * Calculate XP required to reach a specific tier
 * @param {number} tier - Target tier (1-100)
 * @returns {number} - XP required
 */
function getTierXPRequired(tier) {
  if (tier === 1) return 0;
  if (tier <= 10) return tier * 100;
  if (tier <= 30) return tier * 150;
  if (tier <= 60) return tier * 200;
  if (tier <= 90) return tier * 250;
  return tier * 300;
}

/**
 * Calculate cumulative XP required to reach a tier
 * @param {number} tier - Target tier
 * @returns {number} - Total XP needed from tier 1
 */
function getCumulativeXPRequired(tier) {
  let totalXP = 0;
  for (let t = 2; t <= tier; t++) {
    totalXP += getTierXPRequired(t);
  }
  return totalXP;
}

/**
 * Calculate which tier user should be at based on XP
 * @param {number} xp - Current XP
 * @returns {number} - Current tier (1-100)
 */
function calculateTierFromXP(xp) {
  let currentTier = 1;
  let cumulativeXP = 0;

  while (currentTier < 100) {
    const nextTierXP = getTierXPRequired(currentTier + 1);
    if (xp < cumulativeXP + nextTierXP) {
      return currentTier;
    }
    cumulativeXP += nextTierXP;
    currentTier++;
  }

  return 100;
}

/**
 * Get progress to next tier
 * @param {number} currentXP - Current XP
 * @param {number} currentTier - Current tier
 * @returns {Object} - Progress details
 */
function getProgressToNextTier(currentXP, currentTier) {
  if (currentTier >= 100) {
    return {
      currentTier: 100,
      nextTier: 100,
      xpForNextTier: 0,
      xpToNextTier: 0,
      percentToNext: 100
    };
  }

  const cumulativeXP = getCumulativeXPRequired(currentTier);
  const xpInCurrentTier = currentXP - cumulativeXP;
  const xpForNextTier = getTierXPRequired(currentTier + 1);
  const xpToNextTier = xpForNextTier - xpInCurrentTier;
  const percentToNext = Math.floor((xpInCurrentTier / xpForNextTier) * 100);

  return {
    currentTier,
    nextTier: currentTier + 1,
    xpForNextTier,
    xpToNextTier: Math.max(0, xpToNextTier),
    percentToNext: Math.min(100, Math.max(0, percentToNext))
  };
}

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  XP_SOURCES,
  PREMIUM_XP_MULTIPLIER,
  MAX_STREAK_DAYS,

  // XP calculation
  calculatePuzzleXP,
  calculateAchievementXP,
  calculateTutorialXP,
  getXPSourceName,
  formatXPBreakdown,

  // Tier calculation
  getTierXPRequired,
  getCumulativeXPRequired,
  calculateTierFromXP,
  getProgressToNextTier
};
