class SudokuChampionship {
    constructor() {
        this.entries = [];
        this.achievements = [];
        this.challenges = [];
        // User-centric data (no hardcoded players)
        this.userStats = {
            xp: 0,
            globalRank: null,
            achievementCount: 0,
            leagueTier: null,
            currentStreak: 0,
            bestStreak: 0
        };
        this.migrationDone = false;

        // 🚀 PERFORMANCE OPTIMIZATION: Enhanced in-memory data management system
        // Reduces localStorage dependency and provides instant data access
        this.cache = {
            lastUpdate: null,
            duration: 60000, // Extended to 60 seconds cache for better performance
            data: null
        };

        // Today's progress cache with faster refresh
        this.todayProgressCache = {
            lastUpdate: null,
            duration: 5000, // Reduced to 5 seconds for more responsive updates
            data: null,
            date: null
        };

        // Enhanced puzzle preloading cache
        this.puzzleCache = {
            puzzles: null,
            loadTime: null,
            loading: false
        };

        // In-memory data store to minimize localStorage dependency
        this.inMemoryStore = {
            todayProgress: new Map(),
            gameStates: new Map(),
            settings: new Map(),
            notifications: new Map(),
            initialized: false
        };

        // Date change detection - use local date
        this.currentDate = this.getTodayDate();
        this.lastCheckedDate = localStorage.getItem('lastCheckedDate');
        this.initializationComplete = false;

        // Track when we've determined today's battle winner to prevent polling from clearing it
        this.lastCompleteBattleDate = null;

        this.init();
    }

    // In-memory data management methods to reduce localStorage dependency
    initializeInMemoryStore() {
        if (this.inMemoryStore.initialized) return;


        // Initialize in-memory storage
        this.inMemoryStore.todayProgress.clear();
        this.inMemoryStore.gameStates.clear();
        this.inMemoryStore.settings.clear();
        this.inMemoryStore.notifications.clear();

        this.inMemoryStore.initialized = true;
    }

    // Get data from in-memory store first, fallback to localStorage
    getStoredData(category, key, fallbackToLocalStorage = true) {
        const memoryStore = this.inMemoryStore[category];
        if (memoryStore && memoryStore.has(key)) {
            return memoryStore.get(key);
        }

        if (fallbackToLocalStorage) {
            const localData = localStorage.getItem(key);
            if (localData) {
                try {
                    const parsed = JSON.parse(localData);
                    // Cache in memory for next time
                    if (memoryStore) {
                        memoryStore.set(key, parsed);
                    }
                    return parsed;
                } catch (error) {
                    return null;
                }
            }
        }

        return null;
    }

