# 🎮 BATTLE PASS MECHANICS SPECIFICATION

**Model**: Call of Duty / Fortnite (Free + Premium tracks)
**Version**: 1.0
**Last Updated**: November 2025

---

## 📋 SYSTEM OVERVIEW

### Battle Pass = Premium Subscription

**ONE PRODUCT**:
- Premium Subscription ($4.99/month) includes full battle pass
- No separate battle pass purchase
- Simpler than CoD (which sells pass separately)

**What Users Get**:
- **Free Users**: Progress through tiers, unlock every 20th tier reward (5 total per season)
- **Premium Users**: Unlock ALL tier rewards (40-50 total per season) + 50% XP boost

---

## 🎯 XP SYSTEM

### XP Sources

```javascript
const XP_SOURCES = {
  // Puzzle completions (primary source)
  puzzle_classic_easy: 50,
  puzzle_classic_medium: 100,
  puzzle_classic_hard: 150,
  puzzle_xsudoku_easy: 60,
  puzzle_xsudoku_medium: 120,
  puzzle_xsudoku_hard: 180,
  puzzle_mini_easy: 40,
  puzzle_mini_medium: 80,
  puzzle_killer_easy: 100,
  puzzle_killer_medium: 200,
  puzzle_killer_hard: 300,
  puzzle_jigsaw_easy: 80,
  puzzle_jigsaw_medium: 160,
  puzzle_jigsaw_hard: 240,

  // Bonuses
  perfect_game: 25,           // No errors, no hints
  first_puzzle_today: 20,     // First puzzle of the day
  daily_streak_bonus: 10,     // Per consecutive day (1st day = +10, 2nd = +20, etc.)

  // Achievements
  achievement_common: 10,
  achievement_rare: 25,
  achievement_epic: 50,
  achievement_legendary: 100,

  // Social (future)
  friend_challenge_win: 50,
  league_daily_win: 75,

  // Educational
  tutorial_complete: 75,
  quiz_perfect_score: 50,
  practice_technique: 15      // Successfully use taught technique
};
```

### XP Calculation

```javascript
function calculateXP(completion) {
  const { variant, difficulty, errors, hints, isPremium, isFirstToday, streak } = completion;

  // Base XP
  const baseKey = `puzzle_${variant}_${difficulty}`;
  let xp = XP_SOURCES[baseKey] || 50;

  // Perfect game bonus
  if (errors === 0 && hints === 0) {
    xp += XP_SOURCES.perfect_game;
  }

  // First puzzle today
  if (isFirstToday) {
    xp += XP_SOURCES.first_puzzle_today;
  }

  // Streak bonus (cumulative: day 1 = +10, day 7 = +70)
  if (streak > 0) {
    xp += XP_SOURCES.daily_streak_bonus * Math.min(streak, 30); // Cap at 30 days
  }

  // Premium multiplier (+50% XP)
  if (isPremium) {
    xp = Math.floor(xp * 1.5);
  }

  return xp;
}
```

**Example Calculations**:

| Scenario | Base XP | Bonuses | Premium Multiplier | Total XP |
|----------|---------|---------|-------------------|----------|
| Free, Classic Easy, errors | 50 | 0 | 1.0x | **50** |
| Free, Classic Easy, perfect | 50 | +25 perfect | 1.0x | **75** |
| Free, Killer Hard, perfect, first today, 5-day streak | 300 | +25 perfect +20 first +50 streak | 1.0x | **395** |
| Premium, Classic Medium, perfect | 100 | +25 perfect | 1.5x | **188** |
| Premium, Killer Hard, perfect, first, 7-day streak | 300 | +25 +20 +70 | 1.5x | **623** |

---

## 🏆 TIER PROGRESSION

### 100 Tiers per Season (90 days)

**XP Required Per Tier** (cumulative):

