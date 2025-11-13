/**
 * BATTLE PASS UI MANAGER
 *
 * Handles the battle pass page functionality:
 * - Loading season and user progress
 * - Displaying tier track and rewards
 * - Claiming rewards
 * - Showing leaderboard
 *
 * Version: 1.0
 * Created: November 2025
 */

// Global state
let currentUser = null;
let battlePassData = null;
let allTiers = [];
let currentTrack = 'all'; // 'all', 'free', 'premium'
let pendingRewardClaim = null;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Get current user
        currentUser = await getCurrentUser();
        if (!currentUser) {
            window.location.href = 'auth.html';
            return;
        }

        // Display username
        document.getElementById('username-display').textContent = currentUser.username;

        // Load battle pass data
        await loadBattlePass();

        // Track page view
        if (typeof Monitoring !== 'undefined') {
            Monitoring.trackPageView('Battle Pass');
        }
    } catch (error) {
        showError('Failed to load battle pass. Please try again.');
    }
});

// =====================================================
// USER AUTHENTICATION
// =====================================================

async function getCurrentUser() {
    // Check session storage for user
    const userStr = sessionStorage.getItem('currentUser');
    if (userStr) {
        return JSON.parse(userStr);
    }

    // Check localStorage for anonymous session
    const anonymousSession = localStorage.getItem('anonymous_session_id');
    if (anonymousSession) {
        return { username: 'anonymous', id: null, anonymous: true };
    }

    return null;
}

function logout() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'auth.html';
}

// =====================================================
// DATA LOADING
// =====================================================

async function loadBattlePass() {
    try {
        showLoading();

        // Load user progress
        const progressResponse = await fetch(`/api/stats?type=battle-pass&userId=${currentUser.id}`);
        if (!progressResponse.ok) {
            if (progressResponse.status === 404) {
                showNoSeason();
                return;
            }
            throw new Error('Failed to load battle pass progress');
        }

        battlePassData = await progressResponse.json();

        // Load all tiers
        const tiersResponse = await fetch('/api/stats?type=battle-pass-tiers');
        if (!tiersResponse.ok) {
            throw new Error('Failed to load tiers');
        }

        const tiersData = await tiersResponse.json();
        allTiers = tiersData.tiers || [];

        // Render the page
        renderBattlePass();

        // Load leaderboard
        await loadLeaderboard();

        hideLoading();
        document.getElementById('battle-pass-content').style.display = 'block';

    } catch (error) {
        showError(error.message || 'Failed to load battle pass');
    }
}

async function loadLeaderboard() {
    try {
        const response = await fetch('/api/stats?type=battle-pass-leaderboard&limit=50');
        if (!response.ok) {
            throw new Error('Failed to load leaderboard');
        }

        const data = await response.json();
        renderLeaderboard(data.leaderboard || []);
    } catch (error) {
    }
}

// =====================================================
// RENDERING
// =====================================================

function renderBattlePass() {
    if (!battlePassData) return;

    const { season, progress, nextTier } = battlePassData;

    // Render season header
    document.getElementById('season-name').textContent = season.name;
    document.getElementById('season-duration').textContent =
        `${new Date(season.startDate).toLocaleDateString()} - ${new Date(season.endDate).toLocaleDateString()}`;
    document.getElementById('days-remaining').textContent =
        `${season.daysRemaining} days remaining`;

    // Show premium or free badge
    if (progress.hasPremium) {
        document.getElementById('premium-badge').style.display = 'flex';
        document.getElementById('free-badge').style.display = 'none';
    } else {
        document.getElementById('premium-badge').style.display = 'none';
        document.getElementById('free-badge').style.display = 'flex';
    }

    // Render progress overview
    document.getElementById('current-tier').textContent = progress.currentTier;
    document.getElementById('current-xp').textContent = progress.currentXP.toLocaleString();
    document.getElementById('next-tier-xp').textContent = nextTier.xpForNextTier.toLocaleString();
    document.getElementById('xp-remaining').textContent = nextTier.xpToNextTier.toLocaleString();

    // Update progress bar
    const progressPercent = nextTier.percentToNext;
    document.getElementById('xp-progress-bar').style.width = `${progressPercent}%`;

    // Calculate stats
    const totalXP = progress.currentXP;
    const tokensEarned = calculateTokensEarned(progress);
    const rewardsClaimed = (progress.claimedFreeTiers?.length || 0) +
                          (progress.claimedPremiumTiers?.length || 0);

    document.getElementById('total-xp').textContent = totalXP.toLocaleString();
    document.getElementById('tokens-earned').textContent = tokensEarned.toLocaleString();
    document.getElementById('rewards-claimed').textContent = rewardsClaimed;

    // Render tier track
    renderTierTrack();
}

