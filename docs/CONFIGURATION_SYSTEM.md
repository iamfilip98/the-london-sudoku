# ⚙️ CONFIGURATION SYSTEM

**Purpose**: Make all game parameters configurable, testable, and adjustable without code changes
**Version**: 1.0
**Last Updated**: November 2025

---

## 🎯 DESIGN PRINCIPLES

1. **No Hardcoded Values**: All game parameters in database/config
2. **Hot Reloadable**: Changes take effect without deployment
3. **A/B Testable**: Support multiple configurations for experiments
4. **Versioned**: Track configuration history
5. **Type-Safe**: Validate config values
6. **Default Fallbacks**: Always have safe defaults

---

## 🗄️ DATABASE SCHEMA

```sql
-- ============================================
-- CONFIGURATION SYSTEM
-- ============================================

-- Global configuration (key-value store)
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  value_type VARCHAR(50) NOT NULL, -- 'number', 'string', 'boolean', 'json'
  description TEXT,
  category VARCHAR(50), -- 'monetization', 'gameplay', 'battle_pass', etc.

  -- Validation
  min_value NUMERIC,
  max_value NUMERIC,
  allowed_values JSONB, -- For enums

  -- Versioning
  version INTEGER DEFAULT 1,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),

  -- A/B Testing
  ab_test_variant VARCHAR(50), -- 'control', 'test_a', 'test_b'
  ab_test_percentage NUMERIC, -- 0-100, what % of users see this

  -- Feature flags
  is_active BOOLEAN DEFAULT true,

  CONSTRAINT valid_percentage CHECK (ab_test_percentage >= 0 AND ab_test_percentage <= 100)
);

CREATE INDEX idx_config_category ON config(category, is_active);
CREATE INDEX idx_config_ab_test ON config(ab_test_variant) WHERE ab_test_variant IS NOT NULL;

-- Configuration history (audit trail)
CREATE TABLE IF NOT EXISTS config_history (
  id SERIAL PRIMARY KEY,
  config_id INTEGER REFERENCES config(id),
  old_value JSONB,
  new_value JSONB,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT,
  changed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_config_history_config ON config_history(config_id, changed_at DESC);

-- ============================================
-- VARIANT DEFINITIONS (not hardcoded!)
-- ============================================

CREATE TABLE IF NOT EXISTS variant_definitions (
  id SERIAL PRIMARY KEY,
  variant_id VARCHAR(50) UNIQUE NOT NULL, -- 'classic', 'xsudoku', 'killer'
  name VARCHAR(100) NOT NULL,
  description TEXT,

  -- Availability
  is_enabled BOOLEAN DEFAULT true,
  is_premium_only BOOLEAN DEFAULT false,
  release_date DATE,

  -- Difficulty configuration
  difficulties JSONB DEFAULT '["easy", "medium", "hard"]',

  -- Display
  icon_url TEXT,
  display_order INTEGER DEFAULT 0,

  -- Generation settings (stored in JSONB for flexibility)
  generation_config JSONB DEFAULT '{}',

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variants_enabled ON variant_definitions(is_enabled, display_order);

-- ============================================
-- DIFFICULTY CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS difficulty_config (
  id SERIAL PRIMARY KEY,
  variant_id VARCHAR(50) REFERENCES variant_definitions(variant_id),
  difficulty VARCHAR(20) NOT NULL, -- 'easy', 'medium', 'hard'

  -- Classic 9x9 settings
  clue_count INTEGER,

  -- Validation criteria (stored as JSONB for flexibility)
  validation_criteria JSONB DEFAULT '{}',
  -- Example: {"naked_singles_min": 15, "candidate_density_max": 3.3}

  -- Target solve time (for quality assessment)
  target_solve_seconds INTEGER,

  -- XP rewards
  base_xp INTEGER DEFAULT 50,

  UNIQUE(variant_id, difficulty)
);

-- ============================================
-- MONETIZATION CONFIGURATION
-- ============================================

CREATE TABLE IF NOT EXISTS pricing_config (
  id SERIAL PRIMARY KEY,
  product_id VARCHAR(50) UNIQUE NOT NULL, -- 'premium_monthly', 'token_pack_100'

  -- Stripe
  stripe_price_id VARCHAR(255),

  -- Pricing
  price_cents INTEGER NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Type
  product_type VARCHAR(50) NOT NULL, -- 'subscription', 'one_time'
  billing_period VARCHAR(20), -- 'monthly', 'annual' (for subscriptions)

  -- A/B Testing
  ab_test_variant VARCHAR(50),
  ab_test_percentage NUMERIC,

  -- Features granted
  features_granted JSONB DEFAULT '[]',
  -- Example: ["unlimited_puzzles", "all_variants", "battle_pass", "ad_free"]

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_active ON pricing_config(is_active, product_type);
CREATE INDEX idx_pricing_ab_test ON pricing_config(ab_test_variant);
```

