/**
 * PHASE 2 MONTH 19: Variant Statistics Manager
 *
 * Tracks detailed statistics for each Sudoku variant.
 * Integrates with variant achievement system.
 */

class VariantStatsManager {
    constructor() {
        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'variantStats';

        this.stats = this.loadStats();
    }

    /**
     * Initialize default stats structure for a variant
     */
    getDefaultVariantStats() {
        return {
            completions: 0,
            perfectGames: 0,
            totalErrors: 0,
            totalTime: 0,
            bestTime: {
                any: Infinity,
                easy: Infinity,
                medium: Infinity,
                hard: Infinity
            },
            byDifficulty: {
                easy: { completions: 0, perfectGames: 0 },
                medium: { completions: 0, perfectGames: 0 },
                hard: { completions: 0, perfectGames: 0 }
            },
            firstCompletedAt: null,
            lastCompletedAt: null
        };
    }

    /**
     * Record a game completion for a variant
     */
    recordCompletion(variantId, difficulty, timeInSeconds, errorCount) {
        if (!this.stats[variantId]) {
            this.stats[variantId] = this.getDefaultVariantStats();
        }

        const variantStats = this.stats[variantId];

        // Update general stats
        variantStats.completions++;
        variantStats.totalErrors += errorCount;
        variantStats.totalTime += timeInSeconds;
        variantStats.lastCompletedAt = Date.now();

        if (!variantStats.firstCompletedAt) {
            variantStats.firstCompletedAt = Date.now();
        }

        // Track perfect games
        if (errorCount === 0) {
            variantStats.perfectGames++;
            variantStats.byDifficulty[difficulty].perfectGames++;
        }

        // Update difficulty-specific stats
        variantStats.byDifficulty[difficulty].completions++;

        // Update best times
        if (timeInSeconds < variantStats.bestTime.any) {
            variantStats.bestTime.any = timeInSeconds;
        }
        if (timeInSeconds < variantStats.bestTime[difficulty]) {
            variantStats.bestTime[difficulty] = timeInSeconds;
        }

        this.saveStats();

        // Return newly unlocked achievements
        return this.checkVariantAchievements();
    }

    /**
     * Check which variant achievements are unlocked
     */
    checkVariantAchievements() {
        if (typeof checkVariantAchievements !== 'function') {
            console.warn('Variant achievements library not loaded');
            return [];
        }

        const unlockedIds = checkVariantAchievements(this.stats);
        return unlockedIds;
    }

    /**
     * Get statistics for a specific variant
     */
    getVariantStats(variantId) {
        return this.stats[variantId] || this.getDefaultVariantStats();
    }

    /**
     * Get all variant statistics
     */
    getAllStats() {
        return this.stats;
    }

    /**
     * Get variant mastery tier
     */
    getVariantMastery(variantId) {
        if (typeof getVariantMasteryTier !== 'function') {
            console.warn('Variant achievements library not loaded');
            return null;
        }

        const variantStats = this.getVariantStats(variantId);
        return getVariantMasteryTier(variantStats.completions);
    }

    /**
     * Get mastery progress for a variant
     */
    getVariantMasteryProgress(variantId) {
        if (typeof getMasteryProgress !== 'function') {
            console.warn('Variant achievements library not loaded');
            return null;
        }

        const variantStats = this.getVariantStats(variantId);
        return getMasteryProgress(variantStats.completions);
    }

    /**
     * Get favorite variant (most played)
     */
    getFavoriteVariant() {
        const variants = Object.entries(this.stats);
        if (variants.length === 0) return null;

        return variants.reduce((favorite, [variantId, stats]) => {
            if (!favorite || stats.completions > favorite.completions) {
                return { variantId, ...stats };
            }
            return favorite;
        }, null);
    }

    /**
     * Get total completions across all variants
     */
    getTotalCompletions() {
        return Object.values(this.stats).reduce((total, variantStats) => {
            return total + variantStats.completions;
        }, 0);
    }

    /**
     * Get total perfect games across all variants
     */
    getTotalPerfectGames() {
        return Object.values(this.stats).reduce((total, variantStats) => {
            return total + variantStats.perfectGames;
        }, 0);
    }

    /**
     * Get average errors per game for a variant
     */
    getAverageErrors(variantId) {
        const variantStats = this.getVariantStats(variantId);
        if (variantStats.completions === 0) return 0;
        return variantStats.totalErrors / variantStats.completions;
    }

    /**
     * Get average completion time for a variant
     */
    getAverageTime(variantId) {
        const variantStats = this.getVariantStats(variantId);
        if (variantStats.completions === 0) return 0;
        return variantStats.totalTime / variantStats.completions;
    }

    /**
     * Get completion count for a specific difficulty across all variants
     */
    getCompletionsByDifficulty(difficulty) {
        return Object.values(this.stats).reduce((total, variantStats) => {
            return total + (variantStats.byDifficulty[difficulty]?.completions || 0);
        }, 0);
    }

