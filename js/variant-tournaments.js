/**
 * PHASE 2 MONTH 23: Variant Tournaments & Events Manager
 *
 * Manages time-limited competitive tournaments and special events.
 * Provides tournament lifecycle, scoring, rankings, and rewards.
 */

class VariantTournamentsManager {
    constructor(statsManager) {
        this.statsManager = statsManager;

        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'variantTournaments';

        // Tournament types
        this.tournamentTypes = {
            'speed': {
                name: 'Speed Challenge',
                icon: '⚡',
                description: 'Fastest completion wins',
                scoring: 'time', // Lower is better
                duration: 7 // days
            },
            'accuracy': {
                name: 'Perfect Precision',
                icon: '🎯',
                description: 'Fewest errors wins',
                scoring: 'errors', // Lower is better
                duration: 7
            },
            'marathon': {
                name: 'Endurance Marathon',
                icon: '🏃',
                description: 'Most completions wins',
                scoring: 'completions', // Higher is better
                duration: 14
            },
            'perfect': {
                name: 'Flawless Victory',
                icon: '✨',
                description: 'Most perfect games wins',
                scoring: 'perfect', // Higher is better
                duration: 7
            }
        };

        // Load saved data
        this.loadData();

        // Generate tournaments if needed
        this.generateUpcomingTournaments();
    }

