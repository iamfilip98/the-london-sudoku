/**
 * LEAGUES SYSTEM API
 *
 * Handles all league-related functionality:
 * - Getting official leagues
 * - Joining/leaving leagues
 * - Creating custom leagues
 * - League rankings and points
 * - Weekly promotion/demotion logic
 *
 * Version: 1.0
 * Created: November 2025
 */

const pool = require('./db-pool');

/**
 * Get all official leagues with member counts
 */
async function getOfficialLeagues() {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.name,
        l.description,
        l.tier,
        l.max_members,
        COUNT(lm.id) as member_count
      FROM leagues l
      LEFT JOIN league_members lm ON l.id = lm.league_id
      WHERE l.type = 'official'
      GROUP BY l.id, l.name, l.description, l.tier, l.max_members
      ORDER BY
        CASE l.tier
          WHEN 'bronze' THEN 1
          WHEN 'silver' THEN 2
          WHEN 'gold' THEN 3
          WHEN 'platinum' THEN 4
          WHEN 'diamond' THEN 5
          WHEN 'legend' THEN 6
        END
    `);

    return {
      success: true,
      leagues: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        tier: row.tier,
        maxMembers: row.max_members,
        memberCount: parseInt(row.member_count),
        isFull: parseInt(row.member_count) >= row.max_members
      }))
    };
  } catch (error) {
    // Error occurred
    return { success: false, error: 'Failed to fetch leagues' };
  }
}

/**
 * Get league rankings for a specific league
 */
async function getLeagueRankings(leagueId, limit = 100) {
  try {
    const result = await pool.query(`
      SELECT
        lm.rank,
        lm.points,
        lm.weekly_puzzles_completed,
        lm.weekly_points_earned,
        lm.joined_at,
        lm.total_weeks_in_league,
        lm.times_promoted,
        lm.times_demoted,
        u.id as user_id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.subscription_tier
      FROM league_members lm
      JOIN users u ON lm.user_id = u.id
      WHERE lm.league_id = $1
      ORDER BY lm.points DESC, lm.joined_at ASC
      LIMIT $2
    `, [leagueId, limit]);

    return {
      success: true,
      rankings: result.rows.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        subscriptionTier: row.subscription_tier,
        points: row.points,
        weeklyPuzzles: row.weekly_puzzles_completed,
        weeklyPoints: row.weekly_points_earned,
        weeksInLeague: row.total_weeks_in_league,
        timesPromoted: row.times_promoted,
        timesDemoted: row.times_demoted,
        joinedAt: row.joined_at
      }))
    };
  } catch (error) {
    // Error occurred
    return { success: false, error: 'Failed to fetch rankings' };
  }
}

/**
 * Get user's league membership status
 */
async function getUserLeagueStatus(userId) {
  try {
    const result = await pool.query(`
      SELECT
        lm.league_id,
        lm.points,
        lm.rank,
        lm.weekly_puzzles_completed,
        lm.weekly_points_earned,
        lm.joined_at,
        lm.total_weeks_in_league,
        lm.times_promoted,
        lm.times_demoted,
        l.name as league_name,
        l.tier as league_tier,
        l.type as league_type,
        l.description as league_description
      FROM league_members lm
      JOIN leagues l ON lm.league_id = l.id
      WHERE lm.user_id = $1
    `, [userId]);

    if (result.rows.length === 0) {
      return {
        success: true,
        inLeague: false
      };
    }

    const membership = result.rows[0];
    return {
      success: true,
      inLeague: true,
      leagueId: membership.league_id,
      leagueName: membership.league_name,
      leagueTier: membership.league_tier,
      leagueType: membership.league_type,
      leagueDescription: membership.league_description,
      points: membership.points,
      rank: membership.rank,
      weeklyPuzzles: membership.weekly_puzzles_completed,
      weeklyPoints: membership.weekly_points_earned,
      joinedAt: membership.joined_at,
      weeksInLeague: membership.total_weeks_in_league,
      timesPromoted: membership.times_promoted,
      timesDemoted: membership.times_demoted
    };
  } catch (error) {
    // Error occurred
    return { success: false, error: 'Failed to fetch league status' };
  }
}

/**
 * Join a league (official or custom)
 */
async function joinLeague(userId, leagueId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user is already in a league
    const existingMembership = await client.query(
      'SELECT id FROM league_members WHERE user_id = $1',
      [userId]
    );

    if (existingMembership.rows.length > 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User is already in a league. Leave current league first.' };
    }

    // Check if league exists and is not full
    const leagueCheck = await client.query(`
      SELECT
        l.id,
        l.max_members,
        l.type,
        l.tier,
        COUNT(lm.id) as current_members
      FROM leagues l
      LEFT JOIN league_members lm ON l.id = lm.league_id
      WHERE l.id = $1
      GROUP BY l.id, l.max_members, l.type, l.tier
    `, [leagueId]);

    if (leagueCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'League not found' };
    }

    const league = leagueCheck.rows[0];
    if (parseInt(league.current_members) >= league.max_members) {
      await client.query('ROLLBACK');
      return { success: false, error: 'League is full' };
    }

    // Get current week start date (Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Add user to league
    const insertResult = await client.query(`
      INSERT INTO league_members (league_id, user_id, points, rank, week_start_date, weekly_puzzles_completed, weekly_points_earned, total_weeks_in_league)
      VALUES ($1, $2, 0, NULL, $3, 0, 0, 0)
      RETURNING id
    `, [leagueId, userId, weekStart.toISOString().split('T')[0]]);

    // Log activity
    await client.query(`
      INSERT INTO league_activity (user_id, to_league_id, activity_type, week_date)
      VALUES ($1, $2, 'join', $3)
    `, [userId, leagueId, weekStart.toISOString().split('T')[0]]);

    // Update ranks for all members in the league
    await updateLeagueRanks(client, leagueId);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Successfully joined league',
      leagueId: leagueId,
      leagueTier: league.tier,
      leagueType: league.type
    };
  } catch (error) {
    await client.query('ROLLBACK');
    // Error occurred
    return { success: false, error: 'Failed to join league' };
  } finally {
    client.release();
  }
}

/**
 * Leave a league
 */
async function leaveLeague(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current league
    const currentLeague = await client.query(
      'SELECT league_id FROM league_members WHERE user_id = $1',
      [userId]
    );

    if (currentLeague.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User is not in a league' };
    }

    const leagueId = currentLeague.rows[0].league_id;

    // Get current week start date
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Log activity
    await client.query(`
      INSERT INTO league_activity (user_id, from_league_id, to_league_id, activity_type, week_date)
      VALUES ($1, $2, $2, 'leave', $3)
    `, [userId, leagueId, weekStart.toISOString().split('T')[0]]);

    // Remove from league
    await client.query('DELETE FROM league_members WHERE user_id = $1', [userId]);

    // Update ranks for remaining members
    await updateLeagueRanks(client, leagueId);

    await client.query('COMMIT');

    return { success: true, message: 'Successfully left league' };
  } catch (error) {
    await client.query('ROLLBACK');
    // Error occurred
    return { success: false, error: 'Failed to leave league' };
  } finally {
    client.release();
  }
}

/**
 * Award points to a user for completing a puzzle (called from games.js)
 */
async function awardLeaguePoints(userId, points) {
  try {
    // Check if user is in a league
    const membership = await pool.query(
      'SELECT id, league_id FROM league_members WHERE user_id = $1',
      [userId]
    );

    if (membership.rows.length === 0) {
      // User not in a league, skip
      return { success: true, awarded: false };
    }

    const leagueId = membership.rows[0].league_id;

    // Update user's points and weekly stats
    await pool.query(`
      UPDATE league_members
      SET
        points = points + $1,
        weekly_points_earned = weekly_points_earned + $1,
        weekly_puzzles_completed = weekly_puzzles_completed + 1
      WHERE user_id = $2
    `, [points, userId]);

    // Update ranks for the league
    await updateLeagueRanks(null, leagueId);

    return { success: true, awarded: true, points: points };
  } catch (error) {
    // Error occurred
    return { success: false, error: 'Failed to award points' };
  }
}

/**
 * Update league rankings based on points (helper function)
 */
async function updateLeagueRanks(client, leagueId) {
  const db = client || pool;

  try {
    // Get all members ordered by points
    const members = await db.query(`
      SELECT id
      FROM league_members
      WHERE league_id = $1
      ORDER BY points DESC, joined_at ASC
    `, [leagueId]);

    // Update ranks
    for (let i = 0; i < members.rows.length; i++) {
      await db.query(
        'UPDATE league_members SET rank = $1 WHERE id = $2',
        [i + 1, members.rows[i].id]
      );
    }

    return { success: true };
  } catch (error) {
    // Error occurred
    throw error;
  }
}

/**
 * Create a custom league (Premium feature)
 */
async function createCustomLeague(creatorId, name, description, isPublic, maxMembers) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check if user has Premium subscription
    const userCheck = await client.query(
      'SELECT subscription_tier FROM users WHERE id = $1',
      [creatorId]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return { success: false, error: 'User not found' };
    }

    const subscriptionTier = userCheck.rows[0].subscription_tier;
    if (subscriptionTier !== 'premium' && subscriptionTier !== 'founder') {
      await client.query('ROLLBACK');
      return { success: false, error: 'Custom leagues are a Premium feature' };
    }

    // Create the league
    const leagueResult = await client.query(`
      INSERT INTO leagues (name, description, type, tier, creator_id, is_public, max_members)
      VALUES ($1, $2, 'custom', NULL, $3, $4, $5)
      RETURNING id
    `, [name, description, creatorId, isPublic, maxMembers || 100]);

    const leagueId = leagueResult.rows[0].id;

    // Get current week start date
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(today.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);

    // Auto-join creator as admin
    await client.query(`
      INSERT INTO league_members (league_id, user_id, is_admin, points, rank, week_start_date)
      VALUES ($1, $2, true, 0, 1, $3)
    `, [leagueId, creatorId, weekStart.toISOString().split('T')[0]]);

    // Log activity
    await client.query(`
      INSERT INTO league_activity (user_id, to_league_id, activity_type, week_date)
      VALUES ($1, $2, 'join', $3)
    `, [creatorId, leagueId, weekStart.toISOString().split('T')[0]]);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Custom league created successfully',
      leagueId: leagueId
    };
  } catch (error) {
    await client.query('ROLLBACK');
    // Error occurred
    return { success: false, error: 'Failed to create league' };
  } finally {
    client.release();
  }
}

/**
 * Get all custom leagues (public or created by user)
 */
async function getCustomLeagues(userId) {
  try {
    const result = await pool.query(`
      SELECT
        l.id,
        l.name,
        l.description,
        l.creator_id,
        l.is_public,
        l.max_members,
        l.created_at,
        u.username as creator_username,
        u.display_name as creator_display_name,
        COUNT(lm.id) as member_count
      FROM leagues l
      JOIN users u ON l.creator_id = u.id
      LEFT JOIN league_members lm ON l.id = lm.league_id
      WHERE l.type = 'custom'
        AND (l.is_public = true OR l.creator_id = $1)
      GROUP BY l.id, l.name, l.description, l.creator_id, l.is_public, l.max_members, l.created_at, u.username, u.display_name
      ORDER BY l.created_at DESC
      LIMIT 100
    `, [userId]);

    return {
      success: true,
      leagues: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        creatorId: row.creator_id,
        creatorUsername: row.creator_username,
        creatorDisplayName: row.creator_display_name,
        isPublic: row.is_public,
        maxMembers: row.max_members,
        memberCount: parseInt(row.member_count),
        isFull: parseInt(row.member_count) >= row.max_members,
        createdAt: row.created_at
      }))
    };
  } catch (error) {
    // Error occurred
    return { success: false, error: 'Failed to fetch custom leagues' };
  }
}

module.exports = {
  getOfficialLeagues,
  getLeagueRankings,
  getUserLeagueStatus,
  joinLeague,
  leaveLeague,
  awardLeaguePoints,
  createCustomLeague,
  getCustomLeagues
};