function renderTierTrack() {
    const container = document.getElementById('tier-track-container');
    container.innerHTML = '';

    // Filter tiers based on current track
    let tiersToShow = allTiers;
    if (currentTrack === 'free') {
        tiersToShow = allTiers.filter(tier =>
            tier.tierNumber % 20 === 0 // Free rewards every 20 tiers
        );
    } else if (currentTrack === 'premium') {
        tiersToShow = allTiers.filter(tier =>
            tier.premiumRewards && tier.premiumRewards.length > 0
        );
    }

    tiersToShow.forEach(tier => {
        const tierElement = createTierElement(tier);
        container.appendChild(tierElement);
    });
}

function createTierElement(tier) {
    const div = document.createElement('div');
    div.className = 'tier-item';

    const progress = battlePassData.progress;
    const isUnlocked = tier.tierNumber <= progress.currentTier;
    const isFreeClaimed = progress.claimedFreeTiers?.includes(tier.tierNumber);
    const isPremiumClaimed = progress.claimedPremiumTiers?.includes(tier.tierNumber);

    if (isUnlocked) {
        div.classList.add('unlocked');
    }
    if (tier.tierNumber === progress.currentTier) {
        div.classList.add('current');
    }

    // Tier number
    const tierNumber = document.createElement('div');
    tierNumber.className = 'tier-number';
    tierNumber.textContent = tier.tierNumber;
    div.appendChild(tierNumber);

    // Free track reward
    if (tier.freeRewards && tier.freeRewards.length > 0) {
        const freeReward = createRewardElement(tier.freeRewards[0], 'free', isFreeClaimed, isUnlocked);
        div.appendChild(freeReward);
    } else {
        const emptyReward = document.createElement('div');
        emptyReward.className = 'reward-slot empty';
        emptyReward.textContent = '-';
        div.appendChild(emptyReward);
    }

    // Premium track reward
    if (tier.premiumRewards && tier.premiumRewards.length > 0) {
        const premiumReward = createRewardElement(tier.premiumRewards[0], 'premium', isPremiumClaimed, isUnlocked);
        div.appendChild(premiumReward);
    } else {
        const emptyReward = document.createElement('div');
        emptyReward.className = 'reward-slot empty premium';
        emptyReward.textContent = '-';
        div.appendChild(emptyReward);
    }

    // Claim button
    if (isUnlocked && (!isFreeClaimed || (!isPremiumClaimed && progress.hasPremium))) {
        const claimBtn = document.createElement('button');
        claimBtn.className = 'btn-claim';
        claimBtn.innerHTML = '<i class="fas fa-gift"></i> Claim';
        claimBtn.onclick = () => openRewardModal(tier);
        div.appendChild(claimBtn);
    }

    return div;
}

function createRewardElement(reward, track, isClaimed, isUnlocked) {
    const div = document.createElement('div');
    div.className = `reward-slot ${track}`;

    if (!isUnlocked) {
        div.classList.add('locked');
    }
    if (isClaimed) {
        div.classList.add('claimed');
    }

    const icon = getRewardIcon(reward.type);
    const amount = reward.amount > 0 ? ` ×${reward.amount}` : '';

    div.innerHTML = `
        <i class="${icon}"></i>
        <span>${formatRewardType(reward.type)}${amount}</span>
        ${isClaimed ? '<i class="fas fa-check claimed-check"></i>' : ''}
    `;

    return div;
}

