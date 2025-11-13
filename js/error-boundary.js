/**
 * Frontend Error Boundary
 *
 * Catches JavaScript errors in the UI and displays user-friendly fallback
 * Integrates with PostHog for error tracking
 */

class ErrorBoundary {
  constructor() {
    this.errors = [];
    this.setupGlobalHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error, {
        type: 'unhandled_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_rejection',
        promise: event.promise
      });
    });
  }

  /**
   * Handle caught error
   * @param {Error} error - Error object
   * @param {Object} context - Additional context
   */
  handleError(error, context = {}) {
    // Log to console
    console.error('Error caught by boundary:', error, context);

    // Track in PostHog
    if (window.Monitoring) {
      window.Monitoring.trackError(error, context);
    }

    // Store error
    this.errors.push({
      error,
      context,
      timestamp: Date.now()
    });

    // Show user-friendly error message
    this.showErrorUI(error, context);
  }

  /**
   * Show error UI to user
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   */
  showErrorUI(error, context) {
    // Check if error is critical
    const isCritical = this.isCriticalError(error, context);

    if (isCritical) {
      this.showCriticalError(error);
    } else {
      this.showToast(error);
    }
  }

  /**
   * Determine if error is critical
   * @param {Error} error - Error object
   * @param {Object} context - Error context
   * @returns {boolean} True if critical
   */
  isCriticalError(error, context) {
    // Critical: Errors that prevent app from functioning
    const criticalTypes = [
      'SyntaxError',
      'ReferenceError',
      'TypeError in core functionality'
    ];

    return criticalTypes.some(type => error.name === type || error.message.includes(type));
  }

  /**
   * Show critical error page
   * @param {Error} error - Error object
   */
  showCriticalError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.id = 'critical-error-boundary';
    errorContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      font-family: 'Roboto', sans-serif;
    `;

    errorContainer.innerHTML = `
      <div style="max-width: 600px; padding: 40px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h1 style="font-family: 'Orbitron', sans-serif; margin-bottom: 20px;">
          Oops! Something went wrong
        </h1>
        <p style="margin-bottom: 30px; opacity: 0.8;">
          We've encountered an unexpected error. Our team has been notified and is working on a fix.
        </p>
        <button
          onclick="location.reload()"
          style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Orbitron', sans-serif;
          "
        >
          Reload Page
        </button>
        ${process.env.NODE_ENV === 'development' ? `
          <details style="margin-top: 30px; text-align: left; opacity: 0.6;">
            <summary style="cursor: pointer; margin-bottom: 10px;">Technical Details</summary>
            <pre style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 4px; overflow: auto;">
${error.stack || error.message}
            </pre>
          </details>
        ` : ''}
      </div>
    `;

    document.body.appendChild(errorContainer);
  }

  /**
   * Show error toast notification
   * @param {Error} error - Error object
   */
  showToast(error) {
    // Check if toast container exists
    let toastContainer = document.getElementById('error-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'error-toast-container';
      toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(toastContainer);
    }

    // Create toast
    const toast = document.createElement('div');
    toast.style.cssText = `
      background: rgba(220, 38, 38, 0.95);
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
      animation: slideIn 0.3s ease-out;
      font-family: 'Roboto', sans-serif;
    `;

    const message = this.getErrorMessage(error);
    toast.innerHTML = `
      <div style="display: flex; align-items: start; gap: 12px;">
        <span style="font-size: 20px;">⚠️</span>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 4px;">Error</div>
          <div style="opacity: 0.9; font-size: 14px;">${message}</div>
        </div>
        <button
          onclick="this.parentElement.parentElement.remove()"
          style="
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            opacity: 0.7;
            padding: 0;
          "
        >×</button>
      </div>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Get user-friendly error message
   * @param {Error} error - Error object
   * @returns {string} User-friendly message
   */
  getErrorMessage(error) {
    // Map common errors to user-friendly messages
    const errorMessages = {
      'Network Error': 'Connection lost. Please check your internet connection.',
      'Failed to fetch': 'Unable to load data. Please try again.',
      'Timeout': 'Request timed out. Please try again.',
      '401': 'Please sign in to continue.',
      '403': 'You don\'t have permission to perform this action.',
      '404': 'Resource not found.',
      '429': 'Too many requests. Please wait a moment.',
      '500': 'Server error. Please try again later.'
    };

    // Check for known error patterns
    for (const [pattern, message] of Object.entries(errorMessages)) {
      if (error.message.includes(pattern) || error.status?.toString() === pattern) {
        return message;
      }
    }

    // Default message
    return 'Something went wrong. Please try again.';
  }

  /**
   * Clear all errors
   */
  clearErrors() {
    this.errors = [];
    const container = document.getElementById('error-toast-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Get error count
   * @returns {number} Number of errors
   */
  getErrorCount() {
    return this.errors.length;
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize error boundary
window.ErrorBoundary = new ErrorBoundary();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorBoundary;
}
