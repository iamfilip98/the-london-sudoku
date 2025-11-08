-- ============================================
-- THE LONDON SUDOKU - COMPLETE DATABASE SCHEMA
-- ============================================
-- Version: 2.0
-- Database: PostgreSQL (Neon Serverless)
-- Last Updated: November 2025
-- ============================================

-- ============================================
-- USERS & AUTHENTICATION
-- ============================================

-- Main users table (extended from original)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Legacy auth, will migrate to Clerk
  display_name VARCHAR(100),
  avatar_url TEXT,

  -- Clerk integration (Phase 0)
  clerk_id VARCHAR(255) UNIQUE, -- Clerk user ID
  email VARCHAR(255) UNIQUE,
  email_verified BOOLEAN DEFAULT false,

  -- Subscription & monetization
  subscription_tier VARCHAR(50) DEFAULT 'free', -- 'free', 'premium', 'founder'
  subscription_status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'cancelled'
  subscription_expires_at TIMESTAMP,
  stripe_customer_id VARCHAR(255) UNIQUE,

  -- Profile & personalization
  bio TEXT,
  country VARCHAR(3), -- ISO 3166-1 alpha-3
  timezone VARCHAR(50) DEFAULT 'UTC',
  theme_id VARCHAR(50) DEFAULT 'default',

  -- User level & XP (for battle pass)
  level INTEGER DEFAULT 1,
  total_xp INTEGER DEFAULT 0,

  -- Statistics (cached for performance)
  total_puzzles_solved INTEGER DEFAULT 0,
  perfect_games INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,

  -- Tokens (future microtransactions)
  tokens INTEGER DEFAULT 0,

  -- Settings & preferences
  preferences JSONB DEFAULT '{}', -- UI settings, notifications, etc.

  -- Moderation
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for users
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_subscription_tier ON users(subscription_tier);

-- ============================================
-- PUZZLE SYSTEM
-- ============================================

-- Daily official puzzles (everyone plays the same)
CREATE TABLE IF NOT EXISTS daily_puzzles (
  id SERIAL PRIMARY KEY,
  puzzle_date DATE NOT NULL, -- YYYY-MM-DD
  variant VARCHAR(50) NOT NULL, -- 'classic', 'xsudoku', 'killer', etc.
  difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'
  puzzle TEXT NOT NULL, -- JSON string of puzzle state
  solution TEXT NOT NULL, -- JSON string of solution

  -- Metadata
  quality_score FLOAT, -- 0-100, from validation
  generation_time_ms INTEGER,
  techniques_required JSONB, -- ['naked_singles', 'hidden_pairs', etc.]

  -- Statistics (updated as users solve)
  times_played INTEGER DEFAULT 0,
  times_completed INTEGER DEFAULT 0,
  average_time_seconds INTEGER,
  fastest_time_seconds INTEGER,
  fastest_user_id INTEGER REFERENCES users(id),

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(puzzle_date, variant, difficulty)
);

