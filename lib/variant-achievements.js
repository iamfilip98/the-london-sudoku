/**
 * PHASE 2 MONTH 19: Variant-Specific Achievements
 *
 * Comprehensive achievement definitions for all Sudoku variants.
 * Tracks mastery, progression, and special accomplishments for each variant type.
 */

const VARIANT_ACHIEVEMENTS = {
    // ========================================
    // CLASSIC SUDOKU ACHIEVEMENTS
    // ========================================
    'classic-first-steps': {
        id: 'classic-first-steps',
        name: 'Classic Beginning',
        description: 'Complete your first Classic Sudoku puzzle',
        icon: '🎯',
        category: 'variant-specific',
        variant: 'classic',
        rarity: 'common',
        condition: (stats) => stats.classic?.completions >= 1
    },
    'classic-speed-runner': {
        id: 'classic-speed-runner',
        name: 'Classic Speed Runner',
        description: 'Complete a Classic Sudoku puzzle in under 3 minutes',
        icon: '⚡',
        category: 'variant-specific',
        variant: 'classic',
        rarity: 'rare',
        condition: (stats) => stats.classic?.bestTime?.any < 180
    },
    'classic-perfectionist': {
        id: 'classic-perfectionist',
        name: 'Classic Perfectionist',
        description: 'Complete 10 Classic Sudoku puzzles with zero errors',
        icon: '✨',
        category: 'variant-specific',
        variant: 'classic',
        rarity: 'epic',
        condition: (stats) => stats.classic?.perfectGames >= 10
    },
    'classic-master': {
        id: 'classic-master',
        name: 'Classic Master',
        description: 'Complete 100 Classic Sudoku puzzles',
        icon: '👑',
        category: 'variant-specific',
        variant: 'classic',
        rarity: 'legendary',
        condition: (stats) => stats.classic?.completions >= 100
    },

    // ========================================
    // X-SUDOKU ACHIEVEMENTS
    // ========================================
    'x-sudoku-first-steps': {
        id: 'x-sudoku-first-steps',
        name: 'Diagonal Discovery',
        description: 'Complete your first X-Sudoku puzzle',
        icon: '✖️',
        category: 'variant-specific',
        variant: 'x-sudoku',
        rarity: 'common',
        condition: (stats) => stats['x-sudoku']?.completions >= 1
    },
    'x-sudoku-diagonal-master': {
        id: 'x-sudoku-diagonal-master',
        name: 'Diagonal Master',
        description: 'Complete 50 X-Sudoku puzzles',
        icon: '⚔️',
        category: 'variant-specific',
        variant: 'x-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['x-sudoku']?.completions >= 50
    },
    'x-sudoku-speed': {
        id: 'x-sudoku-speed',
        name: 'Diagonal Speed Demon',
        description: 'Complete an X-Sudoku puzzle in under 4 minutes',
        icon: '⚡',
        category: 'variant-specific',
        variant: 'x-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['x-sudoku']?.bestTime?.any < 240
    },

    // ========================================
    // MINI 6×6 ACHIEVEMENTS
    // ========================================
    'mini-first-steps': {
        id: 'mini-first-steps',
        name: 'Mini Beginner',
        description: 'Complete your first Mini 6×6 Sudoku',
        icon: '📐',
        category: 'variant-specific',
        variant: 'mini',
        rarity: 'common',
        condition: (stats) => stats.mini?.completions >= 1
    },
    'mini-speed-runner': {
        id: 'mini-speed-runner',
        name: 'Mini Speed Runner',
        description: 'Complete a Mini Sudoku in under 2 minutes',
        icon: '💨',
        category: 'variant-specific',
        variant: 'mini',
        rarity: 'rare',
        condition: (stats) => stats.mini?.bestTime?.any < 120
    },
    'mini-marathon': {
        id: 'mini-marathon',
        name: 'Mini Marathon',
        description: 'Complete 200 Mini Sudoku puzzles',
        icon: '🏃',
        category: 'variant-specific',
        variant: 'mini',
        rarity: 'epic',
        condition: (stats) => stats.mini?.completions >= 200
    },

    // ========================================
    // ANTI-KNIGHT ACHIEVEMENTS
    // ========================================
    'anti-knight-first-steps': {
        id: 'anti-knight-first-steps',
        name: 'Knight\'s First Move',
        description: 'Complete your first Anti-Knight Sudoku',
        icon: '♞',
        category: 'variant-specific',
        variant: 'anti-knight',
        rarity: 'common',
        condition: (stats) => stats['anti-knight']?.completions >= 1
    },
    'anti-knight-master': {
        id: 'anti-knight-master',
        name: 'Chess Master',
        description: 'Complete 50 Anti-Knight Sudoku puzzles',
        icon: '♜',
        category: 'variant-specific',
        variant: 'anti-knight',
        rarity: 'epic',
        condition: (stats) => stats['anti-knight']?.completions >= 50
    },
    'anti-knight-perfect': {
        id: 'anti-knight-perfect',
        name: 'Perfect Knight',
        description: 'Complete an Anti-Knight puzzle with zero errors',
        icon: '⚔️',
        category: 'variant-specific',
        variant: 'anti-knight',
        rarity: 'rare',
        condition: (stats) => stats['anti-knight']?.perfectGames >= 1
    },

    // ========================================
    // KILLER SUDOKU ACHIEVEMENTS
    // ========================================
    'killer-first-steps': {
        id: 'killer-first-steps',
        name: 'Killer Instinct',
        description: 'Complete your first Killer Sudoku',
        icon: '🔪',
        category: 'variant-specific',
        variant: 'killer-sudoku',
        rarity: 'common',
        condition: (stats) => stats['killer-sudoku']?.completions >= 1
    },
    'killer-mathematician': {
        id: 'killer-mathematician',
        name: 'Cage Mathematician',
        description: 'Complete 25 Killer Sudoku puzzles',
        icon: '🧮',
        category: 'variant-specific',
        variant: 'killer-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['killer-sudoku']?.completions >= 25
    },
    'killer-speed': {
        id: 'killer-speed',
        name: 'Quick Calculator',
        description: 'Complete a Killer Sudoku in under 6 minutes',
        icon: '⚡',
        category: 'variant-specific',
        variant: 'killer-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['killer-sudoku']?.bestTime?.any < 360
    },
    'killer-perfectionist': {
        id: 'killer-perfectionist',
        name: 'Cage Perfect',
        description: 'Complete 10 Killer Sudoku puzzles with zero errors',
        icon: '💎',
        category: 'variant-specific',
        variant: 'killer-sudoku',
        rarity: 'legendary',
        condition: (stats) => stats['killer-sudoku']?.perfectGames >= 10
    },

    // ========================================
    // HYPER SUDOKU ACHIEVEMENTS
    // ========================================
    'hyper-first-steps': {
        id: 'hyper-first-steps',
        name: 'Hyper Beginner',
        description: 'Complete your first Hyper Sudoku',
        icon: '🎯',
        category: 'variant-specific',
        variant: 'hyper-sudoku',
        rarity: 'common',
        condition: (stats) => stats['hyper-sudoku']?.completions >= 1
    },
    'hyper-region-master': {
        id: 'hyper-region-master',
        name: 'Region Master',
        description: 'Complete 50 Hyper Sudoku puzzles',
        icon: '🏆',
        category: 'variant-specific',
        variant: 'hyper-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['hyper-sudoku']?.completions >= 50
    },
    'hyper-perfect': {
        id: 'hyper-perfect',
        name: 'Hyper Perfect',
        description: 'Complete a Hyper Sudoku with zero errors',
        icon: '✨',
        category: 'variant-specific',
        variant: 'hyper-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['hyper-sudoku']?.perfectGames >= 1
    },

    // ========================================
    // CONSECUTIVE SUDOKU ACHIEVEMENTS
    // ========================================
    'consecutive-first-steps': {
        id: 'consecutive-first-steps',
        name: 'Consecutive Beginner',
        description: 'Complete your first Consecutive Sudoku',
        icon: '🔢',
        category: 'variant-specific',
        variant: 'consecutive-sudoku',
        rarity: 'common',
        condition: (stats) => stats['consecutive-sudoku']?.completions >= 1
    },
    'consecutive-marker-master': {
        id: 'consecutive-marker-master',
        name: 'Marker Master',
        description: 'Complete 50 Consecutive Sudoku puzzles',
        icon: '⚪',
        category: 'variant-specific',
        variant: 'consecutive-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['consecutive-sudoku']?.completions >= 50
    },
    'consecutive-perfect': {
        id: 'consecutive-perfect',
        name: 'Consecutively Perfect',
        description: 'Complete 5 Consecutive Sudoku puzzles with zero errors',
        icon: '💫',
        category: 'variant-specific',
        variant: 'consecutive-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['consecutive-sudoku']?.perfectGames >= 5
    },

    // ========================================
    // THERMO SUDOKU ACHIEVEMENTS
    // ========================================
    'thermo-first-steps': {
        id: 'thermo-first-steps',
        name: 'Rising Temperature',
        description: 'Complete your first Thermo Sudoku',
        icon: '🌡️',
        category: 'variant-specific',
        variant: 'thermo-sudoku',
        rarity: 'common',
        condition: (stats) => stats['thermo-sudoku']?.completions >= 1
    },
    'thermo-master': {
        id: 'thermo-master',
        name: 'Thermometer Master',
        description: 'Complete 50 Thermo Sudoku puzzles',
        icon: '🔥',
        category: 'variant-specific',
        variant: 'thermo-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['thermo-sudoku']?.completions >= 50
    },
    'thermo-speed': {
        id: 'thermo-speed',
        name: 'Hot Shot',
        description: 'Complete a Thermo Sudoku in under 5 minutes',
        icon: '⚡',
        category: 'variant-specific',
        variant: 'thermo-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['thermo-sudoku']?.bestTime?.any < 300
    },
    'thermo-perfect': {
        id: 'thermo-perfect',
        name: 'Thermo Perfect',
        description: 'Complete 10 Thermo Sudoku puzzles with zero errors',
        icon: '🌟',
        category: 'variant-specific',
        variant: 'thermo-sudoku',
        rarity: 'legendary',
        condition: (stats) => stats['thermo-sudoku']?.perfectGames >= 10
    },

    // ========================================
    // JIGSAW SUDOKU ACHIEVEMENTS
    // ========================================
    'jigsaw-first-steps': {
        id: 'jigsaw-first-steps',
        name: 'Puzzle Piecer',
        description: 'Complete your first Jigsaw Sudoku',
        icon: '🧩',
        category: 'variant-specific',
        variant: 'jigsaw-sudoku',
        rarity: 'common',
        condition: (stats) => stats['jigsaw-sudoku']?.completions >= 1
    },
    'jigsaw-region-expert': {
        id: 'jigsaw-region-expert',
        name: 'Irregular Region Expert',
        description: 'Complete 50 Jigsaw Sudoku puzzles',
        icon: '🎨',
        category: 'variant-specific',
        variant: 'jigsaw-sudoku',
        rarity: 'epic',
        condition: (stats) => stats['jigsaw-sudoku']?.completions >= 50
    },
    'jigsaw-perfect': {
        id: 'jigsaw-perfect',
        name: 'Jigsaw Perfect',
        description: 'Complete a Jigsaw Sudoku with zero errors',
        icon: '💎',
        category: 'variant-specific',
        variant: 'jigsaw-sudoku',
        rarity: 'rare',
        condition: (stats) => stats['jigsaw-sudoku']?.perfectGames >= 1
    },

    // ========================================
    // MULTI-VARIANT ACHIEVEMENTS
    // ========================================
    'variant-explorer': {
        id: 'variant-explorer',
        name: 'Variant Explorer',
        description: 'Complete at least one puzzle of 5 different variants',
        icon: '🗺️',
        category: 'variant-specific',
        variant: 'multi',
        rarity: 'rare',
        condition: (stats) => {
            const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku', 'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];
            const completedVariants = variants.filter(v => stats[v]?.completions >= 1);
            return completedVariants.length >= 5;
        }
    },
    'variant-master': {
        id: 'variant-master',
        name: 'Variant Master',
        description: 'Complete at least one puzzle of ALL 9 variants',
        icon: '🎓',
        category: 'variant-specific',
        variant: 'multi',
        rarity: 'epic',
        condition: (stats) => {
            const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku', 'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];
            const completedVariants = variants.filter(v => stats[v]?.completions >= 1);
            return completedVariants.length === 9;
        }
    },
    'variant-completionist': {
        id: 'variant-completionist',
        name: 'Variant Completionist',
        description: 'Complete 25 puzzles of ALL 9 variants',
        icon: '👑',
        category: 'variant-specific',
        variant: 'multi',
        rarity: 'legendary',
        condition: (stats) => {
            const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku', 'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];
            const completedVariants = variants.filter(v => stats[v]?.completions >= 25);
            return completedVariants.length === 9;
        }
    },
    'tutorial-student': {
        id: 'tutorial-student',
        name: 'Eager Student',
        description: 'Complete tutorials for 3 different variants',
        icon: '📚',
        category: 'variant-specific',
        variant: 'multi',
        rarity: 'common',
        condition: (stats) => (stats.tutorials?.completed?.length || 0) >= 3
    },
    'tutorial-graduate': {
        id: 'tutorial-graduate',
        name: 'Tutorial Graduate',
        description: 'Complete tutorials for ALL 9 variants',
        icon: '🎓',
        category: 'variant-specific',
        variant: 'multi',
        rarity: 'epic',
        condition: (stats) => (stats.tutorials?.completed?.length || 0) >= 9
    }
};

