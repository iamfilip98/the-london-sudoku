const { getPool } = require('./db-pool');

/**
 * League Seasons System
 *
 * Weekly competition system with promotion/demotion mechanics:
 * - Seasons run Monday 00:00 UTC to Sunday 23:59 UTC
 * - Top 20% of each league get promoted (except Legend)
 * - Bottom 20% of each league get demoted (except Bronze)
 * - Points reset weekly
 * - History preserved for stats and achievements
 */

// League tier hierarchy (for promotion/demotion)
const LEAGUE_TIERS = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'];

const PROMOTION_RATE = 0.20; // Top 20% get promoted
const DEMOTION_RATE = 0.20;  // Bottom 20% get demoted

/**
 * Get current active season for a league
 */
async function getCurrentSeason(leagueId) {
    const pool = getPool();
    const result = await pool.query(`
        SELECT * FROM league_seasons
        WHERE league_id = $1 AND status = 'active'
        ORDER BY start_date DESC
        LIMIT 1
    `, [leagueId]);

    return result.rows[0] || null;
}

/**
 * Get all active seasons (one per league)
 */
async function getAllActiveSeasons() {
    const pool = getPool();
    const result = await pool.query(`
        SELECT ls.*, l.name as league_name, l.tier
        FROM league_seasons ls
        JOIN leagues l ON ls.league_id = l.id
        WHERE ls.status = 'active'
        ORDER BY l.tier
    `);

    return result.rows;
}

/**
 * Create new season for all leagues
 * Called at start of each week (Monday 00:00 UTC)
 */
async function createNewSeasons() {
    const pool = getPool();

    // Get all official leagues
    const leagues = await pool.query(`
        SELECT id, tier FROM leagues
        WHERE is_official = true
        ORDER BY tier
    `);

    const startDate = getNextMonday();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    const seasonIds = [];

    for (const league of leagues.rows) {
        // Get current season number
        const lastSeason = await pool.query(`
            SELECT season_number FROM league_seasons
            WHERE league_id = $1
            ORDER BY season_number DESC
            LIMIT 1
        `, [league.id]);

        const seasonNumber = lastSeason.rows[0] ? lastSeason.rows[0].season_number + 1 : 1;

        // Create new season
        const result = await pool.query(`
            INSERT INTO league_seasons (league_id, season_number, start_date, end_date, status)
            VALUES ($1, $2, $3, $4, 'active')
            RETURNING id
        `, [league.id, seasonNumber, startDate, endDate]);

        seasonIds.push({ leagueId: league.id, seasonId: result.rows[0].id, tier: league.tier });
    }

    console.log(`Created ${seasonIds.length} new league seasons`);
    return seasonIds;
}

/**
 * Process end of season: calculate rankings, promote/demote, reset points
 * Called at end of each week (Sunday 23:59 UTC) via cron
 */
