/**
 * PHASE 2 MONTH 23: Variant Tournaments UI Manager
 *
 * Manages the visual display of tournaments and events.
 * Renders tournament cards, leaderboards, and user stats.
 */

class VariantTournamentsUI {
    constructor(tournamentsManager) {
        this.tournamentsManager = tournamentsManager;
        this.currentView = 'active'; // 'active', 'upcoming', 'ended'
        this.selectedTournament = null;

        // Variant info for display
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
    }

    /**
     * Initialize the tournaments UI
     */
    initialize() {
        this.setupEventListeners();
        this.render();

        // Auto-refresh every minute to update time remaining
        setInterval(() => this.updateTimeRemaining(), 60000);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View tabs
        const viewButtons = document.querySelectorAll('.tournament-view-tab');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentView = button.getAttribute('data-view');
                this.updateActiveTabs(viewButtons, button);
                this.render();
            });
        });
    }

    /**
     * Update active state for tabs
     */
    updateActiveTabs(buttons, activeButton) {
        buttons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    /**
     * Render the complete tournaments view
     */
    render() {
        this.renderTournamentsList();
        this.renderTournamentDetail();
    }

    /**
     * Render tournaments list based on current view
     */
    renderTournamentsList() {
        const container = document.getElementById('tournamentsList');
        if (!container) return;

        let tournaments = [];
        switch (this.currentView) {
            case 'active':
                tournaments = this.tournamentsManager.getActiveTournaments();
                break;
            case 'upcoming':
                tournaments = this.tournamentsManager.getUpcomingTournaments();
                break;
            case 'ended':
                tournaments = this.tournamentsManager.getEndedTournaments();
                break;
        }

        if (tournaments.length === 0) {
            container.innerHTML = '<p class="no-data">No tournaments in this category</p>';
            return;
        }

        container.innerHTML = `
            <div class="tournaments-grid">
                ${tournaments.map(tournament => this.renderTournamentCard(tournament)).join('')}
            </div>
        `;

        // Add click handlers for tournament cards
        container.querySelectorAll('.tournament-card').forEach(card => {
            card.addEventListener('click', () => {
                const tournamentId = card.getAttribute('data-tournament-id');
                this.showTournamentDetail(tournamentId);
            });
        });
    }

    /**
     * Render a single tournament card
     */
    renderTournamentCard(tournament) {
        const status = this.tournamentsManager.getTournamentStatus(tournament.id);
        const timeRemaining = this.tournamentsManager.getTimeRemaining(tournament.id);
        const isParticipating = this.tournamentsManager.isParticipating(tournament.id);
        const variantInfo = this.variantInfo[tournament.variant];
        const userRank = this.tournamentsManager.getUserTournamentRank(tournament.id);

        let statusBadge = '';
        if (status === 'active') {
            statusBadge = `<div class="tournament-status active">🔴 Live</div>`;
        } else if (status === 'upcoming') {
            statusBadge = `<div class="tournament-status upcoming">📅 Upcoming</div>`;
        } else {
            statusBadge = `<div class="tournament-status ended">✅ Ended</div>`;
        }

        return `
            <div class="tournament-card ${status}" data-tournament-id="${tournament.id}">
                ${statusBadge}

                <div class="tournament-header">
                    <div class="tournament-icon">${tournament.icon}</div>
                    <div class="tournament-title">
                        <h3>${this.escapeHtml(tournament.name)}</h3>
                        <p class="tournament-variant">
                            ${variantInfo.icon} ${variantInfo.name}
                        </p>
                    </div>
                </div>

                <p class="tournament-description">${tournament.description}</p>

                <div class="tournament-meta">
                    <div class="meta-item">
                        <span class="meta-label">Participants</span>
                        <span class="meta-value">${tournament.participants.length}</span>
                    </div>
                    ${timeRemaining ? `
                        <div class="meta-item">
                            <span class="meta-label">${status === 'upcoming' ? 'Starts in' : 'Ends in'}</span>
                            <span class="meta-value time-remaining" data-tournament-id="${tournament.id}">${timeRemaining}</span>
                        </div>
                    ` : ''}
                </div>

                ${isParticipating && userRank ? `
                    <div class="user-tournament-rank">
                        <span class="rank-label">Your Rank:</span>
                        <span class="rank-value">#${userRank.rank}</span>
                        <span class="rank-score">${this.tournamentsManager.formatScore(userRank.score, tournament.scoring)}</span>
                    </div>
                ` : ''}

                <div class="tournament-prizes">
                    <span class="prize-label">1st Prize:</span>
                    <span class="prize-value">${tournament.prizes.first.badge} ${tournament.prizes.first.xp} XP</span>
                </div>
            </div>
        `;
    }

    /**
     * Show tournament detail modal
     */
    showTournamentDetail(tournamentId) {
        this.selectedTournament = tournamentId;
        this.renderTournamentDetail();
    }

    /**
     * Render tournament detail view
     */
    renderTournamentDetail() {
        const container = document.getElementById('tournamentDetail');
        if (!container) return;

        if (!this.selectedTournament) {
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        const tournament = this.tournamentsManager.getTournament(this.selectedTournament);
        if (!tournament) {
            this.selectedTournament = null;
            container.innerHTML = '';
            container.classList.add('hidden');
            return;
        }

        container.classList.remove('hidden');

        const status = this.tournamentsManager.getTournamentStatus(tournament.id);
        const isParticipating = this.tournamentsManager.isParticipating(tournament.id);
        const leaderboard = this.tournamentsManager.getTournamentLeaderboard(tournament.id, 10);
        const userRank = this.tournamentsManager.getUserTournamentRank(tournament.id);
        const variantInfo = this.variantInfo[tournament.variant];

        container.innerHTML = `
            <div class="tournament-detail-modal">
                <div class="tournament-detail-header">
                    <button class="close-detail-btn" onclick="window.variantTournamentsUI.closeTournamentDetail()">✕</button>
                    <div class="detail-title">
                        <div class="detail-icon">${tournament.icon}</div>
                        <div>
                            <h2>${this.escapeHtml(tournament.name)}</h2>
                            <p class="detail-variant">
                                ${variantInfo.icon} ${variantInfo.name} • ${tournament.description}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="tournament-detail-body">
                    <!-- Info Section -->
                    <div class="detail-section">
                        <h3>Tournament Info</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <span class="info-label">Status</span>
                                <span class="info-value ${status}">${status.toUpperCase()}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Participants</span>
                                <span class="info-value">${tournament.participants.length}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Start Date</span>
                                <span class="info-value">${this.formatDate(tournament.startDate)}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">End Date</span>
                                <span class="info-value">${this.formatDate(tournament.endDate)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Prizes Section -->
                    <div class="detail-section">
                        <h3>🏆 Prizes</h3>
                        <div class="prizes-grid">
                            <div class="prize-card first">
                                <div class="prize-position">🥇 1st Place</div>
                                <div class="prize-reward">${tournament.prizes.first.xp} XP</div>
                                <div class="prize-title">${tournament.prizes.first.title}</div>
                            </div>
                            <div class="prize-card second">
                                <div class="prize-position">🥈 2nd Place</div>
                                <div class="prize-reward">${tournament.prizes.second.xp} XP</div>
                                <div class="prize-title">${tournament.prizes.second.title}</div>
                            </div>
                            <div class="prize-card third">
                                <div class="prize-position">🥉 3rd Place</div>
                                <div class="prize-reward">${tournament.prizes.third.xp} XP</div>
                                <div class="prize-title">${tournament.prizes.third.title}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Action Button -->
                    ${status === 'active' && !isParticipating ? `
                        <button class="join-tournament-btn" onclick="window.variantTournamentsUI.joinTournament('${tournament.id}')">
                            🎮 Join Tournament
                        </button>
                    ` : ''}

                    ${status === 'active' && isParticipating ? `
                        <button class="play-tournament-btn" onclick="window.variantTournamentsUI.playTournament('${tournament.variant}')">
                            🎯 Play ${variantInfo.name}
                        </button>
                    ` : ''}

                    <!-- User Stats -->
                    ${userRank ? `
                        <div class="detail-section user-stats">
                            <h3>Your Performance</h3>
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-label">Rank</div>
                                    <div class="stat-value">#${userRank.rank}</div>
                                </div>
                                <div class="stat-card">
                                    <div class="stat-label">Score</div>
                                    <div class="stat-value">${this.tournamentsManager.formatScore(userRank.score, tournament.scoring)}</div>
                                </div>
                            </div>
                        </div>
                    ` : ''}

                    <!-- Leaderboard -->
                    <div class="detail-section">
                        <h3>📊 Leaderboard</h3>
                        ${leaderboard.length > 0 ? `
                            <div class="tournament-leaderboard">
                                ${leaderboard.map(entry => this.renderLeaderboardRow(entry, tournament)).join('')}
                            </div>
                        ` : '<p class="no-data">No entries yet</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render leaderboard row
     */
    renderLeaderboardRow(entry, tournament) {
        const isCurrentUser = entry.userId === this.tournamentsManager.getCurrentUser().id;
        const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
        const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };
        const medal = medals[entry.rank] || '';

        return `
            <div class="leaderboard-row ${rankClass} ${isCurrentUser ? 'current-user' : ''}">
                <div class="row-rank">${medal} ${entry.rank}</div>
                <div class="row-username">${this.escapeHtml(entry.username)}</div>
                <div class="row-score">${this.tournamentsManager.formatScore(entry.score, tournament.scoring)}</div>
            </div>
        `;
    }

    /**
     * Close tournament detail view
     */
    closeTournamentDetail() {
        this.selectedTournament = null;
        this.renderTournamentDetail();
    }

    /**
     * Join tournament
     */
    joinTournament(tournamentId) {
        const result = this.tournamentsManager.joinTournament(tournamentId);

        if (result.success) {
            this.showNotification('Successfully joined tournament! 🎉', 'success');
            this.render();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Play tournament variant
     */
    playTournament(variantId) {
        // Close detail modal
        this.closeTournamentDetail();

        // Navigate to play page
        if (typeof navigateToPage === 'function') {
            navigateToPage('play');
        }

        // Load variant
        if (window.sudoku && typeof window.sudoku.loadVariant === 'function') {
            window.sudoku.loadVariant(variantId);
        }

        this.showNotification(`Playing ${this.variantInfo[variantId].name}! Good luck! 🎮`, 'success');
    }

    /**
     * Update time remaining for all tournaments
     */
    updateTimeRemaining() {
        const timeElements = document.querySelectorAll('.time-remaining');
        timeElements.forEach(el => {
            const tournamentId = el.getAttribute('data-tournament-id');
            const timeRemaining = this.tournamentsManager.getTimeRemaining(tournamentId);
            if (timeRemaining) {
                el.textContent = timeRemaining;
            }
        });
    }

    /**
     * Format date for display
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('en-US', options);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `tournament-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 10);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh the tournaments display
     */
    refresh() {
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantTournamentsUI;
}
