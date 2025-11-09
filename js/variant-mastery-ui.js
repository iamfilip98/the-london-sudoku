/**
 * PHASE 2 MONTH 20: Variant Mastery UI Manager
 *
 * Manages the visual display of variant achievements, mastery tiers, and statistics.
 * Renders the variant mastery dashboard with interactive components.
 */

class VariantMasteryUI {
    constructor(statsManager) {
        this.statsManager = statsManager;
        this.currentVariantFilter = 'all';

        // Variant metadata
        this.variantInfo = {
            'classic': { name: 'Classic Sudoku', icon: '🎯', color: '#4A90E2' },
            'x-sudoku': { name: 'X-Sudoku', icon: '✖️', color: '#E24A4A' },
            'mini': { name: 'Mini 6×6', icon: '📐', color: '#9B59B6' },
            'anti-knight': { name: 'Anti-Knight', icon: '♞', color: '#E67E22' },
            'killer-sudoku': { name: 'Killer Sudoku', icon: '🔪', color: '#E74C3C' },
            'hyper-sudoku': { name: 'Hyper Sudoku', icon: '🎯', color: '#3498DB' },
            'consecutive-sudoku': { name: 'Consecutive', icon: '🔢', color: '#1ABC9C' },
            'thermo-sudoku': { name: 'Thermo Sudoku', icon: '🌡️', color: '#F39C12' },
            'jigsaw-sudoku': { name: 'Jigsaw Sudoku', icon: '🧩', color: '#8E44AD' }
        };
    }

    /**
     * Initialize the variant mastery UI
     */
    initialize() {
        // Setup tab switching
        this.setupTabSwitching();

        // Setup variant filter buttons
        this.setupVariantFilters();

        // Render the dashboard
        this.render();
    }

