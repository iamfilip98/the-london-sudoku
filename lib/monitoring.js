/**
 * Error Monitoring & Analytics
 *
 * Integrates PostHog for:
 * - Error tracking
 * - User analytics
 * - Feature usage tracking
 * - Performance monitoring
 *
 * SECURITY: No PII (personally identifiable information) sent to PostHog
 */

// PostHog will be loaded via CDN in HTML
// This file provides helper functions for error tracking

/**
 * Initialize PostHog (call this once on page load)
 */
function initMonitoring() {
  if (typeof window === 'undefined') return; // Server-side

  // PostHog should be loaded via CDN in HTML:
  // <script>
  //   !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  //   posthog.init('YOUR_PROJECT_API_KEY', {api_host: 'https://app.posthog.com'})
  // </script>

  if (!window.posthog) {
    console.warn('PostHog not loaded. Error monitoring disabled.');
    return;
  }

  // PostHog is already configured in the HTML init script
  // No need to call config() here - it would throw an error
  console.log('✅ Monitoring initialized');
}

/**
 * Track error
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
function trackError(error, context = {}) {
  if (typeof window === 'undefined' || !window.posthog) return;

  window.posthog.capture('error_occurred', {
    error_name: error.name,
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500), // Limit stack trace length
    ...sanitizeContext(context),
    timestamp: Date.now(),
    url: window.location.href,
    user_agent: navigator.userAgent
  });

  // Also log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error tracked:', error, context);
  }
}

/**
 * Track custom event
 * @param {string} eventName - Event name
 * @param {Object} properties - Event properties
 */
function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined' || !window.posthog) return;

  window.posthog.capture(eventName, sanitizeContext(properties));
}

/**
 * Track page view
 * @param {string} pageName - Page name
 */
function trackPageView(pageName) {
  if (typeof window === 'undefined' || !window.posthog) return;

  window.posthog.capture('$pageview', {
    page_name: pageName,
    url: window.location.href
  });
}

/**
 * Identify user (call after login)
 * @param {string} userId - User ID (NOT email or username)
 * @param {Object} traits - User traits (no PII!)
 */
function identifyUser(userId, traits = {}) {
  if (typeof window === 'undefined' || !window.posthog) return;

  // SECURITY: Never send PII to PostHog
  const sanitizedTraits = {
    subscription_tier: traits.subscription_tier,
    created_at: traits.created_at,
    total_puzzles_completed: traits.total_puzzles_completed,
    level: traits.level
  };

  window.posthog.identify(userId, sanitizedTraits);
}

/**
 * Track puzzle completion
 * @param {Object} completionData - Puzzle completion data
 */
function trackPuzzleCompletion(completionData) {
  trackEvent('puzzle_completed', {
    variant: completionData.variant,
    difficulty: completionData.difficulty,
    time_seconds: completionData.time,
    errors: completionData.errors,
    hints: completionData.hints,
    score: completionData.score,
    is_perfect: completionData.errors === 0 && completionData.hints === 0
  });
}

/**
 * Track subscription event
 * @param {string} action - 'created' | 'canceled' | 'upgraded' | 'downgraded'
 * @param {Object} subscriptionData - Subscription data
 */
function trackSubscription(action, subscriptionData) {
  trackEvent('subscription_' + action, {
    tier: subscriptionData.tier,
    price: subscriptionData.price,
    billing_cycle: subscriptionData.billing_cycle
  });
}

/**
 * Track achievement unlock
 * @param {Object} achievementData - Achievement data
 */
function trackAchievementUnlock(achievementData) {
  trackEvent('achievement_unlocked', {
    achievement_id: achievementData.id,
    achievement_name: achievementData.name,
    category: achievementData.category,
    rarity: achievementData.rarity,
    xp_earned: achievementData.xp,
    total_achievements: achievementData.total_count,
    unlock_source: achievementData.source // 'game', 'lesson', 'battle_pass', etc.
  });
}

/**
 * Track lesson interaction
 * @param {string} action - 'started' | 'completed' | 'abandoned'
 * @param {Object} lessonData - Lesson data
 */
function trackLessonInteraction(action, lessonData) {
  trackEvent('lesson_' + action, {
    lesson_id: lessonData.id,
    lesson_number: lessonData.number,
    lesson_title: lessonData.title,
    course: lessonData.course, // 'beginner', 'intermediate', 'variants'
    duration_estimate: lessonData.duration,
    time_spent: lessonData.time_spent,
    premium: lessonData.premium,
    xp_earned: lessonData.xp_earned,
    quiz_score: lessonData.quiz_score,
    hints_used: lessonData.hints_used,
    completed_lessons_count: lessonData.completed_count
  });
}

/**
 * Track battle pass interaction
 * @param {string} action - 'xp_earned' | 'tier_unlocked' | 'reward_claimed'
 * @param {Object} battlePassData - Battle pass data
 */
function trackBattlePass(action, battlePassData) {
  trackEvent('battle_pass_' + action, {
    season_id: battlePassData.season_id,
    current_tier: battlePassData.current_tier,
    current_xp: battlePassData.current_xp,
    xp_gained: battlePassData.xp_gained,
    xp_source: battlePassData.xp_source, // 'game', 'achievement', 'lesson', etc.
    reward_type: battlePassData.reward_type, // 'theme', 'badge', 'avatar', 'xp_boost'
    is_premium: battlePassData.is_premium
  });
}

