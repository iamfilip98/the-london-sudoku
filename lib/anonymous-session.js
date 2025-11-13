/**
 * Anonymous Session Management
 *
 * PHASE 0: Month 3
 * Purpose: Allow users to play without signup, then migrate data on registration
 *
 * Flow:
 * 1. User visits site → Auto-create anonymous session (UUID)
 * 2. User plays puzzles → Store in localStorage
 * 3. User completes 5 puzzles → Show "Sign up to save progress" modal
 * 4. User signs up → Migrate all localStorage data to database
 * 5. Delete localStorage → User now fully authenticated
 */

/**
 * Get or create anonymous session ID
 * @returns {string} Anonymous session UUID
 */
function getOrCreateAnonymousSession() {
  let sessionId = localStorage.getItem('anonymous_session_id');

  if (!sessionId) {
    // Generate UUID v4
    sessionId = crypto.randomUUID();
    localStorage.setItem('anonymous_session_id', sessionId);
  }

  return sessionId;
}

/**
 * Check if user is anonymous (not authenticated)
 * @returns {boolean} True if user is anonymous
 */
function isAnonymous() {
  const clerkToken = sessionStorage.getItem('clerk_token');
  const legacyAuth = sessionStorage.getItem('sudokuAuth');

  // User is anonymous if they have no authentication
  return !clerkToken && legacyAuth !== 'authenticated';
}

/**
 * Get anonymous progress from localStorage
 * @returns {Object} Anonymous progress data
 */
function getAnonymousProgress() {
  const data = localStorage.getItem('anonymous_progress');
  return data ? JSON.parse(data) : {
    completions: [],
    achievements: [],
    stats: {
      totalGames: 0,
      totalTime: 0,
      bestTimes: {},
      currentStreak: 0
    },
    createdAt: Date.now()
  };
}

/**
 * Save anonymous progress to localStorage
 * @param {Object} progress - Progress data
 */
function saveAnonymousProgress(progress) {
  localStorage.setItem('anonymous_progress', JSON.stringify(progress));
}

/**
 * Track anonymous puzzle completion
 * @param {Object} completion - Puzzle completion data
 */
function trackAnonymousCompletion(completion) {
  const progress = getAnonymousProgress();

  // Add completion
  progress.completions.push({
    date: new Date().toISOString().split('T')[0],
    difficulty: completion.difficulty,
    time: completion.time,
    score: completion.score,
    errors: completion.errors,
    hints: completion.hints,
    timestamp: Date.now()
  });

  // Update stats
  progress.stats.totalGames++;
  progress.stats.totalTime += completion.time;

  // Update best time for difficulty
  if (!progress.stats.bestTimes[completion.difficulty] ||
      completion.time < progress.stats.bestTimes[completion.difficulty]) {
    progress.stats.bestTimes[completion.difficulty] = completion.time;
  }

  saveAnonymousProgress(progress);

  // Check if should show signup prompt
  checkSignupPrompt(progress);
}

/**
 * Track anonymous achievement
 * @param {Object} achievement - Achievement data
 */
function trackAnonymousAchievement(achievement) {
  const progress = getAnonymousProgress();

  progress.achievements.push({
    id: achievement.id,
    unlockedAt: Date.now()
  });

  saveAnonymousProgress(progress);
}

/**
 * Check if should show "Sign up to save progress" prompt
 * @param {Object} progress - Current progress
 * @returns {boolean} True if should show prompt
 */
function checkSignupPrompt(progress) {
  const totalGames = progress.completions.length;

  // Show prompt after 5, 10, 15, 20 games
  const promptThresholds = [5, 10, 15, 20];

  if (promptThresholds.includes(totalGames)) {
    showSignupPrompt(totalGames);
    return true;
  }

  return false;
}

/**
 * Show "Sign up to save progress" modal
 * @param {number} gamesCompleted - Number of games completed
 */
function showSignupPrompt(gamesCompleted) {
  // Check if modal already shown recently
  const lastPrompt = localStorage.getItem('last_signup_prompt');
  if (lastPrompt && (Date.now() - parseInt(lastPrompt)) < 3600000) { // 1 hour
    return;
  }

  localStorage.setItem('last_signup_prompt', Date.now().toString());

  // Create and show modal
  const modal = document.getElementById('signupPromptModal');
  if (!modal) {
    createSignupPromptModal(gamesCompleted);
  } else {
    updateSignupPromptModal(gamesCompleted);
    modal.style.display = 'flex';
  }
}

/**
 * Create signup prompt modal
 * @param {number} gamesCompleted - Number of games completed
 */
