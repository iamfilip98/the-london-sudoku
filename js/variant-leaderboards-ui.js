/**
 * PHASE 2 MONTH 22: Variant Leaderboards UI Manager
 *
 * Manages the visual display of leaderboards and rankings.
 * Renders podiums, leaderboard tables, and user rankings.
 */

class VariantLeaderboardsUI {
    constructor(leaderboardsManager) {
        this.leaderboardsManager = leaderboardsManager;
        this.currentVariant = 'all';
        this.currentCategory = 'speed';

        // Variant info for display
        this.variantInfo = {
            'all': { name: 'All Variants', icon: '🌟' },
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
     * Initialize the leaderboards UI
     */
    initialize() {
        this.setupEventListeners();
        this.render();
    }

    /**
     * Setup event listeners for filters
     */
    setupEventListeners() {
        // Category tabs
        const categoryButtons = document.querySelectorAll('.leaderboard-category-tab');
        categoryButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentCategory = button.getAttribute('data-category');
                this.updateActiveTabs(categoryButtons, button);
                this.render();
            });
        });

        // Variant filter buttons
        const variantButtons = document.querySelectorAll('.leaderboard-variant-filter .filter-btn');
        variantButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentVariant = button.getAttribute('data-variant');
                this.updateActiveTabs(variantButtons, button);
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
     * Render the complete leaderboard view
     */
    render() {
        this.renderCategoryInfo();
        this.renderPodium();
        this.renderLeaderboardTable();
        this.renderUserRanking();
    }

    /**
     * Render category information header
     */
    renderCategoryInfo() {
        const container = document.getElementById('leaderboardCategoryInfo');
        if (!container) return;

        const category = this.leaderboardsManager.categories[this.currentCategory];
        const variantInfo = this.variantInfo[this.currentVariant];

        container.innerHTML = `
            <div class="category-info-header">
                <div class="category-icon">${category.icon}</div>
                <div class="category-details">
                    <h2 class="category-name">${category.name}</h2>
                    <p class="category-description">${category.description}</p>
                    <p class="category-variant">
                        ${variantInfo.icon} ${variantInfo.name}
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * Render podium for top 3
     */
    renderPodium() {
        const container = document.getElementById('leaderboardPodium');
        if (!container) return;

        let podium;
        if (this.currentVariant === 'all') {
            podium = this.leaderboardsManager.getGlobalLeaderboard(this.currentCategory, 3);
        } else {
            podium = this.leaderboardsManager.getPodium(this.currentVariant, this.currentCategory);
        }

        if (podium.length === 0) {
            container.innerHTML = '<p class="no-data">No leaderboard data available</p>';
            return;
        }

        // Reorder for podium display: 2nd, 1st, 3rd
        const ordered = [
            podium[1] || null, // 2nd place (left)
            podium[0] || null, // 1st place (center)
            podium[2] || null  // 3rd place (right)
        ];

        container.innerHTML = `
            <div class="podium-container">
                ${ordered.map((entry, index) => {
                    if (!entry) return '';

                    // Actual rank (not podium position)
                    const rank = index === 1 ? 1 : index === 0 ? 2 : 3;
                    const medals = ['🥈', '🥇', '🥉'];
                    const heights = ['podium-second', 'podium-first', 'podium-third'];

                    return `
                        <div class="podium-place ${heights[index]} ${entry.isCurrentUser ? 'current-user' : ''}">
                            <div class="podium-rank">${medals[index]}</div>
                            <div class="podium-avatar">${this.getAvatarIcon(entry.username)}</div>
                            <div class="podium-username">${this.escapeHtml(entry.username)}</div>
                            <div class="podium-value">
                                ${this.leaderboardsManager.formatValue(entry.value, this.currentCategory)}
                            </div>
                            ${entry.badges && entry.badges.length > 0 ? `
                                <div class="podium-badges">
                                    ${entry.badges.map(badge => `<span class="badge" title="${badge.name}">${badge.icon}</span>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render leaderboard table
     */
    renderLeaderboardTable() {
        const container = document.getElementById('leaderboardTable');
        if (!container) return;

        let leaderboard;
        if (this.currentVariant === 'all') {
            leaderboard = this.leaderboardsManager.getGlobalLeaderboard(this.currentCategory, 100);
        } else {
            leaderboard = this.leaderboardsManager.getLeaderboard(this.currentVariant, this.currentCategory, 100);
        }

        if (leaderboard.length === 0) {
            container.innerHTML = '<p class="no-data">No leaderboard data available</p>';
            return;
        }

        container.innerHTML = `
            <div class="leaderboard-list">
                ${leaderboard.map(entry => this.renderLeaderboardRow(entry)).join('')}
            </div>
        `;
    }

    /**
     * Render a single leaderboard row
     */
    renderLeaderboardRow(entry) {
        const rankClass = entry.rank <= 3 ? `rank-${entry.rank}` : '';
        const userClass = entry.isCurrentUser ? 'current-user' : '';

        return `
            <div class="leaderboard-row ${rankClass} ${userClass}">
                <div class="row-rank">${entry.rank}</div>
                <div class="row-user">
                    <div class="user-avatar">${this.getAvatarIcon(entry.username)}</div>
                    <div class="user-info">
                        <div class="user-name">${this.escapeHtml(entry.username)}</div>
                        ${entry.badges && entry.badges.length > 0 ? `
                            <div class="user-badges">
                                ${entry.badges.map(badge => `<span class="badge-small" title="${badge.name}">${badge.icon}</span>`).join('')}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="row-value">
                    ${this.leaderboardsManager.formatValue(entry.value, this.currentCategory)}
                </div>
            </div>
        `;
    }

    /**
     * Render user's current ranking summary
     */
    renderUserRanking() {
        const container = document.getElementById('userRankingSummary');
        if (!container) return;

        let userEntry;
        if (this.currentVariant === 'all') {
            const global = this.leaderboardsManager.getGlobalLeaderboard(this.currentCategory, 1000);
            userEntry = global.find(entry => entry.isCurrentUser);
        } else {
            userEntry = this.leaderboardsManager.getUserRanking(this.currentVariant, this.currentCategory);
        }

        if (!userEntry) {
            container.innerHTML = '';
            return;
        }

        const category = this.leaderboardsManager.categories[this.currentCategory];

        container.innerHTML = `
            <div class="user-ranking-card">
                <div class="ranking-header">
                    <h3>Your Ranking</h3>
                </div>
                <div class="ranking-content">
                    <div class="ranking-position">
                        <div class="position-label">Rank</div>
                        <div class="position-value">#${userEntry.rank}</div>
                    </div>
                    <div class="ranking-stat">
                        <div class="stat-label">${category.name}</div>
                        <div class="stat-value">
                            ${this.leaderboardsManager.formatValue(userEntry.value, this.currentCategory)}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get avatar icon for username (first letter)
     */
    getAvatarIcon(username) {
        if (!username) return '?';
        return username.charAt(0).toUpperCase();
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
     * Refresh the leaderboard display
     */
    refresh() {
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantLeaderboardsUI;
}
