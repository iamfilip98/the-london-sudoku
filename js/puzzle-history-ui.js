/**
 * PHASE 2 MONTH 25: Puzzle History UI Manager
 *
 * Manages the visual interface for viewing and managing puzzle history.
 * Renders history list, filters, search, and detail views.
 */

class PuzzleHistoryUI {
    constructor(historyManager) {
        this.historyManager = historyManager;

        // Current filter state
        this.filters = {
            variant: 'all',
            difficulty: 'all',
            status: 'all',
            sortBy: 'date',
            sortOrder: 'desc',
            search: '',
            perfectOnly: false
        };

        // Pagination
        this.currentPage = 1;
        this.itemsPerPage = 20;
    }

    /**
     * Initialize the history UI
     */
    initialize() {
        this.setupEventListeners();
        this.render();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Filter buttons
        const variantFilters = document.querySelectorAll('.history-variant-filter');
        variantFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filters.variant = btn.getAttribute('data-variant');
                this.updateActiveFilter(variantFilters, btn);
                this.currentPage = 1;
                this.render();
            });
        });

        const difficultyFilters = document.querySelectorAll('.history-difficulty-filter');
        difficultyFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filters.difficulty = btn.getAttribute('data-difficulty');
                this.updateActiveFilter(difficultyFilters, btn);
                this.currentPage = 1;
                this.render();
            });
        });

        const statusFilters = document.querySelectorAll('.history-status-filter');
        statusFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filters.status = btn.getAttribute('data-status');
                this.updateActiveFilter(statusFilters, btn);
                this.currentPage = 1;
                this.render();
            });
        });

        // Search
        const searchInput = document.getElementById('historySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filters.search = e.target.value;
                this.currentPage = 1;
                this.render();
            });
        }

        // Sort
        const sortSelect = document.getElementById('historySort');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.filters.sortBy = e.target.value;
                this.render();
            });
        }

        // Perfect only checkbox
        const perfectCheckbox = document.getElementById('perfectOnly');
        if (perfectCheckbox) {
            perfectCheckbox.addEventListener('change', (e) => {
                this.filters.perfectOnly = e.target.checked;
                this.currentPage = 1;
                this.render();
            });
        }

        // Clear history button
        const clearBtn = document.getElementById('clearHistoryBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // Export history button
        const exportBtn = document.getElementById('exportHistoryBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportHistory();
            });
        }
    }

    /**
     * Update active state for filter buttons
     */
    updateActiveFilter(buttons, activeButton) {
        buttons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    /**
     * Render the complete history view
     */
    render() {
        this.renderHistoryList();
        this.renderStatistics();
    }

    /**
     * Render history list
     */
    renderHistoryList() {
        const container = document.getElementById('historyList');
        if (!container) return;

        // Get filtered history
        const filtered = this.historyManager.getFilteredHistory(this.filters);

        // Pagination
        const totalPages = Math.ceil(filtered.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedHistory = filtered.slice(startIndex, endIndex);

        if (paginatedHistory.length === 0) {
            container.innerHTML = `
                <div class="no-history">
                    <div class="no-history-icon">📋</div>
                    <h3>No Puzzle History</h3>
                    <p>Complete some puzzles to see your history here!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-grid">
                ${paginatedHistory.map(entry => this.renderHistoryCard(entry)).join('')}
            </div>
            ${totalPages > 1 ? this.renderPagination(totalPages) : ''}
        `;

        // Add click handlers
        container.querySelectorAll('.history-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.getAttribute('data-game-id');
                this.showGameDetail(gameId);
            });
        });

        // Add delete handlers
        container.querySelectorAll('.delete-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const gameId = btn.getAttribute('data-game-id');
                this.deleteGame(gameId);
            });
        });

        // Pagination handlers
        container.querySelectorAll('.page-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.getAttribute('data-page'));
                this.currentPage = page;
                this.render();
            });
        });
    }

    /**
     * Render a single history card
     */
    renderHistoryCard(entry) {
        const variantInfo = this.historyManager.variantInfo[entry.variant] || {};
        const statusClass = entry.status === 'completed' ? 'completed' : 'incomplete';
        const perfectBadge = entry.perfect ? '<div class="perfect-badge">✨ Perfect</div>' : '';

        return `
            <div class="history-card ${statusClass}" data-game-id="${entry.id}">
                ${perfectBadge}

                <div class="history-header">
                    <div class="variant-info">
                        <span class="variant-icon">${variantInfo.icon}</span>
                        <span class="variant-name">${variantInfo.name}</span>
                    </div>
                    <div class="difficulty-badge ${entry.difficulty}">
                        ${entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                    </div>
                </div>

                <div class="history-stats">
                    <div class="stat-item">
                        <span class="stat-label">⏱️ Time</span>
                        <span class="stat-value">${this.historyManager.formatTime(entry.timeElapsed)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">❌ Errors</span>
                        <span class="stat-value">${entry.errors}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">💡 Hints</span>
                        <span class="stat-value">${entry.hints}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">⭐ Score</span>
                        <span class="stat-value">${entry.score.toLocaleString()}</span>
                    </div>
                </div>

                <div class="history-footer">
                    <div class="history-date">${this.historyManager.formatDate(entry.timestamp)}</div>
                    <button class="delete-game-btn" data-game-id="${entry.id}" title="Delete">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render pagination
     */
    renderPagination(totalPages) {
        const maxVisible = 5;
        const pages = [];

        // Calculate visible page range
        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);

        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        // Previous button
        if (this.currentPage > 1) {
            pages.push(`<button class="page-btn" data-page="${this.currentPage - 1}">←</button>`);
        }

        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? 'active' : '';
            pages.push(`<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`);
        }

        // Next button
        if (this.currentPage < totalPages) {
            pages.push(`<button class="page-btn" data-page="${this.currentPage + 1}">→</button>`);
        }

        return `
            <div class="pagination">
                ${pages.join('')}
            </div>
        `;
    }

    /**
     * Render statistics summary
     */
    renderStatistics() {
        const container = document.getElementById('historyStatistics');
        if (!container) return;

        const stats = this.historyManager.getStatistics(this.filters.variant);

        container.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">🎮</div>
                    <div class="stat-number">${stats.totalGames}</div>
                    <div class="stat-label">Total Games</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✅</div>
                    <div class="stat-number">${stats.completedGames}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">✨</div>
                    <div class="stat-number">${stats.perfectGames}</div>
                    <div class="stat-label">Perfect Games</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⏱️</div>
                    <div class="stat-number">${stats.averageTime > 0 ? this.historyManager.formatTime(Math.round(stats.averageTime)) : 'N/A'}</div>
                    <div class="stat-label">Avg Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⚡</div>
                    <div class="stat-number">${stats.bestTime ? this.historyManager.formatTime(stats.bestTime) : 'N/A'}</div>
                    <div class="stat-label">Best Time</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-number">${stats.totalScore.toLocaleString()}</div>
                    <div class="stat-label">Total Score</div>
                </div>
            </div>
        `;
    }

    /**
     * Show game detail modal
     */
    showGameDetail(gameId) {
        const game = this.historyManager.getGameById(gameId);
        if (!game) return;

        const modal = document.createElement('div');
        modal.className = 'game-detail-modal';
        modal.innerHTML = `
            <div class="game-detail-content">
                <div class="game-detail-header">
                    <h2>Game Details</h2>
                    <button class="close-detail-btn">✕</button>
                </div>

                <div class="game-detail-body">
                    <div class="detail-section">
                        <h3>Game Information</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Variant</span>
                                <span class="detail-value">${this.historyManager.variantInfo[game.variant]?.name}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Difficulty</span>
                                <span class="detail-value">${game.difficulty}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Status</span>
                                <span class="detail-value">${game.status}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Date</span>
                                <span class="detail-value">${new Date(game.timestamp).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h3>Performance Stats</h3>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <span class="detail-label">Time</span>
                                <span class="detail-value">${this.historyManager.formatTime(game.timeElapsed)}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Errors</span>
                                <span class="detail-value">${game.errors}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Hints</span>
                                <span class="detail-value">${game.hints}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Score</span>
                                <span class="detail-value">${game.score.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    ${game.moves && game.moves.length > 0 ? `
                        <div class="detail-section">
                            <h3>Move History</h3>
                            <div class="moves-list">
                                <p>${game.moves.length} moves recorded</p>
                                <button class="replay-btn" data-game-id="${game.id}">
                                    ▶️ Replay Game
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button
        modal.querySelector('.close-detail-btn').addEventListener('click', () => {
            modal.remove();
        });

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Replay button
        const replayBtn = modal.querySelector('.replay-btn');
        if (replayBtn) {
            replayBtn.addEventListener('click', () => {
                modal.remove();
                this.replayGame(gameId);
            });
        }
    }

    /**
     * Replay a game
     */
    replayGame(gameId) {
        // This will be implemented in puzzle-replay.js
        if (window.puzzleReplaySystem) {
            window.puzzleReplaySystem.startReplay(gameId);
        } else {
            this.showNotification('Replay system not available', 'error');
        }
    }

    /**
     * Delete a game
     */
    deleteGame(gameId) {
        const confirmed = confirm('Are you sure you want to delete this game from history?');
        if (confirmed) {
            const success = this.historyManager.deleteGame(gameId);
            if (success) {
                this.showNotification('Game deleted', 'success');
                this.render();
            }
        }
    }

    /**
     * Clear all history
     */
    clearHistory() {
        const success = this.historyManager.clearHistory();
        if (success) {
            this.showNotification('All history cleared', 'success');
            this.render();
        }
    }

    /**
     * Export history
     */
    exportHistory() {
        const json = this.historyManager.exportHistory();

        // Copy to clipboard
        navigator.clipboard.writeText(json).then(() => {
            this.showNotification('History exported to clipboard!', 'success');
        }).catch(() => {
            // Fallback: show in dialog
            this.showExportDialog(json);
        });
    }

    /**
     * Show export dialog
     */
    showExportDialog(json) {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-dialog">
                <h3>Export History</h3>
                <p>Copy this JSON to backup your history:</p>
                <textarea readonly>${json}</textarea>
                <div class="dialog-actions">
                    <button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value); this.textContent = '✓ Copied!'">
                        📋 Copy
                    </button>
                    <button class="close-btn" onclick="this.closest('.export-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `history-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Refresh the display
     */
    refresh() {
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleHistoryUI;
}
