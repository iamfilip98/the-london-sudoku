const { getPool } = require('./db-pool');

/**
 * Database migration for Phase 6 Month 22: Advanced League Achievement Tracking
 *
 * Adds enhanced tracking columns to league_season_results:
 * - rank_percentile: What % of players the user beat (for top X% achievements)
 * - winning_margin: Point difference to 2nd place (for margin achievements)
 * - max_possible_points: Maximum points achievable in the season (for perfect season detection)
 */

async function migrateLeagueSeasonTracking() {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');


        // Add new columns for advanced achievement tracking
        await client.query(`
            ALTER TABLE league_season_results
            ADD COLUMN IF NOT EXISTS rank_percentile DECIMAL(5,2),
            ADD COLUMN IF NOT EXISTS winning_margin INTEGER,
            ADD COLUMN IF NOT EXISTS max_possible_points INTEGER
        `);


        // Create index for percentile-based queries
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_season_results_percentile
            ON league_season_results(rank_percentile)
        `);


        // Backfill rank_percentile for existing season results
        await client.query(`
            WITH ranked_results AS (
                SELECT
                    id,
                    season_id,
                    final_rank,
                    COUNT(*) OVER (PARTITION BY season_id) as total_members
                FROM league_season_results
            )
            UPDATE league_season_results lsr
            SET rank_percentile = ((rr.total_members - rr.final_rank + 1) * 100.0 / rr.total_members)
            FROM ranked_results rr
            WHERE lsr.id = rr.id AND lsr.rank_percentile IS NULL
        `);


        // Backfill winning_margin for rank 1 finishers
        await client.query(`
            WITH winner_margins AS (
                SELECT
                    w.id,
                    w.final_points - COALESCE(
                        (
                            SELECT final_points
                            FROM league_season_results
                            WHERE season_id = w.season_id
                            AND final_rank = 2
                            LIMIT 1
                        ),
                        0
                    ) as margin
                FROM league_season_results w
                WHERE w.final_rank = 1 AND w.winning_margin IS NULL
            )
            UPDATE league_season_results lsr
            SET winning_margin = wm.margin
            FROM winner_margins wm
            WHERE lsr.id = wm.id
        `);


        // Set max_possible_points for existing records (7 days * 600 points max per day)
        const maxPoints = 7 * 600; // 7 days * (100 easy + 200 medium + 300 hard)

        await client.query(`
            UPDATE league_season_results
            SET max_possible_points = $1
            WHERE max_possible_points IS NULL
        `, [maxPoints]);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Enhanced league season tracking enabled',
            columns: ['rank_percentile', 'winning_margin', 'max_possible_points'],
            modifications: ['league_season_results table updated with tracking columns']
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { migrateLeagueSeasonTracking };