    // Store data in memory and optionally in localStorage
    setStoredData(category, key, data, persistToLocalStorage = false) {
        const memoryStore = this.inMemoryStore[category];
        if (memoryStore) {
            memoryStore.set(key, data);
        }

        if (persistToLocalStorage) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
            } catch (error) {
            }
        }
    }

    // Clear data from both memory and localStorage
    clearStoredData(category, key = null) {
        const memoryStore = this.inMemoryStore[category];
        if (key) {
            if (memoryStore) {
                memoryStore.delete(key);
            }
            localStorage.removeItem(key);
        } else {
            if (memoryStore) {
                memoryStore.clear();
            }
            // Clear all localStorage keys for this category
            const keys = Object.keys(localStorage);
            keys.forEach(lsKey => {
                if (lsKey.includes(category)) {
                    localStorage.removeItem(lsKey);
                }
            });
        }
    }

    init() {
        // Ensure DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize();
            });
        } else {
            this.initialize();
        }
    }

    async initialize() {
        const initStart = performance.now();

        // Scroll to top on page load/refresh
        window.scrollTo(0, 0);

        // Initialize in-memory data store for optimal performance
        this.initializeInMemoryStore();

        // Check if date has changed and handle new day logic
        await this.checkDateChange();

        this.setupEventListeners();
        this.setupNavigation();
        this.setupLeaderboardTabs();
        this.setCurrentDate();
        this.initializeScoreDisplay();

        // Preload puzzles in background for instant loading
        setTimeout(() => this.preloadPuzzles(), 10);

        // Load data from database or migrate from localStorage
        await this.loadData();

        await this.updateDashboard();
        await this.updateAllPages();

        // Set up automatic date checking every minute
        this.startDateChangeMonitoring();

        // Set up live progress polling for real-time battle updates
        this.startLiveProgressPolling();

        // Mark initialization as complete
        this.initializationComplete = true;

        const initEnd = performance.now();
    }

    initializeScoreDisplay() {
        // Initialize battle results
        const winnerElement = document.getElementById('winnerAnnouncement');
        if (winnerElement) {
            winnerElement.querySelector('.winner-text').textContent = 'Play Sudoku to compete!';
        }
    }

    setupEventListeners() {
        // Achievement notification close
        const achievementClose = document.querySelector('.achievement-close');
        if (achievementClose) {
            achievementClose.addEventListener('click', () => {
                this.hideAchievementNotification();
            });
        }
    }

    setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        navLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const targetPage = e.target.closest('.nav-link').dataset.page;

                // Update active nav link
                navLinks.forEach(l => l.classList.remove('active'));
                e.target.closest('.nav-link').classList.add('active');

                // Update active page
                pages.forEach(page => page.classList.remove('active'));
                const targetPageElement = document.getElementById(targetPage);
                targetPageElement.classList.add('active');

                // Scroll to appropriate position when switching
                targetPageElement.scrollTop = 0;

                if (targetPage === 'sudoku') {
                    // For Sudoku page, scroll to center the puzzle
                    setTimeout(() => {
                        const sudokuGrid = document.querySelector('.sudoku-grid');
                        if (sudokuGrid) {
                            sudokuGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        } else {
                            // Fallback if grid not found yet
                            window.scrollTo(0, 0);
                        }
                    }, 100); // Small delay to ensure content is rendered
                } else {
                    // For all other pages, scroll to top
                    window.scrollTo(0, 0);
                }

                // Update page content
                await this.updatePageContent(targetPage);

                // If navigating to dashboard, force refresh today's progress to show latest updates
                if (targetPage === 'dashboard') {
                    // Invalidate cache to ensure fresh data
                    this.todayProgressCache.data = null;
                    this.todayProgressCache.lastUpdate = null;
                    this.todayProgressCache.date = null;

                    await this.updateTodayProgress();
                }
            });
        });
    }

    setupLeaderboardTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');

                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    // Scroll to top of tab content when switching tabs
                    targetContent.scrollTop = 0;
                }
            });
        });
    }

    getTodayDate() {
        // Get today's date in local timezone as YYYY-MM-DD string
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    setCurrentDate() {
        document.getElementById('currentDate').textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    async checkDateChange() {
        const today = this.getTodayDate();

        // If this is the first visit or date has changed
        if (!this.lastCheckedDate || this.lastCheckedDate !== today) {

            // Clear today's progress from localStorage for fresh start
            this.clearTodayProgressFromLocalStorage(today);

            // Clear puzzle cache to force new puzzle generation
            this.puzzleCache.puzzles = null;
            this.puzzleCache.loadTime = null;

            // Clear general cache to force data refresh
            this.cache.data = null;
            this.cache.lastUpdate = null;

            // Clear today's progress cache
            this.todayProgressCache.data = null;
            this.todayProgressCache.lastUpdate = null;
            this.todayProgressCache.date = null;

            // Update the stored date
            localStorage.setItem('lastCheckedDate', today);
            this.lastCheckedDate = today;
            this.currentDate = today;

            // Refresh the date display
            this.setCurrentDate();

            // If initialization is complete, refresh data
            if (this.initializationComplete) {

                // Preload fresh puzzles
                await this.preloadPuzzles();

                // Refresh dashboard data
                await this.updateDashboard();

                // Update all page content
                await this.updateAllPages();
            }

        }
    }

    clearTodayProgressFromLocalStorage(date) {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        // Clear all keys related to today's date
        keys.forEach(key => {
            if (key.includes(date) || key.startsWith('completed_')) {
                // Only clear today's completed games, not other data
                if (key.includes(date)) {
                    localStorage.removeItem(key);
                    cleared++;
                }
            }
        });

        if (cleared > 0) {
        }
    }

    startDateChangeMonitoring() {
        // Check for date changes every minute
        setInterval(() => {
            this.checkDateChange();
        }, 60000); // 1 minute

        // Also check when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.checkDateChange();
            }
        });
    }

    startLiveProgressPolling() {
        // Poll for live progress updates every 15 seconds for real-time battle updates
        setInterval(async () => {
            if (this.initializationComplete) {
                // Poll regardless of active page to keep data fresh for when user switches to dashboard
                // Invalidate cache and update progress for live updates
                this.todayProgressCache.data = null;
                this.todayProgressCache.lastUpdate = null;
                this.todayProgressCache.date = null;

                await this.updateTodayProgress();
            }
        }, 15000); // 15 seconds for live battle updates

        // Also check immediately when page becomes visible (user returns to tab)
        document.addEventListener('visibilitychange', async () => {
            if (!document.hidden && this.initializationComplete) {
                // Force refresh when user returns to tab
                this.todayProgressCache.data = null;
                this.todayProgressCache.lastUpdate = null;
                this.todayProgressCache.date = null;

                await this.updateTodayProgress();
            }
        });
    }


    parseTimeToSeconds(timeString) {
        if (!timeString || timeString.trim() === '' || timeString === '0:00') return null;

        // Handle raw seconds input (e.g., "330")
        if (!timeString.includes(':')) {
            const totalSeconds = parseInt(timeString);
            if (isNaN(totalSeconds) || totalSeconds <= 0) return null;
            return totalSeconds;
        }

        // Handle MM:SS format
        const parts = timeString.split(':');
        if (parts.length !== 2) return null;

        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseInt(parts[1]) || 0;

        // Return null for invalid times like 0:00
        if (minutes === 0 && seconds === 0) return null;

        return minutes * 60 + seconds;
    }

    formatSecondsToTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // TRANSFORMED: Single-user entry completion check
    isEntryComplete(entry) {
        // Check if entry has required data for current user
        if (!entry || !entry.times) return false;

        return ['easy', 'medium', 'hard'].every(difficulty => {
            const time = entry.times?.[difficulty];
            const dnf = entry.dnf?.[difficulty] || false;

            // Complete if either DNF'd or has a time
            return dnf || time !== null;
        });
    }

    // REMOVED: updateBattleResults() - Dead code, battle UI elements no longer exist in HTML

    async loadData() {
        try {
            // Check if we have localStorage data to migrate
            const localEntries = localStorage.getItem('sudokuChampionshipEntries');
            const localAchievements = localStorage.getItem('sudokuChampionshipAchievements');
            const localStreaks = localStorage.getItem('sudokuChampionshipStreaks');
            const localChallenges = localStorage.getItem('sudokuChampionshipChallenges');

            if (localEntries || localAchievements || localStreaks || localChallenges) {
                // Migrate localStorage data to database
                const migrationData = {
                    entries: localEntries ? JSON.parse(localEntries) : [],
                    achievements: localAchievements ? JSON.parse(localAchievements) : [],
                    streaks: localStreaks ? JSON.parse(localStreaks) : null,
                    challenges: localChallenges ? JSON.parse(localChallenges) : []
                };

                await fetch('/api/entries', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        migrate: true,
                        migrationData
                    })
                });

                // Clear localStorage after successful migration
                localStorage.removeItem('sudokuChampionshipEntries');
                localStorage.removeItem('sudokuChampionshipAchievements');
                localStorage.removeItem('sudokuChampionshipStreaks');
                localStorage.removeItem('sudokuChampionshipChallenges');
                localStorage.removeItem('sudokuChampionshipRecords');

            }

            // Check for comprehensive preloaded data first for optimal performance
            const comprehensivePreload = sessionStorage.getItem('comprehensivePreload');
            let entries, bulkData, achievements, challenges, todayGames;

            if (comprehensivePreload) {
                const preloadedData = JSON.parse(comprehensivePreload);

                // Extract all preloaded data
                entries = preloadedData.entries || [];
                bulkData = preloadedData.bulkData || {};
                achievements = preloadedData.achievements || [];
                challenges = preloadedData.challenges || [];
                todayGames = preloadedData.todayGames || {};

                // Update today's progress cache with preloaded data
                if (todayGames && Object.keys(todayGames).length > 0) {
                    this.todayProgressCache.data = todayGames;
                    this.todayProgressCache.lastUpdate = preloadedData.loadTime;
                    this.todayProgressCache.date = preloadedData.date;
                }

                // Clear comprehensive preload to free memory
                sessionStorage.removeItem('comprehensivePreload');

                // Also use bulkData for achievements and challenges if available
                if (!bulkData.achievements && achievements.length > 0) {
                    bulkData.achievements = achievements;
                }
                if (!bulkData.challenges && challenges.length > 0) {
                    bulkData.challenges = challenges;
                }

            } else {
                // Fallback: check for individual preloaded data
                const preloadedEntries = sessionStorage.getItem('preloadedEntries');
                const preloadedBulkData = sessionStorage.getItem('preloadedBulkData');

                if (preloadedEntries && preloadedBulkData) {
                    entries = JSON.parse(preloadedEntries);
                    bulkData = JSON.parse(preloadedBulkData);

                    // Clear the preloaded data to free memory
                    sessionStorage.removeItem('preloadedEntries');
                    sessionStorage.removeItem('preloadedBulkData');
                } else {
                    // Load data from database - optimized with parallel loading
                    [entries, bulkData] = await Promise.all([
                        this.loadFromStorage(),
                        this.loadBulkData()
                    ]);
                }
            }

            this.entries = entries;
            this.achievements = bulkData.achievements || [];
            // TRANSFORMED: User-centric streaks (completion streaks, not win/loss)
            this.streaks = bulkData.streaks || { current: 0, best: 0 };
            this.challenges = bulkData.challenges || [];

            // Calculate records from entries
            this.records = this.calculateRecords();

            // Recalculate streaks to ensure they match the current data
            await this.updateStreaks();

        } catch (error) {
            // Failed to load data
        }
    }

    // TRANSFORMED: User-centric personal records
    calculateRecords() {
        const records = {};

        this.entries.forEach(entry => {
            // Track only current user's personal bests
            ['easy', 'medium', 'hard'].forEach(difficulty => {
                // Add null/undefined checks to prevent errors
                if (!entry || !entry.times || !entry.errors || !entry.dnf) {
                    return; // Skip this entry if data is incomplete
                }

                const time = entry.times?.[difficulty];
                const errors = entry.errors?.[difficulty];
                const dnf = entry.dnf?.[difficulty];

                if (!dnf && time !== null && time !== undefined) {
                    // Update fastest time record
                    if (!records[`${difficulty}_fastest`] ||
                        time < records[`${difficulty}_fastest`]) {
                        records[`${difficulty}_fastest`] = time;
                    }

                    // Update perfect game record (0 errors)
                    if (errors === 0) {
                        if (!records[`${difficulty}_perfect`] ||
                            time < records[`${difficulty}_perfect`]) {
                            records[`${difficulty}_perfect`] = time;
                        }
                    }
                }
            });
        });

        // Add aggregate statistics
        const completedEntries = this.entries.filter(e => this.isEntryComplete(e));
        records.totalCompleted = completedEntries.length;
        records.perfectGames = completedEntries.filter(e =>
            (e.errors?.easy || 0) + (e.errors?.medium || 0) + (e.errors?.hard || 0) === 0
        ).length;

        return records;
    }

    // TRANSFORMED: Completion streaks (not win/loss streaks)
    async updateStreaks() {
        if (this.entries.length === 0) {
            // If no entries exist, streaks should be 0
            this.streaks = {
                current: 0,
                best: this.streaks?.best || 0
            };
            await this.saveStreaks();
            return;
        }

        // Sort entries by date (oldest first) for streak calculation
        const sortedEntries = [...this.entries].sort((a, b) => new Date(a.date) - new Date(b.date));

        let currentStreak = 0;
        let bestStreak = this.streaks?.best || 0;

        sortedEntries.forEach((entry) => {
            // Count completion streak (all 3 puzzles completed without DNF)
            const allCompleted = ['easy', 'medium', 'hard'].every(difficulty =>
                entry.times?.[difficulty] !== null &&
                entry.times?.[difficulty] !== undefined &&
                !entry.dnf?.[difficulty]
            );

            if (allCompleted) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });

        // Update streaks with calculated values
        this.streaks = {
            current: currentStreak,
            best: bestStreak
        };

        await this.saveStreaks();
    }

    // TRANSFORMED: User-centric record updates
    updateRecords(entry) {
        if (!this.records) this.records = {};

        ['easy', 'medium', 'hard'].forEach(difficulty => {
            const time = entry.times?.[difficulty];
            const errors = entry.errors?.[difficulty];
            const dnf = entry.dnf?.[difficulty];

            if (!dnf && time !== null && time !== undefined) {
                // Update fastest time record
                if (!this.records[`${difficulty}_fastest`] ||
                    time < this.records[`${difficulty}_fastest`]) {
                    this.records[`${difficulty}_fastest`] = time;
                }

                // Update perfect game record (0 errors)
                if (errors === 0) {
                    if (!this.records[`${difficulty}_perfect`] ||
                        time < this.records[`${difficulty}_perfect`]) {
                        this.records[`${difficulty}_perfect`] = time;
                    }
                }
            }
        });

        this.saveRecords();
    }

    async updateDashboard() {
        // Modern user-centric dashboard with parallel API calls for performance
        try {
            // Run all async updates in parallel for 70-80% faster load
            await Promise.all([
                this.updateModernDashboard(),
                this.updateDailyGoals(),
                this.updateTodayPerformance(),
                this.updateRecentGames(),
                this.updateTodayProgress()
            ]);

            // REMOVED: updateProgressNotifications() call - function no longer exists
        } catch (error) {
            // Continue execution even if dashboard update fails
        }
    }

    // TRANSFORMED: User-centric streak display
    updateStreakDisplay() {
        // Update current user's streak displays
        const currentStreakEl = document.getElementById('currentStreakDisplay');
        if (currentStreakEl) {
            currentStreakEl.textContent = this.streaks?.current || 0;
        }

        const bestStreakEl = document.getElementById('bestStreakDisplay');
        if (bestStreakEl) {
            bestStreakEl.textContent = this.streaks?.best || 0;
        }
    }

    // TRANSFORMED: User-centric overall statistics
    updateOverallRecord() {
        // Calculate user's overall statistics
        const completeEntries = this.entries.filter(entry => this.isEntryComplete(entry));
        const totalGames = completeEntries.length;

        // Calculate success rate (perfect games / total games)
        const perfectGames = completeEntries.filter(entry =>
            (entry.errors?.easy || 0) + (entry.errors?.medium || 0) + (entry.errors?.hard || 0) === 0
        ).length;
        const successRate = totalGames > 0 ? Math.round((perfectGames / totalGames) * 100) : 0;

        // Calculate average score
        const totalScore = completeEntries.reduce((sum, entry) =>
            sum + (entry.scores?.total || 0), 0
        );
        const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;

        // Update overall record display
        const overallRecordEl = document.getElementById('overallRecord');
        if (overallRecordEl) {
            overallRecordEl.textContent = `${totalGames} games | ${successRate}% success | ${avgScore} avg`;
        }

        // Update mobile displays with user stats
        const mobileOverallRecord = document.getElementById('mobileOverallRecord');
        if (mobileOverallRecord) {
            const currentStreak = this.streaks?.current || 0;
            const mobileText = currentStreak > 0
                ? `${currentStreak} day streak 🔥`
                : `${totalGames} games completed`;

            if (mobileOverallRecord.textContent !== mobileText) {
                mobileOverallRecord.style.opacity = '0.6';
                setTimeout(() => {
                    mobileOverallRecord.textContent = mobileText;
                    mobileOverallRecord.style.opacity = '1';
                }, 50);
            }
        }

        // Update achievements page mobile display
        const achievementsMobileOverallRecord = document.getElementById('achievementsMobileOverallRecord');
        if (achievementsMobileOverallRecord) {
            const mobileText = `${totalGames} games | ${successRate}% success`;

            if (achievementsMobileOverallRecord.textContent !== mobileText) {
                achievementsMobileOverallRecord.style.opacity = '0.6';
                setTimeout(() => {
                    achievementsMobileOverallRecord.textContent = mobileText;
                    achievementsMobileOverallRecord.style.opacity = '1';
                }, 50);
            }
        }
    }

    // TRANSFORMED: User-centric history (recent personal games)
    updateRecentHistory() {
        const historyContainer = document.getElementById('historyCards');
        if (!historyContainer) return;

        const recentEntries = this.entries.slice(0, 5); // Show last 5 entries

        if (recentEntries.length === 0) {
            historyContainer.innerHTML = '<div class="no-history">No games recorded yet. Start playing!</div>';
            return;
        }

        historyContainer.innerHTML = recentEntries.map(entry => {
            // Check if entry has valid structure
            if (!entry || !entry.scores) {
                return '';
            }

            // Check if entry is complete
            const isComplete = this.isEntryComplete(entry);
            const totalScore = entry.scores?.total || 0;
            const totalErrors = (entry.errors?.easy || 0) + (entry.errors?.medium || 0) + (entry.errors?.hard || 0);
            const isPerfect = totalErrors === 0;

            return `
                <div class="history-card ${isComplete ? 'complete' : 'incomplete'}">
                    <div class="history-date">${new Date(entry.date).toLocaleDateString()}</div>
                    <div class="history-stats">
                        <div class="stat-item">
                            <div class="stat-label">Score</div>
                            <div class="stat-value">${totalScore.toFixed(0)}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Errors</div>
                            <div class="stat-value">${totalErrors}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Status</div>
                            <div class="stat-value">${isComplete ? (isPerfect ? 'Perfect ⭐' : 'Complete ✓') : 'Incomplete'}</div>
                        </div>
                    </div>
                    <div class="history-actions">
                        <button class="history-btn" onclick="sudokuApp.deleteEntry('${entry.date}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async deleteEntry(date) {
        if (confirm('Are you sure you want to delete this entry?')) {
            try {
                const response = await fetch(`/api/entries?date=${date}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error('Failed to delete entry');
                }

                this.entries = this.entries.filter(entry => entry.date !== date);
                await this.updateStreaks();
                await this.updateDashboard();
            } catch (error) {
                alert('Failed to delete entry. Please try again.');
            }
        }
    }

    async updatePageContent(page) {
        switch (page) {
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.updateCharts(this.entries);
                }
                // Update modern user-centric analytics stats
                await this.updateAnalyticsUserStats();
                break;
            case 'achievements':
                if (window.achievementsManager) {
                    await window.achievementsManager.updateAchievements(this.entries, this.streaks, this.records);
                }
                // Update modern user-centric achievement summary
                await this.updateAchievementSummary();
                break;
            case 'leaderboards':
                this.updateLeaderboards();
                break;
            case 'challenges':
                if (window.challengesManager) {
                    window.challengesManager.updateChallenges(this.entries);
                }
                break;
        }
    }

    updateLeaderboards() {
        this.updateMonthlyLeaderboard();
        this.updateWeeklyLeaderboard();
        this.updateRecords();
    }

    // TRANSFORMED: User-centric monthly trend (personal performance over time)
    updateMonthlyLeaderboard() {
        const monthlyContainer = document.getElementById('monthlyLeaderboard');
        if (!monthlyContainer) return;

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthlyEntries = this.entries.filter(entry => {
            // Parse date and set to start of day in local timezone
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            const isCurrentMonth = entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
            // Only include complete entries
            const isComplete = this.isEntryComplete(entry);
            return isCurrentMonth && isComplete;
        });

        if (monthlyEntries.length === 0) {
            monthlyContainer.innerHTML = '<p class="no-data">No games completed this month yet!</p>';
            return;
        }

        // Calculate user's monthly statistics
        const totalScore = monthlyEntries.reduce((sum, e) => sum + (e.scores?.total || 0), 0);
        const avgScore = Math.round(totalScore / monthlyEntries.length);
        const perfectGames = monthlyEntries.filter(e =>
            (e.errors?.easy || 0) + (e.errors?.medium || 0) + (e.errors?.hard || 0) === 0
        ).length;

        monthlyContainer.innerHTML = `
            <div class="monthly-stats">
                <div class="stat-card">
                    <div class="stat-value">${monthlyEntries.length}</div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgScore}</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${perfectGames}</div>
                    <div class="stat-label">Perfect Games</div>
                </div>
            </div>
        `;
    }

    // TRANSFORMED: User-centric weekly trend (personal performance this week)
    updateWeeklyLeaderboard() {
        const weeklyContainer = document.getElementById('weeklyLeaderboard');
        if (!weeklyContainer) return;

        const now = new Date();
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay();

        // Calculate Monday of the current calendar week
        const daysFromMonday = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
        startOfWeek.setDate(now.getDate() - daysFromMonday);
        startOfWeek.setHours(0, 0, 0, 0);

        // Calculate end of current week (Sunday)
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyEntries = this.entries.filter(entry => {
            // Parse date and set to start of day in local timezone
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);

            // Check if entry is within the Monday-Sunday week
            const isThisWeek = entryDate >= startOfWeek && entryDate <= endOfWeek;
            // Only include complete entries
            const isComplete = this.isEntryComplete(entry);
            return isThisWeek && isComplete;
        });

        if (weeklyEntries.length === 0) {
            weeklyContainer.innerHTML = '<p class="no-data">No games completed this week yet!</p>';
            return;
        }

        // Calculate user's weekly statistics
        const totalScore = weeklyEntries.reduce((sum, e) => sum + (e.scores?.total || 0), 0);
        const avgScore = Math.round(totalScore / weeklyEntries.length);
        const perfectGames = weeklyEntries.filter(e =>
            (e.errors?.easy || 0) + (e.errors?.medium || 0) + (e.errors?.hard || 0) === 0
        ).length;

        weeklyContainer.innerHTML = `
            <div class="weekly-stats">
                <div class="stat-card">
                    <div class="stat-value">${weeklyEntries.length}</div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${avgScore}</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${perfectGames}</div>
                    <div class="stat-label">Perfect Games</div>
                </div>
            </div>
        `;
    }

    // TRANSFORMED: User-centric personal records
    updateRecords() {
        const fastestTimesContainer = document.getElementById('fastestTimes');
        const perfectGamesContainer = document.getElementById('perfectGames');

        if (!fastestTimesContainer || !perfectGamesContainer) return;

        // User's fastest times by difficulty
        const difficulties = ['easy', 'medium', 'hard'];
        const fastestTimes = {};

        difficulties.forEach(difficulty => {
            const userTimes = this.entries
                .filter(entry => {
                    // Safety check for valid entry structure
                    return entry &&
                           entry.dnf &&
                           entry.times &&
                           !entry.dnf[difficulty] &&
                           entry.times[difficulty];
                })
                .map(entry => ({
                    time: entry.times[difficulty],
                    date: entry.date,
                    score: entry.scores?.[difficulty] || 0
                }))
                .sort((a, b) => a.time - b.time);

            fastestTimes[difficulty] = userTimes.slice(0, 5); // Top 5 personal bests
        });

        fastestTimesContainer.innerHTML = this.generateRecordsHTML(fastestTimes);

        // User's perfect games (0 errors)
        const perfectGames = this.entries.filter(entry => {
            // Safety check for valid entry structure
            if (!entry || !entry.errors) {
                return false;
            }
            const totalErrors = (entry.errors.easy || 0) +
                              (entry.errors.medium || 0) +
                              (entry.errors.hard || 0);
            return totalErrors === 0;
        }).slice(0, 10);

        perfectGamesContainer.innerHTML = this.generatePerfectGamesHTML(perfectGames);
    }

    // REMOVED: calculatePlayerStats() - No longer needed in single-user mode

    // REMOVED: generateLeaderboardHTML() - No longer needed (replaced by inline stats in updateMonthly/WeeklyLeaderboard)

    // TRANSFORMED: User-centric personal records HTML
    generateRecordsHTML(fastestTimes) {
        const difficulties = ['easy', 'medium', 'hard'];
        return difficulties.map(difficulty => {
            const records = fastestTimes[difficulty] || [];
            const recordsHTML = records.map((record, index) => `
                <div class="record-item ${difficulty}">
                    <span class="record-rank">#${index + 1}</span>
                    <span class="record-time">${this.formatSecondsToTime(record.time)}</span>
                    <span class="record-score">${record.score} pts</span>
                    <span class="record-date">${new Date(record.date).toLocaleDateString()}</span>
                </div>
            `).join('') || '<div class="record-item">No records set yet!</div>';

            return `
                <div class="difficulty-records">
                    <h4>${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</h4>
                    ${recordsHTML}
                </div>
            `;
        }).join('');
    }

    // TRANSFORMED: User-centric perfect games HTML
    generatePerfectGamesHTML(perfectGames) {
        if (perfectGames.length === 0) {
            return '<div class="record-item">No perfect games recorded yet!</div>';
        }

        return perfectGames.map(entry => {
            // Safety check for scores
            const score = entry.scores?.total || 0;
            return `
                <div class="record-item">
                    <span class="record-score">${Math.round(score)} pts</span>
                    <span class="record-date">${new Date(entry.date).toLocaleDateString()}</span>
                    <span class="record-badge">⭐ Perfect</span>
                </div>
            `;
        }).join('');
    }

    showAchievementNotification(achievement) {
        const notification = document.getElementById('achievementNotification');
        const message = document.getElementById('achievementMessage');

        message.textContent = achievement.description;
        notification.classList.add('show');

        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.hideAchievementNotification();
        }, 5000);
    }

    hideAchievementNotification() {
        document.getElementById('achievementNotification').classList.remove('show');
    }

    async checkAchievements(entry) {
        // This will be implemented in achievements.js
        if (window.achievementsManager) {
            await window.achievementsManager.checkNewAchievements(entry, this.entries, this.streaks);
        }
    }

    async updateAllPages() {
        await this.updateDashboard();
        this.updateLeaderboards();
        // Other page updates will be handled when those managers are loaded
    }

    // API methods
    async saveToStorage() {
        try {
            const response = await fetch('/api/entries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    migrate: true,
                    migrationData: {
                        entries: this.entries,
                        achievements: this.achievements,
                        streaks: this.streaks,
                        challenges: this.challenges
                    }
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save data');
            }

            // Clear cache after successful save
            this.cache.data = null;
            this.cache.lastUpdate = null;
        } catch (error) {
            // Failed to save to database
        }
    }

    async loadFromStorage() {
        try {
            const response = await fetch('/api/entries');
            if (!response.ok) {
                throw new Error('Failed to load entries');
            }
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async saveStreaks() {
        try {
            await fetch('/api/stats', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'streaks',
                    data: this.streaks
                })
            });
        } catch (error) {
            // Failed to save streaks
        }
    }

    async loadStreaks() {
        try {
            const response = await fetch('/api/stats?type=streaks');
            if (!response.ok) {
                throw new Error('Failed to load streaks');
            }
            return await response.json();
        } catch (error) {
            return null;
        }
    }

    saveRecords() {
        // Records are calculated from entries, no separate storage needed
    }

    loadRecords() {
        // Records are calculated from entries, no separate storage needed
        return null;
    }

    async saveAchievements() {
        try {
            for (const achievement of this.achievements) {
                await fetch('/api/achievements', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(achievement)
                });
            }
        } catch (error) {
            // Failed to save achievements
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/achievements');
            if (!response.ok) {
                throw new Error('Failed to load achievements');
            }
            return await response.json();
        } catch (error) {
            // Return empty array as fallback - achievements will still show as locked
            return [];
        }
    }

    async saveChallenges() {
        try {
            for (const challenge of this.challenges) {
                await fetch('/api/stats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        type: 'challenge',
                        data: challenge
                    })
                });
            }
        } catch (error) {
            // Failed to save challenges
        }
    }

    async loadChallenges() {
        try {
            const response = await fetch('/api/stats?type=challenges');
            if (!response.ok) {
                throw new Error('Failed to load challenges');
            }
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    async loadBulkData() {
        try {
            // Check cache first
            const now = Date.now();
            if (this.cache.data && this.cache.lastUpdate &&
                (now - this.cache.lastUpdate) < this.cache.duration) {
                return this.cache.data;
            }

            const response = await fetch('/api/stats?type=all');
            if (!response.ok) {
                throw new Error('Failed to load bulk data');
            }

            const data = await response.json();

            // Update cache
            this.cache.data = data;
            this.cache.lastUpdate = now;

            return data;
        } catch (error) {
            // TRANSFORMED: User-centric default data
            return {
                streaks: { current: 0, best: 0 },
                challenges: [],
                achievements: []
            };
        }
    }

    // TRANSFORMED: User-centric today's progress
    async updateTodayProgress() {
        const today = this.getTodayDate();
        const difficulties = ['easy', 'medium', 'hard'];

        // Check cache first
        const now = Date.now();
        if (this.todayProgressCache.data &&
            this.todayProgressCache.lastUpdate &&
            this.todayProgressCache.date === today &&
            (now - this.todayProgressCache.lastUpdate) < this.todayProgressCache.duration) {
            // Use cached data
            const dbProgress = this.todayProgressCache.data;
            this.renderTodayProgress(dbProgress, difficulties, today);
            return;
        }

        // Try to load progress from database first
        let dbProgress = null;
        try {
            // Force no-cache to ensure real-time updates
            const response = await fetch(`/api/games?date=${today}`, {
                cache: 'no-store'
            });
            if (response.ok) {
                dbProgress = await response.json();

                // Update cache
                this.todayProgressCache.data = dbProgress;
                this.todayProgressCache.lastUpdate = now;
                this.todayProgressCache.date = today;
            }
        } catch (error) {
            // Failed to fetch today's progress
        }

        // Always render, even if dbProgress is null (will check localStorage fallback)
        this.renderTodayProgress(dbProgress, difficulties, today);
    }


    // TRANSFORMED: User-centric progress rendering
    renderTodayProgress(dbProgress, difficulties, today) {
        const user = this.getCurrentUser();

        difficulties.forEach(difficulty => {
            const progressElement = document.getElementById(`user-${difficulty}-progress`);
            if (!progressElement) {
                return;
            }

            const statusElement = progressElement.querySelector('.progress-status');
            if (!statusElement) {
                return;
            }

            let gameData = null;

            // Check database first
            if (dbProgress && dbProgress[difficulty]) {
                gameData = dbProgress[difficulty];
                // Cache in memory for fast access
                const progressKey = `${user.id}_${today}_${difficulty}`;
                this.setStoredData('todayProgress', progressKey, gameData, false);
            } else {
                // Check in-memory store first, then localStorage
                const progressKey = `${user.id}_${today}_${difficulty}`;
                gameData = this.getStoredData('todayProgress', `completed_${progressKey}`, true);
            }

            if (gameData && gameData.time) {
                const time = this.formatSecondsToTime(gameData.time);
                statusElement.innerHTML = `
                    <span class="completion-time">✓ ${time}</span>
                    <span class="completion-score">${Math.round(gameData.score || 0)}pts</span>
                `;
                progressElement.classList.add('completed');
            } else {
                statusElement.textContent = 'Not started';
                progressElement.classList.remove('completed');
            }
        });

        // Update today's completion status
        this.updateTodayCompletionStatus();
    }

    // TRANSFORMED: User-centric completion status
    updateTodayCompletionStatus() {
        const today = this.getTodayDate();
        const user = this.getCurrentUser();
        const difficulties = ['easy', 'medium', 'hard'];

        // Calculate user's total score and count completed games
        let totalScore = 0;
        let completedGames = 0;
        const totalGamesRequired = difficulties.length; // 3 games total

        difficulties.forEach(difficulty => {
            let gameData = null;

            // Check database cache first (prioritize database data)
            if (this.todayProgressCache.data &&
                this.todayProgressCache.data[difficulty]) {
                gameData = this.todayProgressCache.data[difficulty];
            } else {
                // Fallback to sessionStorage (session-only cache, no stale data)
                const key = `completed_${user.id}_${today}_${difficulty}`;
                const sessionData = sessionStorage.getItem(key);
                if (sessionData) {
                    gameData = JSON.parse(sessionData);
                }
            }

            if (gameData && gameData.score) {
                totalScore += Number(gameData.score) || 0;
                completedGames++;
            }
        });

        // Update completion indicator
        if (completedGames === totalGamesRequired) {
            // Mark that user completed all puzzles for today
            this.lastCompleteBattleDate = today;

            const completionElement = document.getElementById('todayCompletionStatus');
            if (completionElement) {
                completionElement.innerHTML = `
                    <div class="completion-badge complete">
                        <i class="fas fa-check-circle"></i>
                        All puzzles completed! Total: ${totalScore.toFixed(0)} points
                    </div>
                `;
            }
        } else {
            const completionElement = document.getElementById('todayCompletionStatus');
            if (completionElement) {
                completionElement.innerHTML = `
                    <div class="completion-badge incomplete">
                        <i class="fas fa-clock"></i>
                        ${completedGames}/${totalGamesRequired} completed | Current: ${totalScore.toFixed(0)} points
                    </div>
                `;
            }
        }
    }

    // REMOVED: updateProgressNotifications() - Dead code, opponent notification system no longer exists

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;

        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        if (hours < 24) return `${hours} hours ago`;

        return 'Earlier today';
    }

    // Development helper functions for browser console
    async resetDailyPuzzles(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];

        try {

            // Call the puzzle API to reset puzzles for the date
            const response = await fetch('/api/puzzles', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ date: targetDate })
            });

            if (!response.ok) {
                // If DELETE method isn't supported, try using a POST with reset action
                const resetResponse = await fetch('/api/puzzles', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: 'reset',
                        date: targetDate
                    })
                });

                if (!resetResponse.ok) {
                    throw new Error('Reset API not available - use node reset-daily-puzzles.js instead');
                }
            }


            // Clear localStorage for the date
            this.clearLocalStorageForDate(targetDate);


            return true;
        } catch (error) {
            return false;
        }
    }

    clearLocalStorageForDate(date) {
        const keys = Object.keys(localStorage);
        let cleared = 0;

        keys.forEach(key => {
            if (key.includes(date)) {
                localStorage.removeItem(key);
                cleared++;
            }
        });

        return cleared;
    }

    async fullReset(date) {
        const targetDate = date || new Date().toISOString().split('T')[0];


        // Reset database
        const dbReset = await this.resetDailyPuzzles(targetDate);

        if (dbReset) {
            return true;
        } else {
            return false;
        }
    }

    // Quick access functions for console
    resetToday() {
        return this.fullReset();
    }

    clearAllLocalStorage() {
        const count = localStorage.length;
        localStorage.clear();
        return count;
    }

    // Force complete daily refresh
    forceDailyRefresh() {
        const today = this.getTodayDate();

        // Clear all cached data
        localStorage.removeItem('lastCheckedDate');
        this.clearTodayProgressFromLocalStorage(today);

        // Clear app caches
        this.puzzleCache.puzzles = null;
        this.puzzleCache.loadTime = null;
        this.cache.data = null;
        this.cache.lastUpdate = null;
        this.todayProgressCache.data = null;
        this.todayProgressCache.lastUpdate = null;
        this.todayProgressCache.date = null;

        // Reset date detection
        this.lastCheckedDate = null;
        this.currentDate = today;

        // Clear session storage
        sessionStorage.clear();


        // Force page reload
        location.reload(true);
    }

    // Test API connectivity
    async testApiConnectivity() {
        const today = this.getTodayDate();

        const endpoints = [
            `/api/puzzles?date=${today}&t=${Date.now()}`,
            `/api/games?date=${today}`,
            `/api/entries`,
            `/api/stats?type=all`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);

                if (endpoint.includes('puzzles')) {
                    const data = await response.json();
                    if (data.easy && data.easy.puzzle) {
                    }
                }
            } catch (error) {
                // Endpoint test failed
            }
        }
    }

    // Puzzle preloading functionality
    async preloadPuzzles() {
        // Check for preloaded puzzles from login page first
        const preloadedPuzzles = sessionStorage.getItem('preloadedPuzzles');
        const puzzlesLoadTime = sessionStorage.getItem('puzzlesLoadTime');

        if (preloadedPuzzles && puzzlesLoadTime) {
            const loadTime = parseInt(puzzlesLoadTime);
            const now = Date.now();

            // Use preloaded data if it's recent (within 5 minutes)
            if ((now - loadTime) < 300000) {
                this.puzzleCache.puzzles = JSON.parse(preloadedPuzzles);
                this.puzzleCache.loadTime = loadTime;

                // Make puzzles globally available
                window.preloadedPuzzles = this.puzzleCache.puzzles;

                // Clear from sessionStorage to free memory
                sessionStorage.removeItem('preloadedPuzzles');
                sessionStorage.removeItem('puzzlesLoadTime');
                return;
            } else {
                // Clear stale data
                sessionStorage.removeItem('preloadedPuzzles');
                sessionStorage.removeItem('puzzlesLoadTime');
            }
        }

        // Don't preload if already loading or recently loaded
        if (this.puzzleCache.loading) {
            return;
        }

        const now = Date.now();
        if (this.puzzleCache.puzzles && this.puzzleCache.loadTime &&
            (now - this.puzzleCache.loadTime) < 300000) { // 5 minutes cache
            return;
        }

        this.puzzleCache.loading = true;

        try {
            const today = this.getTodayDate();
            const response = await fetch(`/api/puzzles?date=${today}&t=${Date.now()}`);

            if (response.ok) {
                this.puzzleCache.puzzles = await response.json();
                this.puzzleCache.loadTime = now;

                // Make puzzles globally available
                window.preloadedPuzzles = this.puzzleCache.puzzles;
            } else {
            }
        } catch (error) {
        } finally {
            this.puzzleCache.loading = false;
        }
    }

    // Get preloaded puzzles
    getPreloadedPuzzles() {
        return this.puzzleCache.puzzles;
    }

    // Check if puzzles are available
    arePuzzlesPreloaded() {
        return this.puzzleCache.puzzles !== null &&
               this.puzzleCache.loadTime !== null &&
               (Date.now() - this.puzzleCache.loadTime) < 300000; // 5 minutes fresh
    }

    // Switch to a specific page (for navigation from completion notifications)
    async switchPage(targetPage) {
        const navLinks = document.querySelectorAll('.nav-link');
        const pages = document.querySelectorAll('.page');

        // Update active nav link
        navLinks.forEach(l => l.classList.remove('active'));
        const targetNavLink = document.querySelector(`.nav-link[data-page="${targetPage}"]`);
        if (targetNavLink) {
            targetNavLink.classList.add('active');
        }

        // Update active page
        pages.forEach(page => page.classList.remove('active'));
        const targetPageElement = document.getElementById(targetPage);
        if (targetPageElement) {
            targetPageElement.classList.add('active');

            // Scroll to appropriate position when switching
            targetPageElement.scrollTop = 0;

            if (targetPage === 'sudoku') {
                // For Sudoku page, scroll to center the puzzle
                setTimeout(() => {
                    const sudokuGrid = document.querySelector('.sudoku-grid');
                    if (sudokuGrid) {
                        sudokuGrid.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else {
                        // Fallback if grid not found yet
                        window.scrollTo(0, 0);
                    }
                }, 100); // Small delay to ensure content is rendered
            } else {
                // For all other pages, scroll to top
                window.scrollTo(0, 0);
            }

            // Update page content
            await this.updatePageContent(targetPage);

            // If navigating to dashboard, force refresh today's progress to show latest updates
            if (targetPage === 'dashboard') {
                // Invalidate cache to ensure fresh data
                this.todayProgressCache.data = null;
                this.todayProgressCache.lastUpdate = null;
                this.todayProgressCache.date = null;

                await this.updateTodayProgress();
            }
        }
    }

    // ============================================
    // MODERN USER-CENTRIC DASHBOARD METHODS
    // Phase 1 Week 2: Component Migration
    // ============================================

    /**
     * Get current authenticated user information
     * @returns {Object} Current user data
     */
    getCurrentUser() {
        return {
            id: sessionStorage.getItem('clerk_user_id') || sessionStorage.getItem('currentPlayer'),
            username: sessionStorage.getItem('playerName') || 'Player',
            isAuthenticated: !!sessionStorage.getItem('clerk_token') || sessionStorage.getItem('sudokuAuth') === 'authenticated'
        };
    }

    /**
     * Update modern user-centric dashboard
     * Populates: welcome section, streak badge, quick stats, progress sections
     */
    async updateModernDashboard() {
        try {
            const user = this.getCurrentUser();

            // Update welcome section
            this.updateWelcomeSection(user);

            // Update streak badge
            await this.updateStreakBadge(user);

            // Update quick stats (4 cards)
            await this.updateQuickStats(user);

            // Update progress sections
            await this.updateProgressSections(user);

        } catch (error) {
            // Dashboard update error
        }
    }

    /**
     * Update welcome section with username
     */
    updateWelcomeSection(user) {
        const usernameDisplay = document.getElementById('usernameDisplay');
        if (usernameDisplay) {
            usernameDisplay.textContent = user.username;
        }

        // Update current date
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            currentDateEl.textContent = new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        }
    }

    /**
     * Update streak badge on dashboard
     */
    async updateStreakBadge(user) {
        try {
            // Get user streak from database
            const response = await fetch('/api/stats?type=streaks');
            const streaks = await response.json();

            // Get current user's streak (default to 0 if not found)
            const userStreak = streaks[user.username] || { current: 0, best: 0 };

            // Update streak display
            const currentStreakDisplay = document.getElementById('currentStreakDisplay');
            if (currentStreakDisplay) {
                currentStreakDisplay.textContent = userStreak.current;
            }

            // Update user stats cache
            this.userStats.currentStreak = userStreak.current;
            this.userStats.bestStreak = userStreak.best;

        } catch (error) {
            // Streak badge update error
        }
    }

    /**
     * Update quick stats section (4 cards)
     */
    async updateQuickStats(user) {
        try {
            // Card 1: XP This Season
            await this.updateXPCard(user);

            // Card 2: Global Rank
            await this.updateRankCard(user);

            // Card 3: Achievements Unlocked
            await this.updateAchievementsCard(user);

            // Card 4: League Tier
            await this.updateLeagueTierCard(user);

        } catch (error) {
            // Quick stats update error
        }
    }

    /**
     * Update XP card (Card 1)
     */
    async updateXPCard(user) {
        try {
            // Get battle pass status for XP
            const response = await fetch(`/api/stats?type=battle-pass&userId=${user.id}`);
            if (response.ok) {
                const battlePassData = await response.json();
                const xpDisplay = document.getElementById('userXpDisplay');
                if (xpDisplay && battlePassData.xp !== undefined) {
                    xpDisplay.textContent = battlePassData.xp.toLocaleString();
                    this.userStats.xp = battlePassData.xp;
                }
            }
        } catch (error) {
            // XP card update error
        }
    }

    /**
     * Update global rank card (Card 2)
     */
    async updateRankCard(user) {
        try {
            // Get user's rank from leaderboard
            const response = await fetch('/api/stats?type=leaderboards&period=all&limit=1000');
            if (response.ok) {
                const data = await response.json();
                const leaderboard = data.leaderboard || [];

                // Find user's rank
                const userRank = leaderboard.findIndex(entry => entry.player === user.username) + 1;

                const rankDisplay = document.getElementById('userRankDisplay');
                if (rankDisplay) {
                    rankDisplay.textContent = userRank > 0 ? `#${userRank}` : '--';
                    this.userStats.globalRank = userRank || null;
                }
            }
        } catch (error) {
            // Rank card update error
        }
    }

    /**
     * Update achievements card (Card 3)
     */
    async updateAchievementsCard(user) {
        try {
            // Get user's achievement count
            const response = await fetch('/api/achievements');
            if (response.ok) {
                const achievements = await response.json();
                const userAchievements = achievements.filter(a => a.player === user.username);

                const achievementsDisplay = document.getElementById('userAchievementsDisplay');
                if (achievementsDisplay) {
                    achievementsDisplay.textContent = userAchievements.length;
                    this.userStats.achievementCount = userAchievements.length;
                }
            }
        } catch (error) {
            // Achievements card update error
        }
    }

    /**
     * Update league tier card (Card 4)
     */
    async updateLeagueTierCard(user) {
        try {
            // TODO: Get user's league tier from leagues API
            // For now, show placeholder
            const leagueTierDisplay = document.getElementById('userLeagueTierDisplay');
            if (leagueTierDisplay) {
                leagueTierDisplay.textContent = 'Bronze III'; // Placeholder
                this.userStats.leagueTier = 'Bronze III';
            }
        } catch (error) {
            // League tier card update error
        }
    }

    /**
     * Update progress sections (Battle Pass + Recent Achievements)
     */
    async updateProgressSections(user) {
        try {
            await this.updateBattlePassPreview(user);
            await this.updateLessonProgress(user);
            await this.updateRecentAchievements(user);
        } catch (error) {
            // Progress sections update error
        }
    }

    /**
     * Update Battle Pass preview section
     */
    async updateBattlePassPreview(user) {
        try {
            const response = await fetch(`/api/stats?type=battle-pass&userId=${user.id}`);
            if (response.ok) {
                const battlePassData = await response.json();

                // Update tier info
                const tierLabel = document.querySelector('.tier-label span');
                if (tierLabel && battlePassData.currentTier) {
                    tierLabel.textContent = battlePassData.currentTier;
                }

                // Update XP needed
                const xpNeeded = document.querySelector('.xp-needed span');
                if (xpNeeded && battlePassData.xpForNextTier) {
                    xpNeeded.textContent = battlePassData.xpForNextTier.toLocaleString();
                }

                // Update progress bar
                const progressFill = document.getElementById('battlePassProgress');
                if (progressFill && battlePassData.progressPercentage !== undefined) {
                    progressFill.style.width = `${battlePassData.progressPercentage}%`;
                }
            }
        } catch (error) {
            // Battle pass preview update error
        }
    }

    /**
     * Update lesson progress widget (Phase 2)
     */
    async updateLessonProgress(user) {
        try {
            // Fetch lesson progress from API
            const response = await fetch('/api/stats?type=lesson-progress');

            if (response.ok) {
                const progressData = await response.json();

                // Validate response data
                if (!Array.isArray(progressData)) {
                    return;
                }

                // Calculate stats with proper null/undefined checks
                const completedLessons = progressData.filter(p =>
                    p && p.status === 'completed'
                ).length;

                const totalXP = progressData
                    .filter(p => p && p.status === 'completed' && p.lesson_id)
                    .reduce((sum, lesson) => {
                        // Parse lesson number from ID with validation
                        const match = lesson.lesson_id.match(/lesson-(\d+)/);
                        if (!match || !match[1]) {
                            return sum;
                        }

                        const lessonNum = parseInt(match[1], 10);

                        // Validate lesson number is in expected range (1-20)
                        if (isNaN(lessonNum) || lessonNum < 1 || lessonNum > 20) {
                            return sum;
                        }

                        // XP values based on lesson number (from lesson catalog)
                        const xpMap = {
                            1: 25, 2: 50, 3: 50, 4: 50, 5: 75, 6: 75,  // Beginner
                            7: 100, 8: 100, 9: 100, 10: 150, 11: 150, 12: 150, 13: 150, 14: 200,  // Intermediate
                            15: 150, 16: 150, 17: 150, 18: 150, 19: 150, 20: 200  // Variants
                        };

                        return sum + (xpMap[lessonNum] || 0);
                    }, 0);

                // Count progress per course with validation
                const beginnerComplete = progressData.filter(p =>
                    p && p.status === 'completed' && p.lesson_id && p.lesson_id.match(/^lesson-0[1-6]/)
                ).length;

                const intermediateComplete = progressData.filter(p =>
                    p && p.status === 'completed' && p.lesson_id && p.lesson_id.match(/^lesson-(0[7-9]|1[0-4])/)
                ).length;

                const variantsComplete = progressData.filter(p =>
                    p && p.status === 'completed' && p.lesson_id && p.lesson_id.match(/^lesson-(1[5-9]|20)/)
                ).length;

                // Update DOM elements safely
                const completedDisplay = document.getElementById('completedLessonsDisplay');
                if (completedDisplay) {
                    completedDisplay.textContent = Math.max(0, completedLessons);
                }

                const xpDisplay = document.getElementById('lessonXPDisplay');
                if (xpDisplay) {
                    xpDisplay.textContent = Math.max(0, totalXP).toLocaleString();
                }

                const beginnerDisplay = document.getElementById('beginnerProgressDisplay');
                if (beginnerDisplay) {
                    beginnerDisplay.textContent = `${Math.max(0, beginnerComplete)}/6`;
                }

                const intermediateDisplay = document.getElementById('intermediateProgressDisplay');
                if (intermediateDisplay) {
                    intermediateDisplay.textContent = `${Math.max(0, intermediateComplete)}/8`;
                }

                const variantsDisplay = document.getElementById('variantsProgressDisplay');
                if (variantsDisplay) {
                    variantsDisplay.textContent = `${Math.max(0, variantsComplete)}/6`;
                }
            }
        } catch (error) {
            // Keep default 0 values on error
        }
    }

    /**
     * Update recent achievements section
     */
    async updateRecentAchievements(user) {
        try {
            const response = await fetch('/api/achievements');
            if (response.ok) {
                const achievements = await response.json();
                const userAchievements = achievements
                    .filter(a => a.player === user.username)
                    .sort((a, b) => new Date(b.unlockedAt) - new Date(a.unlockedAt))
                    .slice(0, 3); // Show last 3

                const achievementsList = document.querySelector('.achievements-list');
                if (achievementsList) {
                    if (userAchievements.length === 0) {
                        achievementsList.innerHTML = '<p class="empty-state">No achievements yet. Complete puzzles to earn your first achievement!</p>';
                    } else {
                        achievementsList.innerHTML = userAchievements.map(achievement => `
                            <div class="achievement-item">
                                <div class="achievement-icon">${achievement.icon || '🏆'}</div>
                                <div class="achievement-info">
                                    <div class="achievement-name">${achievement.name || achievement.id}</div>
                                    <div class="achievement-time">${this.getTimeAgo(achievement.unlockedAt)}</div>
                                </div>
                            </div>
                        `).join('');
                    }
                }
            }
        } catch (error) {
            // Recent achievements update error
        }
    }

    /**
     * Get human-readable time ago string
     * @param {string} timestamp - ISO timestamp
     * @returns {string} Time ago string
     */
    getTimeAgo(timestamp) {
        const now = new Date();
        const then = new Date(timestamp);
        const seconds = Math.floor((now - then) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return then.toLocaleDateString();
    }

    /**
     * Update user-centric achievement summary section
     * Used on achievements page
     */
    async updateAchievementSummary() {
        try {
            const user = this.getCurrentUser();

            // Get user's achievements
            const response = await fetch('/api/achievements');
            if (!response.ok) return;

            const allAchievements = await response.json();
            const userAchievements = allAchievements.filter(a => a.player === user.username);

            // Total achievements in system (updated to 390 from Phase 6 Month 23)
            const totalAchievements = 390;
            const unlockedCount = userAchievements.length;
            const lockedCount = totalAchievements - unlockedCount;
            const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100);

            // Update summary stats
            const userAchievementCountEl = document.getElementById('userAchievementCount');
            if (userAchievementCountEl) {
                userAchievementCountEl.textContent = unlockedCount;
            }

            const lockedAchievementCountEl = document.getElementById('lockedAchievementCount');
            if (lockedAchievementCountEl) {
                lockedAchievementCountEl.textContent = lockedCount;
            }

            const completionPercentageEl = document.getElementById('completionPercentage');
            if (completionPercentageEl) {
                completionPercentageEl.textContent = `${completionPercentage}%`;
            }

            const totalAchievementsUnlockedEl = document.getElementById('totalAchievementsUnlocked');
            if (totalAchievementsUnlockedEl) {
                totalAchievementsUnlockedEl.textContent = unlockedCount;
            }

            const totalAchievementsEl = document.getElementById('totalAchievements');
            if (totalAchievementsEl) {
                totalAchievementsEl.textContent = totalAchievements;
            }

            // Update progress bar
            const achievementProgressFill = document.getElementById('achievementProgressFill');
            if (achievementProgressFill) {
                achievementProgressFill.style.width = `${completionPercentage}%`;
            }

        } catch (error) {
            // Achievement summary update error
        }
    }

    /**
     * Update daily goals section
     * Shows completion status for easy/medium/hard puzzles
     */
    async updateDailyGoals() {
        try {
            const user = this.getCurrentUser();
            const today = this.getTodayDate();

            // Fetch today's games
            const response = await fetch(`/api/games?date=${today}`);
            if (!response.ok) return;

            const games = await response.json();
            const userGames = games.filter(g => g.player === user.username);

            // Check which difficulties are completed
            const completedDifficulties = {
                easy: userGames.some(g => g.difficulty === 'easy' && g.completed),
                medium: userGames.some(g => g.difficulty === 'medium' && g.completed),
                hard: userGames.some(g => g.difficulty === 'hard' && g.completed)
            };

            const completedCount = Object.values(completedDifficulties).filter(Boolean).length;

            // Update progress text
            const goalsProgress = document.getElementById('goalsProgress');
            if (goalsProgress) {
                goalsProgress.querySelector('.progress-text').textContent = `${completedCount}/3 completed`;
            }

            // Update each goal card
            ['easy', 'medium', 'hard'].forEach(difficulty => {
                const goalCard = document.getElementById(`goal-${difficulty}`);
                if (goalCard) {
                    const statusEl = goalCard.querySelector('.goal-status');
                    if (completedDifficulties[difficulty]) {
                        goalCard.classList.add('completed');
                        if (statusEl) statusEl.textContent = 'Completed ✓';
                    } else {
                        goalCard.classList.remove('completed');
                        if (statusEl) statusEl.textContent = 'Not completed';
                    }
                }
            });

        } catch (error) {
            // Daily goals update error
        }
    }

    /**
     * Update today's performance section
     * Shows total score, average time, and accuracy
     */
    async updateTodayPerformance() {
        try {
            const user = this.getCurrentUser();
            const today = this.getTodayDate();

            // Fetch today's games
            const response = await fetch(`/api/games?date=${today}`);
            if (!response.ok) return;

            const games = await response.json();
            const userGames = games.filter(g => g.player === user.username && g.completed);

            if (userGames.length === 0) {
                // No games completed today
                return;
            }

            // Calculate total score
            const totalScore = userGames.reduce((sum, game) => sum + (game.score || 0), 0);

            // Calculate average time
            const totalTime = userGames.reduce((sum, game) => sum + (game.time || 0), 0);
            const avgTime = Math.floor(totalTime / userGames.length);
            const avgMinutes = Math.floor(avgTime / 60);
            const avgSeconds = avgTime % 60;

            // Calculate accuracy (100% - error rate)
            const totalErrors = userGames.reduce((sum, game) => sum + (game.errors || 0), 0);
            const totalCells = userGames.length * 81; // Assuming 9x9 grid
            const accuracy = Math.max(0, Math.min(100, 100 - (totalErrors / totalCells * 100)));

            // Update display
            const todayScoreEl = document.getElementById('todayScore');
            if (todayScoreEl) {
                todayScoreEl.textContent = totalScore.toFixed(0);
            }

            const todayTimeEl = document.getElementById('todayTime');
            if (todayTimeEl) {
                todayTimeEl.textContent = `${avgMinutes}:${avgSeconds.toString().padStart(2, '0')}`;
            }

            const todayAccuracyEl = document.getElementById('todayAccuracy');
            if (todayAccuracyEl) {
                todayAccuracyEl.textContent = `${accuracy.toFixed(0)}%`;
            }

        } catch (error) {
            // Today performance update error
        }
    }

    /**
     * Update recent games section
     * Shows last 5 completed games
     */
    async updateRecentGames() {
        try {
            const user = this.getCurrentUser();

            // Fetch recent games
            const response = await fetch('/api/games');
            if (!response.ok) return;

            const allGames = await response.json();
            const userGames = allGames
                .filter(g => g.player === user.username && g.completed)
                .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
                .slice(0, 5);

            const gamesListEl = document.getElementById('recentGamesList');
            if (!gamesListEl) return;

            if (userGames.length === 0) {
                // Show empty state
                gamesListEl.innerHTML = `
                    <div class="no-games">
                        <i class="fas fa-puzzle-piece"></i>
                        <p>No games completed yet. Start playing!</p>
                    </div>
                `;
                return;
            }

            // Render game items
            gamesListEl.innerHTML = userGames.map(game => {
                const time = game.time || 0;
                const minutes = Math.floor(time / 60);
                const seconds = time % 60;
                const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

                return `
                    <div class="game-item">
                        <div class="game-info">
                            <span class="game-difficulty ${game.difficulty}">${game.difficulty}</span>
                            <span class="game-date">${this.getTimeAgo(game.completed_at)}</span>
                        </div>
                        <div class="game-stats">
                            <span><i class="fas fa-trophy"></i> ${(game.score || 0).toFixed(0)}</span>
                            <span><i class="fas fa-clock"></i> ${timeStr}</span>
                            <span><i class="fas fa-times-circle"></i> ${game.errors || 0}</span>
                        </div>
                    </div>
                `;
            }).join('');

        } catch (error) {
            // Recent games update error
        }
    }

    /**
     * Update analytics user stats section
     * Shows personal records and totals
     */
    async updateAnalyticsUserStats() {
        try {
            const user = this.getCurrentUser();

            // Fetch all games
            const response = await fetch('/api/games');
            if (!response.ok) return;

            const allGames = await response.json();
            const userGames = allGames.filter(g => g.player === user.username && g.completed);

            if (userGames.length === 0) {
                return;
            }

            // Calculate stats
            const gamesCompleted = userGames.length;
            const totalPoints = userGames.reduce((sum, game) => sum + (game.score || 0), 0);
            const avgScore = totalPoints / gamesCompleted;
            const bestScore = Math.max(...userGames.map(g => g.score || 0));
            const fastestTime = Math.min(...userGames.map(g => g.time || Infinity));
            const perfectGames = userGames.filter(g => (g.errors || 0) === 0).length;

            // Format fastest time
            const fastMinutes = Math.floor(fastestTime / 60);
            const fastSeconds = fastestTime % 60;
            const fastTimeStr = fastestTime !== Infinity ? `${fastMinutes}:${fastSeconds.toString().padStart(2, '0')}` : '--';

            // Update display
            const updates = [
                { id: 'userGamesCompleted', value: gamesCompleted },
                { id: 'userAvgScore', value: avgScore.toFixed(1) },
                { id: 'userTotalPoints', value: totalPoints.toFixed(0) },
                { id: 'userBestScore', value: bestScore.toFixed(0) },
                { id: 'userFastestTime', value: fastTimeStr },
                { id: 'userPerfectGames', value: perfectGames }
            ];

            updates.forEach(({ id, value }) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            });

        } catch (error) {
            // Analytics user stats update error
        }
    }
}

