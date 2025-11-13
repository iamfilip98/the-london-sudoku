/**
 * Social Sharing Library
 *
 * Phase 2 Month 8: Social Sharing Functionality
 *
 * Provides utilities for sharing achievements, scores, and progress to social media.
 * This is a client-side library that generates share text and URLs for various platforms.
 *
 * Usage:
 *   const shareData = generateShareData('achievement', { achievementName: 'Speed Demon', ... });
 *   shareToTwitter(shareData);
 *   shareToFacebook(shareData);
 *   copyToClipboard(shareData);
 */

const BASE_URL = typeof window !== 'undefined' && window.location
  ? `${window.location.protocol}//${window.location.host}`
  : 'https://thelondonsudoku.com';

/**
 * Generate share data for different content types
 *
 * @param {string} type - Type of content to share (achievement, score, streak, puzzle_completion)
 * @param {object} data - Data specific to the share type
 * @returns {object} Share data with text and URL
 */
function generateShareData(type, data) {
  const shareData = {
    url: BASE_URL,
    hashtags: ['Sudoku', 'TheLondonSudoku', 'PuzzleGame']
  };

  switch (type) {
    case 'achievement':
      shareData.text = `🏆 I just unlocked "${data.achievementName}" on The London Sudoku! ${data.description || ''}`;
      shareData.hashtags.push('Achievement');
      break;

    case 'score':
      shareData.text = `🎯 I scored ${data.score} points on a ${data.difficulty} Sudoku puzzle in ${formatTime(data.time)}! Can you beat that?`;
      shareData.hashtags.push('HighScore');
      break;

    case 'streak':
      shareData.text = `🔥 ${data.streak} day streak on The London Sudoku! I'm on fire! 🔥`;
      shareData.hashtags.push('Streak');
      break;

    case 'puzzle_completion':
      const variant = data.variant || 'Classic';
      shareData.text = `✅ Completed a ${data.difficulty} ${variant} Sudoku in ${formatTime(data.time)}!`;
      shareData.hashtags.push('PuzzleSolved');
      break;

    case 'leaderboard':
      shareData.text = `🥇 Rank #${data.rank} on The London Sudoku ${data.period} leaderboard with ${data.points} points!`;
      shareData.hashtags.push('Leaderboard', 'TopPlayer');
      break;

    default:
      shareData.text = `Check out The London Sudoku - the ultimate competitive Sudoku platform!`;
  }

  return shareData;
}

/**
 * Format time in seconds to readable format (MM:SS)
 *
 * @param {number} seconds
 * @returns {string} Formatted time
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Share to Twitter/X
 *
 * @param {object} shareData - Share data from generateShareData()
 */
function shareToTwitter(shareData) {
  const text = encodeURIComponent(shareData.text);
  const url = encodeURIComponent(shareData.url);
  const hashtags = encodeURIComponent(shareData.hashtags.join(','));

  const twitterUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`;

  if (typeof window !== 'undefined') {
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  }

  return twitterUrl;
}

/**
 * Share to Facebook
 *
 * @param {object} shareData - Share data from generateShareData()
 */
function shareToFacebook(shareData) {
  const url = encodeURIComponent(shareData.url);
  const quote = encodeURIComponent(shareData.text);

  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${quote}`;

  if (typeof window !== 'undefined') {
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  }

  return facebookUrl;
}

/**
 * Share to LinkedIn
 *
 * @param {object} shareData - Share data from generateShareData()
 */
function shareToLinkedIn(shareData) {
  const url = encodeURIComponent(shareData.url);
  const title = encodeURIComponent('The London Sudoku');
  const summary = encodeURIComponent(shareData.text);

  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;

  if (typeof window !== 'undefined') {
    window.open(linkedInUrl, '_blank', 'width=600,height=400');
  }

  return linkedInUrl;
}

/**
 * Share to Reddit
 *
 * @param {object} shareData - Share data from generateShareData()
 */
function shareToReddit(shareData) {
  const url = encodeURIComponent(shareData.url);
  const title = encodeURIComponent(shareData.text);

  const redditUrl = `https://www.reddit.com/submit?url=${url}&title=${title}`;

  if (typeof window !== 'undefined') {
    window.open(redditUrl, '_blank', 'width=600,height=400');
  }

  return redditUrl;
}

/**
 * Copy share text to clipboard
 *
 * @param {object} shareData - Share data from generateShareData()
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(shareData) {
  const text = `${shareData.text}\n\n${shareData.url}\n\n#${shareData.hashtags.join(' #')}`;

  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Error occurred
      return false;
    }
  }

  return false;
}

/**
 * Use Web Share API if available (mobile)
 *
 * @param {object} shareData - Share data from generateShareData()
 * @returns {Promise<boolean>} Success status
 */
