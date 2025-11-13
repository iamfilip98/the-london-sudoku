/**
 * Centralized Error Handling Library
 *
 * Provides consistent error handling across the application:
 * - Standardized error responses
 * - Automatic error logging
 * - User-friendly error messages
 * - Error classification and tracking
 */

/**
 * Error types and their HTTP status codes
 */
const ErrorTypes = {
  VALIDATION_ERROR: { status: 400, message: 'Invalid input provided' },
  AUTHENTICATION_ERROR: { status: 401, message: 'Authentication required' },
  AUTHORIZATION_ERROR: { status: 403, message: 'Access denied' },
  NOT_FOUND_ERROR: { status: 404, message: 'Resource not found' },
  RATE_LIMIT_ERROR: { status: 429, message: 'Too many requests' },
  DATABASE_ERROR: { status: 500, message: 'Database operation failed' },
  CACHE_ERROR: { status: 500, message: 'Cache operation failed' },
  EXTERNAL_API_ERROR: { status: 502, message: 'External service unavailable' },
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' }
};

/**
 * Custom error class for application errors
 */
class AppError extends Error {
  constructor(type, message = null, details = null) {
    const errorConfig = ErrorTypes[type] || ErrorTypes.INTERNAL_ERROR;
    super(message || errorConfig.message);

    this.name = 'AppError';
    this.type = type;
    this.status = errorConfig.status;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: this.message,
      type: this.type,
      status: this.status,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

/**
 * Handle API errors with consistent formatting
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function handleApiError(error, req, res) {
  // Log error details
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  // Track error in PostHog (if available)
  if (typeof window !== 'undefined' && window.Monitoring) {
    window.Monitoring.trackError(error, {
      path: req.path,
      method: req.method
    });
  }

  // Handle known AppError
  if (error instanceof AppError) {
    return res.status(error.status).json({
      success: false,
      ...error.toJSON()
    });
  }

  // Handle database errors
  if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint violations
    return res.status(400).json({
      success: false,
      error: 'Database constraint violation',
      type: 'DATABASE_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }

  // Handle generic errors
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
    type: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    timestamp: new Date().toISOString()
  });
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleApiError(error, req, res);
    });
  };
}

/**
 * Create user-friendly error messages
 * @param {string} errorType - Type of error
 * @param {Object} context - Additional context
 * @returns {string} User-friendly message
 */
function getUserFriendlyMessage(errorType, context = {}) {
  const messages = {
    VALIDATION_ERROR: 'Please check your input and try again.',
    AUTHENTICATION_ERROR: 'Please sign in to continue.',
    AUTHORIZATION_ERROR: 'You don\'t have permission to perform this action.',
    NOT_FOUND_ERROR: `${context.resource || 'Resource'} not found.`,
    RATE_LIMIT_ERROR: 'Too many requests. Please wait a moment and try again.',
    DATABASE_ERROR: 'We\'re experiencing technical difficulties. Please try again later.',
    CACHE_ERROR: 'Temporary issue retrieving data. Please refresh the page.',
    EXTERNAL_API_ERROR: 'Service temporarily unavailable. Please try again later.',
    INTERNAL_ERROR: 'Something went wrong. Our team has been notified.'
  };

  return messages[errorType] || messages.INTERNAL_ERROR;
}

/**
 * Retry logic for failed operations
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} Result of successful operation
 */
async function retryOperation(fn, options = {}) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = 'exponential', // 'exponential' or 'linear'
    onRetry = null
  } = options;

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        // Calculate delay
        const delay = backoff === 'exponential'
          ? delayMs * Math.pow(2, attempt)
          : delayMs * (attempt + 1);

        // Call retry callback
        if (onRetry) {
          onRetry(attempt + 1, delay, error);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Validate required fields in request
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @throws {AppError} If validation fails
 */
function validateRequired(data, requiredFields) {
  const missing = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }

  if (missing.length > 0) {
    throw new AppError(
      'VALIDATION_ERROR',
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    );
  }
}

/**
 * Safe JSON parse with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parse fails
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('JSON parse error:', error.message);
    return defaultValue;
  }
}

// Export for use in Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ErrorTypes,
    AppError,
    handleApiError,
    asyncHandler,
    getUserFriendlyMessage,
    retryOperation,
    validateRequired,
    safeJsonParse
  };
}

// Make available globally in browser
if (typeof window !== 'undefined') {
  window.ErrorHandler = {
    ErrorTypes,
    AppError,
    getUserFriendlyMessage,
    retryOperation,
    validateRequired,
    safeJsonParse
  };
}