    /**
     * Setup tab switching between General and Variant Mastery
     */
    setupTabSwitching() {
        const tabButtons = document.querySelectorAll('.achievement-tab');
        const tabContents = document.querySelectorAll('.achievement-tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked tab
                button.classList.add('active');

                // Show corresponding content
                if (targetTab === 'general') {
                    document.getElementById('generalAchievements').classList.add('active');
                } else if (targetTab === 'variant-mastery') {
                    document.getElementById('variantMastery').classList.add('active');
                    // Render when tab is opened
                    this.render();
                }
            });
        });
    }

    /**
     * Setup variant achievement filter buttons
     */
    setupVariantFilters() {
        const filterButtons = document.querySelectorAll('.variant-achievement-filters .filter-btn');

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Update filter and re-render achievements
                this.currentVariantFilter = button.getAttribute('data-variant');
                this.renderVariantAchievements();
            });
        });
    }

    /**
     * Render the complete variant mastery dashboard
     */
    render() {
        this.renderSummaryCards();
        this.renderVariantMasteryGrid();
        this.renderVariantAchievements();
    }

    /**
     * Render summary statistics cards
     */
    renderSummaryCards() {
        if (!this.statsManager) return;

        // Total completions
        const totalCompletions = this.statsManager.getTotalCompletions();
        document.getElementById('totalVariantCompletions').textContent = totalCompletions;

        // Total perfect games
        const totalPerfect = this.statsManager.getTotalPerfectGames();
        document.getElementById('totalPerfectGames').textContent = totalPerfect;

        // Variants explored
        const variantsExplored = this.statsManager.getVariantExplorationCount();
        document.getElementById('variantsExplored').textContent = variantsExplored;

        // Variant achievements unlocked
        const achievementSummary = this.statsManager.getAchievementSummary();
        document.getElementById('variantAchievementsUnlocked').textContent = achievementSummary.unlocked.length;
        document.getElementById('totalVariantAchievements').textContent = achievementSummary.total;
    }

    /**
     * Render the variant mastery grid showing all 9 variants
     */
    renderVariantMasteryGrid() {
        const grid = document.getElementById('variantMasteryGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Render each variant
        Object.entries(this.variantInfo).forEach(([variantId, info]) => {
            const variantCard = this.createVariantMasteryCard(variantId, info);
            grid.appendChild(variantCard);
        });
    }

    /**
     * Create a mastery card for a single variant
     */
    createVariantMasteryCard(variantId, info) {
        const card = document.createElement('div');
        card.className = 'variant-mastery-card';
        card.setAttribute('data-variant', variantId);

        const stats = this.statsManager.getVariantStats(variantId);
        const masteryProgress = this.statsManager.getVariantMasteryProgress(variantId);
        const currentTier = masteryProgress.current;
        const nextTier = masteryProgress.next;

        // Determine tier color
        const tierColor = currentTier ? currentTier.color : '#888';

        card.innerHTML = `
            <div class="variant-card-header" style="border-left-color: ${tierColor}">
                <div class="variant-icon">${info.icon}</div>
                <div class="variant-name">${info.name}</div>
                ${currentTier ? `<div class="variant-tier-badge" style="background: ${tierColor}">${currentTier.icon} ${currentTier.name}</div>` : '<div class="variant-tier-badge locked">🔒 Not Started</div>'}
            </div>

            <div class="variant-card-body">
                <div class="variant-stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Completions</span>
                        <span class="stat-value">${stats.completions}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Perfect Games</span>
                        <span class="stat-value">${stats.perfectGames}</span>
                    </div>
                </div>

                <div class="variant-stats-row">
                    <div class="stat-item">
                        <span class="stat-label">Best Time</span>
                        <span class="stat-value">${stats.bestTime.any !== Infinity ? this.formatTime(stats.bestTime.any) : '—'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Avg. Errors</span>
                        <span class="stat-value">${stats.completions > 0 ? (stats.totalErrors / stats.completions).toFixed(1) : '—'}</span>
                    </div>
                </div>

                ${nextTier ? `
                <div class="mastery-progress-section">
                    <div class="progress-header">
                        <span class="progress-label">Next: ${nextTier.icon} ${nextTier.name}</span>
                        <span class="progress-count">${stats.completions}/${nextTier.completions}</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${masteryProgress.progress}%; background: ${nextTier.color}"></div>
                    </div>
                    <div class="progress-needed">${masteryProgress.completionsNeeded} more needed</div>
                </div>
                ` : `
                <div class="mastery-progress-section mastered">
                    <div class="mastered-badge">
                        <span class="mastered-icon">👑</span>
                        <span class="mastered-text">MASTER TIER ACHIEVED!</span>
                    </div>
                </div>
                `}
            </div>

            <div class="variant-card-footer">
                <button class="view-details-btn" onclick="variantMasteryUI.showVariantDetail('${variantId}')">
                    <i class="fas fa-chart-line"></i>
                    View Details
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Render variant achievements gallery
     */
    renderVariantAchievements() {
        const grid = document.getElementById('variantAchievementsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        if (typeof VARIANT_ACHIEVEMENTS === 'undefined') {
            grid.innerHTML = '<p class="no-achievements">Variant achievements not loaded</p>';
            return;
        }

        const unlockedIds = this.statsManager.checkVariantAchievements();
        const unlockedSet = new Set(unlockedIds);

        // Filter achievements based on current filter
        const filteredAchievements = Object.values(VARIANT_ACHIEVEMENTS).filter(ach => {
            if (this.currentVariantFilter === 'all') return true;
            return ach.variant === this.currentVariantFilter;
        });

        if (filteredAchievements.length === 0) {
            grid.innerHTML = '<p class="no-achievements">No achievements for this variant yet</p>';
            return;
        }

        // Render each achievement
        filteredAchievements.forEach(achievement => {
            const isUnlocked = unlockedSet.has(achievement.id);
            const achievementCard = this.createAchievementCard(achievement, isUnlocked);
            grid.appendChild(achievementCard);
        });
    }

    /**
     * Create an achievement card
     */
    createAchievementCard(achievement, isUnlocked) {
        const card = document.createElement('div');
        card.className = `variant-achievement-card ${isUnlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}`;
        card.setAttribute('data-achievement-id', achievement.id);

        card.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-info">
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-meta">
                    <span class="achievement-rarity">${achievement.rarity}</span>
                    <span class="achievement-category">${this.getVariantName(achievement.variant)}</span>
                </div>
            </div>
            ${isUnlocked ? '<div class="achievement-checkmark"><i class="fas fa-check-circle"></i></div>' : '<div class="achievement-lock"><i class="fas fa-lock"></i></div>'}
        `;

        return card;
    }

    /**
     * Show detailed view for a specific variant
     */
    showVariantDetail(variantId) {
        const info = this.variantInfo[variantId];
        const stats = this.statsManager.getVariantStats(variantId);
        const masteryProgress = this.statsManager.getVariantMasteryProgress(variantId);

        // Create modal/overlay with detailed stats
        const modal = document.createElement('div');
        modal.className = 'variant-detail-modal';
        modal.innerHTML = `
            <div class="variant-detail-content">
                <button class="modal-close" onclick="this.closest('.variant-detail-modal').remove()">
                    <i class="fas fa-times"></i>
                </button>

                <div class="variant-detail-header">
                    <div class="variant-detail-icon">${info.icon}</div>
                    <h2>${info.name}</h2>
                    ${masteryProgress.current ? `<div class="current-tier" style="color: ${masteryProgress.current.color}">${masteryProgress.current.icon} ${masteryProgress.current.name}</div>` : '<div class="current-tier">Not Started</div>'}
                </div>

                <div class="variant-detail-stats">
                    <h3>Overall Statistics</h3>
                    <div class="detail-stats-grid">
                        <div class="detail-stat">
                            <span class="detail-stat-label">Total Completions</span>
                            <span class="detail-stat-value">${stats.completions}</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-label">Perfect Games</span>
                            <span class="detail-stat-value">${stats.perfectGames}</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-label">Best Time (Any)</span>
                            <span class="detail-stat-value">${stats.bestTime.any !== Infinity ? this.formatTime(stats.bestTime.any) : '—'}</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-label">Average Errors</span>
                            <span class="detail-stat-value">${stats.completions > 0 ? (stats.totalErrors / stats.completions).toFixed(2) : '—'}</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-label">Average Time</span>
                            <span class="detail-stat-value">${stats.completions > 0 ? this.formatTime(stats.totalTime / stats.completions) : '—'}</span>
                        </div>
                        <div class="detail-stat">
                            <span class="detail-stat-label">First Played</span>
                            <span class="detail-stat-value">${stats.firstCompletedAt ? new Date(stats.firstCompletedAt).toLocaleDateString() : '—'}</span>
                        </div>
                    </div>

                    <h3>Best Times by Difficulty</h3>
                    <div class="difficulty-times">
                        <div class="difficulty-time">
                            <span class="difficulty-label easy">Easy</span>
                            <span class="time-value">${stats.bestTime.easy !== Infinity ? this.formatTime(stats.bestTime.easy) : '—'}</span>
                        </div>
                        <div class="difficulty-time">
                            <span class="difficulty-label medium">Medium</span>
                            <span class="time-value">${stats.bestTime.medium !== Infinity ? this.formatTime(stats.bestTime.medium) : '—'}</span>
                        </div>
                        <div class="difficulty-time">
                            <span class="difficulty-label hard">Hard</span>
                            <span class="time-value">${stats.bestTime.hard !== Infinity ? this.formatTime(stats.bestTime.hard) : '—'}</span>
                        </div>
                    </div>

                    <h3>Completions by Difficulty</h3>
                    <div class="difficulty-completions">
                        <div class="difficulty-completion">
                            <span class="difficulty-label easy">Easy</span>
                            <span class="completion-value">${stats.byDifficulty.easy.completions} (${stats.byDifficulty.easy.perfectGames} perfect)</span>
                        </div>
                        <div class="difficulty-completion">
                            <span class="difficulty-label medium">Medium</span>
                            <span class="completion-value">${stats.byDifficulty.medium.completions} (${stats.byDifficulty.medium.perfectGames} perfect)</span>
                        </div>
                        <div class="difficulty-completion">
                            <span class="difficulty-label hard">Hard</span>
                            <span class="completion-value">${stats.byDifficulty.hard.completions} (${stats.byDifficulty.hard.perfectGames} perfect)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    /**
     * Format time in seconds to MM:SS
     */
    formatTime(seconds) {
        if (!seconds || seconds === Infinity) return '—';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Get human-readable variant name
     */
    getVariantName(variantId) {
        if (variantId === 'multi') return 'Multi-Variant';
        return this.variantInfo[variantId]?.name || variantId;
    }

    /**
     * Show achievement unlock notification
     */
    showAchievementUnlockNotification(achievementId) {
        if (typeof VARIANT_ACHIEVEMENTS === 'undefined') return;

        const achievement = VARIANT_ACHIEVEMENTS[achievementId];
        if (!achievement) return;

        const notification = document.createElement('div');
        notification.className = `achievement-unlock-notification rarity-${achievement.rarity}`;
        notification.innerHTML = `
            <div class="unlock-notification-content">
                <div class="unlock-icon">${achievement.icon}</div>
                <div class="unlock-info">
                    <div class="unlock-title">Achievement Unlocked!</div>
                    <div class="unlock-name">${achievement.name}</div>
                    <div class="unlock-description">${achievement.description}</div>
                </div>
                <div class="unlock-rarity">${achievement.rarity}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Show animation
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantMasteryUI;
}
