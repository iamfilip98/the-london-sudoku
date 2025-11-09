/**
 * PHASE 2 MONTH 22: Variant Leaderboards & Rankings Manager
 *
 * Manages leaderboards and rankings for all Sudoku variants.
 * Tracks top performers across multiple categories and time periods.
 */

class VariantLeaderboardsManager {
    constructor(statsManager, challengesManager) {
        this.statsManager = statsManager;
        this.challengesManager = challengesManager;

        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'variantLeaderboards';

        // Current user (from localStorage or session)
        this.currentUser = this.getCurrentUser();

        // Leaderboard categories
        this.categories = {
            'speed': {
                name: 'Speed Legends',
                icon: '⚡',
                description: 'Fastest completion times',
                metric: 'bestTime'
            },
            'streak': {
                name: 'Streak Masters',
                icon: '🔥',
                description: 'Longest daily streaks',
                metric: 'bestStreak'
            },
            'perfect': {
                name: 'Perfectionists',
                icon: '✨',
                description: 'Most perfect games (0 errors)',
                metric: 'perfectGames'
            },
            'completions': {
                name: 'Dedicated Players',
                icon: '🎯',
                description: 'Most total completions',
                metric: 'completions'
            },
            'xp': {
                name: 'XP Champions',
                icon: '⭐',
                description: 'Highest total XP earned',
                metric: 'totalXP'
            }
        };

        // Supported variants
        this.variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku',
                        'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];

        // Load or generate leaderboard data
        this.loadData();
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        // Try to get from Clerk or localStorage
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                return JSON.parse(user);
            } catch {
                return { username: 'Guest', id: 'guest-' + Date.now() };
            }
        }

        // Default guest user
        return {
            username: 'You',
            id: 'guest-' + Date.now(),
            isGuest: true
        };
    }

    /**
     * Get leaderboard for a specific variant and category
     */
    getLeaderboard(variantId, category, limit = 100) {
        if (!this.statsManager) {
            return this.generateMockLeaderboard(variantId, category, limit);
        }

        const leaderboard = [];
        const stats = this.statsManager.getVariantStats(variantId);
        const categoryConfig = this.categories[category];

        // Add current user to leaderboard
        const userEntry = this.createLeaderboardEntry(
            this.currentUser,
            stats,
            category
        );

        // Generate mock data for other users (in a real app, this would come from backend)
        const mockEntries = this.generateMockLeaderboard(variantId, category, limit - 1);

        // Combine and sort
        leaderboard.push(userEntry, ...mockEntries);
        leaderboard.sort((a, b) => {
            if (category === 'speed') {
                // Lower time is better
                return a.value - b.value;
            } else {
                // Higher is better for other categories
                return b.value - a.value;
            }
        });

        // Add rankings
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return leaderboard.slice(0, limit);
    }

    /**
     * Create leaderboard entry for a user
     */
    createLeaderboardEntry(user, stats, category) {
        let value = 0;

        switch(category) {
            case 'speed':
                value = stats.bestTime?.any || Infinity;
                break;
            case 'streak':
                // Get from challenges manager if available
                if (this.challengesManager) {
                    const streak = this.challengesManager.getVariantStreak(stats.variantId || 'classic');
                    value = streak.best || 0;
                } else {
                    value = 0;
                }
                break;
            case 'perfect':
                value = stats.perfectGames || 0;
                break;
            case 'completions':
                value = stats.completions || 0;
                break;
            case 'xp':
                // Calculate estimated XP (50 per completion + bonuses)
                value = (stats.completions || 0) * 50;
                break;
        }

        return {
            username: user.username,
            userId: user.id,
            value: value,
            isCurrentUser: true,
            rank: 0,
            badges: this.getUserBadges(stats)
        };
    }

    /**
     * Get user badges for display
     */
    getUserBadges(stats) {
        const badges = [];

        // Mastery badge
        if (stats.completions >= 500) {
            badges.push({ icon: '👑', name: 'Master' });
        } else if (stats.completions >= 250) {
            badges.push({ icon: '💎', name: 'Diamond' });
        } else if (stats.completions >= 100) {
            badges.push({ icon: '💠', name: 'Platinum' });
        }

        // Perfect games badge
        if (stats.perfectGames >= 100) {
            badges.push({ icon: '✨', name: 'Perfectionist' });
        }

        return badges;
    }

    /**
     * Generate mock leaderboard data (simulates other players)
     */
    generateMockLeaderboard(variantId, category, count) {
        const entries = [];
        const names = [
            'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey',
            'Riley', 'Avery', 'Quinn', 'Sage', 'River',
            'Phoenix', 'Dakota', 'Skyler', 'Charlie', 'Dylan',
            'Rowan', 'Kai', 'Blair', 'Harper', 'Finley',
            'Parker', 'Drew', 'Cameron', 'Emerson', 'Reese',
            'Micah', 'Logan', 'Peyton', 'Spencer', 'Ellis'
        ];

        const seed = this.hashCode(variantId + category);
        const rng = this.seededRandom(seed);

        for (let i = 0; i < count; i++) {
            const nameIndex = Math.floor(rng() * names.length);
            const username = names[nameIndex] + Math.floor(rng() * 1000);

            let value;
            switch(category) {
                case 'speed':
                    // Best times between 60-600 seconds
                    value = Math.floor(60 + rng() * 540);
                    break;
                case 'streak':
                    // Streaks between 1-100 days
                    value = Math.floor(1 + rng() * 99);
                    break;
                case 'perfect':
                    // Perfect games between 0-200
                    value = Math.floor(rng() * 200);
                    break;
                case 'completions':
                    // Completions between 1-1000
                    value = Math.floor(1 + rng() * 999);
                    break;
                case 'xp':
                    // XP between 100-50000
                    value = Math.floor(100 + rng() * 49900);
                    break;
            }

            entries.push({
                username: username,
                userId: 'user-' + i,
                value: value,
                isCurrentUser: false,
                rank: 0,
                badges: []
            });
        }

        return entries;
    }

    /**
     * Get top 3 for podium display
     */
    getPodium(variantId, category) {
        const leaderboard = this.getLeaderboard(variantId, category, 3);
        return leaderboard.slice(0, 3);
    }

    /**
     * Get user's ranking for a specific variant and category
     */
    getUserRanking(variantId, category) {
        const leaderboard = this.getLeaderboard(variantId, category, 1000);
        const userEntry = leaderboard.find(entry => entry.isCurrentUser);
        return userEntry || null;
    }

    /**
     * Get all rankings for current user across all variants
     */
    getAllUserRankings() {
        const rankings = {};

        this.variants.forEach(variantId => {
            rankings[variantId] = {};
            Object.keys(this.categories).forEach(category => {
                rankings[variantId][category] = this.getUserRanking(variantId, category);
            });
        });

        return rankings;
    }

    /**
     * Get global rankings (across all variants)
     */
    getGlobalLeaderboard(category, limit = 100) {
        // Aggregate data across all variants
        const allEntries = [];

        this.variants.forEach(variantId => {
            const variantLeaderboard = this.getLeaderboard(variantId, category, 10);
            allEntries.push(...variantLeaderboard);
        });

        // Remove duplicates and aggregate
        const userMap = new Map();
        allEntries.forEach(entry => {
            if (!userMap.has(entry.userId)) {
                userMap.set(entry.userId, {
                    ...entry,
                    value: 0
                });
            }

            const existing = userMap.get(entry.userId);
            if (category === 'speed') {
                // For speed, take the best (lowest) time
                existing.value = Math.min(existing.value || Infinity, entry.value);
            } else {
                // For others, sum the values
                existing.value += entry.value;
            }
        });

        // Convert back to array and sort
        const global = Array.from(userMap.values());
        global.sort((a, b) => {
            if (category === 'speed') {
                return a.value - b.value;
            } else {
                return b.value - a.value;
            }
        });

        // Add rankings
        global.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        return global.slice(0, limit);
    }

    /**
     * Format value for display
     */
    formatValue(value, category) {
        switch(category) {
            case 'speed':
                if (value === Infinity) return '—';
                const mins = Math.floor(value / 60);
                const secs = Math.floor(value % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            case 'streak':
                return `${value} days`;
            case 'perfect':
                return `${value} games`;
            case 'completions':
                return `${value} games`;
            case 'xp':
                return `${value.toLocaleString()} XP`;
            default:
                return value.toString();
        }
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
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                currentUser: this.currentUser,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save leaderboards data:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No saved leaderboards data found');
                return;
            }

            const data = JSON.parse(saved);

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`Leaderboards storage version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version || 'none'}. Resetting data.`);
                return;
            }

            // Load user info if available
            if (data.currentUser) {
                this.currentUser = data.currentUser;
            }

            console.log('✅ Leaderboards data loaded successfully');
        } catch (error) {
            console.error('Failed to load leaderboards data:', error);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantLeaderboardsManager;
}
