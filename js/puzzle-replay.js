/**
 * PHASE 2 MONTH 25: Puzzle Replay System
 *
 * Simple replay system for viewing completed puzzles.
 * Shows puzzle state with ability to compare player solution vs correct solution.
 */

class PuzzleReplaySystem {
    constructor(historyManager) {
        this.historyManager = historyManager;
        this.currentGame = null;
        this.showingSolution = false;
    }

    /**
     * Start replay for a game
     */
    startReplay(gameId) {
        const game = this.historyManager.getGameById(gameId);
        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        this.currentGame = game;
        this.showingSolution = false;
        this.renderReplayModal();
    }

    /**
     * Render replay modal
     */
    renderReplayModal() {
        const game = this.currentGame;
        if (!game) return;

        const variantInfo = this.historyManager.variantInfo[game.variant] || {};

        const modal = document.createElement('div');
        modal.className = 'replay-modal';
        modal.id = 'replayModal';

        modal.innerHTML = `
            <div class="replay-modal-content">
                <div class="replay-header">
                    <div class="replay-title">
                        <h2>${variantInfo.icon} ${variantInfo.name} - ${game.difficulty}</h2>
                        <p>${this.historyManager.formatDate(game.timestamp)}</p>
                    </div>
                    <button class="close-replay-btn">✕</button>
                </div>

                <div class="replay-controls">
                    <div class="replay-stats">
                        <div class="replay-stat">
                            <span class="stat-icon">⏱️</span>
                            <span class="stat-text">${this.historyManager.formatTime(game.timeElapsed)}</span>
                        </div>
                        <div class="replay-stat">
                            <span class="stat-icon">❌</span>
                            <span class="stat-text">${game.errors} errors</span>
                        </div>
                        <div class="replay-stat">
                            <span class="stat-icon">💡</span>
                            <span class="stat-text">${game.hints} hints</span>
                        </div>
                        <div class="replay-stat">
                            <span class="stat-icon">⭐</span>
                            <span class="stat-text">${game.score.toLocaleString()} pts</span>
                        </div>
                    </div>

                    <button class="toggle-solution-btn" id="toggleSolutionBtn">
                        ${this.showingSolution ? '👁️ Show Your Solution' : '✅ Show Correct Solution'}
                    </button>
                </div>

                <div class="replay-grid-container">
                    ${this.renderGrid(game)}
                </div>

                <div class="replay-info">
                    ${game.perfect ? '<div class="perfect-banner">✨ Perfect Game - No Errors!</div>' : ''}
                    <p class="replay-hint">
                        ${this.showingSolution ?
                            'Showing the correct solution' :
                            'Showing your solution' + (game.errors > 0 ? ' (may contain errors)' : '')}
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        modal.querySelector('.close-replay-btn').addEventListener('click', () => {
            this.closeReplay();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeReplay();
            }
        });

        const toggleBtn = modal.querySelector('#toggleSolutionBtn');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggleSolution();
            });
        }
    }

    /**
     * Render Sudoku grid
     */
    renderGrid(game) {
        const gridSize = game.variant === 'mini' ? 6 : 9;
        const gridToShow = this.showingSolution ? game.solution : game.playerGrid;

        if (!gridToShow) {
            return '<div class="grid-error">Grid data not available</div>';
        }

        let html = `<div class="replay-grid variant-${game.variant}">`;

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const value = gridToShow[row][col];
                const initial = game.initialGrid && game.initialGrid[row][col] !== 0;
                const correct = !this.showingSolution && game.solution &&
                                value === game.solution[row][col];
                const incorrect = !this.showingSolution && game.solution &&
                                  value !== 0 && value !== game.solution[row][col];

                let cellClass = 'replay-cell';
                if (initial) cellClass += ' initial';
                if (!this.showingSolution) {
                    if (correct) cellClass += ' correct';
                    if (incorrect) cellClass += ' incorrect';
                }

                html += `<div class="${cellClass}">${value || ''}</div>`;
            }
        }

        html += '</div>';
        return html;
    }

    /**
     * Toggle between player solution and correct solution
     */
    toggleSolution() {
        this.showingSolution = !this.showingSolution;

        const modal = document.getElementById('replayModal');
        if (!modal) return;

        // Update toggle button
        const toggleBtn = modal.querySelector('#toggleSolutionBtn');
        if (toggleBtn) {
            toggleBtn.textContent = this.showingSolution ?
                '👁️ Show Your Solution' :
                '✅ Show Correct Solution';
        }

        // Update grid
        const gridContainer = modal.querySelector('.replay-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = this.renderGrid(this.currentGame);
        }

        // Update info text
        const infoText = modal.querySelector('.replay-hint');
        if (infoText) {
            infoText.textContent = this.showingSolution ?
                'Showing the correct solution' :
                'Showing your solution' + (this.currentGame.errors > 0 ? ' (may contain errors)' : '');
        }
    }

    /**
     * Close replay modal
     */
    closeReplay() {
        const modal = document.getElementById('replayModal');
        if (modal) {
            modal.remove();
        }
        this.currentGame = null;
        this.showingSolution = false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PuzzleReplaySystem;
}