    /**
     * Get current user info
     */
    getCurrentUser() {
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                return JSON.parse(user);
            } catch {
                return { username: 'Guest', id: 'guest-' + Date.now() };
            }
        }
        return {
            username: 'You',
            id: 'guest-' + Date.now(),
            isGuest: true
        };
    }

    /**
     * Generate upcoming tournaments
     */
    generateUpcomingTournaments() {
        const now = Date.now();
        const tournaments = this.tournaments || [];

        // Remove expired tournaments (older than 30 days)
        this.tournaments = tournaments.filter(t => {
            const endTime = new Date(t.endDate).getTime();
            const daysSinceEnd = (now - endTime) / (1000 * 60 * 60 * 24);
            return daysSinceEnd < 30;
        });

        // Check if we need to generate new tournaments
        const activeTournaments = this.getActiveTournaments();
        const upcomingTournaments = this.getUpcomingTournaments();

        // Keep 3-5 active/upcoming tournaments at all times
        if (activeTournaments.length + upcomingTournaments.length < 3) {
            this.generateNewTournaments(5 - (activeTournaments.length + upcomingTournaments.length));
        }

        this.saveData();
    }

    /**
     * Generate new tournaments
     */
    generateNewTournaments(count) {
        if (!this.tournaments) this.tournaments = [];

        const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku',
                         'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];
        const types = Object.keys(this.tournamentTypes);

        // Find the latest end date to start new tournaments after
        let startFrom = Date.now();
        if (this.tournaments.length > 0) {
            const latestEnd = Math.max(...this.tournaments.map(t => new Date(t.endDate).getTime()));
            startFrom = Math.max(latestEnd + (1000 * 60 * 60 * 24), Date.now()); // 1 day after latest or now
        }

        for (let i = 0; i < count; i++) {
            // Rotate through variants and types
            const variantIndex = (this.tournaments.length + i) % variants.length;
            const typeIndex = (this.tournaments.length + i) % types.length;

            const variant = variants[variantIndex];
            const type = types[typeIndex];
            const config = this.tournamentTypes[type];

            // Calculate start and end dates
            const startDate = new Date(startFrom + (i * 2 * 24 * 60 * 60 * 1000)); // 2 days apart
            const endDate = new Date(startDate.getTime() + (config.duration * 24 * 60 * 60 * 1000));

            const tournament = {
                id: `tournament-${Date.now()}-${i}`,
                name: `${this.getVariantName(variant)} ${config.name}`,
                variant: variant,
                type: type,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                description: config.description,
                icon: config.icon,
                scoring: config.scoring,
                prizes: this.generatePrizes(type),
                participants: [],
                entries: {}, // userId -> best score
                leaderboard: []
            };

            this.tournaments.push(tournament);
        }
    }

    /**
     * Generate prize structure for tournament
     */
    generatePrizes(type) {
        const baseXP = {
            'speed': 500,
            'accuracy': 400,
            'marathon': 600,
            'perfect': 450
        };

        return {
            first: {
                xp: baseXP[type] || 500,
                badge: '🥇',
                title: 'Champion'
            },
            second: {
                xp: Math.floor((baseXP[type] || 500) * 0.6),
                badge: '🥈',
                title: 'Runner-up'
            },
            third: {
                xp: Math.floor((baseXP[type] || 500) * 0.4),
                badge: '🥉',
                title: 'Bronze Medalist'
            },
            participation: {
                xp: 50,
                badge: '🎖️',
                title: 'Participant'
            }
        };
    }

    /**
     * Get active tournaments (currently running)
     */
    getActiveTournaments() {
        const now = Date.now();
        return (this.tournaments || []).filter(t => {
            const start = new Date(t.startDate).getTime();
            const end = new Date(t.endDate).getTime();
            return now >= start && now <= end;
        });
    }

    /**
     * Get upcoming tournaments (not started yet)
     */
    getUpcomingTournaments() {
        const now = Date.now();
        return (this.tournaments || []).filter(t => {
            const start = new Date(t.startDate).getTime();
            return now < start;
        }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    }

    /**
     * Get ended tournaments (completed)
     */
    getEndedTournaments() {
        const now = Date.now();
        return (this.tournaments || []).filter(t => {
            const end = new Date(t.endDate).getTime();
            return now > end;
        }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    }

    /**
     * Get tournament by ID
     */
    getTournament(tournamentId) {
        return (this.tournaments || []).find(t => t.id === tournamentId);
    }

    /**
     * Check if user is participating in tournament
     */
    isParticipating(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return false;

        const user = this.getCurrentUser();
        return tournament.participants.includes(user.id);
    }

    /**
     * Join a tournament
     */
    joinTournament(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return { success: false, error: 'Tournament not found' };

        const now = Date.now();
        const start = new Date(tournament.startDate).getTime();
        const end = new Date(tournament.endDate).getTime();

        // Can only join active tournaments
        if (now < start) {
            return { success: false, error: 'Tournament has not started yet' };
        }

        if (now > end) {
            return { success: false, error: 'Tournament has ended' };
        }

        const user = this.getCurrentUser();

        // Check if already participating
        if (tournament.participants.includes(user.id)) {
            return { success: false, error: 'Already participating' };
        }

        // Add to participants
        tournament.participants.push(user.id);
        this.saveData();

        return { success: true };
    }

    /**
     * Submit a score to tournament
     */
    submitScore(tournamentId, variantId, difficulty, timeInSeconds, errorCount) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return { success: false, error: 'Tournament not found' };

        // Check if tournament is active
        const now = Date.now();
        const start = new Date(tournament.startDate).getTime();
        const end = new Date(tournament.endDate).getTime();

        if (now < start || now > end) {
            return { success: false, error: 'Tournament is not active' };
        }

        // Check if correct variant
        if (tournament.variant !== variantId) {
            return { success: false, error: 'Wrong variant' };
        }

        const user = this.getCurrentUser();

        // Auto-join if not participating
        if (!tournament.participants.includes(user.id)) {
            tournament.participants.push(user.id);
        }

        // Calculate score based on tournament type
        let score = 0;
        const isPerfect = errorCount === 0;

        switch (tournament.scoring) {
            case 'time':
                score = timeInSeconds; // Lower is better
                break;
            case 'errors':
                score = errorCount; // Lower is better
                break;
            case 'completions':
                // Increment completion count
                if (!tournament.entries[user.id]) {
                    tournament.entries[user.id] = { score: 0, username: user.username };
                }
                tournament.entries[user.id].score++;
                break;
            case 'perfect':
                // Increment perfect game count if perfect
                if (isPerfect) {
                    if (!tournament.entries[user.id]) {
                        tournament.entries[user.id] = { score: 0, username: user.username };
                    }
                    tournament.entries[user.id].score++;
                }
                break;
        }

        // For time/errors, keep best score (lowest)
        if (tournament.scoring === 'time' || tournament.scoring === 'errors') {
            if (!tournament.entries[user.id] || score < tournament.entries[user.id].score) {
                tournament.entries[user.id] = {
                    score: score,
                    username: user.username,
                    timestamp: Date.now()
                };
            }
        }

        // Update leaderboard
        this.updateTournamentLeaderboard(tournamentId);
        this.saveData();

        return { success: true, score: tournament.entries[user.id].score };
    }

    /**
     * Update tournament leaderboard
     */
    updateTournamentLeaderboard(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return;

        // Convert entries to leaderboard array
        const leaderboard = Object.entries(tournament.entries).map(([userId, data]) => ({
            userId: userId,
            username: data.username,
            score: data.score,
            timestamp: data.timestamp || 0
        }));

        // Sort based on scoring type
        if (tournament.scoring === 'time' || tournament.scoring === 'errors') {
            // Lower is better
            leaderboard.sort((a, b) => {
                if (a.score !== b.score) return a.score - b.score;
                return a.timestamp - b.timestamp; // Tie-breaker: earlier submission
            });
        } else {
            // Higher is better (completions, perfect)
            leaderboard.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                return a.timestamp - b.timestamp;
            });
        }

        // Add ranks
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });

        tournament.leaderboard = leaderboard;
    }

    /**
     * Get tournament leaderboard
     */
    getTournamentLeaderboard(tournamentId, limit = 100) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return [];

        // Ensure leaderboard is up to date
        this.updateTournamentLeaderboard(tournamentId);

        return tournament.leaderboard.slice(0, limit);
    }

    /**
     * Get user's position in tournament
     */
    getUserTournamentRank(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return null;

        const user = this.getCurrentUser();
        const entry = tournament.leaderboard.find(e => e.userId === user.id);

        return entry || null;
    }

    /**
     * Get all tournaments user has participated in
     */
    getUserTournamentHistory() {
        const user = this.getCurrentUser();
        return (this.tournaments || []).filter(t => {
            return t.participants.includes(user.id);
        }).sort((a, b) => new Date(b.endDate) - new Date(a.endDate));
    }

    /**
     * Award prizes for ended tournaments
     */
    awardPrizes(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return;

        // Only award once
        if (tournament.prizesAwarded) return;

        const leaderboard = tournament.leaderboard;
        const user = this.getCurrentUser();

        // Find user's position
        const userEntry = leaderboard.find(e => e.userId === user.id);
        if (!userEntry) return; // User didn't participate

        let prize = null;

        if (userEntry.rank === 1) {
            prize = tournament.prizes.first;
        } else if (userEntry.rank === 2) {
            prize = tournament.prizes.second;
        } else if (userEntry.rank === 3) {
            prize = tournament.prizes.third;
        } else {
            prize = tournament.prizes.participation;
        }

        // Mark as awarded
        tournament.prizesAwarded = true;
        this.saveData();

        return {
            rank: userEntry.rank,
            prize: prize,
            tournamentName: tournament.name
        };
    }

    /**
     * Format score for display
     */
    formatScore(score, scoringType) {
        switch (scoringType) {
            case 'time':
                const mins = Math.floor(score / 60);
                const secs = Math.floor(score % 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            case 'errors':
                return `${score} errors`;
            case 'completions':
                return `${score} games`;
            case 'perfect':
                return `${score} perfect`;
            default:
                return score.toString();
        }
    }

    /**
     * Get tournament status
     */
    getTournamentStatus(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return 'unknown';

        const now = Date.now();
        const start = new Date(tournament.startDate).getTime();
        const end = new Date(tournament.endDate).getTime();

        if (now < start) return 'upcoming';
        if (now >= start && now <= end) return 'active';
        return 'ended';
    }

    /**
     * Get time remaining for tournament
     */
    getTimeRemaining(tournamentId) {
        const tournament = this.getTournament(tournamentId);
        if (!tournament) return null;

        const now = Date.now();
        const status = this.getTournamentStatus(tournamentId);

        if (status === 'upcoming') {
            const start = new Date(tournament.startDate).getTime();
            return this.formatTimeRemaining(start - now);
        } else if (status === 'active') {
            const end = new Date(tournament.endDate).getTime();
            return this.formatTimeRemaining(end - now);
        }

        return null;
    }

    /**
     * Format time remaining
     */
    formatTimeRemaining(ms) {
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
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
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                tournaments: this.tournaments || [],
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save tournaments data:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No saved tournaments data found');
                this.tournaments = [];
                return;
            }

            const data = JSON.parse(saved);

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`Tournaments storage version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version || 'none'}. Resetting data.`);
                this.tournaments = [];
                return;
            }

            // Safe to load - versions match
            this.tournaments = data.tournaments || [];

            console.log('✅ Tournaments data loaded successfully');
        } catch (error) {
            console.error('Failed to load tournaments data:', error);
            this.tournaments = [];
        }
    }

    /**
     * Reset all data (for testing)
     */
    resetData() {
        const confirmed = confirm('Are you sure you want to reset all tournament data? This cannot be undone.');
        if (confirmed) {
            this.tournaments = [];
            this.saveData();
            this.generateUpcomingTournaments();
            console.log('✅ Tournament data has been reset');
            return true;
        }
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantTournamentsManager;
}
