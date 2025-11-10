-- =====================================================
-- BATTLE PASS SYSTEM - DATABASE SCHEMA
-- =====================================================
-- Version: 1.0
-- Created: November 2025
-- Purpose: Battle pass seasons, tiers, XP, and rewards
-- =====================================================

-- =====================================================
-- TABLE: battle_pass_seasons
-- Stores each 90-day battle pass season
-- =====================================================
CREATE TABLE IF NOT EXISTS battle_pass_seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    season_number INTEGER NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_tiers INTEGER NOT NULL DEFAULT 100,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT valid_season_dates CHECK (end_date > start_date),
    CONSTRAINT positive_tiers CHECK (total_tiers > 0)
);

CREATE INDEX idx_battle_pass_seasons_active ON battle_pass_seasons(is_active, end_date);
CREATE INDEX idx_battle_pass_seasons_number ON battle_pass_seasons(season_number);

-- =====================================================
-- TABLE: battle_pass_tiers
-- Defines rewards for each tier in a season
-- =====================================================
CREATE TABLE IF NOT EXISTS battle_pass_tiers (
    id SERIAL PRIMARY KEY,
    season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,
    tier_number INTEGER NOT NULL,
    xp_required INTEGER NOT NULL,

    -- Free track rewards
    free_reward_type VARCHAR(50), -- 'tokens', 'badge', 'theme', 'title', 'avatar', null
    free_reward_id VARCHAR(100),
    free_reward_amount INTEGER DEFAULT 0,

    -- Premium track rewards
    premium_reward_type VARCHAR(50), -- 'tokens', 'badge', 'theme', 'title', 'avatar', 'ultimate_pack', null
    premium_reward_id VARCHAR(100),
    premium_reward_amount INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_season_tier UNIQUE(season_id, tier_number),
    CONSTRAINT positive_xp CHECK (xp_required >= 0),
    CONSTRAINT positive_tier CHECK (tier_number > 0)
);

CREATE INDEX idx_battle_pass_tiers_season ON battle_pass_tiers(season_id, tier_number);

-- =====================================================
-- TABLE: user_battle_pass_progress
-- Tracks each user's progress through current season
-- =====================================================
CREATE TABLE IF NOT EXISTS user_battle_pass_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,

    -- Progress
    current_tier INTEGER NOT NULL DEFAULT 1,
    current_xp INTEGER NOT NULL DEFAULT 0,

    -- Premium status (cached from users table for quick access)
    has_premium_pass BOOLEAN DEFAULT false,

    -- Claimed rewards (array of tier numbers)
    claimed_free_tiers INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    claimed_premium_tiers INTEGER[] DEFAULT ARRAY[]::INTEGER[],

    -- Timestamps
    first_xp_gain_at TIMESTAMP,
    last_xp_gain_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_season UNIQUE(user_id, season_id),
    CONSTRAINT positive_tier CHECK (current_tier > 0),
    CONSTRAINT positive_xp CHECK (current_xp >= 0)
);

CREATE INDEX idx_user_bp_progress_user ON user_battle_pass_progress(user_id, season_id);
CREATE INDEX idx_user_bp_progress_season ON user_battle_pass_progress(season_id, current_tier DESC);

-- =====================================================
-- TABLE: user_xp_history
-- Logs all XP gains for analytics and debugging
-- =====================================================
CREATE TABLE IF NOT EXISTS user_xp_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,

    -- XP details
    xp_amount INTEGER NOT NULL,
    xp_source VARCHAR(100) NOT NULL, -- 'puzzle_classic_easy', 'achievement_rare', 'perfect_game', etc.

    -- Context
    source_reference VARCHAR(255), -- e.g., game_id, achievement_id, etc.
    tier_before INTEGER NOT NULL,
    tier_after INTEGER NOT NULL,

    -- Premium multiplier applied
    had_premium_boost BOOLEAN DEFAULT false,

    -- Timestamp
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_xp CHECK (xp_amount > 0)
);

CREATE INDEX idx_user_xp_history_user ON user_xp_history(user_id, season_id);
CREATE INDEX idx_user_xp_history_earned ON user_xp_history(earned_at DESC);

-- =====================================================
-- TABLE: user_inventory
-- Stores all items user has unlocked (themes, badges, avatars, titles)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Item details
    item_type VARCHAR(50) NOT NULL, -- 'theme', 'badge', 'avatar', 'title'
    item_id VARCHAR(100) NOT NULL, -- 'theme_classic_blue', 'badge_persistent', etc.

    -- Source tracking
    acquired_from VARCHAR(50) NOT NULL, -- 'battle_pass', 'achievement', 'store', 'event'
    season_acquired INTEGER REFERENCES battle_pass_seasons(season_number),
    tier_acquired INTEGER,

    -- Timestamps
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_user_item UNIQUE(user_id, item_id)
);

CREATE INDEX idx_user_inventory_user ON user_inventory(user_id, item_type);
CREATE INDEX idx_user_inventory_item ON user_inventory(item_id);

-- =====================================================
-- TABLE: user_tokens
-- Tracks user token balance (in-game currency)
-- =====================================================
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    lifetime_earned INTEGER NOT NULL DEFAULT 0,
    lifetime_spent INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT positive_balance CHECK (balance >= 0)
);

-- =====================================================
-- TABLE: token_transactions
-- Logs all token gains/spends for analytics
-- =====================================================
CREATE TABLE IF NOT EXISTS token_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Transaction details
    amount INTEGER NOT NULL, -- Positive = gain, Negative = spend
    transaction_type VARCHAR(50) NOT NULL, -- 'battle_pass_reward', 'store_purchase', 'achievement', etc.
    source_reference VARCHAR(255), -- tier number, item_id, etc.

    -- Balance tracking
    balance_before INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_token_transactions_user ON token_transactions(user_id, created_at DESC);

