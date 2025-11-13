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
  validateSaveGameRequest
} = require('../../../lib/validation');

describe('lib/validation.js', () => {
  describe('validatePlayer()', () => {
    test('should accept valid player names', () => {
      expect(validatePlayer('faidao')).toBe(true);
      expect(validatePlayer('filip')).toBe(true);
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

    test('should reject invalid player names', () => {
      expect(() => validatePlayer('invalid')).toThrow('Invalid player');
      expect(() => validatePlayer('alice')).toThrow('Invalid player');
      expect(() => validatePlayer('FAIDAO')).toThrow('Invalid player'); // Case sensitive
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
      expect(() => validateDate('2025-13-01')).toThrow('Invalid date values'); // Month 13
      expect(() => validateDate('2025-02-30')).toThrow('Invalid date values'); // Feb 30
      expect(() => validateDate('2025-11-31')).toThrow('Invalid date values'); // Nov 31
      expect(() => validateDate('2023-02-29')).toThrow('Invalid date values'); // Not leap year
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

    test('should reject missing or invalid game data', () => {
      expect(() => validateGameData()).toThrow('Game data must be an object');
      expect(() => validateGameData(null)).toThrow('Game data must be an object');
      expect(() => validateGameData('string')).toThrow('Game data must be an object');
    });

    test('should reject missing required fields', () => {
      expect(() => validateGameData({})).toThrow('Time is required');
      expect(() => validateGameData({ time: 180 })).toThrow('Errors is required');
      expect(() => validateGameData({ time: 180, errors: 0 })).toThrow('Score is required');
      expect(() => validateGameData({ time: 180, errors: 0, score: 95 })).toThrow('Hints is required');
    });

    test('should reject invalid time values', () => {
      expect(() => validateGameData({ ...validGameData, time: -1 })).toThrow('Time must be non-negative');
      expect(() => validateGameData({ ...validGameData, time: 'fast' })).toThrow('Time must be a number');
      expect(() => validateGameData({ ...validGameData, time: 7201 })).toThrow('Time must be <= 7200');
    });

    test('should reject invalid error counts', () => {
      expect(() => validateGameData({ ...validGameData, errors: -1 })).toThrow('Errors must be non-negative');
      expect(() => validateGameData({ ...validGameData, errors: 'many' })).toThrow('Errors must be a number');
      expect(() => validateGameData({ ...validGameData, errors: 101 })).toThrow('Errors must be <= 100');
    });

    test('should reject invalid scores', () => {
      expect(() => validateGameData({ ...validGameData, score: -1 })).toThrow('Score must be non-negative');
      expect(() => validateGameData({ ...validGameData, score: 'high' })).toThrow('Score must be a number');
      expect(() => validateGameData({ ...validGameData, score: 1001 })).toThrow('Score must be <= 1000');
    });

    test('should reject invalid hint counts', () => {
      expect(() => validateGameData({ ...validGameData, hints: -1 })).toThrow('Hints must be non-negative');
      expect(() => validateGameData({ ...validGameData, hints: 'few' })).toThrow('Hints must be a number');
      expect(() => validateGameData({ ...validGameData, hints: 26 })).toThrow('Hints must be <= 25');
    });

    test('should accept edge case values', () => {
      expect(validateGameData({
        time: 7200, // Maximum time
        errors: 100, // Maximum errors
        score: 1000, // Maximum score
        hints: 25 // Maximum hints
      })).toBe(true);

      expect(validateGameData({
        time: 0, // Minimum time
        errors: 0, // No errors
        score: 0, // Minimum score
        hints: 0 // No hints
      })).toBe(true);
    });
  });

  describe('validateSaveGameRequest()', () => {
    const validRequest = {
      player: 'faidao',
      date: '2025-11-13',
      difficulty: 'easy',
      gameData: {
        time: 180,
        errors: 2,
        score: 95.5,
        hints: 1
      }
    };

    test('should accept valid save game request', () => {
      expect(validateSaveGameRequest(validRequest)).toBe(true);
    });

    test('should reject missing fields', () => {
      expect(() => validateSaveGameRequest({})).toThrow('Player is required');
      expect(() => validateSaveGameRequest({ player: 'faidao' })).toThrow('Date is required');
      expect(() => validateSaveGameRequest({ player: 'faidao', date: '2025-11-13' })).toThrow('Difficulty is required');
    });

    test('should validate all fields', () => {
      // Invalid player
      expect(() => validateSaveGameRequest({ ...validRequest, player: 'invalid' })).toThrow('Invalid player');

      // Invalid date
      expect(() => validateSaveGameRequest({ ...validRequest, date: '2025-13-01' })).toThrow('Invalid date');

      // Invalid difficulty
      expect(() => validateSaveGameRequest({ ...validRequest, difficulty: 'expert' })).toThrow('Invalid difficulty');

      // Invalid game data
      expect(() => validateSaveGameRequest({ ...validRequest, gameData: { ...validRequest.gameData, time: -1 } })).toThrow('Time must be non-negative');
    });

    test('should work with different players and difficulties', () => {
      expect(validateSaveGameRequest({ ...validRequest, player: 'filip' })).toBe(true);
      expect(validateSaveGameRequest({ ...validRequest, difficulty: 'medium' })).toBe(true);
      expect(validateSaveGameRequest({ ...validRequest, difficulty: 'hard' })).toBe(true);
    });
  });

  describe('Validation edge cases', () => {
    test('should handle whitespace correctly', () => {
      expect(() => validatePlayer(' faidao ')).toThrow('Invalid player'); // With spaces
      expect(() => validateDifficulty(' easy ')).toThrow('Invalid difficulty');
    });

    test('should be case-sensitive', () => {
      expect(() => validatePlayer('Faidao')).toThrow('Invalid player');
      expect(() => validatePlayer('FILIP')).toThrow('Invalid player');
      expect(() => validateDifficulty('Easy')).toThrow('Invalid difficulty');
      expect(() => validateDifficulty('MEDIUM')).toThrow('Invalid difficulty');
    });

    test('should handle special characters in dates', () => {
      expect(() => validateDate('2025-11-13 ')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate(' 2025-11-13')).toThrow('Date must be in YYYY-MM-DD format');
      expect(() => validateDate('2025-11-13\n')).toThrow('Date must be in YYYY-MM-DD format');
    });

    test('should handle floating point numbers correctly', () => {
      expect(validateGameData({
        time: 180.5,
        errors: 2,
        score: 95.789,
        hints: 1
      })).toBe(true);

      // Errors should be integer
      expect(() => validateGameData({
        time: 180,
        errors: 2.5,
        score: 95,
        hints: 1
      })).toThrow(); // Should validate errors are integers
    });
  });
});
