/**
 * Leagues Frontend Logic
 * Phase 4 Month 15 - Custom Leagues System
 */

let currentUser = null;
let userLeagueStatus = null;
let officialLeagues = [];  // Fixed typo: was "official Leagues"
let customLeagues = [];
let currentSeasonInfo = null;
let seasonHistory = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {

    // Get current user
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('username-display').textContent = username;

    try {
        // Fetch user data to get ID
        const userResponse = await fetch(`/api/auth?username=${username}`);
        if (!userResponse.ok) {
            throw new Error('Failed to fetch user data');
        }
        currentUser = await userResponse.json();

        // Load all league data
        await loadLeaguesData();

        // Show content
        document.getElementById('loading-container').style.display = 'none';
        document.getElementById('leagues-content').style.display = 'block';

        // Track page view
        if (window.posthog) {
            posthog.capture('leagues_page_viewed', {
                username: username,
                userId: currentUser.profile?.id
            });
        }
    } catch (error) {
        showError(error.message);
    }
});

// Load all leagues data
async function loadLeaguesData() {
    try {
        const userId = currentUser.profile?.id;
        if (!userId) {
            throw new Error('User ID not found');
        }

        // Fetch data in parallel (including season data)
        const [statusResponse, officialResponse, customResponse, seasonResponse, historyResponse] = await Promise.all([
            fetch(`/api/stats?type=leagues-user-status&userId=${userId}`),
            fetch(`/api/stats?type=leagues-official`),
            fetch(`/api/stats?type=leagues-custom&userId=${userId}`),
            fetch(`/api/stats?type=leagues-current-season&userId=${userId}`),
            fetch(`/api/stats?type=leagues-season-history&userId=${userId}&limit=10`)
        ]);

        if (!statusResponse.ok || !officialResponse.ok || !customResponse.ok) {
            throw new Error('Failed to fetch leagues data');
        }

        userLeagueStatus = await statusResponse.json();
        const officialData = await officialResponse.json();
        const customData = await customResponse.json();

        // Season data (may not exist if user not in a league)
        if (seasonResponse.ok) {
            const seasonData = await seasonResponse.json();
            currentSeasonInfo = seasonData.success ? seasonData.data : null;
        }

        if (historyResponse.ok) {
            const historyData = await historyResponse.json();
            seasonHistory = historyData.success ? historyData.data : [];
        }

        officialLeagues = officialData.leagues || [];
        customLeagues = customData.leagues || [];

        // Render UI
        renderUserStatus();
        renderSeasonInfo();
        renderOfficialLeagues();
        renderCustomLeagues();
    } catch (error) {
        throw error;
    }
}

// Render user status card
function renderUserStatus() {
    const container = document.getElementById('user-status-section');

    if (!userLeagueStatus.inLeague) {
        container.innerHTML = `
            <div class="no-league-message">
                <i class="fas fa-info-circle"></i>
                <h3>You're not in a league yet</h3>
                <p>Join an official league or create your own custom league to start competing!</p>
            </div>
        `;
        return;
    }

    const tierColors = {
        bronze: '#cd7f32',
        silver: '#c0c0c0',
        gold: '#ffd700',
        platinum: '#e5e4e2',
        diamond: '#b9f2ff',
        legend: '#ff6b6b'
    };

    const tierColor = tierColors[userLeagueStatus.leagueTier] || '#667eea';

    container.innerHTML = `
        <div style="background: linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%);">
            <h3 style="margin: 0 0 15px 0; font-size: 1.3em;">
                <i class="fas fa-medal"></i> ${userLeagueStatus.leagueName}
            </h3>
            <div class="status-grid">
                <div class="status-item">
                    <strong>Your Rank</strong>
                    <div class="value">#${userLeagueStatus.rank || '-'}</div>
                </div>
                <div class="status-item">
                    <strong>Total Points</strong>
                    <div class="value">${userLeagueStatus.points || 0}</div>
                </div>
                <div class="status-item">
                    <strong>This Week</strong>
                    <div class="value">${userLeagueStatus.weeklyPoints || 0} pts</div>
                </div>
                <div class="status-item">
                    <strong>Puzzles</strong>
                    <div class="value">${userLeagueStatus.weeklyPuzzles || 0}</div>
                </div>
            </div>
            <div style="margin-top: 20px;">
                <button class="btn-leave" onclick="handleLeaveLeague()">
                    <i class="fas fa-sign-out-alt"></i> Leave League
                </button>
            </div>
        </div>
    `;
}