/**
 * Track league interaction
 * @param {string} action - 'joined' | 'left' | 'promoted' | 'demoted' | 'game_played'
 * @param {Object} leagueData - League data
 */
function trackLeague(action, leagueData) {
  trackEvent('league_' + action, {
    league_id: leagueData.league_id,
    league_name: leagueData.league_name,
    league_tier: leagueData.tier, // 'bronze', 'silver', 'gold', etc.
    is_custom: leagueData.is_custom,
    rank: leagueData.rank,
    points: leagueData.points,
    member_count: leagueData.member_count,
    season_week: leagueData.season_week
  });
}

/**
 * Track premium conversion funnel
 * @param {string} step - 'paywall_shown' | 'pricing_viewed' | 'checkout_started' | 'payment_completed' | 'payment_failed'
 * @param {Object} conversionData - Conversion data
 */
function trackPremiumConversion(step, conversionData) {
  trackEvent('premium_' + step, {
    trigger_source: conversionData.source, // 'lesson', 'variant', 'battle_pass', 'league', etc.
    selected_tier: conversionData.tier,
    selected_price: conversionData.price,
    discount_code: conversionData.discount_code,
    days_since_signup: conversionData.days_since_signup,
    total_puzzles_completed: conversionData.total_puzzles_completed,
    paywall_type: conversionData.paywall_type // 'hard', 'soft'
  });
}

/**
 * Track user retention events
 * @param {string} action - 'daily_login' | 'streak_continued' | 'streak_lost' | 'returned_after_absence'
 * @param {Object} retentionData - Retention data
 */
function trackRetention(action, retentionData) {
  trackEvent('retention_' + action, {
    current_streak: retentionData.current_streak,
    best_streak: retentionData.best_streak,
    days_since_last_login: retentionData.days_since_last_login,
    total_login_days: retentionData.total_login_days,
    account_age_days: retentionData.account_age_days,
    is_weekend: retentionData.is_weekend,
    login_time_hour: new Date().getHours()
  });
}

/**
 * Track variant puzzle interaction
 * @param {string} action - 'variant_discovered' | 'first_attempt' | 'completed'
 * @param {Object} variantData - Variant data
 */
function trackVariant(action, variantData) {
  trackEvent('variant_' + action, {
    variant: variantData.variant,
    difficulty: variantData.difficulty,
    total_variant_completions: variantData.total_completions,
    time_seconds: variantData.time,
    success: variantData.success
  });
}

/**
 * Track friend/social interaction
 * @param {string} action - 'request_sent' | 'request_accepted' | 'friend_challenged' | 'leaderboard_viewed'
 * @param {Object} socialData - Social data
 */
function trackSocial(action, socialData) {
  trackEvent('social_' + action, {
    friend_count: socialData.friend_count,
    pending_requests: socialData.pending_requests,
    challenge_type: socialData.challenge_type,
    shared_platform: socialData.platform // 'twitter', 'facebook', 'reddit', etc.
  });
}

/**
 * Sanitize context (remove PII)
 * @param {Object} context - Context object
 * @returns {Object} Sanitized context
 */
function sanitizeContext(context) {
  const sanitized = { ...context };

  // Remove PII fields
  const piiFields = ['email', 'username', 'password', 'ip', 'address', 'phone', 'ssn', 'credit_card'];
  piiFields.forEach(field => {
    delete sanitized[field];
  });

  return sanitized;
}

/**
 * Performance monitoring
 */
function trackPerformance(metricName, value) {
  if (typeof window === 'undefined' || !window.posthog) return;

  window.posthog.capture('performance_metric', {
    metric_name: metricName,
    value: value,
    url: window.location.href
  });
}

/**
 * Feature flag check
 * @param {string} flagName - Feature flag name
 * @returns {boolean} Flag value
 */
function isFeatureEnabled(flagName) {
  if (typeof window === 'undefined' || !window.posthog) return false;

  return window.posthog.isFeatureEnabled(flagName);
}

// Export for use in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initMonitoring,
    trackError,
    trackEvent,
    trackPageView,
    identifyUser,
    trackPuzzleCompletion,
    trackSubscription,
    trackAchievementUnlock,
    trackLessonInteraction,
    trackBattlePass,
    trackLeague,
    trackPremiumConversion,
    trackRetention,
    trackVariant,
    trackSocial,
    trackPerformance,
    isFeatureEnabled
  };
}

// Also make available globally
if (typeof window !== 'undefined') {
  window.Monitoring = {
    initMonitoring,
    trackError,
    trackEvent,
    trackPageView,
    identifyUser,
    trackPuzzleCompletion,
    trackSubscription,
    trackAchievementUnlock,
    trackLessonInteraction,
    trackBattlePass,
    trackLeague,
    trackPremiumConversion,
    trackRetention,
    trackVariant,
    trackSocial,
    trackPerformance,
    isFeatureEnabled
  };
}
