/**
 * PHASE 2 MONTH 25: Puzzle History Manager
 *
 * Manages storage and retrieval of completed/abandoned puzzles.
 * Enables users to review their gameplay history and track progress.
 */

class PuzzleHistoryManager {
    constructor() {
        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'puzzleHistory';
        this.MAX_HISTORY_SIZE = 1000; // Keep last 1000 games

        // Variant info
        this.variantInfo = {
            'classic': { name: 'Classic', icon: '🎯' },
            'x-sudoku': { name: 'X-Sudoku', icon: '✖️' },
            'mini': { name: 'Mini 6×6', icon: '📐' },
            'anti-knight': { name: 'Anti-Knight', icon: '♞' },
            'killer-sudoku': { name: 'Killer', icon: '🔪' },
            'hyper-sudoku': { name: 'Hyper', icon: '🎯' },
            'consecutive-sudoku': { name: 'Consecutive', icon: '🔢' },
            'thermo-sudoku': { name: 'Thermo', icon: '🌡️' },
            'jigsaw-sudoku': { name: 'Jigsaw', icon: '🧩' }
        };

        // Load history
        this.loadHistory();
    }

    /**
     * Save completed game to history
     */
    saveGame(gameData) {
        const historyEntry = {
            id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            date: new Date().toISOString(),
            variant: gameData.variant || 'classic',
            difficulty: gameData.difficulty || 'easy',
            status: gameData.status || 'completed', // 'completed', 'abandoned', 'failed'
            timeElapsed: gameData.timeElapsed || 0,
            errors: gameData.errors || 0,
            hints: gameData.hints || 0,
            score: gameData.score || 0,
            perfect: gameData.errors === 0,

            // Puzzle data
            initialGrid: gameData.initialGrid || null,
            solution: gameData.solution || null,
            playerGrid: gameData.playerGrid || null,

            // Move history for replay
            moves: gameData.moves || [],

            // Additional metadata
            preset: gameData.preset || 'standard',
            tournamentId: gameData.tournamentId || null,
            challengeId: gameData.challengeId || null
        };

        // Add to history
        this.history.push(historyEntry);

        // Maintain size limit (remove oldest entries)
        if (this.history.length > this.MAX_HISTORY_SIZE) {
            this.history = this.history.slice(-this.MAX_HISTORY_SIZE);
        }

        this.saveHistory();

        return historyEntry.id;
    }