---

## 📋 CONFIGURATION CATEGORIES

### 1. Gameplay Configuration

```sql
-- Insert default gameplay configs
INSERT INTO config (key, value, value_type, description, category) VALUES

-- Free tier limits
('free_daily_limit_classic', '3', 'number', 'Daily puzzle limit for free users (Classic)', 'gameplay'),
('free_daily_limit_variants', '0', 'number', 'Daily puzzle limit for free users (Variants)', 'gameplay'),

-- Puzzle generation
('puzzle_generation_time', '23', 'number', 'Hour (UTC) to generate tomorrow puzzles (0-23)', 'gameplay'),
('puzzle_quality_min_score', '70', 'number', 'Minimum quality score to accept puzzle (0-100)', 'gameplay'),
('puzzle_generation_max_attempts', '3', 'number', 'Max attempts to generate quality puzzle', 'gameplay'),

-- Game rules
('hint_penalty_seconds_point', '5', 'number', 'Time penalty for hint pointing (seconds)', 'gameplay'),
('hint_penalty_seconds_reveal', '10', 'number', 'Time penalty for hint reveal (seconds)', 'gameplay'),
('error_penalty_seconds', '30', 'number', 'Time penalty per error (seconds)', 'gameplay'),

-- Auto-save
('auto_save_interval_seconds', '10', 'number', 'How often to auto-save game state (seconds)', 'gameplay');
```

### 2. Battle Pass Configuration

```sql
INSERT INTO config (key, value, value_type, description, category) VALUES

-- Season settings
('bp_season_duration_days', '90', 'number', 'Battle pass season duration (days)', 'battle_pass'),
('bp_total_tiers', '100', 'number', 'Total tiers in battle pass', 'battle_pass'),
('bp_premium_xp_multiplier', '1.5', 'number', 'XP multiplier for Premium users', 'battle_pass'),

-- Free vs Premium rewards
('bp_free_reward_interval', '20', 'number', 'Free users get reward every N tiers', 'battle_pass'),

-- XP sources (stored as JSON for flexibility)
('bp_xp_puzzle_classic_easy', '50', 'number', 'XP for completing Classic Easy', 'battle_pass'),
('bp_xp_puzzle_classic_medium', '100', 'number', 'XP for completing Classic Medium', 'battle_pass'),
('bp_xp_puzzle_classic_hard', '150', 'number', 'XP for completing Classic Hard', 'battle_pass'),
('bp_xp_perfect_bonus', '25', 'number', 'Bonus XP for perfect game', 'battle_pass'),
('bp_xp_first_daily_bonus', '20', 'number', 'Bonus XP for first puzzle of day', 'battle_pass'),
('bp_xp_streak_per_day', '10', 'number', 'Bonus XP per streak day (cumulative)', 'battle_pass'),

-- Tier progression (JSON config)
('bp_tier_xp_formula', '{
  "tier_1_10": 100,
  "tier_11_30": 150,
  "tier_31_60": 200,
  "tier_61_90": 250,
  "tier_91_100": 300
}', 'json', 'XP required per tier range', 'battle_pass');
```

