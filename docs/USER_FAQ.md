# The London Sudoku - Frequently Asked Questions (FAQ)

**Welcome to The London Sudoku FAQ!** Here you'll find answers to common questions about gameplay, features, social systems, and more.

---

## 📖 Table of Contents

- [Getting Started](#getting-started)
- [Gameplay](#gameplay)
- [Scoring & Timing](#scoring--timing)
- [Variants](#variants)
- [Social Features](#social-features)
- [Battle Pass & Progression](#battle-pass--progression)
- [Achievements](#achievements)
- [Leagues](#leagues)
- [Lessons & Tutorials](#lessons--tutorials)
- [Premium Subscription](#premium-subscription)
- [Technical](#technical)
- [Account & Privacy](#account--privacy)

---

## Getting Started

### How do I create an account?

Visit the signup page and create an account using your email address. You can also sign in with Google or other social providers via Clerk authentication. Your account will be created instantly and you'll be able to start playing immediately.

### What are the different difficulty levels?

The London Sudoku offers three difficulty levels:

- **Easy (42 clues)**: Designed to be solvable without candidate tracking. Perfect for beginners, with 15+ naked singles throughout the solve and smooth progression. Target time: 3 minutes 30 seconds.

- **Medium (28 clues)**: Requires candidate tracking and forces thinking. Features moderate candidate density early on and 6-15 naked singles in the first 20 moves. Target time: 3 minutes.

- **Hard (25 clues)**: Requires heavy candidate work with high candidate density (3.4-5.0 candidates per cell early on) and very few naked singles (max 5 in first 20 moves). Target time: 7 minutes.

All puzzles are pre-generated at 11 PM daily with strict quality control to ensure consistent difficulty.

### How does scoring work?

Your score is calculated based on several factors:

- **Base Points**: 200 (Easy), 300 (Medium), 500 (Hard)
- **Time Bonus**: Points awarded for fast solving (based on target times)
- **Perfect Game Bonus**: +25 XP for completing with no errors and no hints
- **Streak Bonus**: Additional points for consecutive day wins
- **Penalties**: -10 points per error, -5 points per hint used

The scoring system rewards both speed and accuracy, with higher difficulties offering greater rewards.

### What are DNFs (Did Not Finish)?

A DNF (Did Not Finish) is recorded when you start a puzzle but don't complete it before the day ends. DNFs are tracked in your statistics but don't count as losses or break your streaks. They're simply a record that you attempted but didn't finish that particular puzzle.

### Can I play without creating an account?

Yes! The London Sudoku supports anonymous play. You can solve puzzles without an account, but your progress won't be saved. To access features like achievements, leaderboards, leagues, and battle pass progression, you'll need to create an account.

### How do I switch between difficulties?

On the main dashboard, you'll see three difficulty options: Easy, Medium, and Hard. Simply click on the difficulty you want to play. You can play all three difficulties each day if you'd like!

---

## Gameplay

### How do I use candidate mode?

Candidate mode (also called "notes" or "pencil marks") allows you to track possible numbers for each cell:

1. **Toggle Candidate Mode**: Press the **Space** bar or click the "Candidate Mode" button
2. **Add Candidates**: Click numbers 1-9 to add small candidate numbers to the selected cell
3. **Remove Candidates**: Click a candidate number again to remove it
4. **Auto-Candidates**: Some features may automatically eliminate candidates based on your moves
5. **Exit Candidate Mode**: Press **Space** again to return to normal entry mode

Candidate mode is essential for Medium and Hard puzzles, where tracking possibilities becomes crucial.

### What are hints and how do they work?

Hints provide assistance when you're stuck:

- **Cost**: Using a hint deducts 5 points from your score
- **What You Get**: A hint will reveal one correct number in an empty cell
- **Strategic Use**: Use hints sparingly to maintain your score
- **XP Impact**: Hints prevent "Perfect Game" bonuses (which require no errors AND no hints)

Press **H** or click the "Hint" button to use a hint.

### Can I save my progress?

Yes! Your progress is automatically saved as you play:

- **Auto-Save**: Every move is saved automatically to the database
- **Resume Anytime**: If you close the browser, your progress is preserved
- **Multiple Devices**: Log in from any device to continue your games
- **Daily Reset**: Puzzles reset at midnight UTC, so complete them before then

### How do I view my statistics?

Navigate to the **Analytics** page from the main menu to view:

- Win/loss records by difficulty
- Average solve times
- Accuracy rates
- Streak information
- Historical performance charts
- DNF tracking
- Total puzzles completed

### What keyboard shortcuts are available?

The London Sudoku has extensive keyboard support! See [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md) for the complete list. Key shortcuts include:

- **1-9**: Enter numbers
- **Space**: Toggle candidate mode
- **Arrow Keys**: Navigate cells
- **H**: Use hint
- **U**: Undo
- **Delete/Backspace**: Clear cell

### Can I undo moves?

Yes! Press **U** or **Ctrl+Z** to undo your last move. You can undo multiple moves to backtrack when needed.

### How does the timer work?

The timer starts automatically when you open a puzzle and tracks your solving time. You can pause the timer by pressing **P** or clicking the pause button. The timer affects your score calculation, with faster times earning higher bonuses.

---

## Scoring & Timing

### How is my time bonus calculated?

Time bonuses are awarded based on how quickly you solve compared to target times:

- **Easy**: Target 3:30 (210 seconds)
- **Medium**: Target 3:00 (180 seconds)
- **Hard**: Target 7:00 (420 seconds)

Solving faster than the target time gives you additional points, while solving slower results in fewer bonus points (but no penalties).

### Does pausing affect my score?

Yes, the timer continues to track total elapsed time even when paused. However, pausing is encouraged if you need to step away—it's better to pause than to abandon a puzzle!

### What's the maximum score I can achieve?

The maximum score depends on the difficulty:

- **Easy**: Base 200 + time bonus (varies)
- **Medium**: Base 300 + time bonus (varies)
- **Hard**: Base 500 + time bonus (varies)

Perfect games (no errors, no hints) also earn bonus XP, which contributes to your battle pass progression.

### Why did my score go down during the puzzle?

Your score decreases when you:

- Make an error (-10 points per error)
- Use a hint (-5 points per hint)

This encourages careful, strategic play over trial-and-error approaches.

---

## Variants

### What variants are available?

The London Sudoku offers 9 exciting variants:

**Free Variants:**
1. **Classic Sudoku**: Traditional 9×9 grid with standard rules
2. **X-Sudoku**: Classic rules + both diagonals must contain 1-9
3. **Mini Sudoku**: Smaller 6×6 grid (2×3 boxes) for quick play

**Premium Variants** (require subscription):
4. **Killer Sudoku**: Cages with sum constraints (no repeated digits in cages)
5. **Anti-Knight Sudoku**: Cells a chess knight's move apart cannot contain the same digit
6. **Hyper Sudoku**: Four extra 3×3 regions that must also contain 1-9
7. **Consecutive Sudoku**: Orthogonally adjacent cells with consecutive numbers are marked
8. **Thermo Sudoku**: Thermometer shapes where digits must increase from bulb to tip
9. **Jigsaw Sudoku**: Irregular shaped regions instead of standard 3×3 boxes

### How do X-Sudoku, Killer Sudoku, etc. work?

**X-Sudoku (Diagonal Sudoku)**:
- Standard Sudoku rules apply
- Additionally, both main diagonals must contain 1-9
- Increases difficulty as diagonals create more constraints

**Killer Sudoku**:
- No given clues initially
- Grid divided into "cages" (outlined groups)
- Each cage has a sum target (e.g., "15")
- Numbers in a cage must sum to the target
- No number can repeat within a cage
- Standard Sudoku rules still apply

**Anti-Knight Sudoku**:
- Standard Sudoku rules apply
- Cells that are a chess knight's move apart (L-shape: 2 squares in one direction, 1 square perpendicular) cannot contain the same digit
- Creates additional constraints beyond standard rules

**Hyper Sudoku**:
- Standard Sudoku rules apply
- Four additional 3×3 regions (overlaid on the grid) must each contain 1-9
- These regions are typically shown in different colors

**Consecutive Sudoku**:
- Standard Sudoku rules apply
- White dots/bars appear between cells with consecutive numbers (e.g., 3-4, 7-8)
- If there's NO marking between cells, they are NOT consecutive

**Thermo Sudoku**:
- Standard Sudoku rules apply
- Thermometer shapes overlay the grid (bulb at one end)
- Digits must strictly increase from the bulb toward the tip

**Jigsaw Sudoku**:
- Standard Sudoku row/column rules apply
- Instead of 3×3 boxes, regions have irregular shapes
- Each irregular region must contain 1-9 (no repeats)

### Are variants harder than classic Sudoku?

Generally yes, but it depends on the variant and difficulty level:

- **X-Sudoku**: Slightly harder due to diagonal constraints
- **Mini Sudoku**: Actually easier (smaller grid, faster to solve)
- **Killer Sudoku**: Significantly harder (requires arithmetic and logic)
- **Anti-Knight**: Moderate increase in difficulty
- **Thermo/Jigsaw/Hyper**: Moderate to hard depending on puzzle design

Each variant offers a unique challenge and requires adapting your solving strategies.

### Can I play variants in Practice Mode?

Yes! All variants are available in Practice Mode (accessible via the dashboard). Practice Mode lets you:

- Play unlimited puzzles without affecting your daily stats
- Practice specific techniques
- Try out premium variants before subscribing
- Improve your skills at your own pace

### How do I unlock premium variants?

Premium variants are unlocked with a Premium Subscription ($4.99/month). This subscription also includes:

- Battle Pass premium track (all rewards)
- 50% XP boost
- Access to all 6 premium variants
- Access to advanced lessons (Lessons 10-20)
- No ads (when implemented)

---

## Social Features

### How do I add friends?

To add friends:

1. Go to **Settings** or **Profile**
2. Navigate to the **Friends** section
3. Search for a friend by username
4. Send a friend request
5. Wait for them to accept

Once friends, you can see each other's stats and compete on leaderboards!

### What are leagues?

Leagues are weekly competitive seasons where you compete against other players in your tier:

**Six Tiers:**
1. **Bronze**: Starting tier for new players
2. **Silver**: Intermediate tier
3. **Gold**: Competitive tier
4. **Platinum**: Advanced tier
5. **Diamond**: Elite tier
6. **Legend**: Top tier for the best players

**How It Works:**
- Each league season lasts 7 days (weekly)
- Earn points by completing daily puzzles
- Top 20% get promoted to the next tier
- Bottom 20% get demoted to the lower tier
- Middle 60% stay in their current tier

### How does the global leaderboard work?

The global leaderboard ranks all players by:

- **Total Points**: Lifetime points earned across all puzzles
- **Daily Leaderboard**: Today's top performers
- **Weekly Leaderboard**: This week's top performers
- **All-Time Leaderboard**: Career top performers

View leaderboards from the **Leaderboards** page in the main navigation.

### Can I see my friends' progress?

Yes! Once you've added friends, you can:

- View their profiles (click on their username)
- See their statistics and achievements
- Compare your progress
- Compete on friend-specific leaderboards

### What is the Friends section in Settings?

The Friends section allows you to:

- View your current friends list
- See pending friend requests (incoming and outgoing)
- Accept or reject friend requests
- Remove friends if needed
- Search for new friends by username

---

## Battle Pass & Progression

### What is the Battle Pass?

The Battle Pass is a seasonal progression system (similar to Call of Duty or Fortnite) that rewards you for playing:

**Two Tracks:**
- **Free Track**: Available to all players, rewards every 20 tiers (5 total per season)
- **Premium Track**: Requires subscription, unlocks ALL tier rewards (40-50 per season)

**Season Duration**: Typically 4-6 weeks

**How to Progress**: Earn XP by completing puzzles, achievements, and challenges

### How do I earn XP?

XP (Experience Points) is earned through various activities:

**Puzzle Completions:**
- Classic Easy: 50 XP
- Classic Medium: 100 XP
- Classic Hard: 150 XP
- Variants: Higher XP (60-300 depending on variant and difficulty)

**Bonuses:**
- Perfect Game (no errors, no hints): +25 XP
- First Puzzle Today: +20 XP
- Daily Streak Bonus: +10 XP per consecutive day (capped at 30 days)

**Achievements:**
- Common: 10 XP
- Rare: 25 XP
- Epic: 50 XP
- Legendary: 100 XP

**Lessons:**
- Tutorial Complete: 75 XP
- Lesson Complete: 25-200 XP depending on lesson
- Course Completion Bonus: +100 to +300 XP

**Premium Bonus:**
- Premium subscribers get +50% XP on all activities!

### What rewards are available in the Battle Pass?

Battle Pass rewards include:

- **Cosmetic Items**: Profile badges, avatar frames, special icons
- **XP Boosts**: Temporary multipliers for faster progression
- **Titles**: Special titles to display on your profile
- **Currency**: In-game currency for future cosmetic shops (planned)
- **Exclusive Achievements**: Battle Pass-specific achievements

The Battle Pass page shows all available rewards for the current season.

### What's the difference between Free and Premium tiers?

**Free Tier:**
- Available to all players
- Rewards every 20 levels (Levels 20, 40, 60, 80, 100)
- 5 total rewards per season
- Standard XP earn rate

**Premium Tier:**
- Requires Premium Subscription ($4.99/month)
- Rewards at EVERY level (40-50 rewards per season)
- 50% XP boost (earn XP 1.5x faster)
- Exclusive cosmetics and titles
- Instant access to all premium variants and lessons

### Can I progress the Battle Pass after the season ends?

No, Battle Pass progress resets at the end of each season. Any unclaimed rewards are lost, so make sure to claim your rewards before the season ends!

### How do I claim Battle Pass rewards?

Rewards are automatically unlocked as you reach each tier. You can view and equip them from the **Battle Pass** page or your **Profile/Settings**.

---

## Achievements

### How many achievements are there?

The London Sudoku features **190+ achievements** across multiple categories:

- **Streak Achievements**: 10 (e.g., Hot Start, Dominator, Sudoku Overlord)
- **Speed Achievements**: 12 (e.g., Speed Walker, Speed Demon, Lightning Fast)
- **Win Achievements**: 18 (milestone wins by difficulty)
- **Perfect Game Achievements**: 8 (no errors/hints milestones)
- **Comeback Achievements**: 4 (recovery from bad streaks)
- **Consistency Achievements**: 9 (daily play streaks)
- **Variant Achievements**: 27 (complete various puzzle types)
- **League Achievements**: 40 (tier progression, promotions, season performance)
- **Lesson Achievements**: 25 (tutorial completion)
- **Special Achievements**: 30+ (community, social, exploration)

### How do I unlock achievements?

Achievements unlock automatically when you meet their requirements:

- **Automatic Tracking**: The system tracks all relevant stats in real-time
- **Instant Notification**: You'll see a popup notification when you unlock an achievement
- **Database Triggers**: Many achievements (like lesson completions) are auto-awarded via database logic

View all achievements and your progress on the **Achievements** page.

### What are achievement rarities?

Achievements have four rarity levels:

- **Common** (Blue): Easy to obtain, basic milestones
- **Rare** (Purple): Moderate difficulty, requires consistent play
- **Epic** (Orange): Challenging, requires significant dedication
- **Legendary** (Gold): Extremely difficult, reserved for top performers

Rarer achievements grant more XP and are more prestigious!

### Do achievements give rewards?

Yes! Each achievement grants:

- **XP**: Common (10 XP), Rare (25 XP), Epic (50 XP), Legendary (100 XP)
- **Bragging Rights**: Showcase your accomplishments
- **Progress Tracking**: Visual representation of your journey
- **Profile Display**: Featured achievements shown on your profile

Some achievements also unlock titles or cosmetic items.

### Can I view my achievement progress?

Yes! The **Achievements** page shows:

- All available achievements (categorized)
- Your unlocked achievements (with timestamps)
- Locked achievements (with progress bars where applicable)
- Completion percentage
- Total XP earned from achievements

---

## Leagues

### How do leagues work?

Leagues are weekly competitive seasons:

**Structure:**
- 7-day seasons (Monday to Sunday)
- ~20-30 players per league
- Earn points by completing daily puzzles
- Top 20% promoted, bottom 20% demoted, middle 60% stay

**Tiers:**
- Bronze → Silver → Gold → Platinum → Diamond → Legend

**Points:**
- Your score from daily puzzles contributes to league points
- Higher difficulties earn more points
- Perfect games and streaks boost your league standing

### What happens at the end of a league season?

At the end of each season:

1. **Final Rankings Calculated**: Based on total points earned
2. **Promotions/Demotions Applied**:
   - Top 20%: Promoted to next tier
   - Bottom 20%: Demoted to previous tier
   - Middle 60%: Stay in current tier
3. **Rewards Distributed**: (Future feature)
4. **New Season Starts**: Fresh matchmaking for the next week
5. **Achievements Checked**: Season-specific achievements are awarded

### Can I see league standings during the season?

Yes! Visit the **Leagues** page to see:

- Current league standings (live updated)
- Your current rank and points
- Promotion/demotion zones (color-coded)
- Your league tier
- Days remaining in the season

### What are promotion and demotion zones?

**Promotion Zone (Top 20%)**:
- Green highlight on leaderboard
- You'll be promoted to the next tier if you finish here

**Safe Zone (Middle 60%)**:
- Yellow/neutral highlight
- You'll stay in your current tier

**Demotion Zone (Bottom 20%)**:
- Red highlight on leaderboard
- You'll be demoted to the previous tier if you finish here

The zones help you understand where you stand and how much effort you need to secure promotion or avoid demotion.

### Are there league-specific achievements?

Yes! 40 league achievements including:

- **Tier Achievements**: Reach each tier (Bronze Beginner, Silver Competitor, etc.)
- **Season Performance**: Finish 1st, top 3, top 10%
- **Promotion Streaks**: 3 consecutive promotions, rapid promotions
- **Consistency**: Stay in same tier for 10 seasons, avoid demotion
- **Epic Climbs**: Bronze to Legend, Phoenix Rising (demote 2x, promote 2x)

### Can I opt out of leagues?

Currently, all users are automatically enrolled in leagues. However, you can simply not participate—league standings only update when you complete puzzles, so inactive players naturally settle to lower tiers or are unranked.

---

## Lessons & Tutorials

### What are Lessons?

Lessons are interactive tutorials teaching Sudoku techniques:

**20 Total Lessons:**
- **Beginner Course (6 lessons)**: Basics, Naked Singles, Hidden Singles, Scanning, Naked Pairs, Hidden Pairs
- **Intermediate Course (8 lessons)**: Naked Triples, Hidden Triples, Box/Line Reduction, X-Wing, Swordfish, XY-Wing, XYZ-Wing, Simple Coloring
- **Variant Course (6 lessons)**: X-Sudoku, Killer Sudoku, Anti-Knight, Thermo Sudoku, Jigsaw Sudoku, Advanced Combinations

### How do Lessons work?

Each lesson follows a 5-step format:

1. **Introduction**: Overview of the technique
2. **Explanation**: Detailed walkthrough with examples
3. **Practice**: Interactive puzzle to apply the technique
4. **Quiz**: 3 questions to test your understanding (2/3 required to pass)
5. **Summary**: Recap and next steps

Your progress is auto-saved, so you can resume anytime.

### Are all Lessons free?

No, lessons are split:

- **FREE**: Lessons 1-9 (all beginner + 3 intermediate)
- **PREMIUM**: Lessons 10-20 (5 intermediate + 6 variants)

Premium subscribers get full access to all 20 lessons.

### What rewards do I get from completing Lessons?

Completing lessons grants:

- **XP**: 25-200 XP per lesson
- **Course Completion Bonuses**: +100 XP (Beginner), +200 XP (Intermediate), +300 XP (Variants)
- **Achievements**: 25 lesson achievements (20 individual + 3 course + 1 master + 1 sensei)
- **Skill Improvement**: Practical knowledge to solve puzzles faster

**Total Available**: 3,725 XP from all lessons!

### How long do Lessons take?

Estimated times vary by lesson:

- **Beginner Lessons**: 10-20 minutes each
- **Intermediate Lessons**: 15-30 minutes each
- **Variant Lessons**: 20-40 minutes each

**Total Content**: ~8.4 hours (502 minutes) of educational material.

### Can I retake Lessons?

Yes! You can retake any lesson at any time to:

- Refresh your knowledge
- Improve your quiz score
- Practice techniques
- Review explanations

However, XP and achievements are only awarded once (first completion).

---

## Premium Subscription

### What does Premium Subscription include?

Premium Subscription ($4.99/month) unlocks:

**Content Access:**
- All 6 premium puzzle variants (Killer, Anti-Knight, Hyper, Consecutive, Thermo, Jigsaw)
- Advanced lessons (Lessons 10-20)

**Battle Pass:**
- Full premium track (all 40-50 rewards per season)
- 50% XP boost on all activities

**Features:**
- Free tier limit removal (unlimited daily classics)
- Priority support
- Early access to new features

**Future Benefits:**
- Ad-free experience (when ads are implemented)
- Exclusive cosmetics and titles
- Monthly bonus rewards

### How do I subscribe?

1. Navigate to **Settings** or **Battle Pass** page
2. Click **"Upgrade to Premium"** or **"Subscribe"**
3. Complete payment via Stripe (secure checkout)
4. Instant activation—premium features unlock immediately

You can also subscribe from any premium-locked content (e.g., clicking a locked variant).

### Can I cancel my subscription?

Yes! You can cancel anytime:

1. Go to **Settings** → **Subscription**
2. Click **"Manage Subscription"**
3. Select **"Cancel Subscription"**

Your premium access remains active until the end of your current billing period, then automatically reverts to free tier.

### What happens if I cancel?

When your subscription expires:

- Premium variants become locked (but progress is saved)
- Premium lessons become locked (but completed lessons remain viewable)
- Battle Pass switches to free track (premium rewards locked, but free rewards still claimable)
- XP boost is removed (back to standard earn rate)

If you resubscribe later, all your premium progress is restored!

### Are there discounts or free trials?

Currently, The London Sudoku does not offer free trials. However:

- **Practice Mode**: Try premium variants in limited practice mode before subscribing
- **Free Lessons**: First 9 lessons are free to try the lesson system
- **Promotions**: Occasional discounts may be offered (check the website or email announcements)

### Is my payment information secure?

Yes! All payments are processed through **Stripe**, an industry-leading secure payment processor. The London Sudoku never stores your credit card information—all payment data is handled securely by Stripe with PCI-DSS compliance.

---

## Technical

### What browsers are supported?

The London Sudoku supports modern browsers:

**Fully Supported:**
- Google Chrome (latest 2 versions)
- Mozilla Firefox (latest 2 versions)
- Apple Safari (latest 2 versions)
- Microsoft Edge (Chromium-based, latest 2 versions)

**Mobile Browsers:**
- Chrome Mobile (Android)
- Safari Mobile (iOS)
- Samsung Internet

**Minimum Requirements:**
- JavaScript enabled
- LocalStorage enabled
- Modern CSS support (CSS Grid, Flexbox)

### Is there a mobile app?

Yes! The London Sudoku is a **Progressive Web App (PWA)**:

**Features:**
- Install to home screen (iOS and Android)
- Works offline (caches puzzles)
- Native app-like experience
- Push notifications (future feature)

**To Install:**
- **iOS**: Safari → Share → "Add to Home Screen"
- **Android**: Chrome → Menu → "Install App" or "Add to Home Screen"

The PWA provides the best mobile experience without needing a separate app store download!

### Does it work offline?

Partially. The London Sudoku has offline capabilities:

**Works Offline:**
- Complete already-loaded puzzles
- View cached pages (dashboard, settings)
- Review statistics (cached data)

**Requires Connection:**
- Fetch new daily puzzles
- Submit completed puzzles for scoring
- Update leaderboards and league standings
- Sync progress across devices

If you go offline mid-puzzle, your progress is saved locally and will sync once you reconnect.

### Why is my game running slowly?

Performance issues can have several causes:

**Common Solutions:**
1. **Clear Browser Cache**: Old cached data can slow things down
2. **Update Browser**: Ensure you're using the latest browser version
3. **Close Other Tabs**: Free up browser resources
4. **Disable Extensions**: Some browser extensions interfere with web apps
5. **Check Internet Speed**: Slow connection affects loading times

If issues persist, contact support with details about your device and browser.

### How do I report bugs?

To report bugs:

1. Visit the **Settings** page
2. Scroll to **"Contact Support"** or **"Report Bug"**
3. Provide details:
   - What happened
   - What you expected
   - Steps to reproduce
   - Browser and device info
4. Submit

Alternatively, email support directly: [Insert Support Email]

### Where can I give feedback?

We love feedback! You can:

- Email us: [Insert Support Email]
- Submit feedback via **Settings** → **"Send Feedback"**
- Join our community Discord (if available)
- Leave reviews on social media

Your feedback helps us improve The London Sudoku!

### What data does the game collect?

The London Sudoku collects:

**Necessary Data:**
- Email address (for account management)
- Username (for profiles and leaderboards)
- Puzzle completion data (for statistics and scoring)
- Device/browser info (for compatibility)

**Optional Analytics:**
- Gameplay events (puzzle starts, completions)
- Feature usage (which pages you visit)
- Performance metrics (load times)

**Privacy:**
- We do NOT sell your data
- We do NOT track you across other sites
- You can request data deletion anytime (GDPR compliant)

See our [Privacy Policy](../privacy-policy.html) for full details.

---

## Account & Privacy

### How do I change my email or password?

**Via Clerk (if using Clerk auth):**
1. Go to **Settings** → **Account**
2. Click **"Manage Account"** (redirects to Clerk dashboard)
3. Update your email or password
4. Changes take effect immediately

**Via Email Auth:**
1. Go to **Settings** → **Account**
2. Click **"Change Email"** or **"Change Password"**
3. Verify via email confirmation
4. Update saved

### How do I delete my account?

To delete your account:

1. Go to **Settings** → **Account**
2. Scroll to **"Danger Zone"**
3. Click **"Delete Account"**
4. Confirm deletion (this action is irreversible)

**What Gets Deleted:**
- Your account and profile
- All puzzle progress and statistics
- Achievements and Battle Pass progress
- Friends list

**What's Retained:**
- Anonymized leaderboard entries (for historical accuracy)

### Can I export my data?

Yes! GDPR compliance allows data export:

1. Go to **Settings** → **Privacy**
2. Click **"Export My Data"**
3. Receive a JSON file with:
   - All puzzle completions
   - Statistics and achievements
   - Account information
   - Friends list

The export is comprehensive and machine-readable for portability.

### How do I change my username or display name?

1. Go to **Settings** → **Profile**
2. Edit **"Display Name"** or **"Username"** field
3. Click **"Save Changes"**

**Note**: Username changes may be restricted (e.g., once every 30 days) to prevent abuse. Display names can usually be changed freely.

### What is the "Founder Badge"?

The **Founder Badge** is a special badge awarded to early supporters and players who joined during the initial launch period. It's a permanent, exclusive badge that cannot be obtained after the founding period ends. If you have a Founder Badge, wear it with pride!

### How do I enable/disable notifications?

1. Go to **Settings** → **Notifications**
2. Toggle preferences:
   - Achievement notifications
   - League updates
   - Friend requests
   - Battle Pass progress
   - Email notifications
3. Save changes

**Browser Notifications:** You may need to grant permission in your browser settings for push notifications to work.

---

## 🎯 Still Have Questions?

If your question wasn't answered here, please:

- Check the [Help Center](HELP_CENTER.md) for troubleshooting guides
- Review the [Sudoku Strategy Guide](SUDOKU_STRATEGIES.md) for gameplay tips
- Contact support via **Settings** → **"Contact Support"**
- Join our community for discussions and tips

**Happy Solving!** 🧩✨
