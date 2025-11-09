# 🚨 ERROR HANDLING & LOGGING STRATEGY

**Purpose**: Consistent error handling, structured logging, and debugging across the entire platform
**Version**: 1.0
**Last Updated**: November 2025

---

## 🎯 DESIGN PRINCIPLES

1. **Fail Gracefully**: Never show raw errors to users
2. **Log Everything**: Structured, searchable, actionable logs
3. **User-Friendly**: Clear error messages that guide users
4. **Developer-Friendly**: Rich context for debugging
5. **Security-First**: Never leak sensitive data in errors
6. **Consistent**: Same error format across all APIs

---

## 📋 STANDARDIZED ERROR RESPONSE

### API Error Format

```javascript
// All API errors MUST use this format
{
  "success": false,
  "error": {
    "code": "DAILY_LIMIT_REACHED",        // Machine-readable error code
    "message": "Daily puzzle limit reached",  // User-friendly message
    "details": "You've completed 3/3 daily puzzles. Come back tomorrow!", // Optional details
    "field": "daily_count",                // Optional field causing error
    "retry_after": 43200,                  // Optional retry timestamp (seconds)
    "support_id": "err_1a2b3c4d5e"        // Support reference ID
  },
  "meta": {
    "timestamp": "2025-11-08T12:34:56Z",
    "request_id": "req_xyz123"
  }
}
```

### HTTP Status Codes (Consistent Usage)

```javascript
const HTTP_STATUS = {
  // Success
  200: 'OK',                    // Successful GET/PUT/PATCH
  201: 'Created',               // Successful POST (created resource)
  204: 'No Content',            // Successful DELETE

  // Client Errors
  400: 'Bad Request',           // Invalid input, validation failed
  401: 'Unauthorized',          // Not authenticated (missing/invalid token)
  403: 'Forbidden',             // Authenticated but not authorized
  404: 'Not Found',             // Resource doesn't exist
  409: 'Conflict',              // Duplicate resource, constraint violation
  422: 'Unprocessable Entity',  // Validation failed (detailed errors)
  429: 'Too Many Requests',     // Rate limit exceeded

  // Server Errors
  500: 'Internal Server Error', // Unexpected server error
  502: 'Bad Gateway',           // Upstream service failed
  503: 'Service Unavailable',   // Temporary outage (maintenance)
  504: 'Gateway Timeout'        // Upstream timeout
};
```

---

## 🛠️ ERROR HANDLING IMPLEMENTATION

### API Error Handler (Middleware)

```javascript
// lib/errorHandler.js
import { nanoid } from 'nanoid';
import { logger } from './logger';

export class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null, field = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.field = field;
    this.isOperational = true; // Distinguish from programming errors
  }
}

export function errorHandler(err, req, res) {
  const requestId = req.headers['x-request-id'] || nanoid();
  const supportId = `err_${nanoid(10)}`;

  // Log error with full context
  logger.error('API Error', {
    supportId,
    requestId,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack
    },
    request: {
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
      body: sanitizeBody(req.body),
      userId: req.userId || null
    }
  });

  // Operational errors (expected)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        field: err.field,
        support_id: supportId
      },
      meta: {
        timestamp: new Date().toISOString(),
        request_id: requestId
      }
    });
  }

  // Programming errors (unexpected) - don't leak details
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred. Please try again.',
      support_id: supportId
    },
    meta: {
      timestamp: new Date().toISOString(),
      request_id: requestId
    }
  });
}

function sanitizeHeaders(headers) {
  const sanitized = { ...headers };
  delete sanitized.authorization;
  delete sanitized.cookie;
  return sanitized;
}

function sanitizeBody(body) {
  if (!body) return null;
  const sanitized = { ...body };
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.stripe_secret;
  return sanitized;
}
```

### Common Error Definitions

