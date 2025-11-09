/**
 * PHASE 2 MONTH 21: Variant Daily Challenges & Streaks Manager
 *
 * Manages daily challenges, streaks, and rewards for all Sudoku variants.
 * Encourages daily play and variant exploration.
 */

class VariantDailyChallengesManager {
    constructor(statsManager) {
        this.statsManager = statsManager;
        this.challenges = {};
        this.streaks = {};
        this.todayDate = this.getTodayDateString();
        this.variantOfTheDay = null;

        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'variantDailyChallenges';

        // Load saved data
        this.loadData();

        // Generate today's challenges if needed
        this.generateDailyChallenges();

        // Select variant of the day
        this.selectVariantOfTheDay();
    }

    /**
     * Get today's date as a string (YYYY-MM-DD)
     */
    getTodayDateString() {
        const now = new Date();
        return now.toISOString().split('T')[0];
    }

    /**
     * Generate daily challenges for all variants
     */
    generateDailyChallenges() {
        const today = this.getTodayDateString();

        // Check if we already have challenges for today
        if (this.challenges[today]) {
            return;
        }

        // Generate new challenges for each variant
        this.challenges[today] = {};

        const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku',
                         'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];

        variants.forEach(variantId => {
            this.challenges[today][variantId] = this.generateVariantChallenges(variantId);
        });

        this.saveData();
    }

