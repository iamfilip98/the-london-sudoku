-- Phase 1 Month 5: Database Schema Updates
-- Adds support for X-Sudoku, Mini 6x6, free tier limits, and founder badges

-- ============================================================================
-- 1. Add variant support to daily_puzzles
-- ============================================================================

-- Note: We'll keep the existing daily_puzzles table for backward compatibility
-- and add variant column with default 'classic'
ALTER TABLE daily_puzzles
ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic';

-- Create index for variant queries
CREATE INDEX IF NOT EXISTS idx_daily_puzzles_variant
ON daily_puzzles(date, variant);

-- ============================================================================
-- 2. Add variant support to game_states
-- ============================================================================

ALTER TABLE game_states
ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic';

-- Drop old unique constraint and add new one with variant
ALTER TABLE game_states DROP CONSTRAINT IF EXISTS game_states_player_date_difficulty_key;
ALTER TABLE game_states ADD CONSTRAINT game_states_player_date_difficulty_variant_key
  UNIQUE(player, date, difficulty, variant);

-- Update index for variant queries
DROP INDEX IF EXISTS idx_game_states_player_date;
CREATE INDEX IF NOT EXISTS idx_game_states_player_date_variant
ON game_states(player, date, difficulty, variant);

-- ============================================================================
-- 3. Add variant support to individual_games
-- ============================================================================

ALTER TABLE individual_games
ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic';

-- Create index for variant analytics
CREATE INDEX IF NOT EXISTS idx_individual_games_variant
ON individual_games(variant, difficulty);

-- ============================================================================
-- 4. Add variant support to fallback_puzzles
-- ============================================================================

ALTER TABLE fallback_puzzles
ADD COLUMN IF NOT EXISTS variant VARCHAR(20) DEFAULT 'classic';

-- Update fallback query index to include variant
DROP INDEX IF EXISTS idx_fallback_difficulty;
CREATE INDEX IF NOT EXISTS idx_fallback_difficulty_variant
ON fallback_puzzles(variant, difficulty, quality_score DESC, times_used ASC);

-- ============================================================================
-- 5. Add founder badges and free tier tracking to users
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS founder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_classic_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_puzzle_date DATE;

-- Create index for founder queries (partial index for efficiency)
CREATE INDEX IF NOT EXISTS idx_users_founder
ON users(founder) WHERE founder = TRUE;

-- Create index for daily limit queries
CREATE INDEX IF NOT EXISTS idx_users_daily_limits
ON users(username, last_puzzle_date, daily_classic_played);

-- ============================================================================
-- 6. Backfill existing data with classic variant
-- ============================================================================

-- All existing puzzles are classic variant (already handled by DEFAULT)
-- All existing games are classic variant (already handled by DEFAULT)

-- ============================================================================
-- Migration complete
-- ============================================================================