```javascript
// lib/errors.js
import { AppError } from './errorHandler';

export const Errors = {
  // Authentication & Authorization
  UNAUTHENTICATED: () => new AppError(
    'UNAUTHENTICATED',
    'You must be logged in to access this resource.',
    401
  ),

  FORBIDDEN: (resource) => new AppError(
    'FORBIDDEN',
    `You don't have permission to access ${resource}.`,
    403
  ),

  // Validation
  VALIDATION_FAILED: (field, details) => new AppError(
    'VALIDATION_FAILED',
    'Validation failed',
    422,
    details,
    field
  ),

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: (retryAfter) => new AppError(
    'RATE_LIMIT_EXCEEDED',
    'Too many requests. Please slow down.',
    429,
    `Try again in ${retryAfter} seconds.`
  ),

  DAILY_LIMIT_REACHED: (puzzleType) => new AppError(
    'DAILY_LIMIT_REACHED',
    'Daily puzzle limit reached',
    403,
    `You've completed all free ${puzzleType} puzzles today. Upgrade to Premium for unlimited puzzles.`
  ),

  // Resources
  NOT_FOUND: (resource) => new AppError(
    'NOT_FOUND',
    `${resource} not found`,
    404
  ),

  ALREADY_EXISTS: (resource, field) => new AppError(
    'ALREADY_EXISTS',
    `${resource} already exists`,
    409,
    null,
    field
  ),

  // Puzzles
  PUZZLE_ALREADY_COMPLETED: () => new AppError(
    'PUZZLE_ALREADY_COMPLETED',
    'You have already completed this puzzle',
    409,
    'Check the leaderboard to see your previous score.'
  ),

  INVALID_PUZZLE_SOLUTION: () => new AppError(
    'INVALID_PUZZLE_SOLUTION',
    'The solution provided is incorrect',
    400,
    'Please check your solution and try again.'
  ),

  // Subscriptions
  SUBSCRIPTION_REQUIRED: (feature) => new AppError(
    'SUBSCRIPTION_REQUIRED',
    `${feature} requires Premium subscription`,
    403,
    'Upgrade to Premium to unlock this feature.'
  ),

  PAYMENT_FAILED: (reason) => new AppError(
    'PAYMENT_FAILED',
    'Payment processing failed',
    402,
    reason
  ),

  // External Services
  DATABASE_ERROR: () => new AppError(
    'DATABASE_ERROR',
    'Database operation failed',
    500,
    'Please try again in a moment.'
  ),

  STRIPE_ERROR: (message) => new AppError(
    'PAYMENT_SERVICE_ERROR',
    'Payment service error',
    500,
    message
  ),

  GENERATION_FAILED: () => new AppError(
    'GENERATION_FAILED',
    'Puzzle generation failed',
    500,
    'Using fallback puzzle. Quality may vary.'
  )
};
```

### Usage in API Routes

```javascript
// /api/daily-puzzles/complete.js
import { errorHandler, Errors } from '@/lib/errors';

export default async function handler(req, res) {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      throw Errors.UNAUTHENTICATED();
    }

    const { daily_puzzle_id, time_seconds } = req.body;

    // Validate input
    if (!daily_puzzle_id || time_seconds < 0) {
      throw Errors.VALIDATION_FAILED('time_seconds', 'Time must be positive');
    }

    // Check if already completed
    const existing = await db.query(
      'SELECT id FROM user_puzzle_completions WHERE user_id = $1 AND daily_puzzle_id = $2',
      [userId, daily_puzzle_id]
    );

    if (existing.rows.length > 0) {
      throw Errors.PUZZLE_ALREADY_COMPLETED();
    }

    // Process completion
    const result = await completeDailyPuzzle(userId, daily_puzzle_id, time_seconds);

    return res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    return errorHandler(error, req, res);
  }
}
```

---

## 📝 STRUCTURED LOGGING

### Logger Implementation (Winston)

```javascript
// lib/logger.js
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'london-sudoku',
    environment: process.env.NODE_ENV
  },
  transports: [
    // Console (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),

    // File (production)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// If production, also send to external service (Logtail, Datadog, etc.)
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.Http({
    host: process.env.LOG_SERVICE_HOST,
    path: '/logs',
    ssl: true
  }));
}

