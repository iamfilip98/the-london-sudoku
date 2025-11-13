const { getPool } = require('./db-pool');

/**
 * Database migration for Phase 6 Month 23: Intra-Season Zone Tracking
 *
 * Adds league_position_snapshots table for tracking demotion zone escapes:
 * - Daily snapshots of league positions during active seasons
 * - Zone status (promotion/safe/demotion) for each snapshot
 * - Enables "Relegation Fighter" achievement (avoid demotion 5x while in bottom 30%)
 */

async function migrateLeagueZoneTracking() {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');


        // Create table for daily position snapshots
        await client.query(`
            CREATE TABLE IF NOT EXISTS league_position_snapshots (
                id SERIAL PRIMARY KEY,
                league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                season_id INTEGER NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
                snapshot_date DATE NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                rank INTEGER NOT NULL,
                zone VARCHAR(20) NOT NULL CHECK (zone IN ('promotion', 'safe', 'demotion')),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(season_id, user_id, snapshot_date)
            )
        `);


        // Create indexes for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_snapshots_user_season
            ON league_position_snapshots(user_id, season_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_snapshots_season_date
            ON league_position_snapshots(season_id, snapshot_date)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_snapshots_zone
            ON league_position_snapshots(zone)
        `);

        await client.query('COMMIT');

        return {
            success: true,
            message: 'Intra-season zone tracking enabled',
            tables: ['league_position_snapshots'],
            features: [
                'Daily position snapshots during active seasons',
                'Zone status tracking (promotion/safe/demotion)',
                'Demotion escape achievement support',
                'Historical position data for analysis'
            ]
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { migrateLeagueZoneTracking };
