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

        // Get last 30 entries
        const recentEntries = entries.slice(0, 30).reverse();
        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const scores = recentEntries.map(entry => entry.total_score || 0);

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
                        data: scores,
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

        // Calculate average times by difficulty
        const difficulties = ['easy', 'medium', 'hard'];
        const avgTimes = {};

        difficulties.forEach(difficulty => {
            const times = entries
                .filter(entry => !entry.dnf?.[difficulty] && entry.times?.[difficulty] > 0)
                .map(entry => entry.times[difficulty]);

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
                        label: 'Average Time (minutes)',
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

        // Get last 30 entries for error trends
        const recentEntries = entries.slice(0, 30).reverse();
        const labels = recentEntries.map(entry => new Date(entry.date).toLocaleDateString());
        const errors = recentEntries.map(entry => {
            return (entry.errors?.easy || 0) +
                   (entry.errors?.medium || 0) +
                   (entry.errors?.hard || 0);
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
                        data: errors,
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
        this.updatePerformanceStats(entries);
        this.updateProgressStats(entries);
        this.updateCompetitiveStats(entries);
    }

    updatePerformanceStats(entries) {
        const avgScoreEl = document.getElementById('userAvgScore');
        const totalGamesEl = document.getElementById('totalGamesCount');

        if (!avgScoreEl || !totalGamesEl) return;

        if (entries.length === 0) {
            avgScoreEl.textContent = '--';
            totalGamesEl.textContent = '0 games total';
            return;
        }

        // Calculate average score
        const avgScore = Math.round(entries.reduce((sum, entry) =>
            sum + (entry.total_score || 0), 0) / entries.length);

        avgScoreEl.textContent = avgScore;
        totalGamesEl.textContent = `${entries.length} games total`;
    }

    updateProgressStats(entries) {
        const totalPointsEl = document.getElementById('userTotalPoints');
        const progressNoteEl = document.getElementById('progressNote');

        if (!totalPointsEl) return;

        if (entries.length === 0) {
            totalPointsEl.textContent = '--';
            if (progressNoteEl) progressNoteEl.textContent = 'No games yet';
            return;
        }

        // Calculate all-time total points
        const totalPoints = entries.reduce((sum, entry) => sum + (entry.total_score || 0), 0);
        totalPointsEl.textContent = totalPoints.toLocaleString();

        // Show progress message
        if (progressNoteEl) {
            const avgScore = Math.round(totalPoints / entries.length);
            progressNoteEl.textContent = `Average: ${avgScore} points per game`;
        }
    }

    updateCompetitiveStats(entries) {
        const highestScoreEl = document.getElementById('userHighestScore');
        const bestStreakEl = document.getElementById('userBestStreak');
        const perfectGamesEl = document.getElementById('userPerfectGames');

        if (!highestScoreEl) return;

        if (entries.length === 0) {
            if (highestScoreEl) highestScoreEl.textContent = '--';
            if (bestStreakEl) bestStreakEl.textContent = '--';
            if (perfectGamesEl) perfectGamesEl.textContent = '--';
            return;
        }

        // Calculate highest score
        const highestScore = Math.max(...entries.map(entry => entry.total_score || 0));
        if (highestScoreEl) {
            highestScoreEl.textContent = Math.round(highestScore);
        }

        // Calculate best streak (consecutive days with scores above average)
        const avgScore = entries.reduce((sum, entry) => sum + (entry.total_score || 0), 0) / entries.length;
        let currentStreak = 0;
        let bestStreak = 0;

        for (const entry of entries) {
            if ((entry.total_score || 0) >= avgScore) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }

        if (bestStreakEl) {
            bestStreakEl.textContent = bestStreak;
        }

        // Calculate perfect games (zero errors)
        const perfectGames = entries.filter(entry => {
            const totalErrors = (entry.errors?.easy || 0) +
                              (entry.errors?.medium || 0) +
                              (entry.errors?.hard || 0);
            return totalErrors === 0;
        }).length;

        if (perfectGamesEl) {
            perfectGamesEl.textContent = perfectGames;
        }
    }

    showNoDataMessage() {
        const chartContainers = ['scoreChart', 'timeChart', 'errorChart'];
        chartContainers.forEach(chartId => {
            const container = document.getElementById(chartId);
            if (container) {
                container.innerHTML = '<div class="no-data-message">No data available. Start playing to see analytics!</div>';
            }
        });
    }

    getDetailedAnalytics(entries) {
        if (entries.length === 0) return null;

        const difficulties = ['easy', 'medium', 'hard'];

        // Score stats
        const scores = entries.map(entry => entry.total_score || 0);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const bestScore = Math.max(...scores);
        const worstScore = Math.min(...scores);

        // Time stats by difficulty
        const timeStats = {};
        difficulties.forEach(difficulty => {
            const times = entries
                .filter(entry => !entry.dnf?.[difficulty] && entry.times?.[difficulty] > 0)
                .map(entry => entry.times[difficulty]);

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
        const totalErrors = entries.reduce((sum, entry) => {
            return sum + (entry.errors?.easy || 0) + (entry.errors?.medium || 0) + (entry.errors?.hard || 0);
        }, 0);

        const perfectGames = entries.filter(entry => {
            const errors = (entry.errors?.easy || 0) + (entry.errors?.medium || 0) + (entry.errors?.hard || 0);
            return errors === 0;
        }).length;

        return {
            overview: {
                totalGames: entries.length,
                dateRange: {
                    from: entries[entries.length - 1].date,
                    to: entries[0].date
                }
            },
            performance: {
                scores: {
                    average: Math.round(avgScore),
                    best: bestScore,
                    worst: worstScore
                },
                times: timeStats,
                errors: {
                    total: totalErrors,
                    average: totalErrors / entries.length,
                    perfectGames: perfectGames
                }
            }
        };
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
