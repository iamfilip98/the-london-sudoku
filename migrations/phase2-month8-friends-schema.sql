/**
 * Phase 2 Month 8: Friends System & Social Sharing
 *
 * Database schema migration for social features:
 * - Friend requests (send, accept, reject)
 * - Friendships (bidirectional relationships)
 * - Activity feed for social interactions
 * - Social sharing metadata
 *
 * Run via: POST /api/admin?action=migrate-phase2-month8
 */

-- =====================================================
-- 1. FRIEND REQUESTS TABLE
-- =====================================================
-- Stores pending, accepted, and rejected friend requests

CREATE TABLE IF NOT EXISTS friend_requests (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Prevent duplicate requests
  UNIQUE(requester_id, recipient_id),

  -- Prevent self-requests
  CHECK (requester_id != recipient_id)
);

-- Indexes for friend requests
CREATE INDEX IF NOT EXISTS idx_friend_requests_requester
  ON friend_requests(requester_id, status);

CREATE INDEX IF NOT EXISTS idx_friend_requests_recipient
  ON friend_requests(recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_friend_requests_status
  ON friend_requests(status, created_at DESC);


-- =====================================================
-- 2. FRIENDSHIPS TABLE
-- =====================================================
-- Stores confirmed friendships (created when request is accepted)

CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  user1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Ensure user1_id < user2_id for consistent ordering (prevent duplicates)
  CHECK (user1_id < user2_id),

  -- Unique friendship constraint
  UNIQUE(user1_id, user2_id)
);

-- Indexes for friendships
CREATE INDEX IF NOT EXISTS idx_friendships_user1
  ON friendships(user1_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_friendships_user2
  ON friendships(user2_id, created_at DESC);


-- =====================================================
-- 3. SOCIAL SHARES TABLE
-- =====================================================
-- Tracks when users share their achievements/scores

CREATE TABLE IF NOT EXISTS social_shares (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_type VARCHAR(50) NOT NULL, -- achievement, score, streak, puzzle_completion
  share_data JSONB NOT NULL, -- Flexible data storage for different share types
  platform VARCHAR(50), -- twitter, facebook, clipboard, etc.
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for social shares
CREATE INDEX IF NOT EXISTS idx_social_shares_user
  ON social_shares(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_shares_type
  ON social_shares(share_type, created_at DESC);


-- =====================================================
-- 4. ACTIVITY FEED TABLE
-- =====================================================
-- Stores social activity for news feed feature

CREATE TABLE IF NOT EXISTS activity_feed (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL, -- friend_added, achievement_unlocked, puzzle_completed, streak_milestone
  activity_data JSONB NOT NULL,
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for activity feed
CREATE INDEX IF NOT EXISTS idx_activity_feed_user
  ON activity_feed(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_activity_feed_public
  ON activity_feed(is_public, created_at DESC)
  WHERE is_public = TRUE;

CREATE INDEX IF NOT EXISTS idx_activity_feed_type
  ON activity_feed(activity_type, created_at DESC);


-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to get all friends for a user (returns user IDs)
CREATE OR REPLACE FUNCTION get_user_friends(p_user_id INTEGER)
RETURNS TABLE(friend_id INTEGER, friendship_date TIMESTAMP) AS $$
BEGIN
  RETURN QUERY
  SELECT
    CASE
      WHEN user1_id = p_user_id THEN user2_id
      ELSE user1_id
    END AS friend_id,
    created_at AS friendship_date
  FROM friendships
  WHERE user1_id = p_user_id OR user2_id = p_user_id
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;


-- Function to check if two users are friends
CREATE OR REPLACE FUNCTION are_friends(p_user1_id INTEGER, p_user2_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  min_id INTEGER := LEAST(p_user1_id, p_user2_id);
  max_id INTEGER := GREATEST(p_user1_id, p_user2_id);
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE user1_id = min_id AND user2_id = max_id
  );
END;
$$ LANGUAGE plpgsql;


-- Function to create friendship from accepted request
CREATE OR REPLACE FUNCTION create_friendship_from_request(p_request_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_requester_id INTEGER;
  v_recipient_id INTEGER;
  v_min_id INTEGER;
  v_max_id INTEGER;
BEGIN
  -- Get requester and recipient from the request
  SELECT requester_id, recipient_id INTO v_requester_id, v_recipient_id
  FROM friend_requests
  WHERE id = p_request_id AND status = 'accepted';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Ensure consistent ordering (user1_id < user2_id)
  v_min_id := LEAST(v_requester_id, v_recipient_id);
  v_max_id := GREATEST(v_requester_id, v_recipient_id);

  -- Create friendship
  INSERT INTO friendships (user1_id, user2_id)
  VALUES (v_min_id, v_max_id)
  ON CONFLICT (user1_id, user2_id) DO NOTHING;

  -- Create activity feed entries for both users
  INSERT INTO activity_feed (user_id, activity_type, activity_data, is_public)
  VALUES
    (v_requester_id, 'friend_added', jsonb_build_object('friend_id', v_recipient_id), TRUE),
    (v_recipient_id, 'friend_added', jsonb_build_object('friend_id', v_requester_id), TRUE);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;


-- =====================================================
-- 6. VIEWS FOR EASY QUERYING
-- =====================================================

-- View for pending friend requests with user details
CREATE OR REPLACE VIEW pending_friend_requests AS
SELECT
  fr.id,
  fr.requester_id,
  u1.username AS requester_username,
  u1.display_name AS requester_display_name,
  u1.avatar AS requester_avatar,
  fr.recipient_id,
  u2.username AS recipient_username,
  u2.display_name AS recipient_display_name,
  fr.created_at
FROM friend_requests fr
JOIN users u1 ON fr.requester_id = u1.id
JOIN users u2 ON fr.recipient_id = u2.id
WHERE fr.status = 'pending';


-- View for friends list with user details
CREATE OR REPLACE VIEW friends_with_details AS
SELECT
  f.id AS friendship_id,
  f.user1_id,
  f.user2_id,
  u1.username AS user1_username,
  u1.display_name AS user1_display_name,
  u1.avatar AS user1_avatar,
  u1.last_active_at AS user1_last_active,
  u2.username AS user2_username,
  u2.display_name AS user2_display_name,
  u2.avatar AS user2_avatar,
  u2.last_active_at AS user2_last_active,
  f.created_at AS friendship_date
FROM friendships f
JOIN users u1 ON f.user1_id = u1.id
JOIN users u2 ON f.user2_id = u2.id;


-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Update friend_requests.updated_at on status change
CREATE OR REPLACE FUNCTION update_friend_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_friend_request_timestamp
BEFORE UPDATE ON friend_requests
FOR EACH ROW
EXECUTE FUNCTION update_friend_request_timestamp();
