/**
 * PHASE 2 MONTH 21: Variant Daily Challenges UI Manager
 *
 * Manages the visual display of daily challenges, streaks, and rewards.
 */

class VariantChallengesUI {
    constructor(challengesManager) {
        this.challengesManager = challengesManager;
    }

    /**
     * Initialize the challenges UI
     */
    initialize() {
        this.renderDashboard();
    }

    /**
     * Render the complete challenges dashboard
     */
    renderDashboard() {
        this.renderVariantOfTheDay();
        this.renderProgressSummary();
        this.renderDailyChallenges();
        this.renderStreaksSummary();
    }

    /**
     * Render variant of the day banner
     */
    renderVariantOfTheDay() {
        const container = document.getElementById('variantOfTheDay');
        if (!container) return;

        const votd = this.challengesManager.getVariantOfTheDay();

        container.innerHTML = `
            <div class="votd-banner">
                <div class="votd-icon-large">${votd.icon}</div>
                <div class="votd-content">
                    <div class="votd-label">Variant of the Day</div>
                    <div class="votd-name">${votd.name}</div>
                    <div class="votd-bonus">+50% XP Bonus!</div>
                </div>
                <div class="votd-action">
                    <button class="votd-play-btn" onclick="launchVariantOfTheDay()">
                        <i class="fas fa-play"></i>
                        Play Now
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render daily progress summary
     */
    renderProgressSummary() {
        const container = document.getElementById('dailyProgressSummary');
        if (!container) return;

        const progress = this.challengesManager.getTodayProgress();
        const rewards = this.challengesManager.getTodayRewards();

        container.innerHTML = `
            <div class="progress-summary-cards">
                <div class="progress-card">
                    <div class="progress-icon">🎯</div>
                    <div class="progress-content">
                        <div class="progress-value">${progress.completed}/${progress.total}</div>
                        <div class="progress-label">Challenges</div>
                    </div>
                </div>
                <div class="progress-card">
                    <div class="progress-icon">📊</div>
                    <div class="progress-content">
                        <div class="progress-value">${progress.percentage}%</div>
                        <div class="progress-label">Completion</div>
                    </div>
                </div>
                <div class="progress-card">
                    <div class="progress-icon">⭐</div>
                    <div class="progress-content">
                        <div class="progress-value">${rewards.xp}</div>
                        <div class="progress-label">XP Earned</div>
                    </div>
                </div>
                <div class="progress-card">
                    <div class="progress-icon">🔥</div>
                    <div class="progress-content">
                        <div class="progress-value">${this.challengesManager.getActiveStreaksCount()}</div>
                        <div class="progress-label">Active Streaks</div>
                    </div>
                </div>
            </div>

            <div class="daily-progress-bar">
                <div class="progress-bar-fill" style="width: ${progress.percentage}%"></div>
            </div>
        `;
    }

    /**
     * Render daily challenges for all variants
     */
    renderDailyChallenges() {
        const container = document.getElementById('dailyChallengesGrid');
        if (!container) return;

        const allChallenges = this.challengesManager.getTodayChallenges();
        container.innerHTML = '';

        Object.entries(allChallenges).forEach(([variantId, challenges]) => {
            const variantCard = this.createVariantChallengeCard(variantId, challenges);
            container.appendChild(variantCard);
        });
    }

    /**
     * Create a challenge card for a variant
     */
    createVariantChallengeCard(variantId, challenges) {
        const card = document.createElement('div');
        card.className = 'variant-challenge-card';
        card.setAttribute('data-variant', variantId);

        const variantName = this.challengesManager.getVariantName(variantId);
        const variantIcon = this.challengesManager.getVariantIcon(variantId);
        const isVOTD = this.challengesManager.isVariantOfTheDay(variantId);
        const streak = this.challengesManager.getVariantStreak(variantId);

        const completedCount = challenges.filter(c => c.completed).length;
        const totalCount = challenges.length;

        card.innerHTML = `
            <div class="variant-challenge-header ${isVOTD ? 'votd-highlight' : ''}">
                <div class="variant-challenge-icon">${variantIcon}</div>
                <div class="variant-challenge-info">
                    <div class="variant-challenge-name">
                        ${variantName}
                        ${isVOTD ? '<span class="votd-badge">⭐ VOTD</span>' : ''}
                    </div>
                    <div class="variant-challenge-progress">${completedCount}/${totalCount} completed</div>
                </div>
                ${streak.current > 0 ? `
                <div class="variant-streak-badge">
                    <span class="streak-icon">🔥</span>
                    <span class="streak-count">${streak.current}</span>
                </div>
                ` : ''}
            </div>

            <div class="variant-challenge-list">
                ${challenges.map(challenge => this.renderChallengeItem(challenge)).join('')}
            </div>

            <div class="variant-challenge-footer">
                <button class="play-variant-btn" onclick="playVariantChallenge('${variantId}')">
                    <i class="fas fa-gamepad"></i>
                    Play ${variantName}
                </button>
            </div>
        `;

        return card;
    }

    /**
     * Render a single challenge item
     */
    renderChallengeItem(challenge) {
        return `
            <div class="challenge-item ${challenge.completed ? 'completed' : ''}">
                <div class="challenge-icon">${challenge.icon}</div>
                <div class="challenge-content">
                    <div class="challenge-title">${challenge.title}</div>
                    <div class="challenge-description">${challenge.description}</div>
                </div>
                <div class="challenge-reward">
                    <span class="reward-value">+${challenge.reward.value}</span>
                    <span class="reward-type">XP</span>
                </div>
                ${challenge.completed ? '<div class="challenge-check"><i class="fas fa-check-circle"></i></div>' : ''}
            </div>
        `;
    }

    /**
     * Render streaks summary
     */
    renderStreaksSummary() {
        const container = document.getElementById('streaksSummary');
        if (!container) return;

        const longestStreak = this.challengesManager.getLongestActiveStreak();

        container.innerHTML = `
            <div class="streaks-header">
                <h3>🔥 Active Streaks</h3>
                ${longestStreak ? `
                <div class="longest-streak">
                    Longest: ${longestStreak.current} days (${this.challengesManager.getVariantName(longestStreak.variantId)})
                </div>
                ` : ''}
            </div>

            <div class="streaks-grid">
                ${this.renderAllStreaks()}
            </div>
        `;
    }

    /**
     * Render all variant streaks
     */
    renderAllStreaks() {
        const variants = ['classic', 'x-sudoku', 'mini', 'anti-knight', 'killer-sudoku',
                         'hyper-sudoku', 'consecutive-sudoku', 'thermo-sudoku', 'jigsaw-sudoku'];

        return variants.map(variantId => {
            const streak = this.challengesManager.getVariantStreak(variantId);
            const icon = this.challengesManager.getVariantIcon(variantId);
            const name = this.challengesManager.getVariantName(variantId);

            return `
                <div class="streak-card ${streak.current > 0 ? 'active' : 'inactive'}">
                    <div class="streak-variant-icon">${icon}</div>
                    <div class="streak-info">
                        <div class="streak-variant-name">${name}</div>
                        <div class="streak-stats">
                            <span class="streak-current">🔥 ${streak.current}</span>
                            <span class="streak-best">🏆 ${streak.best}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Show challenge completion notification
     */
    showChallengeCompletionNotification(challenges) {
        if (challenges.length === 0) return;

        challenges.forEach((challenge, index) => {
            setTimeout(() => {
                this.showNotification(challenge);
            }, index * 500); // Stagger notifications
        });

        // Re-render dashboard
        this.renderDashboard();
    }

    /**
     * Show a single notification
     */
    showNotification(challenge) {
        const notification = document.createElement('div');
        notification.className = 'challenge-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${challenge.icon}</div>
                <div class="notification-info">
                    <div class="notification-title">Challenge Complete!</div>
                    <div class="notification-challenge">${challenge.title}</div>
                    <div class="notification-reward">+${challenge.reward.value} XP</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto-dismiss
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 4000);
    }