// Render season info card
function renderSeasonInfo() {
    const container = document.getElementById('season-info-section');

    if (!container) {
        // Section doesn't exist in HTML yet - will add it
        return;
    }

    if (!currentSeasonInfo) {
        container.innerHTML = `
            <div class="no-season-message">
                <i class="fas fa-calendar-times"></i>
                <p>No active season - join a league to participate!</p>
            </div>
        `;
        return;
    }

    const season = currentSeasonInfo.season;
    const stats = currentSeasonInfo.userStats;
    const zones = currentSeasonInfo.zones;

    // Calculate days/hours remaining
    const now = new Date();
    const endDate = new Date(season.endDate);
    const timeRemaining = endDate - now;
    const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Determine zone status and styling
    let zoneClass = '';
    let zoneText = '';
    let zoneIcon = '';

    if (stats.zone === 'promotion') {
        zoneClass = 'promotion-zone';
        zoneText = 'Promotion Zone';
        zoneIcon = 'fa-arrow-up';
    } else if (stats.zone === 'demotion') {
        zoneClass = 'demotion-zone';
        zoneText = 'Demotion Zone';
        zoneIcon = 'fa-arrow-down';
    } else {
        zoneClass = 'safe-zone';
        zoneText = 'Safe Zone';
        zoneIcon = 'fa-shield-alt';
    }

    container.innerHTML = `
        <div class="season-card">
            <div class="season-header">
                <h3><i class="fas fa-trophy"></i> Season ${season.number}</h3>
                <div class="season-countdown ${daysRemaining <= 1 ? 'urgent' : ''}">
                    <i class="fas fa-clock"></i>
                    <span>${daysRemaining}d ${hoursRemaining}h remaining</span>
                </div>
            </div>

            <div class="season-stats-grid">
                <div class="season-stat">
                    <strong>Your Rank</strong>
                    <div class="value">#${stats.rank || '-'} / ${stats.totalMembers}</div>
                </div>
                <div class="season-stat">
                    <strong>Season Points</strong>
                    <div class="value">${stats.points || 0}</div>
                </div>
                <div class="season-stat ${zoneClass}">
                    <strong>Status</strong>
                    <div class="value">
                        <i class="fas ${zoneIcon}"></i> ${zoneText}
                    </div>
                </div>
            </div>

            <div class="zone-info">
                <div class="zone-details">
                    <div class="zone-line promotion">
                        <i class="fas fa-arrow-up"></i>
                        Top ${zones.promotionCutoff} promoted
                    </div>
                    <div class="zone-line safe">
                        <i class="fas fa-minus"></i>
                        Middle ${stats.totalMembers - zones.promotionCutoff - (stats.totalMembers - zones.demotionCutoff)} stay
                    </div>
                    <div class="zone-line demotion">
                        <i class="fas fa-arrow-down"></i>
                        Bottom ${stats.totalMembers - zones.demotionCutoff} demoted
                    </div>
                </div>
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <button class="btn-secondary" onclick="viewSeasonHistory()">
                    <i class="fas fa-history"></i> View Season History
                </button>
            </div>
        </div>
    `;

    // Start countdown timer update
    startCountdownTimer(endDate);
}

