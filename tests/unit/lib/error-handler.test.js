/**
 * Unit Tests for lib/error-handler.js
 *
 * Tests centralized error handling functionality
 */

const {
  ErrorTypes,
  AppError,
  handleApiError,
  asyncHandler,
  getUserFriendlyMessage,
  retryOperation,
  validateRequired,
  safeJsonParse
} = require('../../../lib/error-handler');

describe('lib/error-handler.js', () => {
  describe('ErrorTypes', () => {
    test('should export all error types with status codes', () => {
      expect(ErrorTypes.VALIDATION_ERROR).toEqual({ status: 400, message: 'Invalid input provided' });
      expect(ErrorTypes.AUTHENTICATION_ERROR).toEqual({ status: 401, message: 'Authentication required' });
      expect(ErrorTypes.AUTHORIZATION_ERROR).toEqual({ status: 403, message: 'Access denied' });
      expect(ErrorTypes.NOT_FOUND_ERROR).toEqual({ status: 404, message: 'Resource not found' });
      expect(ErrorTypes.RATE_LIMIT_ERROR).toEqual({ status: 429, message: 'Too many requests' });
      expect(ErrorTypes.DATABASE_ERROR).toEqual({ status: 500, message: 'Database operation failed' });
      expect(ErrorTypes.CACHE_ERROR).toEqual({ status: 500, message: 'Cache operation failed' });
      expect(ErrorTypes.EXTERNAL_API_ERROR).toEqual({ status: 502, message: 'External service unavailable' });
      expect(ErrorTypes.INTERNAL_ERROR).toEqual({ status: 500, message: 'Internal server error' });
    });

    test('should have correct HTTP status codes', () => {
      expect(ErrorTypes.VALIDATION_ERROR.status).toBe(400);
      expect(ErrorTypes.AUTHENTICATION_ERROR.status).toBe(401);
      expect(ErrorTypes.AUTHORIZATION_ERROR.status).toBe(403);
      expect(ErrorTypes.NOT_FOUND_ERROR.status).toBe(404);
      expect(ErrorTypes.RATE_LIMIT_ERROR.status).toBe(429);
      expect(ErrorTypes.DATABASE_ERROR.status).toBe(500);
      expect(ErrorTypes.INTERNAL_ERROR.status).toBe(500);
    });
  });

  describe('AppError', () => {
    test('should create AppError with default message', () => {
      const error = new AppError('VALIDATION_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('AppError');
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
      expect(error.message).toBe('Invalid input provided');
      expect(error.timestamp).toBeDefined();
    });

    test('should create AppError with custom message', () => {
      const error = new AppError('VALIDATION_ERROR', 'Custom validation message');

      expect(error.message).toBe('Custom validation message');
      expect(error.type).toBe('VALIDATION_ERROR');
      expect(error.status).toBe(400);
    });

    test('should create AppError with details', () => {
      const details = { field: 'email', reason: 'Invalid format' };
      const error = new AppError('VALIDATION_ERROR', 'Email validation failed', details);

      expect(error.details).toEqual(details);
    });

    test('should handle unknown error type', () => {
      const error = new AppError('UNKNOWN_ERROR');

      expect(error.status).toBe(500); // Defaults to INTERNAL_ERROR
      expect(error.message).toBe('Internal server error');
    });

    test('should capture stack trace', () => {
      const error = new AppError('INTERNAL_ERROR');

      expect(error.stack).toBeDefined();
      expect(typeof error.stack).toBe('string');
    });

    test('should serialize to JSON correctly', () => {
      const error = new AppError('NOT_FOUND_ERROR', 'User not found', { userId: 123 });
      const json = error.toJSON();

      expect(json).toEqual({
        error: 'User not found',
        type: 'NOT_FOUND_ERROR',
        status: 404,
        details: { userId: 123 },
        timestamp: error.timestamp
      });
    });
  });

  describe('handleApiError()', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        path: '/api/test',
        method: 'GET'
      };

      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
    });

    test('should handle AppError correctly', () => {
      const error = new AppError('VALIDATION_ERROR', 'Invalid input', { field: 'email' });

      handleApiError(error, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid input',
        type: 'VALIDATION_ERROR',
        status: 400,
        details: { field: 'email' },
        timestamp: error.timestamp
      });
    });

    test('should handle database constraint violation', () => {
      const error = new Error('Duplicate key violation');
      error.code = '23505'; // PostgreSQL unique violation

      handleApiError(error, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Database constraint violation',
          type: 'DATABASE_ERROR'
        })
      );
    });

    test('should handle generic errors', () => {
      const error = new Error('Something went wrong');

      handleApiError(error, mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
          type: 'INTERNAL_ERROR'
        })
      );
    });

    test('should include error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Development error');
      handleApiError(error, mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: 'Development error'
        })
      );

      process.env.NODE_ENV = originalEnv;
    });

    test('should hide error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Production error');
      handleApiError(error, mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          details: undefined
        })
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler()', () => {
    test('should wrap async function and handle success', async () => {
      const asyncFn = async (req, res) => {
        res.json({ success: true });
      };

      const mockReq = {};
      const mockRes = {
        json: jest.fn()
      };

      const wrapped = asyncHandler(asyncFn);
      await wrapped(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    test('should catch and handle errors', async () => {
      const asyncFn = async () => {
        throw new AppError('NOT_FOUND_ERROR', 'Resource not found');
      };

      const mockReq = { path: '/api/test', method: 'GET' };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const wrapped = asyncHandler(asyncFn);
      await wrapped(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Resource not found',
          type: 'NOT_FOUND_ERROR'
        })
      );
    });
  });

  describe('getUserFriendlyMessage()', () => {
    test('should return user-friendly message for each error type', () => {
      expect(getUserFriendlyMessage('VALIDATION_ERROR')).toBe('Please check your input and try again.');
      expect(getUserFriendlyMessage('AUTHENTICATION_ERROR')).toBe('Please sign in to continue.');
      expect(getUserFriendlyMessage('AUTHORIZATION_ERROR')).toBe("You don't have permission to perform this action.");
      expect(getUserFriendlyMessage('NOT_FOUND_ERROR')).toBe('Resource not found.');
      expect(getUserFriendlyMessage('RATE_LIMIT_ERROR')).toBe('Too many requests. Please wait a moment and try again.');
      expect(getUserFriendlyMessage('DATABASE_ERROR')).toBe("We're experiencing technical difficulties. Please try again later.");
      expect(getUserFriendlyMessage('CACHE_ERROR')).toBe('Temporary issue retrieving data. Please refresh the page.');
      expect(getUserFriendlyMessage('EXTERNAL_API_ERROR')).toBe('Service temporarily unavailable. Please try again later.');
      expect(getUserFriendlyMessage('INTERNAL_ERROR')).toBe('Something went wrong. Our team has been notified.');
    });

    test('should use context for NOT_FOUND_ERROR', () => {
      expect(getUserFriendlyMessage('NOT_FOUND_ERROR', { resource: 'User' })).toBe('User not found.');
      expect(getUserFriendlyMessage('NOT_FOUND_ERROR', { resource: 'Puzzle' })).toBe('Puzzle not found.');
    });

    test('should return default message for unknown error type', () => {
      expect(getUserFriendlyMessage('UNKNOWN_ERROR')).toBe('Something went wrong. Our team has been notified.');
    });
  });

  describe('retryOperation()', () => {
    test('should succeed on first try', async () => {
      const successFn = jest.fn().mockResolvedValue('success');

      const result = await retryOperation(successFn, { maxRetries: 3 });

      expect(result).toBe('success');
      expect(successFn).toHaveBeenCalledTimes(1);
    });

    test('should retry on failure and eventually succeed', async () => {
      let attempts = 0;
      const retryFn = jest.fn(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const result = await retryOperation(retryFn, { maxRetries: 3, delayMs: 10 });

      expect(result).toBe('success');
      expect(retryFn).toHaveBeenCalledTimes(3);
    });

    test('should throw error after max retries', async () => {
      const failFn = jest.fn().mockRejectedValue(new Error('Permanent failure'));

      await expect(retryOperation(failFn, { maxRetries: 2, delayMs: 10 })).rejects.toThrow('Permanent failure');
      expect(failFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    test('should use exponential backoff', async () => {
      const delays = [];
      const failFn = jest.fn().mockRejectedValue(new Error('Failure'));
      const onRetry = (attempt, delay) => {
        delays.push(delay);
      };

      await expect(retryOperation(failFn, {
        maxRetries: 3,
        delayMs: 100,
        backoff: 'exponential',
        onRetry
      })).rejects.toThrow();

      expect(delays).toEqual([100, 200, 400]); // Exponential: 100, 200, 400
    });

    test('should use linear backoff', async () => {
      const delays = [];
      const failFn = jest.fn().mockRejectedValue(new Error('Failure'));
      const onRetry = (attempt, delay) => {
        delays.push(delay);
      };

      await expect(retryOperation(failFn, {
        maxRetries: 3,
        delayMs: 100,
        backoff: 'linear',
        onRetry
      })).rejects.toThrow();

      expect(delays).toEqual([100, 200, 300]); // Linear: 100, 200, 300
    });

    test('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const failFn = jest.fn().mockRejectedValue(new Error('Failure'));

      await expect(retryOperation(failFn, {
        maxRetries: 2,
        delayMs: 10,
        onRetry
      })).rejects.toThrow();

      expect(onRetry).toHaveBeenCalledTimes(2);
      expect(onRetry).toHaveBeenNthCalledWith(1, 1, 10, expect.any(Error));
      expect(onRetry).toHaveBeenNthCalledWith(2, 2, 20, expect.any(Error));
    });
  });

  describe('validateRequired()', () => {
    test('should pass when all required fields are present', () => {
      const data = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      };

      expect(() => validateRequired(data, ['username', 'email', 'password'])).not.toThrow();
    });

    test('should throw AppError when field is missing', () => {
      const data = {
        username: 'testuser'
      };

      expect(() => validateRequired(data, ['username', 'email'])).toThrow(AppError);
      expect(() => validateRequired(data, ['username', 'email'])).toThrow('Missing required fields: email');
    });

    test('should throw AppError when multiple fields are missing', () => {
      const data = {
        username: 'testuser'
      };

      try {
        validateRequired(data, ['username', 'email', 'password']);
        fail('Should have thrown AppError');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toContain('email');
        expect(error.message).toContain('password');
        expect(error.details.missing).toEqual(['email', 'password']);
      }
    });

    test('should consider null as missing', () => {
      const data = {
        username: 'testuser',
        email: null
      };

      expect(() => validateRequired(data, ['username', 'email'])).toThrow('Missing required fields: email');
    });

    test('should consider undefined as missing', () => {
      const data = {
        username: 'testuser',
        email: undefined
      };

      expect(() => validateRequired(data, ['username', 'email'])).toThrow('Missing required fields: email');
    });

    test('should consider empty string as missing', () => {
      const data = {
        username: 'testuser',
        email: ''
      };

      expect(() => validateRequired(data, ['username', 'email'])).toThrow('Missing required fields: email');
    });

    test('should accept 0 as valid value', () => {
      const data = {
        count: 0,
        value: 0
      };

      expect(() => validateRequired(data, ['count', 'value'])).not.toThrow();
    });

    test('should accept false as valid value', () => {
      const data = {
        enabled: false,
        active: false
      };

      expect(() => validateRequired(data, ['enabled', 'active'])).not.toThrow();
    });
  });

  describe('safeJsonParse()', () => {
    test('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse(json);

      expect(result).toEqual({ name: 'test', value: 123 });
    });

    test('should parse JSON array', () => {
      const json = '[1, 2, 3]';
      const result = safeJsonParse(json);

      expect(result).toEqual([1, 2, 3]);
    });

    test('should return default value on parse error', () => {
      const invalidJson = '{invalid json}';
      const result = safeJsonParse(invalidJson, { default: true });

      expect(result).toEqual({ default: true });
    });

    test('should return null as default when not specified', () => {
      const invalidJson = 'not json';
      const result = safeJsonParse(invalidJson);

      expect(result).toBeNull();
    });

    test('should handle empty string', () => {
      const result = safeJsonParse('', { empty: true });

      expect(result).toEqual({ empty: true });
    });

    test('should parse primitive values', () => {
      expect(safeJsonParse('true')).toBe(true);
      expect(safeJsonParse('false')).toBe(false);
      expect(safeJsonParse('123')).toBe(123);
      expect(safeJsonParse('"string"')).toBe('string');
      expect(safeJsonParse('null')).toBeNull();
    });

    test('should handle nested JSON', () => {
      const json = '{"user": {"name": "test", "settings": {"theme": "dark"}}}';
      const result = safeJsonParse(json);

      expect(result).toEqual({
        user: {
          name: 'test',
          settings: {
            theme: 'dark'
          }
        }
      });
    });
  });

  describe('Integration scenarios', () => {
    test('should create and serialize AppError correctly', () => {
      const error = new AppError('RATE_LIMIT_ERROR', 'Too many login attempts', {
        attempts: 5,
        timeWindow: '15m'
      });

      const json = error.toJSON();

      expect(json.error).toBe('Too many login attempts');
      expect(json.type).toBe('RATE_LIMIT_ERROR');
      expect(json.status).toBe(429);
      expect(json.details).toEqual({ attempts: 5, timeWindow: '15m' });
      expect(json.timestamp).toBeDefined();

      const message = getUserFriendlyMessage(error.type);
      expect(message).toBe('Too many requests. Please wait a moment and try again.');
    });

    test('should validate required fields and throw AppError', () => {
      const data = { username: 'user' };

      try {
        validateRequired(data, ['username', 'email', 'password']);
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(AppError);
        expect(error.type).toBe('VALIDATION_ERROR');
        expect(error.status).toBe(400);

        const message = getUserFriendlyMessage(error.type);
        expect(message).toBe('Please check your input and try again.');
      }
    });

    test('should retry operation with exponential backoff', async () => {
      let attempts = 0;
      const operation = async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return { success: true };
      };

      const result = await retryOperation(operation, {
        maxRetries: 3,
        delayMs: 10,
        backoff: 'exponential'
      });

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(3);
    });
  });
});
