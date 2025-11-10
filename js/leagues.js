/**
 * Leagues Frontend Logic
 * Phase 4 Month 15 - Custom Leagues System
 */

let currentUser = null;
let userLeagueStatus = null;
let official Leagues = [];
let customLeagues = [];

// Initialize page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Leagues page loaded');

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
        console.error('Failed to load leagues:', error);
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

        // Fetch data in parallel
        const [statusResponse, officialResponse, customResponse] = await Promise.all([
            fetch(`/api/stats?type=leagues-user-status&userId=${userId}`),
            fetch(`/api/stats?type=leagues-official`),
            fetch(`/api/stats?type=leagues-custom&userId=${userId}`)
        ]);

        if (!statusResponse.ok || !officialResponse.ok || !customResponse.ok) {
            throw new Error('Failed to fetch leagues data');
        }

        userLeagueStatus = await statusResponse.json();
        const officialData = await officialResponse.json();
        const customData = await customResponse.json();

        officialLeagues = officialData.leagues || [];
        customLeagues = customData.leagues || [];

        // Render UI
        renderUserStatus();
        renderOfficialLeagues();
        renderCustomLeagues();
    } catch (error) {
        console.error('Failed to load leagues data:', error);
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
        console.error('Failed to join league:', error);
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
        console.error('Failed to leave league:', error);
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
        console.error('Failed to load rankings:', error);
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
        console.error('Failed to create league:', error);
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