async function webShare(shareData) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: 'The London Sudoku',
        text: shareData.text,
        url: shareData.url
      });
      return true;
    } catch (error) {
      // User cancelled or share failed
      return false;
    }
  }

  return false;
}

/**
 * Track social share in database
 *
 * @param {string} username - User who is sharing
 * @param {string} shareType - Type of share (achievement, score, etc.)
 * @param {object} shareData - Data about what was shared
 * @param {string} platform - Platform shared to (twitter, facebook, clipboard, etc.)
 */
async function trackShare(username, shareType, shareData, platform) {
  try {
    const response = await fetch('/api/stats?action=track-share', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        shareType,
        shareData,
        platform
      })
    });

    if (!response.ok) {
      // Error occurred
    }
  } catch (error) {
    // Error occurred
  }
}

/**
 * Generate shareable image URL for achievements/scores
 *
 * @param {string} type - Type of image (achievement, score, streak)
 * @param {object} data - Data for the image
 * @returns {string} Image URL
 */
function generateShareImageUrl(type, data) {
  // This would ideally connect to an image generation service
  // For now, return a placeholder URL that the frontend can use
  const params = new URLSearchParams({
    type,
    ...data
  });

  return `${BASE_URL}/api/share-image?${params.toString()}`;
}

// =====================================================
// PRESET SHARE ACTIONS
// =====================================================

/**
 * Share an achievement unlock
 */
function shareAchievement(username, achievement, platform = 'twitter') {
  const shareData = generateShareData('achievement', {
    achievementName: achievement.name,
    description: achievement.description
  });

  trackShare(username, 'achievement', achievement, platform);

  switch (platform) {
    case 'twitter':
      return shareToTwitter(shareData);
    case 'facebook':
      return shareToFacebook(shareData);
    case 'linkedin':
      return shareToLinkedIn(shareData);
    case 'reddit':
      return shareToReddit(shareData);
    case 'clipboard':
      return copyToClipboard(shareData);
    default:
      return webShare(shareData);
  }
}

/**
 * Share a high score
 */
function shareScore(username, score, difficulty, time, platform = 'twitter') {
  const shareData = generateShareData('score', {
    score,
    difficulty,
    time
  });

  trackShare(username, 'score', { score, difficulty, time }, platform);

  switch (platform) {
    case 'twitter':
      return shareToTwitter(shareData);
    case 'facebook':
      return shareToFacebook(shareData);
    case 'linkedin':
      return shareToLinkedIn(shareData);
    case 'reddit':
      return shareToReddit(shareData);
    case 'clipboard':
      return copyToClipboard(shareData);
    default:
      return webShare(shareData);
  }
}

/**
 * Share a streak milestone
 */
function shareStreak(username, streak, platform = 'twitter') {
  const shareData = generateShareData('streak', { streak });

  trackShare(username, 'streak', { streak }, platform);

  switch (platform) {
    case 'twitter':
      return shareToTwitter(shareData);
    case 'facebook':
      return shareToFacebook(shareData);
    case 'linkedin':
      return shareToLinkedIn(shareData);
    case 'reddit':
      return shareToReddit(shareData);
    case 'clipboard':
      return copyToClipboard(shareData);
    default:
      return webShare(shareData);
  }
}

/**
 * Share puzzle completion
 */
function sharePuzzleCompletion(username, difficulty, time, variant = 'Classic', platform = 'twitter') {
  const shareData = generateShareData('puzzle_completion', {
    difficulty,
    time,
    variant
  });

  trackShare(username, 'puzzle_completion', { difficulty, time, variant }, platform);

  switch (platform) {
    case 'twitter':
      return shareToTwitter(shareData);
    case 'facebook':
      return shareToFacebook(shareData);
    case 'linkedin':
      return shareToLinkedIn(shareData);
    case 'reddit':
      return shareToReddit(shareData);
    case 'clipboard':
      return copyToClipboard(shareData);
    default:
      return webShare(shareData);
  }
}

// Export for Node.js and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateShareData,
    formatTime,
    shareToTwitter,
    shareToFacebook,
    shareToLinkedIn,
    shareToReddit,
    copyToClipboard,
    webShare,
    trackShare,
    generateShareImageUrl,
    shareAchievement,
    shareScore,
    shareStreak,
    sharePuzzleCompletion
  };
}