    /**
     * Get count of variants with at least one completion
     */
    getVariantExplorationCount() {
        return Object.values(this.stats).filter(variantStats => variantStats.completions >= 1).length;
    }

    /**
     * Get tutorial completion data
     */
    getTutorialStats() {
        if (!this.stats.tutorials) {
            this.stats.tutorials = {
                completed: [],
                inProgress: {},
                startedAt: {}
            };
        }
        return this.stats.tutorials;
    }

    /**
     * Record tutorial completion
     */
    completeTutorial(variantId) {
        const tutorialStats = this.getTutorialStats();

        if (!tutorialStats.completed.includes(variantId)) {
            tutorialStats.completed.push(variantId);
        }

        // Remove from in-progress if present
        delete tutorialStats.inProgress[variantId];

        this.saveStats();
    }

    /**
     * Record tutorial started
     */
    startTutorial(variantId) {
        const tutorialStats = this.getTutorialStats();

        if (!tutorialStats.startedAt[variantId]) {
            tutorialStats.startedAt[variantId] = Date.now();
        }
    }

    /**
     * Save tutorial progress
     */
    saveTutorialProgress(variantId, stepIndex) {
        const tutorialStats = this.getTutorialStats();
        tutorialStats.inProgress[variantId] = stepIndex;
        this.saveStats();
    }

    /**
     * Get variant achievement summary
     */
    getAchievementSummary() {
        const unlockedIds = this.checkVariantAchievements();

        if (typeof VARIANT_ACHIEVEMENTS === 'undefined') {
            return { unlocked: [], total: 0, percentage: 0 };
        }

        const totalAchievements = Object.keys(VARIANT_ACHIEVEMENTS).length;
        const percentage = totalAchievements > 0 ? (unlockedIds.length / totalAchievements) * 100 : 0;

        return {
            unlocked: unlockedIds,
            total: totalAchievements,
            percentage: Math.round(percentage)
        };
    }

    /**
     * Get variant leaderboard data
     */
    getVariantLeaderboard(variantId) {
        const variantStats = this.getVariantStats(variantId);
        const mastery = this.getVariantMastery(variantId);
        const masteryProgress = this.getVariantMasteryProgress(variantId);

        return {
            completions: variantStats.completions,
            perfectGames: variantStats.perfectGames,
            bestTime: variantStats.bestTime,
            averageErrors: this.getAverageErrors(variantId),
            averageTime: this.getAverageTime(variantId),
            mastery: mastery,
            masteryProgress: masteryProgress
        };
    }

    /**
     * Export stats for sharing or backup
     */
    exportStats() {
        return JSON.stringify(this.stats, null, 2);
    }

    /**
     * Import stats from backup
     */
    importStats(statsJson) {
        try {
            const importedStats = JSON.parse(statsJson);

            // Validate structure before importing
            if (typeof importedStats !== 'object') {
                throw new Error('Invalid stats format');
            }

            this.stats = importedStats;
            this.saveStats();

            return true;
        } catch (error) {
            console.error('Failed to import stats:', error);
            return false;
        }
    }

    /**
     * Reset all variant statistics
     */
    resetAllStats() {
        const confirmed = confirm('Are you sure you want to reset ALL variant statistics? This cannot be undone.');

        if (confirmed) {
            this.stats = {};
            this.saveStats();
            console.log('All variant statistics have been reset');
            return true;
        }

        return false;
    }

    /**
     * Reset statistics for a specific variant
     */
    resetVariantStats(variantId) {
        const confirmed = confirm(`Are you sure you want to reset statistics for ${variantId}? This cannot be undone.`);

        if (confirmed) {
            delete this.stats[variantId];
            this.saveStats();
            console.log(`Statistics for ${variantId} have been reset`);
            return true;
        }

        return false;
    }

    /**
     * Save stats to localStorage
     */
    saveStats() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                stats: this.stats
            }));
        } catch (error) {
            console.error('Failed to save variant stats:', error);
        }
    }

    /**
     * Load stats from localStorage
     */
    loadStats() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No saved variant stats found');
                return {};
            }

            const data = JSON.parse(saved);

            // Handle old format (no version) - migrate to new format
            if (!data.version) {
                console.warn('Migrating variant stats from old format to versioned format');
                const migratedData = data; // Old format was just the stats object
                this.saveStats(); // Save in new format
                console.log('✅ Variant stats migrated successfully');
                return migratedData;
            }

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`Variant stats version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version}. Resetting stats.`);
                return {};
            }

            // Safe to load - versions match
            console.log('✅ Variant stats loaded successfully');
            return data.stats || {};

        } catch (error) {
            console.error('Failed to load variant stats:', error);
            return {};
        }
    }

    /**
     * Migrate old stats format (if needed)
     */
    migrateOldStats() {
        // Placeholder for future migrations
        // This can be used to upgrade stats structure when changes are made
        console.log('Variant stats migration check complete');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantStatsManager;
}
