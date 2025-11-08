# 🎯 DAILY PUZZLE SYSTEM SPECIFICATION

**Model**: New York Times Crossword (everyone plays the same puzzle)
**Version**: 1.0
**Last Updated**: November 2025

---

## 📋 TABLE OF CONTENTS

1. [System Overview](#system-overview)
2. [Generation Process](#generation-process)
3. [Storage & Retrieval](#storage--retrieval)
4. [User Experience Flow](#user-experience-flow)
5. [Leaderboard Integration](#leaderboard-integration)
6. [Practice Puzzle System](#practice-puzzle-system)
7. [Rewarded Ads Integration](#rewarded-ads-integration)
8. [Edge Cases & Error Handling](#edge-cases--error-handling)

---

## 🎯 SYSTEM OVERVIEW

### Core Concept

**Same Puzzle for Everyone** (NYT Model):
- Every day at 11:00 PM, generate ONE official puzzle per difficulty per variant
- All users play the SAME puzzles
- Times and scores posted to global leaderboards
- Creates competitive atmosphere and social discussion

**Daily Puzzle Types**:
```
┌─────────────────────────────────────────┐
│         TODAY'S OFFICIAL PUZZLES        │
├─────────────────────────────────────────┤
│ Classic Easy     (all users)            │
│ Classic Medium   (all users)            │
│ Classic Hard     (all users)            │
├─────────────────────────────────────────┤
│ X-Sudoku Easy    (all users, Phase 1+)  │
│ X-Sudoku Medium  (all users, Phase 1+)  │
│ X-Sudoku Hard    (all users, Phase 1+)  │
├─────────────────────────────────────────┤
│ Mini 6x6 Easy    (all users, Phase 1+)  │
│ Mini 6x6 Medium  (all users, Phase 1+)  │
├─────────────────────────────────────────┤
│ Killer Easy      (Premium, Phase 3+)    │
│ Killer Medium    (Premium, Phase 3+)    │
│ Killer Hard      (Premium, Phase 3+)    │
└─────────────────────────────────────────┘
```

### Access Control

**Free Users**:
- Can play Classic Easy, Medium, Hard (3 puzzles/day total)
- Can view leaderboards
- Can see other variants (locked with "Premium Required" overlay)

**Premium Users**:
- Can play ALL daily puzzles (all variants, all difficulties)
- Can play unlimited practice puzzles
- Ad-free experience

---

## 🔧 GENERATION PROCESS

### Cron Job: `/api/generate-tomorrow`

**Schedule**: `0 23 * * *` (11:00 PM UTC daily)

**Vercel Cron Configuration** (`vercel.json`):
```json
{
  "crons": [{
    "path": "/api/generate-tomorrow",
    "schedule": "0 23 * * *"
  }]
}
```

### Generation Flow

```
11:00 PM UTC - Cron triggers
│
├─ 1. Calculate tomorrow's date
│  const tomorrow = new Date();
│  tomorrow.setDate(tomorrow.getDate() + 1);
│  const dateStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
│
├─ 2. Check if puzzles already exist for tomorrow
│  const existing = await checkDailyPuzzles(dateStr);
│  if (existing.length > 0) {
│    log('Puzzles already generated, skipping');
│    return;
│  }
│
├─ 3. Generate Classic 9x9 (Phase 0+)
│  ├─ Easy:   generateClassicPuzzle('easy')   → validate → store
│  ├─ Medium: generateClassicPuzzle('medium') → validate → store
│  └─ Hard:   generateClassicPuzzle('hard')   → validate → store
│
├─ 4. Generate X-Sudoku (Phase 1+)
│  ├─ Easy:   generateXSudoku('easy')   → validate → store
│  ├─ Medium: generateXSudoku('medium') → validate → store
│  └─ Hard:   generateXSudoku('hard')   → validate → store
│
├─ 5. Generate Mini 6x6 (Phase 1+)
│  ├─ Easy:   generateMini6x6('easy')   → validate → store
│  └─ Medium: generateMini6x6('medium') → validate → store
│
├─ 6. Generate Killer Sudoku (Phase 3+)
│  ├─ Easy:   generateKillerSudoku('easy')   → validate → store
│  ├─ Medium: generateKillerSudoku('medium') → validate → store
│  └─ Hard:   generateKillerSudoku('hard')   → validate → store
│
├─ 7. Generate Jigsaw Sudoku (Phase 4+)
│  ├─ Easy:   generateJigsawSudoku('easy')   → validate → store
│  ├─ Medium: generateJigsawSudoku('medium') → validate → store
│  └─ Hard:   generateJigsawSudoku('hard')   → validate → store
│
├─ 8. Validation & Quality Check
│  For each generated puzzle:
│  ├─ Verify unique solution
│  ├─ Check difficulty criteria met
│  ├─ Calculate quality score (0-100)
│  ├─ If score < 70: regenerate (max 3 attempts)
│  └─ If all attempts fail: use fallback puzzle + alert admin
│
└─ 9. Store in Database
   INSERT INTO daily_puzzles (puzzle_date, variant, difficulty, puzzle, solution, quality_score, ...)
   VALUES (tomorrow, 'classic', 'easy', ...), ...

11:10 PM - Generation complete
│
└─ 10. Clear Redis Cache
   await redis.del(`daily_puzzles:${tomorrow}`);

11:11 PM - Send notification (optional, future)
   Email/push notification: "Tomorrow's puzzles are ready!"
```

### Generation Code Template

```javascript
// /api/generate-tomorrow.js

import { generateClassicPuzzle } from '@/lib/generators/classic';
import { generateXSudoku } from '@/lib/generators/xsudoku';
import { generateKillerSudoku } from '@/lib/generators/killer';
import { validatePuzzle } from '@/lib/validators';
import { db } from '@/lib/db';
import { redis } from '@/lib/redis';

export default async function handler(req, res) {
  // Security: Verify cron secret
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];

  console.log(`[CRON] Generating puzzles for ${dateStr}`);

  try {
    // Check if already generated
    const existing = await db.query(
      'SELECT id FROM daily_puzzles WHERE puzzle_date = $1',
      [dateStr]
    );

    if (existing.rows.length > 0) {
      console.log('[CRON] Puzzles already exist, skipping');
      return res.status(200).json({ message: 'Already generated' });
    }

    const puzzlesToGenerate = [
      // Classic (always generate)
      { variant: 'classic', difficulty: 'easy', generator: generateClassicPuzzle },
      { variant: 'classic', difficulty: 'medium', generator: generateClassicPuzzle },
      { variant: 'classic', difficulty: 'hard', generator: generateClassicPuzzle },

      // X-Sudoku (Phase 1+)
      { variant: 'xsudoku', difficulty: 'easy', generator: generateXSudoku },
      { variant: 'xsudoku', difficulty: 'medium', generator: generateXSudoku },
      { variant: 'xsudoku', difficulty: 'hard', generator: generateXSudoku },

      // Killer (Phase 3+)
      // Uncomment when ready:
      // { variant: 'killer', difficulty: 'easy', generator: generateKillerSudoku },
      // { variant: 'killer', difficulty: 'medium', generator: generateKillerSudoku },
      // { variant: 'killer', difficulty: 'hard', generator: generateKillerSudoku },
    ];

    const results = [];

    for (const { variant, difficulty, generator } of puzzlesToGenerate) {
      console.log(`[CRON] Generating ${variant} ${difficulty}...`);

      let puzzle, solution, qualityScore;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;

      // Retry up to 3 times if quality is poor
      while (attempts < MAX_ATTEMPTS) {
        attempts++;

        const generated = await generator(difficulty);
        puzzle = generated.puzzle;
        solution = generated.solution;

        // Validate
        const validation = await validatePuzzle(puzzle, solution, variant, difficulty);
        qualityScore = validation.qualityScore;

        if (qualityScore >= 70) {
          console.log(`[CRON] Quality: ${qualityScore} (attempt ${attempts})`);
          break;
        }

        console.warn(`[CRON] Low quality: ${qualityScore}, retrying...`);
      }

      // If all attempts failed, use fallback
      if (qualityScore < 70) {
        console.error(`[CRON] Failed to generate ${variant} ${difficulty}, using fallback`);
        const fallback = await db.query(
          'SELECT puzzle, solution FROM fallback_puzzles WHERE variant = $1 AND difficulty = $2',
          [variant, difficulty]
        );

        if (fallback.rows.length === 0) {
          throw new Error(`No fallback puzzle for ${variant} ${difficulty}`);
        }

        puzzle = fallback.rows[0].puzzle;
        solution = fallback.rows[0].solution;
        qualityScore = 50; // Fallback quality score
      }

      // Store in database
      await db.query(`
        INSERT INTO daily_puzzles (puzzle_date, variant, difficulty, puzzle, solution, quality_score)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [dateStr, variant, difficulty, puzzle, solution, qualityScore]);

      results.push({ variant, difficulty, qualityScore });
    }

    // Clear cache
    await redis.del(`daily_puzzles:${dateStr}`);

    console.log(`[CRON] Generated ${results.length} puzzles for ${dateStr}`);

    return res.status(200).json({
      message: 'Puzzles generated successfully',
      date: dateStr,
      puzzles: results
    });

  } catch (error) {
    console.error('[CRON] Error generating puzzles:', error);

    // Send alert (future: email/Slack notification)
    // await sendAlert('Puzzle generation failed!', error.message);

    return res.status(500).json({ error: error.message });
  }
}
```

---

## 💾 STORAGE & RETRIEVAL

### Storing Daily Puzzles

**Table**: `daily_puzzles`

```sql
INSERT INTO daily_puzzles (
  puzzle_date,
  variant,
  difficulty,
  puzzle,
  solution,
  quality_score,
  generation_time_ms,
  techniques_required
) VALUES (
  '2025-11-09',
  'classic',
  'easy',
  '[[0,0,0,2,6,0,7,0,1],[6,8,0,0,7,0,0,9,0],...]', -- JSON array
  '[[4,3,5,2,6,9,7,8,1],[6,8,2,5,7,1,4,9,3],...]', -- JSON array
  87.5,
  234,
  '["naked_singles", "hidden_singles"]'::jsonb
);
```

### Fetching Daily Puzzles

**API**: `GET /api/daily-puzzles`

```javascript
// /api/daily-puzzles.js

export default async function handler(req, res) {
  const today = new Date().toISOString().split('T')[0];

  try {
    // Check Redis cache first (1 hour TTL)
    const cacheKey = `daily_puzzles:${today}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    // Fetch from database
    const result = await db.query(`
      SELECT id, variant, difficulty, puzzle
      FROM daily_puzzles
      WHERE puzzle_date = $1
      ORDER BY variant, difficulty
    `, [today]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No puzzles for today. Please contact support.' });
    }

    // Group by variant
    const puzzles = {
      classic: {},
      xsudoku: {},
      mini: {},
      killer: {},
      jigsaw: {}
    };

    for (const row of result.rows) {
      puzzles[row.variant][row.difficulty] = {
        id: row.id,
        puzzle: JSON.parse(row.puzzle),
        variant: row.variant,
        difficulty: row.difficulty
      };
    }

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(puzzles));

    return res.status(200).json(puzzles);

  } catch (error) {
    console.error('Error fetching daily puzzles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
```

**Response Format**:
```json
{
  "classic": {
    "easy": { "id": 123, "puzzle": [[...]], "variant": "classic", "difficulty": "easy" },
    "medium": { "id": 124, "puzzle": [[...]], "variant": "classic", "difficulty": "medium" },
    "hard": { "id": 125, "puzzle": [[...]], "variant": "classic", "difficulty": "hard" }
  },
  "xsudoku": {
    "easy": { "id": 126, "puzzle": [[...]], "variant": "xsudoku", "difficulty": "easy" },
    ...
  },
  "killer": {
    "easy": { "id": 129, "puzzle": {...}, "variant": "killer", "difficulty": "easy" },
    ...
  }
}
```

---

## 🎮 USER EXPERIENCE FLOW

### Daily Puzzle Dashboard

**Free User**:
```
┌──────────────────────────────────────┐
│      TODAY'S DAILY PUZZLES           │
├──────────────────────────────────────┤
│ CLASSIC SUDOKU                       │
│ ✅ Easy    [PLAY] [COMPLETED 3:24]  │
│ 🔓 Medium  [PLAY]                    │
│ 🔓 Hard    [PLAY]                    │
├──────────────────────────────────────┤
│ X-SUDOKU          🔒 Premium Only    │
│ 🔒 Easy    [UPGRADE TO PLAY]         │
│ 🔒 Medium  [UPGRADE TO PLAY]         │
│ 🔒 Hard    [UPGRADE TO PLAY]         │
├──────────────────────────────────────┤
│ KILLER SUDOKU     🔒 Premium Only    │
│ ...                                  │
└──────────────────────────────────────┘
```

**Premium User**:
```
┌──────────────────────────────────────┐
│      TODAY'S DAILY PUZZLES           │
├──────────────────────────────────────┤
│ CLASSIC SUDOKU                       │
│ ✅ Easy    [REPLAY]  [COMPLETED 3:24]│
│ 🔓 Medium  [PLAY]                    │
│ 🔓 Hard    [PLAY]                    │
├──────────────────────────────────────┤
│ X-SUDOKU          ⭐ Premium          │
│ ✅ Easy    [REPLAY]  [COMPLETED 5:12]│
│ 🔓 Medium  [PLAY]                    │
│ 🔓 Hard    [PLAY]                    │
├──────────────────────────────────────┤
│ KILLER SUDOKU     ⭐ Premium          │
│ 🔓 Easy    [PLAY]                    │
│ ...                                  │
│                                      │
│ [PLAY PRACTICE PUZZLES (Unlimited)]  │
└──────────────────────────────────────┘
```

### Completion Flow

**1. User starts daily puzzle**:
```javascript
// Load puzzle from today's daily set
const { id, puzzle } = dailyPuzzles.classic.easy;

// Check if already completed
const completion = await checkCompletion(userId, id);
if (completion) {
  showMessage('You already completed this puzzle today!');
  showReplayOption();
} else {
  startGame(puzzle, { daily: true, puzzleId: id });
}
```

**2. User completes puzzle**:
```javascript
// POST /api/daily-puzzles/complete
{
  "daily_puzzle_id": 123,
  "variant": "classic",
  "difficulty": "easy",
  "time_seconds": 187,
  "errors": 0,
  "hints_used": 1,
  "final_state": "[[...]]"
}

// Server response:
{
  "success": true,
  "score": 850,
  "rank": 142,
  "xp_earned": 75, // 50 base + 25 perfect bonus
  "achievements": [
    { "id": "first_daily_easy", "name": "Easy Does It!" }
  ],
  "battle_pass_progress": {
    "tier": 12,
    "xp": 1250,
    "next_tier_xp": 1500
  }
}
```

**3. Update leaderboard**:
```javascript
// Add to Redis sorted set
await redis.zadd(
  `leaderboard:daily:2025-11-09:classic:easy`,
  187, // time_seconds (score, lower is better)
  userId
);

// Get user's rank
const rank = await redis.zrank(
  `leaderboard:daily:2025-11-09:classic:easy`,
  userId
);
```

**4. Grant XP & check achievements**:
```javascript
const xp = calculateXP({
  variant: 'classic',
  difficulty: 'easy',
  isPerfect: errors === 0 && hints_used === 0,
  isFirstToday: await isFirstPuzzleToday(userId),
  isPremium: user.subscription_tier === 'premium'
});

await addXP(userId, xp);
await checkAchievements(userId, { puzzle_completed: true, difficulty: 'easy', ... });
```

---

## 📊 LEADERBOARD INTEGRATION

See `TECHNICAL_SPEC.md` for complete leaderboard architecture.

**Daily Leaderboard Keys** (Redis):
```
leaderboard:daily:YYYY-MM-DD:variant:difficulty
```

**Example**:
```
leaderboard:daily:2025-11-09:classic:easy
  → Sorted Set: { userId: time_seconds, ... }

Top 100 Query:
await redis.zrange('leaderboard:daily:2025-11-09:classic:easy', 0, 99, 'WITHSCORES');

Result:
[
  { userId: 'user_123', score: 142 },
  { userId: 'user_456', score: 155 },
  ...
]
```

---

## 🎯 PRACTICE PUZZLE SYSTEM

**Purpose**: Premium users can play unlimited puzzles beyond daily limit

### Practice Puzzle Library

**Pre-Generated**: 10,000+ puzzles per variant/difficulty

**Table**: `puzzles`

```sql
SELECT id, puzzle, solution
FROM puzzles
WHERE variant = 'classic'
  AND difficulty = 'easy'
  AND used_as_daily = false
  AND id NOT IN (SELECT practice_puzzle_id FROM user_puzzle_completions WHERE user_id = $1)
ORDER BY RANDOM()
LIMIT 1;
```

### API: `GET /api/practice-puzzle`

```javascript
// /api/practice-puzzle?variant=classic&difficulty=easy

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  const { variant, difficulty } = req.query;

  // Check Premium status
  const user = await getUser(userId);
  if (user.subscription_tier === 'free') {
    return res.status(403).json({ error: 'Premium required' });
  }

  // Fetch random unused puzzle
  const puzzle = await db.query(`
    SELECT id, puzzle, solution
    FROM puzzles
    WHERE variant = $1
      AND difficulty = $2
      AND used_as_daily = false
      AND id NOT IN (
        SELECT practice_puzzle_id
        FROM user_puzzle_completions
        WHERE user_id = $3 AND practice_puzzle_id IS NOT NULL
      )
    ORDER BY RANDOM()
    LIMIT 1
  `, [variant, difficulty, userId]);

  if (puzzle.rows.length === 0) {
    return res.status(404).json({ error: 'No puzzles available' });
  }

  return res.status(200).json({
    id: puzzle.rows[0].id,
    puzzle: JSON.parse(puzzle.rows[0].puzzle),
    variant,
    difficulty,
    isPractice: true
  });
}
```

### Completion Tracking

Practice completions do NOT appear on leaderboards:
```javascript
INSERT INTO user_puzzle_completions (
  user_id,
  practice_puzzle_id, -- Not daily_puzzle_id
  is_daily, -- FALSE
  variant,
  difficulty,
  time_seconds,
  ...
) VALUES (...)
```

---

## 🎁 REWARDED ADS INTEGRATION

**Free users who complete 3 daily puzzles** can watch ads for bonus puzzles.

### Flow

**1. User completes 3rd daily puzzle**:
```javascript
const dailyCount = await getDailyCompletionCount(userId, today);

if (dailyCount >= 3 && user.subscription_tier === 'free') {
  showModal({
    title: 'Daily Puzzles Complete! 🎉',
    message: 'Come back tomorrow for new puzzles.',
    actions: [
      { text: 'Watch 30s ad for 1 bonus puzzle', onClick: showRewardedAd },
      { text: 'Upgrade to Premium (Unlimited)', onClick: showPricing },
      { text: 'Close' }
    ]
  });
}
```

**2. User watches ad**:
```javascript
// Google AdMob rewarded video
admob.rewardedVideo.load(AD_UNIT_ID);
admob.rewardedVideo.show();

admob.rewardedVideo.on('rewarded', async () => {
  // Server-side verification
  await fetch('/api/ads/reward', {
    method: 'POST',
    body: JSON.stringify({ ad_unit_id: AD_UNIT_ID, user_id: userId })
  });
});
```

**3. Grant bonus puzzle token**:
```javascript
// /api/ads/reward
await db.query(`
  INSERT INTO ad_rewards (user_id, ad_type, reward_type, ad_unit_id)
  VALUES ($1, 'rewarded_video', 'bonus_puzzle', $2)
`, [userId, adUnitId]);

// Check limit (max 3 ads/day)
const todayAds = await db.query(`
  SELECT COUNT(*) FROM ad_rewards
  WHERE user_id = $1 AND viewed_at > NOW() - INTERVAL '24 hours'
`, [userId]);

if (todayAds.rows[0].count >= 3) {
  return res.status(429).json({ error: 'Daily ad limit reached' });
}

return res.status(200).json({ bonus_puzzle_token: true });
```

**4. User plays bonus puzzle**:
```javascript
// Fetch a practice puzzle (even though user is free)
const bonusPuzzle = await getPracticePuzzle(variant, difficulty);

// Track as practice completion (not on leaderboard)
// Consume bonus token
```

---

## 🚨 EDGE CASES & ERROR HANDLING

### Generation Failures

**Scenario**: Cron fails to generate puzzles for tomorrow

**Mitigation**:
1. Retry generation (up to 3 attempts per puzzle)
2. If all fail: use fallback puzzle from `fallback_puzzles` table
3. Alert admin via email/Slack
4. Display warning banner to users: "Today's puzzles may be repeats due to technical issues"

### Missing Puzzles

**Scenario**: User requests today's puzzles, but none exist

**Handling**:
```javascript
if (puzzles.length === 0) {
  // Generate on-demand (emergency fallback)
  await generatePuzzlesNow(today);

  // Or serve from fallback
  const fallback = await getFallbackPuzzles();

  return res.status(200).json(fallback);
}
```

### Duplicate Completions

**Scenario**: User tries to submit same daily puzzle twice

**Handling**:
```sql
-- Database constraint prevents duplicates
UNIQUE(user_id, daily_puzzle_id)

-- API returns error
if (existing) {
  return res.status(400).json({ error: 'You already completed this puzzle today' });
}
```

### Time Zone Issues

**Scenario**: User in different time zone sees wrong date

**Handling**:
- All dates stored/compared in UTC
- Frontend converts to user's local time for display
- "Today's puzzles" based on server UTC date, not user's local date

---

## ✅ TESTING CHECKLIST

- [ ] Cron runs at 11 PM UTC daily
- [ ] Puzzles generated for all variants/difficulties
- [ ] Quality validation rejects bad puzzles
- [ ] Fallback puzzles used when generation fails
- [ ] API returns correct puzzles for today
- [ ] Cache invalidation works (new day = new puzzles)
- [ ] Free users limited to 3 Classic dailies
- [ ] Premium users access all variants
- [ ] Leaderboard updates correctly
- [ ] Duplicate completions prevented
- [ ] Practice puzzles don't appear on leaderboards
- [ ] Rewarded ads grant bonus puzzles (max 3/day)

---

**This system enables the core gameplay loop. All other features (battle pass, achievements, social) build on top of this foundation.**
