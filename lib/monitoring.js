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
    trackPerformance,
    isFeatureEnabled
  };
}