### 3. Monetization Configuration

```sql
INSERT INTO config (key, value, value_type, description, category) VALUES

-- Ad settings
('ads_enabled', 'true', 'boolean', 'Enable ads for free users', 'monetization'),
('ads_rewarded_max_per_day', '3', 'number', 'Max rewarded ads free user can watch/day', 'monetization'),
('ads_interstitial_frequency', '0', 'number', 'Show interstitial every N puzzles (0=disabled)', 'monetization'),

-- Upsell settings
('upsell_daily_limit_enabled', 'true', 'boolean', 'Show upsell when daily limit reached', 'monetization'),
('upsell_variant_locked_cooldown', '3600', 'number', 'Cooldown between variant locked upsells (seconds)', 'monetization'),
('upsell_battle_pass_cooldown', '7200', 'number', 'Cooldown between BP upsells (seconds)', 'monetization'),

-- Pricing (also in pricing_config table, but feature flags here)
('premium_trial_enabled', 'false', 'boolean', 'Enable free trial for Premium', 'monetization'),
('premium_trial_days', '7', 'number', 'Free trial duration (days)', 'monetization');
```

### 4. Social & Features

```sql
INSERT INTO config (key, value, type, description, category) VALUES

-- Friends
('friends_max_count', '100', 'number', 'Maximum friends per user', 'social'),
('friend_requests_max_pending', '20', 'number', 'Max pending friend requests', 'social'),

-- Leagues
('leagues_enabled', 'false', 'boolean', 'Enable league system', 'social'),
('custom_leagues_premium_only', 'true', 'boolean', 'Custom leagues require Premium', 'social'),

-- Achievements
('achievements_enabled', 'true', 'boolean', 'Enable achievement system', 'features'),

-- Tutorials
('tutorials_required_for_new_users', 'false', 'boolean', 'Force new users through tutorial', 'features');
```

---

## 🔧 CONFIGURATION API

### Fetch Configuration

```javascript
// /api/config
export default async function handler(req, res) {
  const { category } = req.query;

  // Fetch active configs
  const query = category
    ? 'SELECT key, value, value_type FROM config WHERE category = $1 AND is_active = true'
    : 'SELECT key, value, value_type FROM config WHERE is_active = true';

  const result = await db.query(query, category ? [category] : []);

  // Parse values
  const config = {};
  for (const row of result.rows) {
    const { key, value, value_type } = row;

    switch (value_type) {
      case 'number':
        config[key] = parseFloat(value);
        break;
      case 'boolean':
        config[key] = value === 'true' || value === true;
        break;
      case 'json':
        config[key] = JSON.parse(value);
        break;
      default:
        config[key] = value;
    }
  }

  // Cache for 5 minutes
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
  return res.status(200).json(config);
}
```

### Update Configuration (Admin Only)

```javascript
// /api/admin/config
export default async function handler(req, res) {
  const { userId } = getAuth(req);
  const user = await getUser(userId);

  // Check admin permission
  if (!user.is_admin) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { key, value, change_reason } = req.body;

  // Get old value for history
  const oldConfig = await db.query('SELECT value FROM config WHERE key = $1', [key]);

  // Update config
  await db.query(`
    UPDATE config
    SET value = $1, version = version + 1, updated_by = $2, updated_at = NOW()
    WHERE key = $3
  `, [JSON.stringify(value), userId, key]);

  // Record history
  await db.query(`
    INSERT INTO config_history (config_id, old_value, new_value, changed_by, change_reason)
    SELECT id, $1, $2, $3, $4
    FROM config WHERE key = $5
  `, [oldConfig.rows[0]?.value, JSON.stringify(value), userId, change_reason, key]);

  // Clear cache
  await redis.del('config:*');

  return res.status(200).json({ success: true });
}
```

---

## 💾 REDIS CACHING

