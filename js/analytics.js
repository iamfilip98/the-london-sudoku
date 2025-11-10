class AnalyticsManager {
    constructor() {
        this.charts = {};
        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            layout: {
                padding: {
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#ffffff',
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: window.innerWidth < 768 ? 10 : 12
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#b0b8c1',
                        maxTicksLimit: window.innerWidth < 768 ? 5 : 10,
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#b0b8c1',
                        maxTicksLimit: window.innerWidth < 768 ? 4 : 6,
                        font: {
                            size: window.innerWidth < 768 ? 9 : 11
                        }
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        };
    }

    updateCharts(entries) {
        if (entries.length === 0) {
            this.showNoDataMessage();
            return;
        }

        this.updateScoreChart(entries);
        this.updateTimeChart(entries);
        this.updateErrorChart(entries);
        this.updateStats(entries);
    }

    updateScoreChart(entries) {
        const ctx = document.getElementById('scoreChart');
        if (!ctx) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        // Get last 30 personal entries
        const recentEntries = playerEntries.slice(0, 30).reverse();

        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const personalScores = recentEntries.map(entry => {
            const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
            return playerData?.scores?.total || 0;
        });

        if (this.charts.scoreChart) {
            this.charts.scoreChart.destroy();
        }

        this.charts.scoreChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Your Score',
                        data: personalScores,
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Score Trends Over Time',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    updateTimeChart(entries) {
        const ctx = document.getElementById('timeChart');
        if (!ctx) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        // Calculate average times by difficulty for current player
        const difficulties = ['easy', 'medium', 'hard'];
        const avgTimes = {};

        difficulties.forEach(difficulty => {
            const times = playerEntries
                .filter(entry => {
                    const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
                    return playerData?.dnf?.[difficulty] === false && playerData?.times?.[difficulty] !== null;
                })
                .map(entry => {
                    const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
                    return playerData.times[difficulty];
                });

            avgTimes[difficulty] = times.length > 0 ?
                times.reduce((sum, time) => sum + time, 0) / times.length : 0;
        });

        if (this.charts.timeChart) {
            this.charts.timeChart.destroy();
        }

        this.charts.timeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Easy', 'Medium', 'Hard'],
                datasets: [
                    {
                        label: 'Your Average (minutes)',
                        data: difficulties.map(diff => Math.round(avgTimes[diff] / 60 * 100) / 100),
                        backgroundColor: 'rgba(78, 205, 196, 0.8)',
                        borderColor: '#4ecdc4',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Average Completion Times',
                        color: '#ffffff'
                    }
                }
            }
        });
    }

    updateErrorChart(entries) {
        const ctx = document.getElementById('errorChart');
        if (!ctx) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        // Get last 30 personal entries for error trends
        const recentEntries = playerEntries.slice(0, 30).reverse();

        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const personalErrors = recentEntries.map(entry => {
            const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
            return (playerData?.errors?.easy || 0) +
                   (playerData?.errors?.medium || 0) +
                   (playerData?.errors?.hard || 0);
        });

        if (this.charts.errorChart) {
            this.charts.errorChart.destroy();
        }

        this.charts.errorChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Your Errors',
                        data: personalErrors,
                        borderColor: '#fee140',
                        backgroundColor: 'rgba(254, 225, 64, 0.1)',
                        tension: 0.4
                    }
                ]
            },
            options: {
                ...this.chartOptions,
                plugins: {
                    ...this.chartOptions.plugins,
                    title: {
                        display: true,
                        text: 'Error Trends Over Time',
                        color: '#ffffff'
                    }
                },
                scales: {
                    ...this.chartOptions.scales,
                    y: {
                        ...this.chartOptions.scales.y,
                        beginAtZero: true
                    }
                }
            }
        });
    }

    updateStats(entries) {
        this.updateWinRateStats(entries);
        this.updatePerformanceStats(entries);
        this.updateRecentFormStats(entries);
        this.updateCompetitiveStats(entries);
    }

    updateWinRateStats(entries) {
        const completionRateEl = document.getElementById('personalCompletionRate');
        const totalGamesEl = document.getElementById('totalGamesCount');

        if (!completionRateEl || !totalGamesEl) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        if (playerEntries.length === 0) {
            completionRateEl.textContent = '--';
            totalGamesEl.textContent = '0 games completed';
            return;
        }

        // Calculate completion rate (all entries are completed by definition)
        const completionRate = 100;

        completionRateEl.textContent = `${completionRate}%`;
        totalGamesEl.textContent = `${playerEntries.length} games completed`;
    }

    updatePerformanceStats(entries) {
        const avgScoreEl = document.getElementById('personalAvgScore');

        if (!avgScoreEl) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        if (playerEntries.length === 0) {
            avgScoreEl.textContent = '--';
            return;
        }

        // Calculate average score for current player
        const totalScore = playerEntries.reduce((sum, entry) => {
            const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
            return sum + (playerData?.scores?.total || 0);
        }, 0);

        const avgScore = Math.round(totalScore / playerEntries.length);
        avgScoreEl.textContent = avgScore;
    }

    updateRecentFormStats(entries) {
        const totalXPEl = document.getElementById('personalTotalXP');

        if (!totalXPEl) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        if (playerEntries.length === 0) {
            totalXPEl.textContent = '--';
            return;
        }

        // Calculate total XP for current player
        const totalXP = playerEntries.reduce((sum, entry) => {
            const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;
            return sum + (playerData?.scores?.total || 0);
        }, 0);

        totalXPEl.textContent = totalXP.toLocaleString();
    }

    updateCompetitiveStats(entries) {
        const bestScoreEl = document.getElementById('personalBestScore');
        const fastestTimeEl = document.getElementById('personalFastestTime');
        const perfectGamesEl = document.getElementById('personalPerfectGames');

        if (!bestScoreEl || !fastestTimeEl || !perfectGamesEl) return;

        const currentPlayer = sessionStorage.getItem('currentPlayer');
        if (!currentPlayer) return;

        // Filter entries for current player
        const playerEntries = entries.filter(entry =>
            (entry.faidao && entry.faidao.player === currentPlayer) ||
            (entry.filip && entry.filip.player === currentPlayer)
        );

        if (playerEntries.length === 0) {
            bestScoreEl.textContent = '--';
            fastestTimeEl.textContent = '--';
            perfectGamesEl.textContent = '0';
            return;
        }

        // Calculate best score (highest total score)
        let bestScore = 0;
        let fastestTime = Infinity;
        let perfectGames = 0;

        playerEntries.forEach(entry => {
            const playerData = entry.faidao?.player === currentPlayer ? entry.faidao : entry.filip;

            if (!playerData) return;

            // Track best score
            const totalScore = playerData.scores?.total || 0;
            if (totalScore > bestScore) {
                bestScore = totalScore;
            }

            // Track fastest time (across all difficulties)
            const time = playerData.time || 0;
            if (time > 0 && time < fastestTime) {
                fastestTime = time;
            }

            // Track perfect games (0 errors)
            const errors = playerData.errors || 0;
            if (errors === 0) {
                perfectGames++;
            }
        });

        // Update personal stats
        bestScoreEl.textContent = bestScore > 0 ? Math.round(bestScore) : '--';

        if (fastestTime !== Infinity) {
            const minutes = Math.floor(fastestTime / 60);
            const seconds = fastestTime % 60;
            fastestTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            fastestTimeEl.textContent = '--';
        }

        perfectGamesEl.textContent = perfectGames;
    }

    calculateWinStreak(entries, player) {
        let streak = 0;
        for (const entry of entries) {
            const playerScore = entry[player]?.scores?.total || 0;
            const opponentScore = entry[player === 'faidao' ? 'filip' : 'faidao']?.scores?.total || 0;

            if (playerScore > opponentScore) {
                streak++;
            } else {
                break;
            }
        }
        return streak;
    }

    updateTrendElement(element, trend) {
        if (!element) return;

        const trendClass = trend > 0 ? 'positive' : trend < 0 ? 'negative' : 'neutral';
        const icon = trend > 0 ? 'fa-arrow-up' : trend < 0 ? 'fa-arrow-down' : 'fa-minus';

        element.className = `stat-trend ${trendClass}`;
        element.innerHTML = `<i class="fas ${icon}"></i><span>${Math.abs(Math.round(trend))}</span>`;
    }

    updateStreakTrend(element, streak) {
        if (!element) return;

        const trendClass = streak > 2 ? 'positive' : streak === 0 ? 'negative' : 'neutral';
        const icon = streak > 2 ? 'fa-fire' : streak === 0 ? 'fa-ice-cube' : 'fa-minus';

        element.className = `stat-trend ${trendClass}`;
        element.innerHTML = `<i class="fas ${icon}"></i><span>${streak}W</span>`;
    }

    showNoDataMessage() {
        const chartContainers = ['scoreChart', 'timeChart', 'errorChart'];
        chartContainers.forEach(chartId => {
            const container = document.getElementById(chartId);
            if (container) {
                container.innerHTML = '<div class="no-data-message">No data available. Start competing to see analytics!</div>';
            }
        });
    }

    getDetailedAnalytics(entries) {
        if (entries.length === 0) return null;

        const players = ['faidao', 'filip'];
        const difficulties = ['easy', 'medium', 'hard'];

        const analytics = {
            overview: {
                totalGames: entries.length,
                dateRange: {
                    from: entries[entries.length - 1].date,
                    to: entries[0].date
                }
            },
            players: {}
        };

        players.forEach(player => {
            const playerEntries = entries.map(entry => entry[player]);

            // Win stats
            const wins = entries.filter(entry =>
                entry[player].scores.total > entry[player === 'faidao' ? 'filip' : 'faidao'].scores.total
            ).length;

            // Score stats
            const scores = playerEntries.map(p => p.scores.total);
            const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            const bestScore = Math.max(...scores);
            const worstScore = Math.min(...scores);

            // Time stats by difficulty
            const timeStats = {};
            difficulties.forEach(difficulty => {
                const times = playerEntries
                    .filter(p => !p.dnf[difficulty] && p.times[difficulty] !== null)
                    .map(p => p.times[difficulty]);

                if (times.length > 0) {
                    timeStats[difficulty] = {
                        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
                        bestTime: Math.min(...times),
                        worstTime: Math.max(...times),
                        completionRate: (times.length / entries.length) * 100
                    };
                }
            });

            // Error stats
            const totalErrors = playerEntries.reduce((sum, p) => {
                return sum + (p.errors.easy || 0) + (p.errors.medium || 0) + (p.errors.hard || 0);
            }, 0);

            analytics.players[player] = {
                wins,
                winRate: (wins / entries.length) * 100,
                scores: {
                    average: Math.round(avgScore),
                    best: bestScore,
                    worst: worstScore
                },
                times: timeStats,
                errors: {
                    total: totalErrors,
                    average: totalErrors / entries.length,
                    perfectGames: playerEntries.filter(p =>
                        (p.errors.easy || 0) + (p.errors.medium || 0) + (p.errors.hard || 0) === 0
                    ).length
                }
            };
        });

        return analytics;
    }

    exportAnalytics(entries) {
        const analytics = this.getDetailedAnalytics(entries);
        if (!analytics) return;

        const dataStr = JSON.stringify(analytics, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'sudoku-analytics.json';
        link.click();

        URL.revokeObjectURL(url);
    }
}

// Initialize analytics manager
window.analyticsManager = new AnalyticsManager();