function createSignupPromptModal(gamesCompleted) {
  const modal = document.createElement('div');
  modal.id = 'signupPromptModal';
  modal.className = 'signup-prompt-modal';
  modal.innerHTML = `
    <div class="signup-prompt-overlay"></div>
    <div class="signup-prompt-content">
      <div class="signup-prompt-icon">🎯</div>
      <h2>Great Progress!</h2>
      <p class="signup-prompt-message">
        You've completed <strong>${gamesCompleted} puzzles</strong>!
      </p>
      <p class="signup-prompt-subtitle">
        Sign up to save your progress, track your stats, and compete on leaderboards.
      </p>
      <div class="signup-prompt-actions">
        <button class="btn-primary" onclick="window.location.href='/signup.html'">
          <i class="fas fa-user-plus"></i>
          Sign Up Now
        </button>
        <button class="btn-secondary" onclick="closeSignupPrompt()">
          <i class="fas fa-times"></i>
          Maybe Later
        </button>
      </div>
      <p class="signup-prompt-note">
        Your progress is stored locally and will be transferred to your account.
      </p>
    </div>
  `;

  document.body.appendChild(modal);

  // Show with animation
  setTimeout(() => {
    modal.classList.add('show');
  }, 100);
}

/**
 * Update signup prompt modal content
 * @param {number} gamesCompleted - Number of games completed
 */
function updateSignupPromptModal(gamesCompleted) {
  const modal = document.getElementById('signupPromptModal');
  if (modal) {
    const message = modal.querySelector('.signup-prompt-message');
    if (message) {
      message.innerHTML = `You've completed <strong>${gamesCompleted} puzzles</strong>!`;
    }
  }
}

/**
 * Close signup prompt modal
 */
function closeSignupPrompt() {
  const modal = document.getElementById('signupPromptModal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
}

/**
 * Migrate anonymous progress to authenticated user
 * Called after user signs up/logs in
 * @param {string} userId - Clerk user ID
 * @returns {Promise<Object>} Migration result
 */
async function migrateAnonymousToUser(userId) {
  const progress = getAnonymousProgress();

  if (progress.completions.length === 0 && progress.achievements.length === 0) {
    return { migrated: 0 };
  }


  try {
    // Migrate completions
    let migratedCompletions = 0;
    for (const completion of progress.completions) {
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('clerk_token')}`
          },
          body: JSON.stringify({
            type: 'completion',
            userId,
            ...completion
          })
        });

        if (response.ok) {
          migratedCompletions++;
        }
      } catch (error) {
        // Error occurred
      }
    }

    // Migrate achievements
    let migratedAchievements = 0;
    for (const achievement of progress.achievements) {
      try {
        const response = await fetch('/api/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('clerk_token')}`
          },
          body: JSON.stringify({
            type: 'achievement',
            userId,
            ...achievement
          })
        });

        if (response.ok) {
          migratedAchievements++;
        }
      } catch (error) {
        // Error occurred
      }
    }

    // Clear anonymous data
    localStorage.removeItem('anonymous_session_id');
    localStorage.removeItem('anonymous_progress');
    localStorage.removeItem('last_signup_prompt');


    return {
      migrated: migratedCompletions + migratedAchievements,
      completions: migratedCompletions,
      achievements: migratedAchievements
    };

  } catch (error) {
    throw error;
  }
}

/**
 * Get anonymous stats for display
 * @returns {Object} Anonymous stats
 */
function getAnonymousStats() {
  const progress = getAnonymousProgress();
  return {
    totalGames: progress.stats.totalGames,
    totalTime: progress.stats.totalTime,
    bestTimes: progress.stats.bestTimes,
    achievements: progress.achievements.length,
    streak: progress.stats.currentStreak
  };
}

/**
 * Clear all anonymous data (for testing/debugging)
 */
function clearAnonymousData() {
  localStorage.removeItem('anonymous_session_id');
  localStorage.removeItem('anonymous_progress');
  localStorage.removeItem('last_signup_prompt');
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getOrCreateAnonymousSession,
    isAnonymous,
    getAnonymousProgress,
    saveAnonymousProgress,
    trackAnonymousCompletion,
    trackAnonymousAchievement,
    checkSignupPrompt,
    showSignupPrompt,
    closeSignupPrompt,
    migrateAnonymousToUser,
    getAnonymousStats,
    clearAnonymousData
  };
}

// Also make available globally
if (typeof window !== 'undefined') {
  window.AnonymousSession = {
    getOrCreateAnonymousSession,
    isAnonymous,
    getAnonymousProgress,
    saveAnonymousProgress,
    trackAnonymousCompletion,
    trackAnonymousAchievement,
    showSignupPrompt,
    closeSignupPrompt,
    migrateAnonymousToUser,
    getAnonymousStats,
    clearAnonymousData
  };
}