```javascript
// Cache config in Redis (5 min TTL)
async function getConfig(category = null) {
  const cacheKey = `config:${category || 'all'}`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from DB
  const config = await fetchConfigFromDB(category);

  // Cache
  await redis.setex(cacheKey, 300, JSON.stringify(config));

  return config;
}
```

---

## 🎛️ ADMIN PANEL (Future)

```html
<!-- /admin/config page -->
<div class="config-editor">
  <h2>Game Configuration</h2>

  <div class="config-category">
    <h3>Battle Pass</h3>

    <div class="config-item">
      <label>Season Duration (days)</label>
      <input type="number" value="90" data-key="bp_season_duration_days" />
      <span>Current: 90 days</span>
    </div>

    <div class="config-item">
      <label>Premium XP Multiplier</label>
      <input type="number" step="0.1" value="1.5" data-key="bp_premium_xp_multiplier" />
      <span>Current: 1.5x</span>
    </div>

    <button onclick="saveConfig()">Save Changes</button>
  </div>
</div>
```

---

## 🧪 A/B TESTING

```javascript
// Get user's config variant (A/B testing)
async function getConfigForUser(userId) {
  const user = await getUser(userId);

  // Determine which variant user is in (based on user ID hash)
  const userBucket = hashUserId(userId) % 100; // 0-99

  const configs = await db.query(`
    SELECT key, value, value_type, ab_test_variant, ab_test_percentage
    FROM config
    WHERE is_active = true
  `);

  const userConfig = {};

  for (const config of configs.rows) {
    // If no A/B test, use value
    if (!config.ab_test_variant) {
      userConfig[config.key] = parseValue(config.value, config.value_type);
      continue;
    }

    // Check if user is in this variant
    if (userBucket < config.ab_test_percentage) {
      userConfig[config.key] = parseValue(config.value, config.value_type);
    } else {
      // Use control value
      const control = configs.rows.find(c => c.key === config.key && !c.ab_test_variant);
      userConfig[config.key] = parseValue(control.value, control.value_type);
    }
  }

  return userConfig;
}
```

**Example**: Test $3.99 vs $4.99 pricing
```sql
-- Control (50% of users see $4.99)
INSERT INTO pricing_config (product_id, price_cents, ab_test_variant, ab_test_percentage)
VALUES ('premium_monthly', 499, 'control', 50);

-- Test (50% of users see $3.99)
INSERT INTO pricing_config (product_id, price_cents, ab_test_variant, ab_test_percentage)
VALUES ('premium_monthly', 399, 'test_a', 50);
```

---

## ✅ BENEFITS

1. **No Code Deployments**: Change XP values, pricing, limits without deploying
2. **A/B Testing**: Test different configs on subsets of users
3. **Quick Iterations**: Try 3 puzzles/day vs 5 puzzles/day instantly
4. **Rollback**: Config history lets you revert bad changes
5. **Audit Trail**: Know who changed what and when
6. **Type Safety**: Validation prevents invalid configs

---

## 📝 MIGRATION FROM HARDCODED VALUES

```javascript
// ❌ BEFORE: Hardcoded
const PREMIUM_PRICE = 4.99;

// ✅ AFTER: Configurable
const config = await getConfig('monetization');
const premiumPrice = config.premium_monthly_price;

// ❌ BEFORE: Hardcoded XP
const xp = difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 150;

// ✅ AFTER: Configurable
const config = await getConfig('battle_pass');
const xp = config[`bp_xp_puzzle_${variant}_${difficulty}`];
```

---

## 🚀 IMPLEMENTATION PRIORITY

**Phase 0** (Month 1):
- Set up `config` table
- Migrate critical values (free tier limits, XP values)
- Basic API to fetch config

**Phase 2** (Month 7):
- Add `pricing_config` table for A/B testing prices
- Admin panel to edit configs

**Phase 3** (Month 12):
- Full A/B testing system
- Config versioning and rollback

---

**This makes the entire system flexible, testable, and future-proof. Every game parameter can be tuned without touching code.**