```javascript
function getTierXP(tier) {
  if (tier === 1) return 0;           // Start at tier 1
  if (tier <= 10) return tier * 100;  // Tiers 1-10: 100 XP each
  if (tier <= 30) return tier * 150;  // Tiers 11-30: 150 XP each
  if (tier <= 60) return tier * 200;  // Tiers 31-60: 200 XP each
  if (tier <= 90) return tier * 250;  // Tiers 61-90: 250 XP each
  return tier * 300;                  // Tiers 91-100: 300 XP each
}

// Cumulative XP to reach tier 100: ~150,000 XP
```

**Progression Pacing**:

| User Type | Puzzles/Day | XP/Day | Days to Tier 100 |
|-----------|-------------|--------|------------------|
| Casual Free (3 dailies) | 3 | ~150 | **1000+ days** (impossible) |
| Hardcore Free (3 dailies perfect + streak) | 3 | ~300 | **500 days** (unrealistic) |
| Casual Premium (5 puzzles/day) | 5 | ~500 | **300 days** (too slow) |
| Active Premium (10 puzzles/day) | 10 | ~1,200 | **125 days** (too fast) |
| Dedicated Premium (15 puzzles/day) | 15 | ~1,800 | **83 days** ✅ (perfect for 90-day season) |

**Adjustment**: Free users can reach tier ~40-50 if they play daily (gets 5 rewards). Premium users who play 10-15 puzzles/day hit tier 100.

---

## 🎁 REWARD STRUCTURE

### Season 1: "Launch Season" (90 days)

**Total Rewards**:
- Free Track: 5 rewards (tiers 20, 40, 60, 80, 100)
- Premium Track: 50 rewards (every 2 tiers)

### Reward Types

**Themes** (Premium exclusive):
- 10 unique themes per season
- Unlocked at tiers: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100

**Badges**:
- Free: 3 badges (common quality)
- Premium: 15 badges (rare/epic/legendary)

**Avatars** (Premium exclusive):
- 5 avatar frames per season
- Unlocked at tiers: 25, 50, 75, 100

**Tokens**:
- Free: 800 total (tiers 20, 40, 60, 80, 100)
- Premium: 5,000 total (distributed across all tiers)

**Titles** (display on profile):
- Free: 1 title (tier 100: "Season 1 Completionist")
- Premium: 3 titles (tier 50, 75, 100)

### Season 1 Reward Table

| Tier | Free Reward | Premium Reward |
|------|-------------|----------------|
| 1 | - | Welcome Badge + 50 tokens |
| 2 | - | 100 tokens |
| 5 | - | Common Badge |
| 10 | - | **Theme: "Classic Blue"** |
| 15 | - | Rare Badge + 200 tokens |
| 20 | **100 tokens + Common Badge** | **Theme: "Neon Glow"** + 300 tokens |
| 25 | - | Avatar Frame: "Bronze Border" |
| 30 | - | **Theme: "Midnight Sky"** |
| 40 | **200 tokens + Basic Theme (rotating)** | **Theme: "Sunset Gradient"** + Epic Badge |
| 50 | - | **Theme: "Ocean Depths"** + Title: "Halfway Hero" + Avatar Frame: "Silver Border" |
| 60 | **200 tokens + Rare Badge** | **Theme: "Forest Canopy"** + 500 tokens |
| 70 | - | **Theme: "Lava Flow"** |
| 75 | - | Avatar Frame: "Gold Border" + Title: "Almost There" |
| 80 | **200 tokens + Avatar Frame (basic)** | **Theme: "Arctic Frost"** + Legendary Badge |
| 90 | - | **Theme: "Royal Purple"** + 800 tokens |
| 100 | **100 tokens + Legendary Badge + Title: "S1 Completionist"** | **🏆 ULTIMATE REWARD: Theme "Champion's Glory" + Avatar "Golden Crown" + Title "Season 1 Legend" + 1,500 tokens** |

**Total Value**:
- Free Track: ~800 tokens + 3 badges + 1 theme + 1 avatar + 1 title
- Premium Track: ~5,000 tokens + 15 badges + 10 themes + 5 avatars + 3 titles

---

## 📅 SEASON MANAGEMENT

### Season Structure