function renderLeaderboard(leaderboard) {
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';

    if (leaderboard.length === 0) {
        container.innerHTML = '<p class="no-data">No leaderboard data yet</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'leaderboard-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Tier</th>
                <th>XP</th>
                <th>Type</th>
            </tr>
        </thead>
        <tbody>
            ${leaderboard.map(entry => `
                <tr class="${entry.username === currentUser.username ? 'current-user' : ''}">
                    <td class="rank">#${entry.rank}</td>
                    <td>
                        ${entry.username}
                        ${entry.hasPremium ? '<i class="fas fa-crown premium-icon"></i>' : ''}
                    </td>
                    <td>Tier ${entry.tier}</td>
                    <td>${entry.xp.toLocaleString()} XP</td>
                    <td>${entry.hasPremium ? '<span class="badge-premium">Premium</span>' : '<span class="badge-free">Free</span>'}</td>
                </tr>
            `).join('')}
        </tbody>
    `;

    container.appendChild(table);
}

// =====================================================
// REWARD CLAIMING
// =====================================================

function openRewardModal(tier) {
    const progress = battlePassData.progress;
    const isFreeClaimed = progress.claimedFreeTiers?.includes(tier.tierNumber);
    const isPremiumClaimed = progress.claimedPremiumTiers?.includes(tier.tierNumber);

    pendingRewardClaim = {
        tier: tier.tierNumber,
        rewards: []
    };

    // Build rewards list
    const rewardsList = document.getElementById('modal-rewards-list');
    rewardsList.innerHTML = '';

    if (!isFreeClaimed && tier.freeRewards && tier.freeRewards.length > 0) {
        tier.freeRewards.forEach(reward => {
            rewardsList.appendChild(createRewardListItem(reward, 'Free Track'));
            pendingRewardClaim.rewards.push({ track: 'free', ...reward });
        });
    }

    if (progress.hasPremium && !isPremiumClaimed && tier.premiumRewards && tier.premiumRewards.length > 0) {
        tier.premiumRewards.forEach(reward => {
            rewardsList.appendChild(createRewardListItem(reward, 'Premium Track'));
            pendingRewardClaim.rewards.push({ track: 'premium', ...reward });
        });
    }

    document.getElementById('modal-tier').textContent = tier.tierNumber;
    document.getElementById('reward-modal').style.display = 'flex';
}

function createRewardListItem(reward, trackName) {
    const div = document.createElement('div');
    div.className = 'reward-item';

    const icon = getRewardIcon(reward.type);
    const amount = reward.amount > 0 ? ` ×${reward.amount}` : '';

    div.innerHTML = `
        <i class="${icon}"></i>
        <div class="reward-info">
            <div class="reward-name">${formatRewardType(reward.type)}${amount}</div>
            <div class="reward-track">${trackName}</div>
        </div>
    `;

    return div;
}

function closeRewardModal() {
    document.getElementById('reward-modal').style.display = 'none';
    pendingRewardClaim = null;
}

async function confirmClaimReward() {
    if (!pendingRewardClaim) return;

    const claimBtn = document.getElementById('claim-btn');
    claimBtn.disabled = true;
    claimBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Claiming...';

    try {
        // Claim each reward
        for (const reward of pendingRewardClaim.rewards) {
            const response = await fetch('/api/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'battle-pass-claim',
                    userId: currentUser.id,
                    tier: pendingRewardClaim.tier,
                    track: reward.track
                })
            });

            if (!response.ok) {
                throw new Error('Failed to claim reward');
            }
        }

        // Show success
        showToast('Rewards claimed successfully!', 'success');
        closeRewardModal();

        // Reload battle pass data
        await loadBattlePass();

    } catch (error) {
        showToast('Failed to claim rewards. Please try again.', 'error');
        claimBtn.disabled = false;
        claimBtn.innerHTML = '<i class="fas fa-check"></i> Claim Rewards';
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function switchTrack(track) {
    currentTrack = track;

    // Update active tab
    document.querySelectorAll('.track-tab').forEach(tab => {
        if (tab.dataset.track === track) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });

    // Re-render tier track
    renderTierTrack();
}

function getRewardIcon(type) {
    const icons = {
        tokens: 'fas fa-coins',
        badge: 'fas fa-certificate',
        theme: 'fas fa-palette',
        avatar: 'fas fa-user-circle',
        title: 'fas fa-tag',
        bundle: 'fas fa-box'
    };
    return icons[type] || 'fas fa-gift';
}

function formatRewardType(type) {
    const names = {
        tokens: 'Tokens',
        badge: 'Badge',
        theme: 'Theme',
        avatar: 'Avatar',
        title: 'Title',
        bundle: 'Ultimate Pack'
    };
    return names[type] || type;
}

function calculateTokensEarned(progress) {
    // This would ideally come from the backend
    // For now, estimate based on claimed tiers
    const freeTiers = progress.claimedFreeTiers || [];
    const premiumTiers = progress.claimedPremiumTiers || [];

    let tokens = 0;
    freeTiers.forEach(tier => {
        const tierData = allTiers.find(t => t.tierNumber === tier);
        if (tierData && tierData.freeRewards) {
            tierData.freeRewards.forEach(r => {
                if (r.type === 'tokens') tokens += r.amount;
            });
        }
    });

    premiumTiers.forEach(tier => {
        const tierData = allTiers.find(t => t.tierNumber === tier);
        if (tierData && tierData.premiumRewards) {
            tierData.premiumRewards.forEach(r => {
                if (r.type === 'tokens') tokens += r.amount;
            });
        }
    });

    return tokens;
}

// =====================================================
// UI STATE MANAGEMENT
// =====================================================

function showLoading() {
    document.getElementById('loading-container').style.display = 'flex';
    document.getElementById('error-container').style.display = 'none';
    document.getElementById('no-season-container').style.display = 'none';
    document.getElementById('battle-pass-content').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading-container').style.display = 'none';
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-container').style.display = 'flex';
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('battle-pass-content').style.display = 'none';
}

function showNoSeason() {
    document.getElementById('no-season-container').style.display = 'flex';
    document.getElementById('loading-container').style.display = 'none';
    document.getElementById('error-container').style.display = 'none';
    document.getElementById('battle-pass-content').style.display = 'none';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notification');
    const icon = toast.querySelector('.toast-icon');
    const messageEl = toast.querySelector('.toast-message');

    // Set icon based on type
    if (type === 'success') {
        icon.className = 'toast-icon fas fa-check-circle';
        toast.style.background = 'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)';
    } else if (type === 'error') {
        icon.className = 'toast-icon fas fa-exclamation-circle';
        toast.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
    }

    messageEl.textContent = message;
    toast.style.display = 'flex';

    setTimeout(() => {
        toast.style.display = 'none';
    }, 4000);
}