-- =====================================================
-- VIEWS: Helper views for common queries
-- =====================================================

-- Active season with days remaining
CREATE OR REPLACE VIEW active_battle_pass_season AS
SELECT
    id,
    name,
    description,
    season_number,
    start_date,
    end_date,
    total_tiers,
    CURRENT_DATE - start_date AS days_elapsed,
    end_date - CURRENT_DATE AS days_remaining
FROM battle_pass_seasons
WHERE is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date;

-- User progress with season info
CREATE OR REPLACE VIEW user_battle_pass_status AS
SELECT
    ubp.user_id,
    ubp.season_id,
    bps.name AS season_name,
    bps.season_number,
    bps.end_date,
    ubp.current_tier,
    ubp.current_xp,
    ubp.has_premium_pass,
    array_length(ubp.claimed_free_tiers, 1) AS free_tiers_claimed,
    array_length(ubp.claimed_premium_tiers, 1) AS premium_tiers_claimed,
    ubp.last_xp_gain_at
FROM user_battle_pass_progress ubp
JOIN battle_pass_seasons bps ON ubp.season_id = bps.id;

-- Tier leaderboard for current season
CREATE OR REPLACE VIEW battle_pass_leaderboard AS
SELECT
    u.username,
    u.display_name,
    ubp.current_tier,
    ubp.current_xp,
    ubp.has_premium_pass,
    ubp.last_xp_gain_at,
    RANK() OVER (ORDER BY ubp.current_tier DESC, ubp.current_xp DESC) AS rank
FROM user_battle_pass_progress ubp
JOIN users u ON ubp.user_id = u.id
JOIN battle_pass_seasons bps ON ubp.season_id = bps.id
WHERE bps.is_active = true
ORDER BY ubp.current_tier DESC, ubp.current_xp DESC;

-- =====================================================
-- FUNCTIONS: Helper functions for XP and tier calculations
-- =====================================================

-- Calculate XP required for a specific tier
CREATE OR REPLACE FUNCTION get_tier_xp_required(tier INTEGER)
RETURNS INTEGER AS $$
BEGIN
    IF tier = 1 THEN RETURN 0; END IF;
    IF tier <= 10 THEN RETURN tier * 100; END IF;
    IF tier <= 30 THEN RETURN tier * 150; END IF;
    IF tier <= 60 THEN RETURN tier * 200; END IF;
    IF tier <= 90 THEN RETURN tier * 250; END IF;
    RETURN tier * 300;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate which tier a user should be at based on XP
CREATE OR REPLACE FUNCTION calculate_tier_from_xp(xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_tier INTEGER := 1;
    cumulative_xp INTEGER := 0;
BEGIN
    WHILE current_tier < 100 LOOP
        cumulative_xp := cumulative_xp + get_tier_xp_required(current_tier + 1);
        IF xp < cumulative_xp THEN
            RETURN current_tier;
        END IF;
        current_tier := current_tier + 1;
    END LOOP;
    RETURN 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add XP to user and update tier
CREATE OR REPLACE FUNCTION add_user_xp(
    p_user_id INTEGER,
    p_season_id INTEGER,
    p_xp INTEGER,
    p_source VARCHAR,
    p_reference VARCHAR
) RETURNS TABLE(
    old_tier INTEGER,
    new_tier INTEGER,
    tier_up BOOLEAN,
    total_xp INTEGER
) AS $$
DECLARE
    v_old_tier INTEGER;
    v_new_tier INTEGER;
    v_new_xp INTEGER;
    v_has_premium BOOLEAN;
BEGIN
    -- Get current progress
    SELECT current_tier, current_xp, has_premium_pass
    INTO v_old_tier, v_new_xp, v_has_premium
    FROM user_battle_pass_progress
    WHERE user_id = p_user_id AND season_id = p_season_id;

    -- If no progress record, create one
    IF NOT FOUND THEN
        SELECT premium FROM users WHERE id = p_user_id INTO v_has_premium;

        INSERT INTO user_battle_pass_progress (user_id, season_id, has_premium_pass, first_xp_gain_at)
        VALUES (p_user_id, p_season_id, v_has_premium, NOW());

        v_old_tier := 1;
        v_new_xp := 0;
    END IF;

    -- Add XP
    v_new_xp := v_new_xp + p_xp;
    v_new_tier := calculate_tier_from_xp(v_new_xp);

    -- Update progress
    UPDATE user_battle_pass_progress
    SET current_xp = v_new_xp,
        current_tier = LEAST(v_new_tier, 100),
        last_xp_gain_at = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id AND season_id = p_season_id;

    -- Log XP gain
    INSERT INTO user_xp_history (user_id, season_id, xp_amount, xp_source, source_reference, tier_before, tier_after, had_premium_boost)
    VALUES (p_user_id, p_season_id, p_xp, p_source, p_reference, v_old_tier, v_new_tier, v_has_premium);

    -- Return results
    RETURN QUERY SELECT v_old_tier, v_new_tier, (v_new_tier > v_old_tier), v_new_xp;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA: Insert Season 1 with all 100 tiers
-- =====================================================
-- This will be populated via migration script
-- See: /api/admin.js?action=init-battle-pass-season-1

-- =====================================================
-- MIGRATION TRACKING
-- =====================================================
-- Run this migration via: POST /api/admin?action=migrate-battle-pass
-- Adds columns to users table if needed