/**
 * Variant Mastery Tiers
 * Players progress through tiers as they complete more puzzles of each variant
 */
const VARIANT_MASTERY_TIERS = {
    bronze: { completions: 10, name: 'Bronze', icon: '🥉', color: '#CD7F32' },
    silver: { completions: 25, name: 'Silver', icon: '🥈', color: '#C0C0C0' },
    gold: { completions: 50, name: 'Gold', icon: '🥇', color: '#FFD700' },
    platinum: { completions: 100, name: 'Platinum', icon: '💎', color: '#E5E4E2' },
    diamond: { completions: 250, name: 'Diamond', icon: '💠', color: '#B9F2FF' },
    master: { completions: 500, name: 'Master', icon: '👑', color: '#9D00FF' }
};

/**
 * Get mastery tier for a variant based on completion count
 */
function getVariantMasteryTier(completions) {
    if (completions >= 500) return VARIANT_MASTERY_TIERS.master;
    if (completions >= 250) return VARIANT_MASTERY_TIERS.diamond;
    if (completions >= 100) return VARIANT_MASTERY_TIERS.platinum;
    if (completions >= 50) return VARIANT_MASTERY_TIERS.gold;
    if (completions >= 25) return VARIANT_MASTERY_TIERS.silver;
    if (completions >= 10) return VARIANT_MASTERY_TIERS.bronze;
    return null;
}