export { logger };
```

### Logging Best Practices

```javascript
// ✅ GOOD: Structured logging with context
logger.info('Daily puzzle completed', {
  userId: user.id,
  puzzleId: puzzle.id,
  variant: 'classic',
  difficulty: 'hard',
  timeSeconds: 234,
  errors: 0,
  hints: 1,
  score: 876
});

// ✅ GOOD: Error logging with stack trace
logger.error('Database query failed', {
  error: err.message,
  stack: err.stack,
  query: 'SELECT * FROM users WHERE id = $1',
  params: [userId]
});

// ✅ GOOD: Performance logging
logger.info('Puzzle generation completed', {
  variant: 'killer',
  difficulty: 'hard',
  attempts: 3,
  durationMs: 4523,
  qualityScore: 87
});

// ❌ BAD: Unstructured logging
console.log('User completed puzzle');
console.log(err);
```

### Log Levels

```javascript
logger.error('Critical error requiring immediate attention');
logger.warn('Warning - degraded performance or potential issue');
logger.info('Important business event (user signup, payment, etc.)');
logger.debug('Detailed debugging information (development only)');
```

---

## 🔍 CLIENT-SIDE ERROR HANDLING

### Global Error Boundary (React)

```javascript
// components/ErrorBoundary.js
import React from 'react';
import { logger } from '@/lib/logger';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to service (PostHog, Sentry, etc.)
    logger.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      url: window.location.href,
      userId: this.props.userId
    });

    // Send to PostHog
    if (window.posthog) {
      window.posthog.capture('frontend_error', {
        error: error.message,
        stack: error.stack,
        component: errorInfo.componentStack
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h1>Oops! Something went wrong.</h1>
          <p>We've been notified and are looking into it.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### API Error Handling (Client)

```javascript
// lib/api.js
async function apiRequest(endpoint, options = {}) {
  try {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    const data = await res.json();

    // API returned error
    if (!res.ok || !data.success) {
      const error = data.error || {};

      // Handle specific error codes
      switch (error.code) {
        case 'UNAUTHENTICATED':
          // Redirect to login
          window.location.href = '/auth/login';
          break;

        case 'DAILY_LIMIT_REACHED':
          // Show upsell modal
          showModal({
            type: 'upsell',
            title: error.message,
            message: error.details,
            cta: 'Upgrade to Premium'
          });
          break;

        case 'RATE_LIMIT_EXCEEDED':
          // Show rate limit message
          showToast(error.message, 'warning');
          break;

        default:
          // Generic error
          showToast(error.message || 'An error occurred', 'error');
      }

      throw new Error(error.message);
    }

    return data.data;

  } catch (err) {
    // Network error or parsing error
    logger.error('API request failed', {
      endpoint,
      error: err.message
    });

    showToast('Network error. Please check your connection.', 'error');
    throw err;
  }
}
```

---

## 🚨 ERROR MONITORING (PostHog + Sentry)

### PostHog Error Tracking

```javascript
// Track errors in PostHog
posthog.capture('error_occurred', {
  error_code: err.code,
  error_message: err.message,
  endpoint: req.url,
  user_id: userId,
  user_tier: user.subscription_tier,
  timestamp: Date.now()
});
```

### Sentry Integration (Optional - Month 6+)

```javascript
// Install: npm install @sentry/nextjs

// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions

  beforeSend(event, hint) {
    // Don't send errors from rate limiting (too noisy)
    if (event.exception?.values?.[0]?.value?.includes('RATE_LIMIT_EXCEEDED')) {
      return null;
    }
    return event;
  }
});
```

---

## ✅ ERROR HANDLING CHECKLIST

### Before Launch
- [ ] All API routes use standardized error format
- [ ] All errors logged with structured data
- [ ] Client error boundary implemented
- [ ] User-friendly error messages (no raw errors shown)
- [ ] Sensitive data sanitized from logs
- [ ] PostHog error tracking configured
- [ ] Support ID included in all errors (for user support)

### Monitoring
- [ ] Set up alerts for error rate spikes
- [ ] Daily review of error logs
- [ ] Track most common errors
- [ ] Monitor error-to-success ratio per endpoint

---

**Never let users see raw errors. Every error is an opportunity to guide users or improve the product.**
