/**
 * Unit Tests for lib/validation.js
 *
 * Tests input validation functions for API endpoints
 */

const {
  validatePlayer,
  validateDifficulty,
  validateDate,
  validateGameData,
  validateSaveGameRequest,
  sanitizeString,
  VALID_DIFFICULTIES
} = require('../../../lib/validation');

describe('lib/validation.js', () => {
  describe('validatePlayer()', () => {
    test('should accept valid player names of any length 1-50', () => {
      expect(validatePlayer('user')).toBe(true);
      expect(validatePlayer('testuser123')).toBe(true);
      expect(validatePlayer('a')).toBe(true); // 1 character
      expect(validatePlayer('a'.repeat(50))).toBe(true); // 50 characters
    });

    test('should reject missing player', () => {
      expect(() => validatePlayer()).toThrow('Player is required');
      expect(() => validatePlayer(null)).toThrow('Player is required');
      expect(() => validatePlayer('')).toThrow('Player is required');
    });

    test('should reject non-string player', () => {
      expect(() => validatePlayer(123)).toThrow('Player must be a string');
      expect(() => validatePlayer({})).toThrow('Player must be a string');
      expect(() => validatePlayer([])).toThrow('Player must be a string');
    });

    test('should reject player names that are too long', () => {
      expect(() => validatePlayer('a'.repeat(51))).toThrow('Player must be between 1 and 50 characters');
    });
  });

  describe('validateDifficulty()', () => {
    test('should accept valid difficulties', () => {
      expect(validateDifficulty('easy')).toBe(true);
      expect(validateDifficulty('medium')).toBe(true);
      expect(validateDifficulty('hard')).toBe(true);
    });

    test('should reject missing difficulty', () => {
      expect(() => validateDifficulty()).toThrow('Difficulty is required');
      expect(() => validateDifficulty(null)).toThrow('Difficulty is required');
      expect(() => validateDifficulty('')).toThrow('Difficulty is required');
    });

    test('should reject non-string difficulty', () => {
      expect(() => validateDifficulty(1)).toThrow('Difficulty must be a string');
      expect(() => validateDifficulty({})).toThrow('Difficulty must be a string');
    });

    test('should reject invalid difficulty levels', () => {
      expect(() => validateDifficulty('expert')).toThrow('Invalid difficulty');
      expect(() => validateDifficulty('Easy')).toThrow('Invalid difficulty'); // Case sensitive
      expect(() => validateDifficulty('normal')).toThrow('Invalid difficulty');
    });
  });

  describe('validateDate()', () => {
    test('should accept valid date strings', () => {
      expect(validateDate('2025-11-13')).toBe(true);
      expect(validateDate('2025-01-01')).toBe(true);
      expect(validateDate('2025-12-31')).toBe(true);
      expect(validateDate('2024-02-29')).toBe(true); // Leap year
    });

    test('should reject missing date', () => {
      expect(() => validateDate()).toThrow('Date is required');
      expect(() => validateDate(null)).toThrow('Date is required');
      expect(() => validateDate('')).toThrow('Date is required');
    });

    test('should reject non-string date', () => {
      expect(() => validateDate(20251113)).toThrow('Date must be a string');
      expect(() => validateDate(new Date())).toThrow('Date must be a string');
    });

    test('should reject invalid date format', () => {
      expect(() => validateDate('2025/11/13')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('11-13-2025')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('2025-11-13T00:00:00')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('20251113')).toThrow('Date must be in YYYY-MM-DD format');
    });

    test('should reject invalid date values', () => {
      expect(() => validateDate('2025-13-01')).toThrow('Invalid date'); // Month 13
      expect(() => validateDate('2025-02-30')).toThrow('Invalid date'); // Feb 30
      expect(() => validateDate('2025-11-31')).toThrow('Invalid date'); // Nov 31
      expect(() => validateDate('2023-02-29')).toThrow('Invalid date'); // Not leap year
    });

    test('should reject completely invalid dates', () => {
      expect(() => validateDate('invalid')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('2025-99-99')).toThrow('Invalid date');
    });
  });

  describe('validateGameData()', () => {
    const validGameData = {
      time: 180,
      errors: 2,
      score: 95.5,
      hints: 1
    };

    test('should accept valid game data', () => {
      expect(validateGameData(validGameData)).toBe(true);
      expect(validateGameData({ ...validGameData, time: 0 })).toBe(true); // 0 is valid
      expect(validateGameData({ ...validGameData, errors: 0 })).toBe(true);
      expect(validateGameData({ ...validGameData, hints: 0 })).toBe(true);
    });

    test('should accept empty game data object', () => {
      // Validation is optional - fields are only validated if present
      expect(validateGameData({})).toBe(true);
    });

    test('should reject missing or invalid game data', () => {
      expect(() => validateGameData()).toThrow('Game data must be an object');
      expect(() => validateGameData(null)).toThrow('Game data must be an object');
      expect(() => validateGameData('string')).toThrow('Game data must be an object');
    });

    test('should reject invalid time values', () => {
      expect(() => validateGameData({ time: -1 })).toThrow('Time must be a positive integer');
      expect(() => validateGameData({ time: 'fast' })).toThrow('Time must be a positive integer');
      expect(() => validateGameData({ time: 86401 })).toThrow('Time cannot exceed 24 hours');
      expect(() => validateGameData({ time: 1.5 })).toThrow('Time must be a positive integer'); // Not integer
    });

    test('should reject invalid error counts', () => {
      expect(() => validateGameData({ errors: -1 })).toThrow('Errors must be a non-negative integer');
      expect(() => validateGameData({ errors: 'many' })).toThrow('Errors must be a non-negative integer');
      expect(() => validateGameData({ errors: 101 })).toThrow('Errors seems unreasonably high');
      expect(() => validateGameData({ errors: 1.5 })).toThrow('Errors must be a non-negative integer'); // Not integer
    });

    test('should reject invalid scores', () => {
      expect(() => validateGameData({ score: -1 })).toThrow('Score must be a non-negative number');
      expect(() => validateGameData({ score: 'high' })).toThrow('Score must be a non-negative number');
      expect(() => validateGameData({ score: 10001 })).toThrow('Score seems unreasonably high');
    });

    test('should reject invalid hint counts', () => {
      expect(() => validateGameData({ hints: -1 })).toThrow('Hints must be a non-negative integer');
      expect(() => validateGameData({ hints: 'few' })).toThrow('Hints must be a non-negative integer');
      expect(() => validateGameData({ hints: 11 })).toThrow('Hints seems unreasonably high');
      expect(() => validateGameData({ hints: 1.5 })).toThrow('Hints must be a non-negative integer'); // Not integer
    });

    test('should accept edge case values', () => {
      expect(validateGameData({
        time: 86400, // Maximum time (24 hours)
        errors: 100, // Maximum errors
        score: 10000, // Maximum score
        hints: 10 // Maximum hints
      })).toBe(true);

      expect(validateGameData({
        time: 0, // Minimum time
        errors: 0, // No errors
        score: 0, // Minimum score
        hints: 0 // No hints
      })).toBe(true);
    });

    test('should accept decimal scores', () => {
      expect(validateGameData({ score: 95.5 })).toBe(true);
      expect(validateGameData({ score: 100.123 })).toBe(true);
    });
  });

  describe('validateSaveGameRequest()', () => {
    const validRequest = {
      player: 'testuser',
      date: '2025-11-13',
      difficulty: 'easy',
      time: 180,
      errors: 2,
      score: 95.5,
      hints: 1
    };

    test('should accept valid save game request', () => {
      expect(validateSaveGameRequest(validRequest)).toBe(true);
    });

    test('should reject missing fields', () => {
      expect(() => validateSaveGameRequest({})).toThrow('Validation failed');
      expect(() => validateSaveGameRequest({ player: 'testuser' })).toThrow('Date is required');
      expect(() => validateSaveGameRequest({ player: 'testuser', date: '2025-11-13' })).toThrow('Difficulty is required');
    });

    test('should validate all fields', () => {
      // Invalid player (too long)
      expect(() => validateSaveGameRequest({ ...validRequest, player: 'a'.repeat(51) })).toThrow('between 1 and 50 characters');

      // Invalid date
      expect(() => validateSaveGameRequest({ ...validRequest, date: '2025-13-01' })).toThrow('Invalid date');

      // Invalid difficulty
      expect(() => validateSaveGameRequest({ ...validRequest, difficulty: 'expert' })).toThrow('Invalid difficulty');

      // Invalid game data (negative time)
      expect(() => validateSaveGameRequest({ ...validRequest, time: -1 })).toThrow('positive integer');
    });

    test('should work with different players and difficulties', () => {
      expect(validateSaveGameRequest({ ...validRequest, player: 'user1' })).toBe(true);
      expect(validateSaveGameRequest({ ...validRequest, player: 'anotheruser' })).toBe(true);
      expect(validateSaveGameRequest({ ...validRequest, difficulty: 'medium' })).toBe(true);
      expect(validateSaveGameRequest({ ...validRequest, difficulty: 'hard' })).toBe(true);
    });

    test('should collect multiple validation errors', () => {
      const invalidRequest = {
        player: 'a'.repeat(51), // Too long
        date: 'invalid-date',
        difficulty: 'expert',
        time: -1
      };

      try {
        validateSaveGameRequest(invalidRequest);
        fail('Should have thrown validation error');
      } catch (e) {
        expect(e.message).toContain('Validation failed');
        expect(e.message).toContain('between 1 and 50 characters');
        expect(e.message).toContain('Date must be in YYYY-MM-DD format');
        expect(e.message).toContain('Invalid difficulty');
      }
    });
  });

  describe('sanitizeString()', () => {
    test('should remove dangerous characters', () => {
      expect(sanitizeString('test\\"string')).toBe('teststring');
      expect(sanitizeString("test'string")).toBe('teststring');
      expect(sanitizeString('test;string')).toBe('teststring');
      expect(sanitizeString('test`string')).toBe('teststring');
      expect(sanitizeString('test\\string')).toBe('teststring');
    });

    test('should trim whitespace', () => {
      expect(sanitizeString('  test  ')).toBe('test');
      expect(sanitizeString('\n test \n')).toBe('test');
    });

    test('should limit length to 255 characters', () => {
      const longString = 'a'.repeat(300);
      expect(sanitizeString(longString).length).toBe(255);
    });

    test('should handle non-string input', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    test('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString('   ')).toBe('');
    });
  });

  describe('VALID_DIFFICULTIES constant', () => {
    test('should export valid difficulties', () => {
      expect(VALID_DIFFICULTIES).toEqual(['easy', 'medium', 'hard']);
    });
  });

  describe('Validation edge cases', () => {
    test('should handle whitespace in player names', () => {
      // Whitespace should be preserved in player names
      expect(validatePlayer('user name')).toBe(true);
      expect(validatePlayer('  spaces  ')).toBe(true);
    });

    test('should be case-sensitive for difficulty', () => {
      expect(() => validateDifficulty('Easy')).toThrow('Invalid difficulty');
      expect(() => validateDifficulty('MEDIUM')).toThrow('Invalid difficulty');
    });

    test('should handle special characters in dates', () => {
      expect(() => validateDate('2025-11-13 ')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate(' 2025-11-13')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('2025-11-13\n')).toThrow('Date must be in YYYY-MM-DD format');
    });

    test('should handle floating point time (should fail)', () => {
      expect(() => validateGameData({
        time: 180.5, // Not an integer
        errors: 2,
        score: 95.789,
        hints: 1
      })).toThrow('positive integer');
    });

    test('should handle floating point errors (should fail)', () => {
      expect(() => validateGameData({
        time: 180,
        errors: 2.5, // Not an integer
        score: 95,
        hints: 1
      })).toThrow('non-negative integer');
    });
  });
});