async function processSeasonEnd() {
    const pool = getPool();
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get all active seasons
        const activeSeasons = await getAllActiveSeasons();

        if (activeSeasons.length === 0) {
            console.log('No active seasons to process');
            return { success: true, processed: 0 };
        }

        const results = {
            promoted: 0,
            demoted: 0,
            stayed: 0,
            seasonsProcessed: 0
        };

        for (const season of activeSeasons) {
            console.log(`Processing season ${season.season_number} for ${season.league_name} (${season.tier})`);

            // Get final rankings for this season
            const rankings = await client.query(`
                SELECT
                    user_id,
                    points as season_points,
                    rank as final_rank
                FROM league_members
                WHERE league_id = $1
                ORDER BY points DESC, user_id ASC
            `, [season.league_id]);

            if (rankings.rows.length === 0) {
                console.log(`No members in league ${season.league_name}, skipping`);
                continue;
            }

            const totalMembers = rankings.rows.length;
            const promotionCutoff = Math.ceil(totalMembers * PROMOTION_RATE);
            const demotionCutoff = totalMembers - Math.ceil(totalMembers * DEMOTION_RATE);

            // Process each member
            for (let i = 0; i < rankings.rows.length; i++) {
                const member = rankings.rows[i];
                const rank = i + 1;
                let outcome = 'stayed';
                let newTier = season.tier;

                // Determine promotion/demotion
                if (rank <= promotionCutoff && season.tier !== 'legend') {
                    outcome = 'promoted';
                    newTier = getNextTier(season.tier);
                    results.promoted++;
                } else if (rank > demotionCutoff && season.tier !== 'bronze') {
                    outcome = 'demoted';
                    newTier = getPreviousTier(season.tier);
                    results.demoted++;
                } else {
                    results.stayed++;
                }

                // Save season result
                await client.query(`
                    INSERT INTO league_season_results
                    (season_id, user_id, final_points, final_rank, outcome, new_tier)
                    VALUES ($1, $2, $3, $4, $5, $6)
                `, [season.id, member.user_id, member.season_points, rank, outcome, newTier]);

                // Update member's league if promoted/demoted
                if (outcome !== 'stayed') {
                    const newLeague = await client.query(`
                        SELECT id FROM leagues
                        WHERE tier = $1 AND is_official = true
                        LIMIT 1
                    `, [newTier]);

                    if (newLeague.rows[0]) {
                        await client.query(`
                            UPDATE league_members
                            SET league_id = $1, points = 0, rank = NULL
                            WHERE user_id = $2 AND league_id = $3
                        `, [newLeague.rows[0].id, member.user_id, season.league_id]);

                        // Log activity
                        await client.query(`
                            INSERT INTO league_activity
                            (user_id, league_id, activity_type, details)
                            VALUES ($1, $2, $3, $4)
                        `, [
                            member.user_id,
                            newLeague.rows[0].id,
                            outcome,
                            JSON.stringify({
                                from_tier: season.tier,
                                to_tier: newTier,
                                season: season.season_number,
                                final_points: member.season_points,
                                final_rank: rank
                            })
                        ]);
                    }
                } else {
                    // Reset points for members staying in same league
                    await client.query(`
                        UPDATE league_members
                        SET points = 0, rank = NULL
                        WHERE user_id = $1 AND league_id = $2
                    `, [member.user_id, season.league_id]);
                }
            }

            // Mark season as completed
            await client.query(`
                UPDATE league_seasons
                SET status = 'completed', end_date = NOW()
                WHERE id = $1
            `, [season.id]);

            results.seasonsProcessed++;
        }

        await client.query('COMMIT');

        console.log('Season processing complete:', results);
        return { success: true, ...results };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Failed to process season end:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Get season history for a user
 */
async function getUserSeasonHistory(userId, limit = 10) {
    const pool = getPool();
    const result = await pool.query(`
        SELECT
            lsr.*,
            ls.season_number,
            ls.start_date,
            ls.end_date,
            l.name as league_name,
            l.tier as league_tier
        FROM league_season_results lsr
        JOIN league_seasons ls ON lsr.season_id = ls.id
        JOIN leagues l ON ls.league_id = l.id
        WHERE lsr.user_id = $1
        ORDER BY ls.end_date DESC
        LIMIT $2
    `, [userId, limit]);

    return result.rows;
}

/**
 * Get current season info with user's position
 */
async function getCurrentSeasonInfo(userId) {
    const pool = getPool();

    // Get user's current league
    const membership = await pool.query(`
        SELECT league_id, points, rank
        FROM league_members
        WHERE user_id = $1
        LIMIT 1
    `, [userId]);

    if (membership.rows.length === 0) {
        return null;
    }

    const leagueId = membership.rows[0].league_id;

    // Get current season
    const season = await getCurrentSeason(leagueId);

    if (!season) {
        return null;
    }

    // Get total members in league
    const memberCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM league_members
        WHERE league_id = $1
    `, [leagueId]);

    const totalMembers = parseInt(memberCount.rows[0].count);
    const userRank = membership.rows[0].rank;
    const userPoints = membership.rows[0].points;

    // Calculate promotion/demotion zones
    const promotionCutoff = Math.ceil(totalMembers * PROMOTION_RATE);
    const demotionCutoff = totalMembers - Math.ceil(totalMembers * DEMOTION_RATE);

    let zone = 'safe';
    if (userRank && userRank <= promotionCutoff) {
        zone = 'promotion';
    } else if (userRank && userRank > demotionCutoff) {
        zone = 'demotion';
    }

    // Get league info
    const league = await pool.query(`
        SELECT * FROM leagues WHERE id = $1
    `, [leagueId]);

    return {
        season: {
            id: season.id,
            number: season.season_number,
            startDate: season.start_date,
            endDate: season.end_date,
            daysRemaining: Math.ceil((new Date(season.end_date) - new Date()) / (1000 * 60 * 60 * 24))
        },
        league: league.rows[0],
        userStats: {
            rank: userRank,
            points: userPoints,
            zone: zone,
            totalMembers: totalMembers
        },
        zones: {
            promotionCutoff: promotionCutoff,
            demotionCutoff: demotionCutoff
        }
    };
}

/**
 * Helper: Get next tier (for promotion)
 */
function getNextTier(currentTier) {
    const index = LEAGUE_TIERS.indexOf(currentTier);
    if (index === -1 || index === LEAGUE_TIERS.length - 1) {
        return currentTier;
    }
    return LEAGUE_TIERS[index + 1];
}

/**
 * Helper: Get previous tier (for demotion)
 */
function getPreviousTier(currentTier) {
    const index = LEAGUE_TIERS.indexOf(currentTier);
    if (index <= 0) {
        return currentTier;
    }
    return LEAGUE_TIERS[index - 1];
}

/**
 * Helper: Get next Monday at 00:00 UTC
 */
function getNextMonday() {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;

    const nextMonday = new Date(now);
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    nextMonday.setUTCHours(0, 0, 0, 0);

    return nextMonday;
}

/**
 * Get season leaderboard with promotion/demotion zones
 */
async function getSeasonLeaderboard(seasonId, limit = 100) {
    const pool = getPool();

    // Get season info
    const season = await pool.query(`
        SELECT ls.*, l.name as league_name, l.tier
        FROM league_seasons ls
        JOIN leagues l ON ls.league_id = l.id
        WHERE ls.id = $1
    `, [seasonId]);

    if (season.rows.length === 0) {
        return null;
    }

    const seasonInfo = season.rows[0];

    // Get rankings
    const rankings = await pool.query(`
        SELECT
            lm.user_id,
            lm.points,
            lm.rank,
            u.username,
            u.display_name,
            u.avatar_url
        FROM league_members lm
        LEFT JOIN users u ON lm.user_id = u.id
        WHERE lm.league_id = $1
        ORDER BY lm.points DESC, lm.user_id ASC
        LIMIT $2
    `, [seasonInfo.league_id, limit]);

    const totalMembers = rankings.rows.length;
    const promotionCutoff = Math.ceil(totalMembers * PROMOTION_RATE);
    const demotionCutoff = totalMembers - Math.ceil(totalMembers * DEMOTION_RATE);

    // Add zone information to each member
    const leaderboard = rankings.rows.map((member, index) => {
        const rank = index + 1;
        let zone = 'safe';

        if (rank <= promotionCutoff && seasonInfo.tier !== 'legend') {
            zone = 'promotion';
        } else if (rank > demotionCutoff && seasonInfo.tier !== 'bronze') {
            zone = 'demotion';
        }

        return {
            ...member,
            rank: rank,
            zone: zone
        };
    });

    return {
        season: seasonInfo,
        leaderboard: leaderboard,
        zones: {
            promotionCutoff: promotionCutoff,
            demotionCutoff: demotionCutoff,
            totalMembers: totalMembers
        }
    };
}

module.exports = {
    getCurrentSeason,
    getAllActiveSeasons,
    createNewSeasons,
    processSeasonEnd,
    getUserSeasonHistory,
    getCurrentSeasonInfo,
    getSeasonLeaderboard,
    LEAGUE_TIERS,
    PROMOTION_RATE,
    DEMOTION_RATE
};