-- Indexes for daily puzzles
CREATE INDEX IF NOT EXISTS idx_daily_puzzles_date ON daily_puzzles(puzzle_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_puzzles_date_variant ON daily_puzzles(puzzle_date, variant, difficulty);

-- Practice puzzle library (Premium users, unlimited random puzzles)
CREATE TABLE IF NOT EXISTS puzzles (
  id SERIAL PRIMARY KEY,
  variant VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  puzzle TEXT NOT NULL,
  solution TEXT NOT NULL,

  -- Quality & metadata
  quality_score FLOAT,
  techniques_required JSONB,
  tags JSONB, -- ['minimal_clues', 'symmetrical', etc.]

  -- Usage tracking
  used_as_daily BOOLEAN DEFAULT false, -- If this puzzle was used as a daily
  daily_puzzle_id INTEGER REFERENCES daily_puzzles(id),
  times_played INTEGER DEFAULT 0,

  -- Special flags
  is_featured BOOLEAN DEFAULT false,
  featured_until DATE,

  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for practice puzzles
CREATE INDEX IF NOT EXISTS idx_puzzles_variant_difficulty ON puzzles(variant, difficulty) WHERE used_as_daily = false;
CREATE INDEX IF NOT EXISTS idx_puzzles_featured ON puzzles(is_featured, featured_until) WHERE is_featured = true;

-- Fallback puzzles (emergency backup if generation fails)
CREATE TABLE IF NOT EXISTS fallback_puzzles (
  id SERIAL PRIMARY KEY,
  variant VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  puzzle TEXT NOT NULL,
  solution TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(variant, difficulty)
);

-- ============================================
-- USER PUZZLE COMPLETIONS
-- ============================================

-- Track all puzzle completions (daily + practice)
CREATE TABLE IF NOT EXISTS user_puzzle_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Puzzle reference
  daily_puzzle_id INTEGER REFERENCES daily_puzzles(id), -- If daily puzzle
  practice_puzzle_id INTEGER REFERENCES puzzles(id),    -- If practice puzzle
  is_daily BOOLEAN NOT NULL, -- true = counts for leaderboard, false = practice

  variant VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,

  -- Performance metrics
  time_seconds INTEGER NOT NULL,
  errors INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,
  score INTEGER, -- Calculated score (for leaderboards)

  -- Flags
  is_perfect BOOLEAN DEFAULT false, -- No errors, no hints

  -- Puzzle state (for review)
  final_state TEXT, -- JSON of completed puzzle

  completed_at TIMESTAMP DEFAULT NOW(),

  -- Prevent duplicate completions of same daily puzzle
  UNIQUE(user_id, daily_puzzle_id)
);

-- Indexes for completions
CREATE INDEX IF NOT EXISTS idx_completions_user ON user_puzzle_completions(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_daily ON user_puzzle_completions(daily_puzzle_id, score ASC) WHERE is_daily = true;
CREATE INDEX IF NOT EXISTS idx_completions_date ON user_puzzle_completions(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_completions_perfect ON user_puzzle_completions(user_id, is_perfect) WHERE is_perfect = true;

-- Game states (in-progress games, auto-save)
CREATE TABLE IF NOT EXISTS game_states (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Puzzle reference
  daily_puzzle_id INTEGER REFERENCES daily_puzzles(id),
  practice_puzzle_id INTEGER REFERENCES puzzles(id),
  variant VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,

  -- Current state
  current_state TEXT NOT NULL, -- JSON of current puzzle state
  time_elapsed_seconds INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  hints_used INTEGER DEFAULT 0,

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  last_saved_at TIMESTAMP DEFAULT NOW(),

  -- Only one active game per user per puzzle
  UNIQUE(user_id, daily_puzzle_id),
  UNIQUE(user_id, practice_puzzle_id)
);

CREATE INDEX IF NOT EXISTS idx_game_states_user ON game_states(user_id);

-- ============================================
-- BATTLE PASS SYSTEM
-- ============================================

-- Battle pass seasons (90-day cycles)
CREATE TABLE IF NOT EXISTS battle_pass_seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL, -- "Launch Season", "Winter Wonderland", etc.
  description TEXT,
  season_number INTEGER NOT NULL UNIQUE,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT false,

  -- Configuration
  total_tiers INTEGER DEFAULT 100,
  tier_xp_curve JSONB, -- XP required per tier

  -- Rewards metadata
  theme_count INTEGER, -- How many themes in this season
  badge_count INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),

  -- Only one active season at a time
  CONSTRAINT only_one_active CHECK (
    NOT is_active OR NOT EXISTS (
      SELECT 1 FROM battle_pass_seasons WHERE is_active = true AND id != battle_pass_seasons.id
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_seasons_active ON battle_pass_seasons(is_active) WHERE is_active = true;

-- Battle pass tier definitions (what you get at each tier)
CREATE TABLE IF NOT EXISTS battle_pass_tiers (
  id SERIAL PRIMARY KEY,
  season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL, -- 1-100
  xp_required INTEGER NOT NULL, -- Cumulative XP to reach this tier

  -- Free track reward (all users)
  free_reward_type VARCHAR(50), -- 'tokens', 'badge', 'theme', 'xp_boost', null
  free_reward_id VARCHAR(100), -- ID of the reward item
  free_reward_amount INTEGER, -- For tokens/XP

  -- Premium track reward (Premium subscribers only)
  premium_reward_type VARCHAR(50),
  premium_reward_id VARCHAR(100),
  premium_reward_amount INTEGER,

  -- Additional premium rewards (some tiers have multiple)
  premium_rewards_extra JSONB, -- [{ type, id, amount }, ...]

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(season_id, tier_number)
);

CREATE INDEX IF NOT EXISTS idx_tiers_season ON battle_pass_tiers(season_id, tier_number);

-- User battle pass progress
CREATE TABLE IF NOT EXISTS user_battle_pass_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  season_id INTEGER NOT NULL REFERENCES battle_pass_seasons(id) ON DELETE CASCADE,

  -- Progress
  current_tier INTEGER DEFAULT 1,
  current_xp INTEGER DEFAULT 0,

  -- Premium status (included with subscription)
  has_premium_pass BOOLEAN DEFAULT false,

  -- Claimed rewards (tier numbers)
  claimed_free_tiers INTEGER[] DEFAULT '{}',
  claimed_premium_tiers INTEGER[] DEFAULT '{}',

  -- Timestamps
  started_at TIMESTAMP DEFAULT NOW(),
  last_xp_gain_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, season_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bp_user_season ON user_battle_pass_progress(user_id, season_id);
CREATE INDEX IF NOT EXISTS idx_user_bp_season ON user_battle_pass_progress(season_id, current_tier DESC);

-- ============================================
-- USER INVENTORY (Owned Items)
-- ============================================

-- Themes, badges, avatars, etc.
CREATE TABLE IF NOT EXISTS user_inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  item_type VARCHAR(50) NOT NULL, -- 'theme', 'badge', 'avatar', 'title'
  item_id VARCHAR(100) NOT NULL, -- e.g., 'theme_neon_glow', 'badge_s1_legend'

  -- Metadata
  acquired_from VARCHAR(50), -- 'battle_pass', 'store', 'achievement', 'event'
  acquired_at TIMESTAMP DEFAULT NOW(),

  -- Usage
  equipped BOOLEAN DEFAULT false,
  times_used INTEGER DEFAULT 0,

  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_user ON user_inventory(user_id, item_type);
CREATE INDEX IF NOT EXISTS idx_inventory_equipped ON user_inventory(user_id, item_type, equipped) WHERE equipped = true;

-- ============================================
-- ACHIEVEMENTS
-- ============================================

-- User achievements (existing table, kept as-is)
CREATE TABLE IF NOT EXISTS achievements (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(100) NOT NULL,
  achievement_name VARCHAR(200),
  achievement_description TEXT,
  category VARCHAR(50),
  rarity VARCHAR(20), -- 'common', 'rare', 'epic', 'legendary'

  -- Rewards
  xp_reward INTEGER DEFAULT 0,
  token_reward INTEGER DEFAULT 0,

  earned_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_category ON achievements(user_id, category);
CREATE INDEX IF NOT EXISTS idx_achievements_rarity ON achievements(rarity);

-- ============================================
-- LEADERBOARDS
-- ============================================

-- Leaderboard snapshots (daily/weekly/monthly winners archived)
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id SERIAL PRIMARY KEY,

  -- Period
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Puzzle reference
  variant VARCHAR(50) NOT NULL,
  difficulty VARCHAR(20) NOT NULL,

  -- Rankings (top 100)
  rankings JSONB NOT NULL, -- [{ user_id, username, score, rank }, ...]

  created_at TIMESTAMP DEFAULT NOW(),

  UNIQUE(period_type, period_start, variant, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_period ON leaderboard_snapshots(period_type, period_start DESC);

-- NOTE: Real-time leaderboards stored in Redis (Vercel KV)
-- Key format: leaderboard:{period}:{date}:{variant}:{difficulty}
-- Data structure: Sorted Set (ZADD/ZRANGE)

-- ============================================
-- SOCIAL FEATURES
-- ============================================

-- Friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'

  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,

  -- Constraints
  CHECK (user_id != friend_id),
  UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status);

-- Leagues (official and custom) - FUTURE PHASE
CREATE TABLE IF NOT EXISTS leagues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,

  type VARCHAR(20) NOT NULL, -- 'official', 'custom', 'seasonal'
  tier VARCHAR(20), -- 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'

  creator_id INTEGER REFERENCES users(id),
  icon_url TEXT,

  -- Settings
  is_public BOOLEAN DEFAULT true,
  max_members INTEGER DEFAULT 100,
  start_date DATE,
  end_date DATE,

  settings JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leagues_type ON leagues(type, tier);

-- League memberships - FUTURE PHASE
CREATE TABLE IF NOT EXISTS league_members (
  id SERIAL PRIMARY KEY,
  league_id INTEGER NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  joined_at TIMESTAMP DEFAULT NOW(),
  rank INTEGER,
  points INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,

  UNIQUE(league_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_league_members_league ON league_members(league_id, rank);
CREATE INDEX IF NOT EXISTS idx_league_members_user ON league_members(user_id);

-- ============================================
-- MONETIZATION
-- ============================================

-- Subscriptions (Stripe tracking)
CREATE TABLE IF NOT EXISTS subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Stripe references
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- Subscription details
  tier VARCHAR(50) NOT NULL, -- 'premium'
  status VARCHAR(50) NOT NULL, -- 'active', 'past_due', 'canceled', 'unpaid'

  -- Billing
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Purchases (one-time, future use for tokens/themes)
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- Purchase details
  purchase_type VARCHAR(50) NOT NULL, -- 'tokens', 'theme', 'battle_pass' (future)
  item_id VARCHAR(100),
  amount INTEGER, -- For tokens

  -- Payment
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  price_cents INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',

  status VARCHAR(50) NOT NULL, -- 'succeeded', 'pending', 'failed'

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_user ON purchases(user_id, created_at DESC);

-- Transactions (payment history, all types)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  transaction_type VARCHAR(50) NOT NULL, -- 'subscription', 'purchase', 'refund'
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- References
  stripe_id VARCHAR(255),
  subscription_id INTEGER REFERENCES subscriptions(id),
  purchase_id INTEGER REFERENCES purchases(id),

  status VARCHAR(50) NOT NULL,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC);

-- ============================================
-- ANALYTICS & STATS
-- ============================================

-- Flexible stats storage (existing table, kept as-is)
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stat_key VARCHAR(100) NOT NULL,
  stat_value JSONB NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, stat_key)
);

CREATE INDEX IF NOT EXISTS idx_stats_user ON stats(user_id);

-- Daily competition entries (legacy, keep for historical data)
CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_date DATE NOT NULL,
  difficulty VARCHAR(20) NOT NULL,
  time_seconds INTEGER NOT NULL,
  errors INTEGER DEFAULT 0,
  score INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, puzzle_date, difficulty)
);

CREATE INDEX IF NOT EXISTS idx_entries_user_date ON entries(user_id, puzzle_date DESC);
CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(puzzle_date DESC);

-- Streaks (existing table, kept as-is)
CREATE TABLE IF NOT EXISTS streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_play_date DATE,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_streaks_user ON streaks(user_id);

-- ============================================
-- REWARDED ADS TRACKING
-- ============================================

-- Track ad views and rewards (prevent abuse)
CREATE TABLE IF NOT EXISTS ad_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  ad_type VARCHAR(50) NOT NULL, -- 'rewarded_video'
  reward_type VARCHAR(50) NOT NULL, -- 'bonus_puzzle'

  -- Verification (server-side)
  ad_network VARCHAR(50), -- 'admob'
  ad_unit_id VARCHAR(255),

  viewed_at TIMESTAMP DEFAULT NOW(),
  rewarded_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_user_date ON ad_rewards(user_id, viewed_at DESC);

-- Rate limiting: Max 3 rewarded ads per day
-- Enforced in application logic + query:
-- SELECT COUNT(*) FROM ad_rewards WHERE user_id = ? AND viewed_at > NOW() - INTERVAL '24 hours'

-- ============================================
-- TRIGGERS & FUNCTIONS
-- ============================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- MIGRATION NOTES
-- ============================================

-- PHASE 0: Infrastructure Migration
-- 1. Export existing data from Vercel Postgres
-- 2. Create Neon database
-- 3. Run this schema
-- 4. Import existing data (users, achievements, entries, streaks, stats)
-- 5. Add clerk_id column to existing users (NULL initially)
-- 6. Migrate Faidao & Filip to Clerk, populate clerk_id

-- PHASE 1: Soft Launch
-- 1. Add daily_puzzles, puzzles tables
-- 2. Migrate existing puzzle generation to new schema
-- 3. Add user_puzzle_completions tracking

-- PHASE 2: Monetization
-- 1. Add subscriptions, purchases, transactions tables
-- 2. Integrate Stripe webhook handlers

-- PHASE 3: Battle Pass
-- 1. Add battle_pass_seasons, battle_pass_tiers
-- 2. Add user_battle_pass_progress
-- 3. Add user_inventory
-- 4. Create Season 1 with rewards

-- PHASE 4: Social
-- 1. Add friendships table
-- 2. Add leagues, league_members (when ready)

-- ============================================
-- SAMPLE DATA (for development)
-- ============================================

-- Insert default battle pass season (Season 1)
-- (Will be populated via admin script)

-- Insert founder users (Faidao & Filip)
-- (Will be migrated from existing users table)

-- ============================================
-- INDEXES SUMMARY
-- ============================================

-- Critical for performance:
-- - All foreign keys have indexes
-- - Leaderboard queries optimized (date, user, score)
-- - Battle pass lookups (user, season)
-- - Subscription status checks
-- - Achievement queries (user, category, rarity)

-- Redis indexes (Vercel KV):
-- - Leaderboards: Sorted Sets with TTL
-- - Daily puzzle cache: Hash with 1-hour TTL
-- - User session data: String with 24-hour TTL

-- ============================================
-- BACKUP & MAINTENANCE
-- ============================================

-- Neon automatic backups: 7 days retention
-- Manual snapshot before each major migration
-- Archive old leaderboard snapshots (>90 days) to cold storage
-- Clean up expired game_states (>30 days old, not completed)

-- Cleanup queries (run monthly):
-- DELETE FROM game_states WHERE last_saved_at < NOW() - INTERVAL '30 days';
-- DELETE FROM leaderboard_snapshots WHERE period_start < NOW() - INTERVAL '1 year';

-- ============================================
-- END OF SCHEMA
-- ============================================