    /**
     * Show streak milestone notification
     */
    showStreakMilestone(variantId, streakCount) {
        const milestones = [3, 7, 14, 30, 50, 100];
        if (!milestones.includes(streakCount)) return;

        const icon = this.challengesManager.getVariantIcon(variantId);
        const name = this.challengesManager.getVariantName(variantId);

        const notification = document.createElement('div');
        notification.className = 'streak-notification milestone';
        notification.innerHTML = `
            <div class="streak-milestone-content">
                <div class="milestone-icon">🔥</div>
                <div class="milestone-info">
                    <div class="milestone-title">${streakCount}-Day Streak!</div>
                    <div class="milestone-variant">${icon} ${name}</div>
                    <div class="milestone-message">Keep it going!</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    /**
     * Refresh the dashboard
     */
    refresh() {
        this.renderDashboard();
    }
}

// Global function to launch variant of the day
function launchVariantOfTheDay() {
    if (window.variantChallengesManager) {
        const votd = window.variantChallengesManager.getVariantOfTheDay();
        sessionStorage.setItem('selectedVariant', votd.variantId);
        sessionStorage.setItem('selectedDifficulty', 'medium');

        // Navigate to sudoku page if needed
        const sudokuPage = document.getElementById('sudoku');
        if (sudokuPage) {
            document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
            sudokuPage.classList.add('active');
        }

        // Load the puzzle
        if (window.sudokuEngine) {
            window.sudokuEngine.loadDailyPuzzles();
        }
    }
}

// Global function to play variant challenge
function playVariantChallenge(variantId) {
    sessionStorage.setItem('selectedVariant', variantId);
    sessionStorage.setItem('selectedDifficulty', 'medium');

    // Navigate to sudoku page
    const sudokuPage = document.getElementById('sudoku');
    if (sudokuPage) {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        sudokuPage.classList.add('active');
    }

    // Load the puzzle
    if (window.sudokuEngine) {
        window.sudokuEngine.loadDailyPuzzles();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantChallengesUI;
}