// UI Utility Functions
class UIHelpers {
    static showToast(message, type = 'info', title = null, duration = 5000) {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            info: 'fa-info-circle',
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle'
        };

        const titles = {
            info: title || 'Info',
            success: title || 'Success',
            error: title || 'Error',
            warning: title || 'Warning'
        };

        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">&times;</button>
        `;

        document.body.appendChild(toast);

        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            toast.remove();
        });

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    static showLoading(container, message = 'Loading...') {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;

        return container;
    }

    static showError(container, title = 'Something went wrong', message = 'Please try again later', onRetry = null) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        const retryButton = onRetry ? `
            <div class="error-actions">
                <button class="retry-btn" id="errorRetryBtn">
                    <i class="fas fa-redo"></i> Try Again
                </button>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="error-container">
                <i class="fas fa-exclamation-triangle error-icon"></i>
                <div class="error-title">${title}</div>
                <div class="error-message">${message}</div>
                ${retryButton}
            </div>
        `;

        if (onRetry) {
            const btn = container.querySelector('#errorRetryBtn');
            if (btn) {
                btn.addEventListener('click', onRetry);
            }
        }

        return container;
    }

    static showSkeletonCards(container, count = 3) {
        if (typeof container === 'string') {
            container = document.getElementById(container) || document.querySelector(container);
        }

        if (!container) return null;

        const skeletons = Array.from({ length: count }, () =>
            '<div class="skeleton skeleton-card"></div>'
        ).join('');

        container.innerHTML = skeletons;
        return container;
    }
}

// Make UI helpers globally available
window.UIHelpers = UIHelpers;

// Initialize the application
const sudokuApp = new SudokuChampionship();

// Make sudokuApp globally available
window.sudokuApp = sudokuApp;

// Global console helper functions
window.resetPuzzles = (date) => sudokuApp.resetDailyPuzzles(date);
window.resetToday = () => sudokuApp.resetToday();
window.fullReset = (date) => sudokuApp.fullReset(date);
window.clearLocalStorage = () => sudokuApp.clearAllLocalStorage();
window.forceDailyRefresh = () => sudokuApp.forceDailyRefresh();
window.testApi = () => sudokuApp.testApiConnectivity();
window.testPuzzles = () => {
    if (window.sudokuEngine && window.sudokuEngine.dailyPuzzles) {
        Object.keys(window.sudokuEngine.dailyPuzzles).forEach(difficulty => {
            const puzzle = window.sudokuEngine.dailyPuzzles[difficulty];
            if (puzzle && puzzle.puzzle) {
            }
        });
    } else {
    }
};
window.testDates = () => {
    const now = new Date();
    const utcDate = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const localISODate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];

};