/**
 * Calculate progress to next mastery tier
 */
function getMasteryProgress(completions) {
    const tiers = Object.values(VARIANT_MASTERY_TIERS);

    // Find current and next tier
    let currentTier = null;
    let nextTier = tiers[0];

    for (let i = 0; i < tiers.length; i++) {
        if (completions >= tiers[i].completions) {
            currentTier = tiers[i];
            nextTier = tiers[i + 1] || null;
        }
    }

    if (!nextTier) {
        return { current: currentTier, progress: 100, completionsNeeded: 0 };
    }

    const previousTierCompletions = currentTier?.completions || 0;
    const progress = ((completions - previousTierCompletions) / (nextTier.completions - previousTierCompletions)) * 100;

    return {
        current: currentTier,
        next: nextTier,
        progress: Math.min(100, Math.max(0, progress)),
        completionsNeeded: nextTier.completions - completions
    };
}

/**
 * Get all achievements for a specific variant
 */
function getVariantAchievements(variantId) {
    return Object.values(VARIANT_ACHIEVEMENTS).filter(ach =>
        ach.variant === variantId || ach.variant === 'multi'
    );
}

/**
 * Check variant achievements against current stats
 */
function checkVariantAchievements(stats) {
    const unlockedAchievements = [];

    for (const [id, achievement] of Object.entries(VARIANT_ACHIEVEMENTS)) {
        if (achievement.condition(stats)) {
            unlockedAchievements.push(id);
        }
    }

    return unlockedAchievements;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        VARIANT_ACHIEVEMENTS,
        VARIANT_MASTERY_TIERS,
        getVariantMasteryTier,
        getMasteryProgress,
        getVariantAchievements,
        checkVariantAchievements
    };
}