    /**
     * Generate challenges for a specific variant
     */
    generateVariantChallenges(variantId) {
        // Seed random generator with date + variant for consistency
        const seed = this.hashCode(this.todayDate + variantId);
        const rng = this.seededRandom(seed);

        const challenges = [];

        // Challenge 1: Speed Challenge
        const speedTimes = {
            'classic': [120, 180, 240],
            'x-sudoku': [150, 210, 270],
            'mini': [90, 120, 180],
            'anti-knight': [180, 240, 300],
            'killer-sudoku': [240, 300, 360],
            'hyper-sudoku': [180, 240, 300],
            'consecutive-sudoku': [180, 240, 300],
            'thermo-sudoku': [240, 300, 360],
            'jigsaw-sudoku': [210, 270, 330]
        };

        const targetTime = speedTimes[variantId][Math.floor(rng() * 3)];
        challenges.push({
            id: `speed-${variantId}-${this.todayDate}`,
            type: 'speed',
            title: 'Speed Demon',
            description: `Complete any ${this.getVariantName(variantId)} puzzle in under ${this.formatTime(targetTime)}`,
            requirement: { type: 'time', value: targetTime },
            reward: { type: 'xp', value: 50 },
            icon: '⚡',
            completed: false
        });

        // Challenge 2: Perfect Challenge
        challenges.push({
            id: `perfect-${variantId}-${this.todayDate}`,
            type: 'perfect',
            title: 'Flawless Victory',
            description: `Complete any ${this.getVariantName(variantId)} puzzle with 0 errors`,
            requirement: { type: 'errors', value: 0 },
            reward: { type: 'xp', value: 75 },
            icon: '✨',
            completed: false
        });

        // Challenge 3: Difficulty Challenge
        const difficultyIndex = Math.floor(rng() * 3);
        const difficulties = ['easy', 'medium', 'hard'];
        const difficulty = difficulties[difficultyIndex];
        challenges.push({
            id: `difficulty-${variantId}-${this.todayDate}`,
            type: 'difficulty',
            title: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode`,
            description: `Complete a ${difficulty} ${this.getVariantName(variantId)} puzzle`,
            requirement: { type: 'difficulty', value: difficulty },
            reward: { type: 'xp', value: difficulty === 'hard' ? 100 : difficulty === 'medium' ? 60 : 30 },
            icon: difficulty === 'hard' ? '🔥' : difficulty === 'medium' ? '⚔️' : '🎯',
            completed: false
        });

        return challenges;
    }

    /**
     * Check if a game completion satisfies any challenges
     */
    checkChallenges(variantId, difficulty, timeInSeconds, errorCount) {
        const today = this.getTodayDateString();
        if (!this.challenges[today] || !this.challenges[today][variantId]) {
            return [];
        }

        const completedChallenges = [];
        const variantChallenges = this.challenges[today][variantId];

        variantChallenges.forEach(challenge => {
            if (challenge.completed) return;

            let satisfied = false;

            switch (challenge.requirement.type) {
                case 'time':
                    satisfied = timeInSeconds < challenge.requirement.value;
                    break;
                case 'errors':
                    satisfied = errorCount <= challenge.requirement.value;
                    break;
                case 'difficulty':
                    satisfied = difficulty === challenge.requirement.value;
                    break;
            }

            if (satisfied) {
                challenge.completed = true;
                challenge.completedAt = Date.now();
                completedChallenges.push(challenge);
            }
        });

        if (completedChallenges.length > 0) {
            this.saveData();
        }

        return completedChallenges;
    }

    /**
     * Update streak for a variant
     */
    updateStreak(variantId) {
        const today = this.getTodayDateString();

        if (!this.streaks[variantId]) {
            this.streaks[variantId] = {
                current: 0,
                best: 0,
                lastPlayed: null
            };
        }

        const streak = this.streaks[variantId];

        // Check if already played today
        if (streak.lastPlayed === today) {
            return streak;
        }

        // Check if streak continues
        const yesterday = this.getYesterdayDateString();
        if (streak.lastPlayed === yesterday) {
            // Continue streak
            streak.current++;
        } else if (streak.lastPlayed !== today) {
            // Streak broken, start new
            streak.current = 1;
        }

        // Update best streak
        if (streak.current > streak.best) {
            streak.best = streak.current;
        }

        streak.lastPlayed = today;
        this.saveData();

        return streak;
    }

    /**
     * Get yesterday's date string
     */
    getYesterdayDateString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday.toISOString().split('T')[0];
    }

    /**
     * Select variant of the day (rotates based on date)
     */
    selectVariantOfTheDay() {
        const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku',
                         'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];

        // Use date as seed for consistent daily rotation
        const dayOfYear = this.getDayOfYear();
        const index = dayOfYear % variants.length;

        this.variantOfTheDay = {
            variantId: variants[index],
            bonus: 1.5, // 50% bonus XP
            icon: this.getVariantIcon(variants[index]),
            name: this.getVariantName(variants[index])
        };
    }

    /**
     * Get day of year (1-365/366)
     */
    getDayOfYear() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 0);
        const diff = now - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    }

    /**
     * Get all challenges for today
     */
    getTodayChallenges() {
        const today = this.getTodayDateString();
        return this.challenges[today] || {};
    }

    /**
     * Get challenges for a specific variant
     */
    getVariantChallenges(variantId) {
        const today = this.getTodayDateString();
        return this.challenges[today]?.[variantId] || [];
    }

    /**
     * Get streak for a variant
     */
    getVariantStreak(variantId) {
        return this.streaks[variantId] || { current: 0, best: 0, lastPlayed: null };
    }

    /**
     * Get completion status for today's challenges
     */
    getTodayProgress() {
        const today = this.getTodayDateString();
        if (!this.challenges[today]) return { total: 0, completed: 0, percentage: 0 };

        let total = 0;
        let completed = 0;

        Object.values(this.challenges[today]).forEach(variantChallenges => {
            variantChallenges.forEach(challenge => {
                total++;
                if (challenge.completed) completed++;
            });
        });

        return {
            total,
            completed,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
    }

    /**
     * Get variant of the day
     */
    getVariantOfTheDay() {
        return this.variantOfTheDay;
    }

    /**
     * Check if variant is the variant of the day
     */
    isVariantOfTheDay(variantId) {
        return this.variantOfTheDay?.variantId === variantId;
    }

    /**
     * Calculate total rewards earned today
     */
    getTodayRewards() {
        const today = this.getTodayDateString();
        if (!this.challenges[today]) return { xp: 0, challenges: 0 };

        let totalXP = 0;
        let challengesCompleted = 0;

        Object.values(this.challenges[today]).forEach(variantChallenges => {
            variantChallenges.forEach(challenge => {
                if (challenge.completed) {
                    totalXP += challenge.reward.value;
                    challengesCompleted++;

                    // Apply variant of the day bonus
                    if (challenge.id.includes(this.variantOfTheDay.variantId)) {
                        totalXP += Math.floor(challenge.reward.value * 0.5);
                    }
                }
            });
        });

        return { xp: totalXP, challenges: challengesCompleted };
    }

    /**
     * Get challenge history summary
     */
    getChallengeHistory() {
        const history = [];
        const dates = Object.keys(this.challenges).sort().reverse().slice(0, 7); // Last 7 days

        dates.forEach(date => {
            const dayChallenges = this.challenges[date];
            let total = 0;
            let completed = 0;

            Object.values(dayChallenges).forEach(variantChallenges => {
                variantChallenges.forEach(challenge => {
                    total++;
                    if (challenge.completed) completed++;
                });
            });

            history.push({
                date,
                total,
                completed,
                percentage: total > 0 ? Math.round((completed / total) * 100) : 0
            });
        });

        return history;
    }

    /**
     * Get active streaks count
     */
    getActiveStreaksCount() {
        return Object.values(this.streaks).filter(streak => streak.current > 0).length;
    }

    /**
     * Get longest active streak
     */
    getLongestActiveStreak() {
        const activeStreaks = Object.entries(this.streaks)
            .filter(([_, streak]) => streak.current > 0)
            .map(([variantId, streak]) => ({ variantId, ...streak }))
            .sort((a, b) => b.current - a.current);

        return activeStreaks[0] || null;
    }

    /**
     * Helper: Hash string to number
     */
    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    /**
     * Helper: Seeded random number generator
     */
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    /**
     * Helper: Format time in seconds to MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Helper: Get variant name
     */
    getVariantName(variantId) {
        const names = {
            'classic': 'Classic',
            'x-sudoku': 'X-Sudoku',
            'mini': 'Mini 6×6',
            'anti-knight': 'Anti-Knight',
            'killer-sudoku': 'Killer',
            'hyper-sudoku': 'Hyper',
            'consecutive-sudoku': 'Consecutive',
            'thermo-sudoku': 'Thermo',
            'jigsaw-sudoku': 'Jigsaw'
        };
        return names[variantId] || variantId;
    }

    /**
     * Helper: Get variant icon
     */
    getVariantIcon(variantId) {
        const icons = {
            'classic': '🎯',
            'x-sudoku': '✖️',
            'mini': '📐',
            'anti-knight': '♞',
            'killer-sudoku': '🔪',
            'hyper-sudoku': '🎯',
            'consecutive-sudoku': '🔢',
            'thermo-sudoku': '🌡️',
            'jigsaw-sudoku': '🧩'
        };
        return icons[variantId] || '🎮';
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                challenges: this.challenges,
                streaks: this.streaks,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save daily challenges data:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No saved daily challenges data found');
                return;
            }

            const data = JSON.parse(saved);

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`Daily challenges storage version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version || 'none'}. Resetting data.`);
                this.resetDataSilent();
                return;
            }

            // Safe to load - versions match
            this.challenges = data.challenges || {};
            this.streaks = data.streaks || {};

            // Clean up old challenges (keep last 7 days)
            this.cleanupOldChallenges();

            console.log('✅ Daily challenges data loaded successfully');
        } catch (error) {
            console.error('Failed to load daily challenges data:', error);
            this.resetDataSilent();
        }
    }

    /**
     * Clean up challenges older than 7 days
     */
    cleanupOldChallenges() {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        Object.keys(this.challenges).forEach(date => {
            if (date < cutoffDate) {
                delete this.challenges[date];
            }
        });
    }

    /**
     * Reset all data silently (for version mismatches or errors)
     */
    resetDataSilent() {
        this.challenges = {};
        this.streaks = {};
        console.log('Daily challenges and streaks have been reset (silent)');
    }

    /**
     * Reset all data (for testing - with user confirmation)
     */
    resetData() {
        const confirmed = confirm('Are you sure you want to reset all daily challenges and streaks? This cannot be undone.');
        if (confirmed) {
            this.resetDataSilent();
            this.generateDailyChallenges();
            this.saveData();
            console.log('✅ Daily challenges and streaks have been reset');
            return true;
        }
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantDailyChallengesManager;
}
