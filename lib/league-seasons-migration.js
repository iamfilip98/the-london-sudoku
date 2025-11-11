const { getPool } = require('./db-pool');

/**
 * Database migration for League Seasons System
 *
 * Creates tables for:
 * - league_seasons: Weekly season tracking
 * - league_season_results: Historical results for each user
 */

async function migrateLeagueSeasons() {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Creating league_seasons table...');

        // Create league_seasons table
        await client.query(`
            CREATE TABLE IF NOT EXISTS league_seasons (
                id SERIAL PRIMARY KEY,
                league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
                season_number INTEGER NOT NULL,
                start_date TIMESTAMP NOT NULL,
                end_date TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed')),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(league_id, season_number)
            )
        `);

        console.log('Creating league_season_results table...');

        // Create league_season_results table
        await client.query(`
            CREATE TABLE IF NOT EXISTS league_season_results (
                id SERIAL PRIMARY KEY,
                season_id INTEGER NOT NULL REFERENCES league_seasons(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                final_points INTEGER NOT NULL DEFAULT 0,
                final_rank INTEGER NOT NULL,
                outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('promoted', 'demoted', 'stayed')),
                new_tier VARCHAR(50),
                created_at TIMESTAMP DEFAULT NOW(),
                UNIQUE(season_id, user_id)
            )
        `);

        console.log('Creating indexes for league seasons...');

        // Create indexes for performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_seasons_league_status
            ON league_seasons(league_id, status)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_seasons_dates
            ON league_seasons(start_date, end_date)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_season_results_user
            ON league_season_results(user_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_league_season_results_season
            ON league_season_results(season_id)
        `);

        console.log('Modifying league_members table for season tracking...');

        // Add season-related columns to league_members if they don't exist
        await client.query(`
            ALTER TABLE league_members
            ADD COLUMN IF NOT EXISTS season_points INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS lifetime_points INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS weeks_in_league INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS best_rank INTEGER,
            ADD COLUMN IF NOT EXISTS promotions_count INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS demotions_count INTEGER DEFAULT 0
        `);

        // Copy current points to lifetime_points for existing members
        await client.query(`
            UPDATE league_members
            SET lifetime_points = points, season_points = points
            WHERE lifetime_points = 0
        `);

        console.log('Creating initial seasons for all official leagues...');

        // Create initial active season for each official league
        const leagues = await client.query(`
            SELECT id, tier FROM leagues
            WHERE is_official = true
        `);

        const now = new Date();
        const seasonStart = new Date(now);
        seasonStart.setHours(0, 0, 0, 0);

        const seasonEnd = new Date(now);
        seasonEnd.setDate(seasonEnd.getDate() + 7);
        seasonEnd.setHours(23, 59, 59, 999);

        for (const league of leagues.rows) {
            // Check if season already exists
            const existing = await client.query(`
                SELECT id FROM league_seasons
                WHERE league_id = $1 AND season_number = 1
            `, [league.id]);

            if (existing.rows.length === 0) {
                await client.query(`
                    INSERT INTO league_seasons (league_id, season_number, start_date, end_date, status)
                    VALUES ($1, 1, $2, $3, 'active')
                `, [league.id, seasonStart, seasonEnd]);

                console.log(`  Created Season 1 for ${league.tier} league`);
            } else {
                console.log(`  Season 1 already exists for ${league.tier} league`);
            }
        }

        await client.query('COMMIT');

        console.log('League seasons migration completed successfully!');
        return {
            success: true,
            message: 'League seasons system created',
            tables: ['league_seasons', 'league_season_results'],
            modifications: ['league_members table updated with season columns']
        };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('League seasons migration failed:', error);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { migrateLeagueSeasons };