// Update countdown timer every minute
function startCountdownTimer(endDate) {
    const updateCountdown = () => {
        const now = new Date();
        const timeRemaining = endDate - now;

        if (timeRemaining <= 0) {
            // Season ended, reload data
            loadLeaguesData();
            return;
        }

        const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const countdownEl = document.querySelector('.season-countdown span');
        if (countdownEl) {
            countdownEl.textContent = `${daysRemaining}d ${hoursRemaining}h remaining`;

            // Add urgent class if less than 2 days
            const parentEl = countdownEl.parentElement;
            if (daysRemaining <= 1) {
                parentEl.classList.add('urgent');
            } else {
                parentEl.classList.remove('urgent');
            }
        }
    };

    // Update every minute
    const intervalId = setInterval(updateCountdown, 60000);

    // Store interval ID for cleanup
    window.seasonCountdownInterval = intervalId;
}

// View season history modal
function viewSeasonHistory() {
    if (seasonHistory.length === 0) {
        alert('No season history available yet');
        return;
    }

    const modal = document.getElementById('season-history-modal') || createSeasonHistoryModal();

    const historyHTML = seasonHistory.map((season, index) => {
        let outcomeClass = '';
        let outcomeIcon = '';
        let outcomeText = season.outcome;

        if (season.outcome === 'promoted') {
            outcomeClass = 'promoted';
            outcomeIcon = 'fa-arrow-up';
            outcomeText = `Promoted to ${season.new_tier}`;
        } else if (season.outcome === 'demoted') {
            outcomeClass = 'demoted';
            outcomeIcon = 'fa-arrow-down';
            outcomeText = `Demoted to ${season.new_tier}`;
        } else {
            outcomeClass = 'stayed';
            outcomeIcon = 'fa-minus';
            outcomeText = 'Stayed in league';
        }

        return `
            <div class="history-item">
                <div class="history-header">
                    <strong>Season ${season.season_number}</strong>
                    <span class="outcome-badge ${outcomeClass}">
                        <i class="fas ${outcomeIcon}"></i> ${outcomeText}
                    </span>
                </div>
                <div class="history-stats">
                    <span><strong>Rank:</strong> #${season.final_rank}</span>
                    <span><strong>Points:</strong> ${season.final_points}</span>
                    <span><strong>League:</strong> ${season.league_name}</span>
                </div>
                <div class="history-date">${new Date(season.end_date).toLocaleDateString()}</div>
            </div>
        `;
    }).join('');

    modal.querySelector('.modal-body').innerHTML = historyHTML || '<p>No history available</p>';
    modal.style.display = 'block';

    // Track with PostHog
    if (window.posthog) {
        posthog.capture('season_history_viewed', {
            username: currentUser.username,
            seasonsCount: seasonHistory.length
        });
    }
}

