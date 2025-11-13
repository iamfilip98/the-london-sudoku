const { getPool } = require('./db-pool');

/**
 * League Zone Snapshots System
 *
 * Daily snapshots of league positions to track zone movements:
 * - Promotion zone (top 20%)
 * - Safe zone (middle 60%)
 * - Demotion zone (bottom 20%)
 *
 * Used for "Relegation Fighter" achievement tracking
 */

const PROMOTION_RATE = 0.20;
const DEMOTION_RATE = 0.20;

/**
 * Take snapshot of all active league positions
 * Called daily during active seasons
 */
async function takeLeagueSnapshots() {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const snapshotDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        let totalSnapshots = 0;

        // Get all active seasons
        const activeSeasons = await client.query(`
            SELECT ls.*, l.id as league_id, l.tier
            FROM league_seasons ls
            JOIN leagues l ON ls.league_id = l.id
            WHERE ls.status = 'active'
        `);


        for (const season of activeSeasons.rows) {
            // Get current rankings for this league
            const rankings = await client.query(`
                SELECT
                    user_id,
                    points,
                    rank
                FROM league_members
                WHERE league_id = $1
                ORDER BY points DESC, user_id ASC
            `, [season.league_id]);

            if (rankings.rows.length === 0) {
                continue;
            }

            const totalMembers = rankings.rows.length;
            const promotionCutoff = Math.ceil(totalMembers * PROMOTION_RATE);
            const demotionCutoff = totalMembers - Math.ceil(totalMembers * DEMOTION_RATE);

            // Create snapshot for each member
            for (let i = 0; i < rankings.rows.length; i++) {
                const member = rankings.rows[i];
                const rank = i + 1;

                // Determine zone
                let zone = 'safe';
                if (rank <= promotionCutoff && season.tier !== 'legend') {
                    zone = 'promotion';
                } else if (rank > demotionCutoff && season.tier !== 'bronze') {
                    zone = 'demotion';
                }

                // Insert snapshot (ignore if already exists for today)
                await client.query(`
                    INSERT INTO league_position_snapshots
                    (league_id, user_id, season_id, snapshot_date, points, rank, zone)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (season_id, user_id, snapshot_date) DO NOTHING
                `, [season.league_id, member.user_id, season.id, snapshotDate, member.points, rank, zone]);

                totalSnapshots++;
            }

        }

        await client.query('COMMIT');

        return {
            success: true,
            date: snapshotDate,
            totalSnapshots: totalSnapshots,
            seasonsProcessed: activeSeasons.rows.length
        };

    } catch (error) {
        await client.query('ROLLBACK');
        // Error occurred
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get demotion escapes for a user across all seasons
 * Escape = was in demotion zone during season, but finished in safe/promotion zone
 */
async function getUserDemotionEscapes(userId) {
    const pool = getPool();

    const result = await pool.query(`
        WITH user_seasons AS (
            -- Get all seasons user participated in
            SELECT DISTINCT season_id
            FROM league_position_snapshots
            WHERE user_id = $1
        ),
        demotion_zone_seasons AS (
            -- Seasons where user was in demotion zone at some point
            SELECT DISTINCT season_id
            FROM league_position_snapshots
            WHERE user_id = $1 AND zone = 'demotion'
        ),
        season_outcomes AS (
            -- Final outcomes for those seasons
            SELECT
                lsr.season_id,
                lsr.outcome,
                lsr.final_rank
            FROM league_season_results lsr
            WHERE lsr.user_id = $1
            AND lsr.season_id IN (SELECT season_id FROM demotion_zone_seasons)
        )
        -- Count escapes (was in demotion zone but didn't get demoted)
        SELECT COUNT(*) as escape_count
        FROM season_outcomes
        WHERE outcome IN ('stayed', 'promoted')
    `, [userId]);

    return result.rows[0]?.escape_count || 0;
}

module.exports = {
    takeLeagueSnapshots,
    getUserDemotionEscapes
};
