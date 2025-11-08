/**
 * Input Validation Schemas
 *
 * Uses Zod for runtime type validation and sanitization
 * Prevents XSS, SQL injection, and malformed data attacks
 *
 * SECURITY: All user input MUST be validated before database operations
 */

const { z } = require('zod');

// ============================================
// COMMON VALIDATORS
// ============================================

const username = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username must be at most 50 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

const password = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password must be at most 100 characters');

const email = z.string()
  .email('Invalid email address')
  .max(255, 'Email must be at most 255 characters');

const displayName = z.string()
  .min(1, 'Display name is required')
  .max(100, 'Display name must be at most 100 characters')
  .transform(str => str.trim()); // Remove leading/trailing whitespace

const date = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine(str => !isNaN(Date.parse(str)), 'Invalid date');

const difficulty = z.enum(['easy', 'medium', 'hard'], {
  errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' })
});

const player = z.enum(['faidao', 'filip'], {
  errorMap: () => ({ message: 'Player must be faidao or filip' })
});

const puzzleGrid = z.array(z.array(z.number().int().min(0).max(9)).length(9)).length(9);

// ============================================
// AUTHENTICATION SCHEMAS
// ============================================

const loginSchema = z.object({
  username: username,
  password: password
});

const signupSchema = z.object({
  username: username,
  password: password,
  displayName: displayName,
  avatar: z.string().max(100).optional()
});

// ============================================
// PUZZLE SCHEMAS
// ============================================

const createPuzzleSchema = z.object({
  date: date,
  difficulty: difficulty,
  puzzle: puzzleGrid,
  solution: puzzleGrid
});

const completePuzzleSchema = z.object({
  date: date,
  difficulty: difficulty,
  time: z.number()
    .int('Time must be an integer')
    .min(1, 'Time must be at least 1 second')
    .max(7200, 'Time cannot exceed 2 hours'),
  errors: z.number()
    .int('Errors must be an integer')
    .min(0, 'Errors cannot be negative')
    .max(100, 'Errors cannot exceed 100'),
  hints: z.number()
    .int('Hints must be an integer')
    .min(0, 'Hints cannot be negative')
    .max(81, 'Hints cannot exceed 81'),
  score: z.number()
    .min(0, 'Score cannot be negative')
    .max(10000, 'Score cannot exceed 10000'),
  player: player
});

// ============================================
// GAME STATE SCHEMAS
// ============================================

const saveGameSchema = z.object({
  date: date,
  difficulty: difficulty,
  player: player,
  currentGrid: puzzleGrid,
  notes: z.record(z.string(), z.array(z.number().int().min(1).max(9))).optional(),
  time: z.number().int().min(0),
  errors: z.number().int().min(0).max(100),
  hints: z.number().int().min(0).max(81)
});

const loadGameSchema = z.object({
  date: date,
  difficulty: difficulty,
  player: player
});

// ============================================
// RATING SCHEMAS
// ============================================

const submitRatingSchema = z.object({
  player: player,
  date: date,
  difficulty: difficulty,
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(10, 'Rating must be at most 10'),
  time: z.number().int().min(1),
  errors: z.number().int().min(0),
  hints: z.number().int().min(0),
  score: z.number().min(0),
  puzzleGrid: puzzleGrid,
  timestamp: z.string().datetime()
});

// ============================================
// ACHIEVEMENT SCHEMAS
// ============================================

const unlockAchievementSchema = z.object({
  achievementId: z.string()
    .min(1)
    .max(255)
    .regex(/^[a-z0-9_-]+$/, 'Achievement ID can only contain lowercase letters, numbers, underscores, and hyphens'),
  player: player,
  unlockedAt: z.string().datetime(),
  data: z.record(z.unknown()).optional()
});

// ============================================
// ENTRY SCHEMAS (Daily Battle Results)
// ============================================

const saveEntrySchema = z.object({
  date: date,
  faidao: z.object({
    easy: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional(),
    medium: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional(),
    hard: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional()
  }),
  filip: z.object({
    easy: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional(),
    medium: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional(),
    hard: z.object({
      time: z.number().int().min(0).optional(),
      score: z.number().min(0).optional(),
      errors: z.number().int().min(0).optional(),
      hints: z.number().int().min(0).optional()
    }).optional()
  })
});

// ============================================
// STATS SCHEMAS
// ============================================

const getStatsSchema = z.object({
  player: player.optional(),
  startDate: date.optional(),
  endDate: date.optional(),
  difficulty: difficulty.optional()
});

// ============================================
// VALIDATION HELPER FUNCTIONS
// ============================================

/**
 * Validate request body against schema
 * @param {Object} data - Request body
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Object} { success: boolean, data?: any, error?: ZodError }
 */
function validate(data, schema) {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    return {
      success: false,
      error: {
        message: 'Validation failed',
        issues: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      }
    };
  }
}

/**
 * Middleware to validate request body
 * @param {ZodSchema} schema - Zod validation schema
 * @returns {Function} Validation middleware
 */
function validateBody(schema) {
  return (req, res, next) => {
    const result = validate(req.body, schema);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    // Replace req.body with validated/sanitized data
    req.body = result.data;
    next();
  };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
function sanitizeHtml(input) {
  if (typeof input !== 'string') return input;

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Schemas
  loginSchema,
  signupSchema,
  createPuzzleSchema,
  completePuzzleSchema,
  saveGameSchema,
  loadGameSchema,
  submitRatingSchema,
  unlockAchievementSchema,
  saveEntrySchema,
  getStatsSchema,

  // Common validators (for custom validation)
  validators: {
    username,
    password,
    email,
    displayName,
    date,
    difficulty,
    player,
    puzzleGrid
  },

  // Helper functions
  validate,
  validateBody,
  sanitizeHtml
};