    /**
     * Get all history entries
     */
    getAllHistory() {
        return [...this.history].sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Get history entry by ID
     */
    getGameById(id) {
        return this.history.find(entry => entry.id === id);
    }

    /**
     * Get filtered history
     */
    getFilteredHistory(filters = {}) {
        let filtered = [...this.history];

        // Filter by variant
        if (filters.variant && filters.variant !== 'all') {
            filtered = filtered.filter(entry => entry.variant === filters.variant);
        }

        // Filter by difficulty
        if (filters.difficulty && filters.difficulty !== 'all') {
            filtered = filtered.filter(entry => entry.difficulty === filters.difficulty);
        }

        // Filter by status
        if (filters.status && filters.status !== 'all') {
            filtered = filtered.filter(entry => entry.status === filters.status);
        }

        // Filter by date range
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom).getTime();
            filtered = filtered.filter(entry => entry.timestamp >= fromDate);
        }

        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo).getTime();
            filtered = filtered.filter(entry => entry.timestamp <= toDate);
        }

        // Filter by perfect games
        if (filters.perfectOnly) {
            filtered = filtered.filter(entry => entry.perfect);
        }

        // Search by variant name or difficulty
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(entry => {
                const variantName = this.variantInfo[entry.variant]?.name.toLowerCase() || '';
                const difficulty = entry.difficulty.toLowerCase();
                return variantName.includes(searchLower) || difficulty.includes(searchLower);
            });
        }

        // Sort
        if (filters.sortBy) {
            filtered = this.sortHistory(filtered, filters.sortBy, filters.sortOrder || 'desc');
        } else {
            // Default sort by timestamp (newest first)
            filtered.sort((a, b) => b.timestamp - a.timestamp);
        }

        return filtered;
    }

    /**
     * Sort history by field
     */
    sortHistory(history, sortBy, sortOrder = 'desc') {
        const sorted = [...history];

        sorted.sort((a, b) => {
            let compareA, compareB;

            switch (sortBy) {
                case 'date':
                    compareA = a.timestamp;
                    compareB = b.timestamp;
                    break;
                case 'time':
                    compareA = a.timeElapsed;
                    compareB = b.timeElapsed;
                    break;
                case 'score':
                    compareA = a.score;
                    compareB = b.score;
                    break;
                case 'errors':
                    compareA = a.errors;
                    compareB = b.errors;
                    break;
                case 'variant':
                    compareA = a.variant;
                    compareB = b.variant;
                    break;
                case 'difficulty':
                    const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
                    compareA = difficultyOrder[a.difficulty] || 0;
                    compareB = difficultyOrder[b.difficulty] || 0;
                    break;
                default:
                    compareA = a.timestamp;
                    compareB = b.timestamp;
            }

            if (sortOrder === 'asc') {
                return compareA > compareB ? 1 : -1;
            } else {
                return compareA < compareB ? 1 : -1;
            }
        });

        return sorted;
    }

    /**
     * Get statistics from history
     */
    getStatistics(variant = null) {
        let entries = this.history;

        if (variant && variant !== 'all') {
            entries = entries.filter(e => e.variant === variant);
        }

        if (entries.length === 0) {
            return {
                totalGames: 0,
                completedGames: 0,
                perfectGames: 0,
                totalTime: 0,
                averageTime: 0,
                totalErrors: 0,
                averageErrors: 0,
                bestTime: null,
                worstTime: null,
                totalScore: 0,
                averageScore: 0
            };
        }

        const completed = entries.filter(e => e.status === 'completed');
        const perfect = entries.filter(e => e.perfect);

        const times = completed.map(e => e.timeElapsed).filter(t => t > 0);
        const scores = completed.map(e => e.score);
        const errors = entries.map(e => e.errors);

        return {
            totalGames: entries.length,
            completedGames: completed.length,
            perfectGames: perfect.length,
            totalTime: times.reduce((sum, t) => sum + t, 0),
            averageTime: times.length > 0 ? times.reduce((sum, t) => sum + t, 0) / times.length : 0,
            totalErrors: errors.reduce((sum, e) => sum + e, 0),
            averageErrors: errors.length > 0 ? errors.reduce((sum, e) => sum + e, 0) / errors.length : 0,
            bestTime: times.length > 0 ? Math.min(...times) : null,
            worstTime: times.length > 0 ? Math.max(...times) : null,
            totalScore: scores.reduce((sum, s) => sum + s, 0),
            averageScore: scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0
        };
    }

    /**
     * Get recent games (last N games)
     */
    getRecentGames(count = 10, variant = null) {
        let entries = [...this.history];

        if (variant && variant !== 'all') {
            entries = entries.filter(e => e.variant === variant);
        }

        return entries
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
    }

    /**
     * Get games by date
     */
    getGamesByDate(date) {
        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        return this.history.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return entryDate >= targetDate && entryDate < nextDate;
        });
    }

    /**
     * Delete game from history
     */
    deleteGame(id) {
        const index = this.history.findIndex(entry => entry.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.saveHistory();
            return true;
        }
        return false;
    }

    /**
     * Clear all history
     */
    clearHistory() {
        const confirmed = confirm('Are you sure you want to delete all puzzle history? This cannot be undone.');
        if (confirmed) {
            this.history = [];
            this.saveHistory();
            console.log('✅ Puzzle history cleared');
            return true;
        }
        return false;
    }

    /**
     * Export history as JSON
     */
    exportHistory() {
        const exportData = {
            version: this.STORAGE_VERSION,
            exportedAt: Date.now(),
            history: this.history
        };

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import history from JSON
     */
    importHistory(jsonString, merge = false) {
        try {
            const data = JSON.parse(jsonString);

            // Validate structure
            if (!data.history || !Array.isArray(data.history)) {
                return { success: false, error: 'Invalid history format' };
            }

            if (merge) {
                // Merge with existing history (avoid duplicates by ID)
                const existingIds = new Set(this.history.map(e => e.id));
                const newEntries = data.history.filter(e => !existingIds.has(e.id));
                this.history = [...this.history, ...newEntries];
            } else {
                // Replace existing history
                this.history = data.history;
            }

            // Maintain size limit
            if (this.history.length > this.MAX_HISTORY_SIZE) {
                this.history = this.history.slice(-this.MAX_HISTORY_SIZE);
            }

            this.saveHistory();

            return {
                success: true,
                imported: merge ? data.history.filter(e => !existingIds.has(e.id)).length : data.history.length
            };
        } catch (error) {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    /**
     * Save history to localStorage
     */
    saveHistory() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                history: this.history,
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save puzzle history:', error);
        }
    }

    /**
     * Load history from localStorage
     */
    loadHistory() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No puzzle history found');
                this.history = [];
                return;
            }

            const data = JSON.parse(saved);

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`History storage version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version || 'none'}. Resetting history.`);
                this.history = [];
                return;
            }

            // Safe to load - versions match
            this.history = data.history || [];

            console.log(`✅ Puzzle history loaded: ${this.history.length} games`);
        } catch (error) {
            console.error('Failed to load puzzle history:', error);
            this.history = [];
        }
    }

    /**
     * Format time for display
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Format date for display
     */
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleHistoryManager;
}