```javascript
const SEASON_1 = {
  id: 1,
  name: "Launch Season",
  description: "Celebrate the launch of The London Sudoku!",
  season_number: 1,
  start_date: "2025-12-01",
  end_date: "2026-03-01", // 90 days
  total_tiers: 100,
  is_active: true
};
```

### Season Lifecycle

**Pre-Season** (1 week before):
- Announce Season 2 rewards
- Show sneak peeks of themes
- Create hype (email, social media)

**Season Active** (90 days):
- Track user progress
- Update leaderboards (who's tier 100 first?)
- Send weekly progress emails ("You're at tier 42!")

**Season End** (last day):
- Final push notifications ("Last day to claim rewards!")
- Archive season data
- Snapshot tier 100 users (hall of fame)

**Post-Season** (1-2 days):
- Display final stats ("You reached tier 78!")
- Allow claiming unclaimed rewards (grace period)
- Launch Season 2

### Database Operations

**Create Season**:
```sql
INSERT INTO battle_pass_seasons (name, season_number, start_date, end_date, is_active, total_tiers)
VALUES ('Launch Season', 1, '2025-12-01', '2026-03-01', true, 100);

-- Insert all 100 tiers with rewards
INSERT INTO battle_pass_tiers (season_id, tier_number, xp_required, free_reward_type, premium_reward_type, ...)
VALUES (1, 1, 0, NULL, 'badge', ...),
       (1, 2, 100, NULL, 'tokens', ...),
       ...
       (1, 100, 150000, 'badge', 'ultimate_pack', ...);
```

**User Progress Tracking**:
```sql
-- Initialize user progress (on first XP gain of season)
INSERT INTO user_battle_pass_progress (user_id, season_id, current_tier, current_xp, has_premium_pass)
VALUES ($1, $2, 1, 0, $3)
ON CONFLICT (user_id, season_id) DO NOTHING;

-- Add XP
UPDATE user_battle_pass_progress
SET current_xp = current_xp + $1,
    current_tier = LEAST(100, (current_xp + $1) / tier_xp_required),
    last_xp_gain_at = NOW()
WHERE user_id = $2 AND season_id = $3;
```

**Claim Reward**:
```sql
-- Check if tier reached
SELECT current_tier FROM user_battle_pass_progress WHERE user_id = $1 AND season_id = $2;

-- Claim free reward
UPDATE user_battle_pass_progress
SET claimed_free_tiers = array_append(claimed_free_tiers, $3)
WHERE user_id = $1 AND season_id = $2 AND current_tier >= $3;

-- Add item to inventory
INSERT INTO user_inventory (user_id, item_type, item_id, acquired_from)
VALUES ($1, 'theme', 'theme_classic_blue', 'battle_pass');
```

---

## 🖥️ UI/UX DESIGN

### Battle Pass Page

**Layout**:
```
┌──────────────────────────────────────────────────┐
│            SEASON 1: LAUNCH SEASON               │
│               45 DAYS REMAINING                  │
├──────────────────────────────────────────────────┤
│ Your Progress:  Tier 42 / 100  (28,500 / 30,000 XP) │
│ [███████████████████░░░░░░░░░░] 42%            │
├──────────────────────────────────────────────────┤
│ [FREE TRACK]                                     │
│ Tier 20 ✅  Tier 40 ✅  Tier 60 🔒  Tier 80 🔒  Tier 100 🔒 │
│                                                  │
│ [PREMIUM TRACK] ⭐ UNLOCKED                      │
│ Tier 40 ✅  Tier 41 ✅  Tier 42 🎁 [CLAIM]  Tier 43 🔒 │
├──────────────────────────────────────────────────┤
│             ALL REWARDS (100 Tiers)              │
│ ┌────┬────┬────┬────┬────┬────┬────┬────┬────┐ │
│ │ 1  │ 2  │ 3  │ 4  │ 5  │ ... │ 98 │ 99 │100 │ │
│ │ ✅ │ ✅ │ ✅ │ ✅ │ ✅ │     │ 🔒 │ 🔒 │ 🔒 │ │
│ └────┴────┴────┴────┴────┴────┴────┴────┴────┘ │
└──────────────────────────────────────────────────┘
```

**Tier Detail (on hover/click)**:
```
┌───────────────────────────────┐
│        TIER 42 REWARDS        │
├───────────────────────────────┤
│ FREE TRACK:                   │
│ • Nothing (next reward: Tier 60) │
│                               │
│ PREMIUM TRACK:                │
│ • 300 Tokens                  │
│ • Rare Badge: "Persistent"    │
│                               │
│ [CLAIM REWARDS] ✅            │
└───────────────────────────────┘
```

### In-Game XP Notifications

**After completing puzzle**:
```
┌─────────────────────────────┐
│   PUZZLE COMPLETE! 🎉       │
├─────────────────────────────┤
│ Time: 3:24                  │
│ Errors: 0                   │
│ Score: 850                  │
├─────────────────────────────┤
│ XP EARNED: +188 ⭐          │
│ • Base XP: 100              │
│ • Perfect Bonus: +25        │
│ • Premium Boost: +50%       │
│                             │
│ Battle Pass: Tier 42        │
│ [████████░░] 95% to Tier 43 │
│                             │
│ [CONTINUE]                  │
└─────────────────────────────┘
```

**Tier Up Notification**:
```
┌─────────────────────────────┐
│     🎊 TIER UP! 🎊          │
│   YOU REACHED TIER 43!      │
├─────────────────────────────┤
│ NEW REWARDS UNLOCKED:       │
│ • 200 Tokens                │
│                             │
│ [CLAIM NOW] [VIEW ALL]      │
└─────────────────────────────┘
```

---

## 🔧 API ENDPOINTS

### GET `/api/battle-pass/progress`

**Response**:
```json
{
  "season": {
    "id": 1,
    "name": "Launch Season",
    "start_date": "2025-12-01",
    "end_date": "2026-03-01",
    "days_remaining": 45
  },
  "user_progress": {
    "current_tier": 42,
    "current_xp": 28500,
    "next_tier_xp": 30000,
    "has_premium_pass": true,
    "claimed_free_tiers": [20, 40],
    "claimed_premium_tiers": [1, 2, 3, ..., 42]
  },
  "next_reward": {
    "tier": 43,
    "xp_required": 30000,
    "rewards": [
      { "type": "tokens", "amount": 200 }
    ]
  }
}
```

### POST `/api/battle-pass/claim-reward`

**Request**:
```json
{
  "tier": 42,
  "track": "premium"
}
```

**Response**:
```json
{
  "success": true,
  "rewards": [
    { "type": "tokens", "amount": 300, "added": true },
    { "type": "badge", "id": "badge_persistent", "added": true }
  ],
  "new_inventory": [...]
}
```

### POST `/api/battle-pass/add-xp`

**Called internally after puzzle completion, achievement unlock, etc.**

```javascript
async function addBattlePassXP(userId, xp) {
  const season = await getActiveSeason();
  if (!season) return;

  const progress = await getUserProgress(userId, season.id);
  const newXP = progress.current_xp + xp;
  const newTier = calculateTier(newXP);

  await db.query(`
    UPDATE user_battle_pass_progress
    SET current_xp = $1,
        current_tier = $2,
        last_xp_gain_at = NOW()
    WHERE user_id = $3 AND season_id = $4
  `, [newXP, newTier, userId, season.id]);

  // Check for tier up
  if (newTier > progress.current_tier) {
    return { tier_up: true, new_tier: newTier };
  }

  return { tier_up: false, xp_added: xp };
}
```

---

## ✅ TESTING CHECKLIST

- [ ] XP calculation correct for all sources
- [ ] Premium users get 50% XP boost
- [ ] Tier progression matches XP curve
- [ ] Free users can only claim every 20th tier
- [ ] Premium users can claim all tiers
- [ ] Rewards added to inventory correctly
- [ ] Season end transitions smoothly to Season 2
- [ ] Unclaimed rewards can be claimed in grace period
- [ ] Tier-up notifications display correctly
- [ ] Battle pass UI shows accurate progress

---

**The battle pass is the core engagement and monetization driver. All features funnel into XP gain and tier progression.**
