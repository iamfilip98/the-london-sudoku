/**
 * Phase 2 Month 7: Premium Subscription Schema
 *
 * Adds Stripe subscription tracking and premium status to users.
 *
 * Run via: POST /api/admin?action=migrate-phase2-month7
 */

-- Add premium fields to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS premium BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS stripe_price_id VARCHAR(255);

-- Add indexes for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_stripe_subscription ON users(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_users_premium ON users(premium);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);

-- Create subscription_events table for webhook logging
CREATE TABLE IF NOT EXISTS subscription_events (
  id SERIAL PRIMARY KEY,
  event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  customer_id VARCHAR(255),
  subscription_id VARCHAR(255),
  username VARCHAR(100),
  data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscription_events_event_id ON subscription_events(event_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_customer_id ON subscription_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_processed ON subscription_events(processed);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Add comments for documentation
COMMENT ON COLUMN users.premium IS 'Whether user has active premium subscription';
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN users.stripe_subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN users.subscription_status IS 'Stripe subscription status: active, canceled, incomplete, past_due, etc.';
COMMENT ON COLUMN users.subscription_start_date IS 'Date when subscription started';
COMMENT ON COLUMN users.subscription_end_date IS 'Date when subscription ends (for canceled subs)';
COMMENT ON COLUMN users.subscription_cancel_at_period_end IS 'Whether subscription is set to cancel at end of billing period';
COMMENT ON COLUMN users.stripe_price_id IS 'Stripe price ID for the subscription plan';

-- Create view for active premium users
CREATE OR REPLACE VIEW premium_users AS
SELECT
  username,
  email,
  premium,
  subscription_status,
  subscription_start_date,
  subscription_end_date,
  subscription_cancel_at_period_end,
  created_at
FROM users
WHERE premium = TRUE
  AND subscription_status = 'active'
ORDER BY subscription_start_date DESC;

-- Sample query: Get premium user count
-- SELECT COUNT(*) FROM premium_users;

-- Sample query: Get subscription revenue (requires price data)
-- SELECT COUNT(*) * 4.99 AS monthly_revenue FROM premium_users;