// Create season history modal
function createSeasonHistoryModal() {
    const modal = document.createElement('div');
    modal.id = 'season-history-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-history"></i> Season History</h2>
                <button class="modal-close" onclick="closeSeasonHistoryModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body"></div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

// Close season history modal
function closeSeasonHistoryModal() {
    const modal = document.getElementById('season-history-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Render official leagues
function renderOfficialLeagues() {
    const container = document.getElementById('official-leagues-grid');

    if (officialLeagues.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No official leagues available</p>';
        return;
    }

    container.innerHTML = officialLeagues.map(league => {
        const canJoin = !userLeagueStatus.inLeague && !league.isFull;
        const isFull = league.isFull;

        return `
            <div class="league-card ${league.tier}">
                <div class="league-header">
                    <h3 class="league-name">${league.name}</h3>
                    <span class="league-tier-badge ${league.tier}">${league.tier}</span>
                </div>
                <p class="league-description">${league.description}</p>
                <div class="league-stats">
                    <div class="league-members ${isFull ? 'members-full' : ''}">
                        <i class="fas fa-users"></i>
                        <span>${league.memberCount} / ${league.maxMembers}</span>
                        ${isFull ? '<span style="margin-left: 8px; color: #ff6b6b; font-weight: 600;">FULL</span>' : ''}
                    </div>
                    <div class="league-actions">
                        <button class="btn-view-rankings" onclick="viewLeagueRankings(${league.id}, '${league.name}')">
                            <i class="fas fa-list-ol"></i> Rankings
                        </button>
                        ${canJoin ? `
                            <button class="btn-join" onclick="handleJoinLeague(${league.id})">
                                <i class="fas fa-sign-in-alt"></i> Join
                            </button>
                        ` : ''}
                        ${isFull && !userLeagueStatus.inLeague ? `
                            <button class="btn-join" disabled>
                                Full
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render custom leagues
function renderCustomLeagues() {
    const container = document.getElementById('custom-leagues-grid');

    if (customLeagues.length === 0) {
        container.innerHTML = `
            <div class="no-league-message">
                <i class="fas fa-users"></i>
                <h3>No custom leagues yet</h3>
                <p>Create your own league and invite friends to compete!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = customLeagues.map(league => {
        const canJoin = !userLeagueStatus.inLeague && !league.isFull;
        const isFull = league.isFull;
        const isCreator = currentUser.profile?.id === league.creatorId;

        return `
            <div class="league-card">
                <div class="league-header">
                    <h3 class="league-name">${league.name}</h3>
                    ${isCreator ? '<span class="league-tier-badge legend">OWNER</span>' : ''}
                </div>
                <p class="league-description">${league.description || 'No description provided.'}</p>
                <div style="margin: 15px 0; font-size: 0.9em; color: #666;">
                    <i class="fas fa-user"></i> Created by ${league.creatorDisplayName || league.creatorUsername}
                </div>
                <div class="league-stats">
                    <div class="league-members ${isFull ? 'members-full' : ''}">
                        <i class="fas fa-users"></i>
                        <span>${league.memberCount} / ${league.maxMembers}</span>
                        ${isFull ? '<span style="margin-left: 8px; color: #ff6b6b; font-weight: 600;">FULL</span>' : ''}
                    </div>
                    <div class="league-actions">
                        <button class="btn-view-rankings" onclick="viewLeagueRankings(${league.id}, '${league.name}')">
                            <i class="fas fa-list-ol"></i> Rankings
                        </button>
                        ${canJoin ? `
                            <button class="btn-join" onclick="handleJoinLeague(${league.id})">
                                <i class="fas fa-sign-in-alt"></i> Join
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Switch tabs
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.closest('.tab-btn').classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Join league
async function handleJoinLeague(leagueId) {
    if (!confirm('Are you sure you want to join this league?')) {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'leagues-join',
                userId: currentUser.profile.id,
                leagueId: leagueId
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to join league');
        }

        const result = await response.json();

        // Track event
        if (window.posthog) {
            posthog.capture('league_joined', {
                userId: currentUser.profile.id,
                leagueId: leagueId,
                leagueTier: result.leagueTier
            });
        }

        alert(`Successfully joined ${result.leagueTier} league!`);

        // Reload data
        await loadLeaguesData();
    } catch (error) {
        alert(`Failed to join league: ${error.message}`);
    }
}

// Leave league
async function handleLeaveLeague() {
    if (!confirm('Are you sure you want to leave your current league? Your progress will be reset.')) {
        return;
    }

    try {
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'leagues-leave',
                userId: currentUser.profile.id
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to leave league');
        }

        // Track event
        if (window.posthog) {
            posthog.capture('league_left', {
                userId: currentUser.profile.id
            });
        }

        alert('Successfully left league');

        // Reload data
        await loadLeaguesData();
    } catch (error) {
        alert(`Failed to leave league: ${error.message}`);
    }
}

// View league rankings
async function viewLeagueRankings(leagueId, leagueName) {
    try {
        const response = await fetch(`/api/stats?type=leagues-rankings&leagueId=${leagueId}&limit=100`);

        if (!response.ok) {
            throw new Error('Failed to fetch rankings');
        }

        const data = await response.json();
        const rankings = data.rankings || [];

        // Update modal title
        document.getElementById('rankings-modal-title').textContent = `${leagueName} - Rankings`;

        // Render rankings
        const container = document.getElementById('rankings-list');

        if (rankings.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 40px; color: #666;">No members yet</p>';
        } else {
            container.innerHTML = rankings.map(item => {
                const isTop3 = item.rank <= 3;
                const positionClass = item.rank === 1 ? 'first' : item.rank === 2 ? 'second' : item.rank === 3 ? 'third' : '';

                return `
                    <div class="ranking-item ${isTop3 ? 'top-3' : ''}">
                        <div class="ranking-position ${positionClass}">
                            ${item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                        </div>
                        <div class="ranking-user">
                            <div class="ranking-avatar">
                                ${item.displayName ? item.displayName[0].toUpperCase() : item.username[0].toUpperCase()}
                            </div>
                            <div>
                                <div class="ranking-username">${item.displayName || item.username}</div>
                                <div style="font-size: 0.85em; color: #666;">${item.weeklyPuzzles} puzzles this week</div>
                            </div>
                        </div>
                        <div class="ranking-stats">
                            <div class="ranking-stat">
                                <span class="ranking-stat-label">Total Points</span>
                                <span class="ranking-stat-value">${item.points}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Show modal
        document.getElementById('rankings-modal').style.display = 'flex';

        // Track event
        if (window.posthog) {
            posthog.capture('league_rankings_viewed', {
                leagueId: leagueId,
                leagueName: leagueName
            });
        }
    } catch (error) {
        alert('Failed to load rankings');
    }
}

// Close rankings modal
function closeRankingsModal() {
    document.getElementById('rankings-modal').style.display = 'none';
}

// Show create league modal
function showCreateLeagueModal() {
    // Check if user has Premium
    const subscriptionTier = currentUser.profile?.subscription_tier || 'free';
    if (subscriptionTier !== 'premium' && subscriptionTier !== 'founder') {
        if (confirm('Custom leagues are a Premium feature. Would you like to upgrade to Premium?')) {
            window.location.href = 'pricing.html'; // Assuming pricing page exists
        }
        return;
    }

    document.getElementById('create-league-modal').style.display = 'flex';
}

// Close create league modal
function closeCreateLeagueModal() {
    document.getElementById('create-league-modal').style.display = 'none';
    document.getElementById('create-league-form').reset();
}

// Handle create league
async function handleCreateLeague(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = {
        type: 'leagues-create',
        creatorId: currentUser.profile.id,
        name: formData.get('name'),
        description: formData.get('description'),
        maxMembers: parseInt(formData.get('maxMembers')),
        isPublic: formData.get('isPublic') === 'on'
    };

    try {
        const response = await fetch('/api/stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create league');
        }

        const result = await response.json();

        // Track event
        if (window.posthog) {
            posthog.capture('league_created', {
                userId: currentUser.profile.id,
                leagueId: result.leagueId,
                leagueName: data.name
            });
        }

        alert(`League "${data.name}" created successfully!`);

        // Close modal and reload data
        closeCreateLeagueModal();
        await loadLeaguesData();

        // Switch to custom leagues tab
        document.querySelectorAll('.tab-btn')[1].click();
    } catch (error) {
        alert(`Failed to create league: ${error.message}`);
    }
}

// Logout
function logout() {
    localStorage.removeItem('username');
    window.location.href = 'login.html';
}

// Show error
function showError(message) {
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('error-container').style.display = 'block';
    document.getElementById('error-message').textContent = message;
}

// Close modal on outside click
window.onclick = function(event) {
    const rankingsModal = document.getElementById('rankings-modal');
    const createModal = document.getElementById('create-league-modal');

    if (event.target === rankingsModal) {
        closeRankingsModal();
    }
    if (event.target === createModal) {
        closeCreateLeagueModal();
    }
};
