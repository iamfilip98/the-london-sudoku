-- ============================================================================
-- Migration: Transform Battle Mode to User-Centric Personal Milestones
-- ============================================================================
-- This migration transforms the database from a dual-player battle system
-- to a user-centric personal milestone system.
--
-- BEFORE: Entries stored dual-player data (faidao vs filip)
-- AFTER: Entries support any number of users, each tracking personal progress
--
-- Date: November 2025
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: Ensure entries table supports dynamic player data
-- ============================================================================
-- The entries table already stores JSONB data, so it's flexible enough
-- to handle any player structure. No schema changes needed.

-- Verify table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'entries') THEN
        RAISE EXCEPTION 'entries table does not exist. Run init-db first.';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Ensure streaks table supports any player
-- ============================================================================
-- Remove the constraint that limits players to specific names
-- The current structure already supports this via VARCHAR(50)

COMMENT ON TABLE streaks IS 'Tracks completion streaks for all users (generic, not limited to specific players)';

-- ============================================================================
-- STEP 3: Update achievements table to support any player
-- ============================================================================
-- Already flexible - player column is VARCHAR(50)
-- No changes needed

COMMENT ON TABLE achievements IS 'Tracks achievement unlocks for all users (personal milestones)';

-- ============================================================================
-- STEP 4: Add indexes for better performance with multi-user queries
-- ============================================================================

-- Index for quickly finding all players in entries
CREATE INDEX IF NOT EXISTS idx_entries_players
ON entries USING GIN (data jsonb_path_ops);

-- Index for user-specific achievement queries
CREATE INDEX IF NOT EXISTS idx_achievements_player_date
ON achievements(player, unlocked_at DESC);

-- ============================================================================
-- STEP 5: Data transformation (if needed)
-- ============================================================================
-- If you have existing battle-mode data that needs transformation,
-- run these queries to restructure the data:

-- Example: Transform dual-player entries to separate per-user entries
-- (Only run if you have existing data to migrate)

-- UNCOMMENT AND MODIFY IF NEEDED:
/*
-- Create separate entries for each player from battle-mode entries
INSERT INTO entries (date, data, created_at, updated_at)
SELECT
    date,
    jsonb_build_object('player', 'faidao', player_key, data->'faidao') as data,
    created_at,
    updated_at
FROM entries
WHERE data ? 'faidao'
ON CONFLICT (date) DO NOTHING;

-- Repeat for other players as needed
*/

-- ============================================================================
-- STEP 6: Verify migration
-- ============================================================================

-- Check that indexes were created
SELECT
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('entries', 'achievements', 'streaks')
ORDER BY tablename, indexname;

-- Check sample data structure
SELECT
    'entries' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('entries')) as table_size
FROM entries
UNION ALL
SELECT
    'achievements' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('achievements')) as table_size
FROM achievements
UNION ALL
SELECT
    'streaks' as table_name,
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('streaks')) as table_size
FROM streaks;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- If you need to rollback this migration:
--
-- DROP INDEX IF EXISTS idx_entries_players;
-- DROP INDEX IF EXISTS idx_achievements_player_date;
--
-- Note: Data transformations are not automatically reversible.
-- Create a backup before running data transformation queries.
-- ============================================================================

COMMIT;

-- Migration complete!
SELECT 'User-centric migration completed successfully!' as status;
