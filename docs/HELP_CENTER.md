# The London Sudoku - Help Center

**Need help?** This Help Center provides solutions to common issues, feature guides, and troubleshooting tips.

---

## 📖 Table of Contents

- [Common Issues](#common-issues)
- [Feature Guides](#feature-guides)
- [Account Management](#account-management)
- [Performance & Technical](#performance--technical)
- [Mobile & PWA](#mobile--pwa)
- [Contact Support](#contact-support)

---

## Common Issues

### "I can't log in"

**Symptoms**: Login button doesn't work, stuck on login page, or error messages

**Solutions**:

1. **Check your credentials**
   - Verify email address is correct (check for typos)
   - Ensure password is correct (check Caps Lock)
   - Try "Forgot Password" if needed

2. **Clear browser cache**
   - Chrome: Settings → Privacy and Security → Clear browsing data
   - Firefox: Options → Privacy & Security → Cookies and Site Data → Clear Data
   - Safari: Preferences → Privacy → Manage Website Data → Remove All

3. **Disable browser extensions**
   - Ad blockers and privacy extensions can interfere with authentication
   - Try disabling extensions temporarily
   - Test in incognito/private mode

4. **Check Clerk service status**
   - Visit https://status.clerk.com to check for outages
   - If Clerk is down, wait and try again later

5. **Try a different browser**
   - Test in Chrome, Firefox, or Safari
   - This helps isolate browser-specific issues

**Still stuck?** [Contact Support](#contact-support) with:
- Browser name and version
- Error message (if any)
- Screenshot of the issue

---

### "My progress isn't saving"

**Symptoms**: Moves disappear after refresh, completion doesn't register, statistics don't update

**Solutions**:

1. **Check your internet connection**
   - Progress requires an active connection to save
   - Look for "offline" indicator in browser
   - Try refreshing the page

2. **Verify you're logged in**
   - Check username appears in top-right corner
   - Anonymous users can't save progress
   - Log in or create an account

3. **Enable LocalStorage**
   - Browser Settings → Privacy → Allow cookies and site data
   - Some privacy modes block LocalStorage
   - Disable "Block all cookies" setting

4. **Check browser console for errors**
   - Press F12 to open developer tools
   - Look for red error messages in Console tab
   - Take screenshot and [contact support](#contact-support)

5. **Try completing a new puzzle**
   - Start a fresh puzzle to test if saving works
   - If new puzzle saves, old data may be corrupted

**Preventive measures**:
- Keep browser updated
- Don't close browser mid-puzzle (pause instead)
- Use stable internet connection

---

### "Puzzles aren't loading"

**Symptoms**: Blank grid, "Loading..." message stuck, or error messages

**Solutions**:

1. **Refresh the page**
   - Press F5 or Ctrl+R (Cmd+R on Mac)
   - Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)

2. **Check internet connection**
   - Visit another website to verify connection
   - Try switching networks (WiFi vs mobile data)

3. **Clear browser cache**
   - Cached puzzles may be outdated or corrupted
   - Follow browser-specific steps above

4. **Check API status**
   - If other users report issues, server may be down
   - Check official announcements or status page

5. **Disable ad blockers**
   - Some ad blockers interfere with API requests
   - Whitelist thelondonsudoku.com

6. **Try a different difficulty**
   - Test if specific difficulty is broken
   - Report which difficulty fails

**If puzzles still won't load**: [Contact Support](#contact-support) with:
- Browser console errors (F12 → Console tab)
- Network tab errors (F12 → Network tab, refresh page)
- Time of issue (including timezone)

---

### "Timer seems wrong"

**Symptoms**: Timer jumps forward/backward, time doesn't match actual duration, or timer stops

**Solutions**:

1. **Check system time**
   - Verify your device's clock is correct
   - Timer syncs with your system time
   - Enable automatic time synchronization

2. **Timezone differences**
   - Daily puzzles reset at midnight UTC
   - Your local time may differ
   - Timer tracks actual elapsed time, not wall-clock time

3. **Pausing behavior**
   - Pausing stops the visible timer but tracks total elapsed time
   - If you pause and resume, check for time added

4. **Browser tab switching**
   - Some browsers throttle inactive tabs
   - Timer continues running even when tab is inactive
   - Use pause feature if stepping away

5. **Clear cache and refresh**
   - Cached timer state may be stale
   - Hard refresh (Ctrl+Shift+R) to reset

**Note**: Timer tracks total elapsed time from start to completion, including pauses. This ensures fair scoring across all players.

---

### "I lost my streak"

**Symptoms**: Streak counter reset to 0, streak didn't increment after win

**Solutions**:

1. **Check streak rules**
   - Streaks require completing puzzles before midnight UTC
   - DNFs (Did Not Finish) break streaks
   - Must complete at least one puzzle per day

2. **Verify completion time**
   - Check when you completed yesterday's puzzle
   - If completed after midnight UTC, it counts for today
   - Timezone differences can cause confusion

3. **Check for DNFs**
   - Starting but not completing a puzzle may count as DNF
   - DNFs break streaks
   - Review your recent completion history

4. **Server sync issues**
   - If completed puzzle but streak didn't update:
     - Wait 5 minutes for sync
     - Refresh page
     - Check statistics page for accurate count

5. **Appeal process** (if you believe it's an error)
   - [Contact Support](#contact-support) with:
     - Date range of streak
     - Completion timestamps
     - Screenshot of statistics page

**Streak recovery**:
- Unfortunately, lost streaks cannot be manually restored
- Start a new streak and keep going!
- Use the pause feature to avoid abandoning puzzles

---

### "My score seems incorrect"

**Symptoms**: Score lower than expected, penalties not matching errors, or bonus not applied

**Solutions**:

1. **Understand scoring system**
   - Base score: 200 (Easy), 300 (Medium), 500 (Hard)
   - Errors: -10 points each
   - Hints: -5 points each
   - Time bonus: Based on target times (varies)

2. **Check for hidden penalties**
   - Count all errors made (not just current ones)
   - Even corrected errors count as penalties
   - Hints used earlier still deduct points

3. **Verify time bonus**
   - Faster than target = higher bonus
   - Slower than target = lower bonus
   - Very slow times may have minimal or no bonus

4. **Compare with statistics**
   - Check your average scores for that difficulty
   - Consistency issues may indicate bugs
   - Report if scores are consistently wrong

**Example Calculation**:
```
Medium puzzle:
Base: 300 points
Errors: 3 × -10 = -30 points
Hints: 2 × -5 = -10 points
Time bonus: +50 points (fast solve)
─────────────────────────
Total: 310 points
```

**Still confused?** [Contact Support](#contact-support) with:
- Puzzle date and difficulty
- Screenshot of completion screen
- Expected vs actual score

---

### "Achievements not unlocking"

**Symptoms**: Met requirements but achievement didn't unlock, notification didn't appear

**Solutions**:

1. **Check achievement requirements**
   - Visit Achievements page to review exact requirements
   - Some achievements have hidden criteria (e.g., "in a row")
   - Verify you truly met all conditions

2. **Wait for sync**
   - Achievements may take 1-2 minutes to process
   - Refresh the Achievements page
   - Check for notification after refresh

3. **Verify statistics**
   - Check your stats match achievement requirements
   - Example: "Win 50 Easy puzzles" → verify Easy wins = 50+
   - Statistics page shows accurate counts

4. **Restart browser**
   - Sometimes achievements unlock after page reload
   - Close all tabs and reopen
   - Log out and log back in

5. **Database triggers**
   - Some achievements (like lesson completions) use database triggers
   - These should unlock instantly
   - If not, [contact support](#contact-support)

**Known Timing Issues**:
- Streak achievements: Update after midnight UTC
- League achievements: Process at end of season (weekly)
- Lesson achievements: Should be instant (report if not)

---

## Feature Guides

### How to Use Candidate Mode

**What is Candidate Mode?**
Candidate mode (also called notes or pencil marks) lets you track possible numbers for each cell.

**Activating Candidate Mode**:
1. Press **Space** bar (keyboard)
2. OR click **"Candidate Mode"** button (on-screen)
3. Cell highlights change to indicate candidate mode is active

**Using Candidates**:
1. Select an empty cell
2. Press numbers **1-9** to add/remove candidates
3. Small numbers appear in the cell (top-left, centered, or grid layout)
4. Press number again to remove that candidate

**Exiting Candidate Mode**:
1. Press **Space** bar again
2. Return to normal entry mode (large numbers)

**Tips**:
- Fill candidates for all cells at start of Medium/Hard puzzles
- Update candidates after each placement
- Use elimination techniques (see [SUDOKU_STRATEGIES.md](SUDOKU_STRATEGIES.md))

**Visual Example**:
```
Normal mode:        Candidate mode:
┌─────┐            ┌─────┐
│  5  │            │1 2 3│
│     │            │4   6│
└─────┘            │7 8 9│
                   └─────┘
```

---

### How to Use Keyboard Shortcuts

**Why Keyboard Shortcuts?**
Keyboard shortcuts drastically speed up puzzle solving (30-50% faster than mouse).

**Essential Shortcuts**:
- **1-9**: Enter number in selected cell
- **Space**: Toggle candidate mode
- **Arrow Keys**: Navigate between cells
- **Tab**: Jump to next empty cell
- **H**: Use hint
- **U**: Undo last move
- **Delete/Backspace**: Clear cell

**Full List**: See [KEYBOARD_SHORTCUTS.md](KEYBOARD_SHORTCUTS.md)

**Learning Tips**:
1. Start with number keys (1-9)
2. Add arrow keys for navigation
3. Learn Space for candidate mode
4. Master Tab for empty cell jumping
5. Add advanced shortcuts as needed

**Practice**:
- Use keyboard-only for one full puzzle
- Speed will improve quickly with practice
- Most experts use 90%+ keyboard

---

### How to Customize Settings

**Accessing Settings**:
1. Click username dropdown (top-right)
2. Select **"Settings"**
3. OR visit settings.html directly

**Available Settings**:

**Appearance**:
- Theme: Light/Dark mode (future feature)
- Grid size: Adjust zoom level
- Number style: Font and size preferences

**Gameplay**:
- Auto-check: Highlight errors immediately (vs on completion)
- Candidate auto-fill: Fill all candidates at start
- Candidate auto-elimination: Remove candidates when number placed
- Timer visibility: Show/hide timer during play

**Notifications**:
- Achievement popups: Enable/disable
- League updates: Enable/disable
- Friend activity: Enable/disable
- Email notifications: Control email frequency

**Audio**:
- Sound effects: Enable/disable
- Volume: Adjust level
- Victory music: Enable/disable

**Account**:
- Email: Change email address
- Password: Change password
- Display name: Change username
- Avatar: Upload profile picture
- Delete account: Permanently remove account

**Privacy**:
- Data export: Download your data
- Analytics: Opt in/out of usage tracking
- Profile visibility: Public/Friends-only/Private

**Save Changes**:
- Click **"Save"** button at bottom
- Changes apply immediately
- Some changes require page refresh

---

### How to Use the Mobile PWA

**What is a PWA?**
Progressive Web App (PWA) = installable web app that works like a native app.

**Installing on iOS**:
1. Open Safari (must use Safari, not Chrome)
2. Navigate to thelondonsudoku.com
3. Tap **Share** button (square with arrow)
4. Scroll down and tap **"Add to Home Screen"**
5. Name the app (default: "The London Sudoku")
6. Tap **"Add"**
7. App icon appears on home screen

**Installing on Android**:
1. Open Chrome browser
2. Navigate to thelondonsudoku.com
3. Tap **Menu** (three dots)
4. Select **"Install App"** or **"Add to Home Screen"**
5. Confirm installation
6. App icon appears on home screen

**PWA Benefits**:
- ✅ Works offline (caches puzzles)
- ✅ Faster loading
- ✅ Full-screen experience
- ✅ Push notifications (future)
- ✅ No app store needed
- ✅ Auto-updates

**Offline Features**:
- Complete already-loaded puzzles
- View cached statistics
- Access settings

**Requires Internet**:
- Fetch new daily puzzles
- Submit completions
- Update leaderboards
- Sync progress

**Uninstalling**:
- **iOS**: Long-press icon → Remove App
- **Android**: Long-press icon → Uninstall / Remove

---

### How to Enable/Disable Sounds

**Accessing Sound Settings**:
1. Go to **Settings** → **Audio**
2. Toggle options:
   - Sound effects (ON/OFF)
   - Volume slider (0-100%)
   - Victory music (ON/OFF)
   - Error sounds (ON/OFF)

**Quick Mute**:
- Use browser mute (click speaker icon in tab)
- OR mute entire device
- Settings persist after mute

**Sound Types**:
- **Number placement**: Soft click sound
- **Error**: Alert sound when mistake detected
- **Achievement**: Fanfare when unlocking achievement
- **Victory**: Music when completing puzzle
- **Hint**: Chime when using hint

**Recommendations**:
- Enable sounds for feedback (helps avoid errors)
- Disable in quiet environments (library, office)
- Adjust volume to comfortable level

---

### How to Add and Manage Friends

**Adding Friends**:
1. Go to **Settings** → **Friends**
2. OR click **"Friends"** in navigation (if available)
3. Click **"Add Friend"** button
4. Enter friend's username
5. Click **"Send Request"**
6. Wait for them to accept

**Managing Friend Requests**:
1. Go to **Settings** → **Friends**
2. View **"Pending Requests"** section
3. **Incoming**: Accept or Reject
4. **Outgoing**: Cancel if desired

**Viewing Friends**:
1. Go to **Settings** → **Friends**
2. See list of current friends
3. Click on friend to view their profile
4. View their statistics and achievements

**Removing Friends**:
1. Go to **Settings** → **Friends**
2. Find friend in list
3. Click **"Remove"** button
4. Confirm removal

**Friend Benefits**:
- Compare statistics
- See friends on leaderboards
- Compete in friend-only leagues (future)
- Challenge friends (future)

---

### Understanding Leagues

**What Are Leagues?**
Leagues are weekly competitive seasons where you compete against ~20-30 players in your skill tier.

**Six Tiers**:
1. **Bronze**: Starting tier (new players)
2. **Silver**: Intermediate tier
3. **Gold**: Competitive tier
4. **Platinum**: Advanced tier
5. **Diamond**: Elite tier
6. **Legend**: Top tier (best players)

**How Leagues Work**:
- **Season Length**: 7 days (Monday to Sunday)
- **Matchmaking**: ~20-30 players per league
- **Points**: Earn points by completing daily puzzles
- **Ranking**: Live updated throughout the week

**Promotion/Demotion**:
- **Top 20%**: Promoted to next tier
- **Middle 60%**: Stay in current tier
- **Bottom 20%**: Demoted to previous tier

**Season End**:
- Rankings finalized Sunday at midnight UTC
- Promotions/demotions applied
- New season starts Monday morning
- Rewards distributed (future feature)

**Viewing Leagues**:
1. Navigate to **Leagues** page
2. See current league standings
3. Your rank highlighted
4. Color-coded zones:
   - 🟢 Green = Promotion zone
   - 🟡 Yellow = Safe zone
   - 🔴 Red = Demotion zone

**Tips**:
- Play daily to maximize points
- Higher difficulties = more points
- Consistent play > occasional big scores
- Check standings regularly to know your position

---

## Account Management

### How to Change Email or Password

**Via Clerk Authentication** (most users):
1. Go to **Settings** → **Account**
2. Click **"Manage Account"** button
3. Redirects to Clerk user portal
4. Update email or password
5. Verify via email if required
6. Changes take effect immediately

**Via Email Authentication** (legacy users):
1. Go to **Settings** → **Account**
2. Click **"Change Email"** or **"Change Password"**
3. Enter new email or password
4. Confirm via email verification link
5. Changes apply after verification

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- Special characters recommended

**Email Change Notes**:
- New email must be unique (not used by another account)
- Verification link sent to new email
- Must verify within 24 hours
- Old email remains active until verified

**Forgot Password**:
1. Go to login page
2. Click **"Forgot Password"**
3. Enter email address
4. Check email for reset link
5. Create new password

---

### How to Delete Your Account

**Warning**: Account deletion is **permanent and irreversible**. All data will be deleted.

**What Gets Deleted**:
- Account and profile information
- All puzzle completions and progress
- Statistics and history
- Achievements and battle pass progress
- Friends list
- Subscription (will be cancelled)

**What's Retained** (anonymized):
- Historical leaderboard entries (for accuracy)
- No personally identifiable information

**Deletion Process**:
1. Go to **Settings** → **Account**
2. Scroll to **"Danger Zone"** (bottom)
3. Click **"Delete Account"** button
4. Read warnings carefully
5. Type confirmation phrase (e.g., "DELETE")
6. Confirm deletion
7. Account deleted immediately

**After Deletion**:
- Cannot be undone
- Email address becomes available for new accounts
- Logout forced immediately
- All access revoked

**Alternatives to Deletion**:
- **Take a break**: Just don't log in (data preserved)
- **Export data first**: Download your data before deleting
- **Cancel subscription**: Keep free account but cancel premium

---

### How to Export Your Data (GDPR)

**Why Export Data?**
- Backup your progress
- Portability to other apps (future)
- GDPR compliance (your right)
- Review your activity

**Export Process**:
1. Go to **Settings** → **Privacy**
2. Click **"Export My Data"** button
3. Wait for processing (30 seconds to 2 minutes)
4. Download JSON file
5. Save file securely

**What's Included**:
- Account information (email, username, join date)
- All puzzle completions (date, difficulty, time, score)
- Statistics (win/loss records, averages)
- Achievements (all unlocked achievements with dates)
- Friends list (usernames)
- League history (seasons, tiers, outcomes)
- Battle pass progress (tiers, rewards)
- Subscription status (if applicable)

**File Format**:
- JSON (JavaScript Object Notation)
- Machine-readable for portability
- Human-readable with formatting
- Can be opened in any text editor

**Example Structure**:
```json
{
  "account": {
    "email": "user@example.com",
    "username": "sudoku_master",
    "created_at": "2025-01-15T10:30:00Z"
  },
  "completions": [
    {
      "date": "2025-11-13",
      "difficulty": "hard",
      "time": 385,
      "score": 520
    }
  ],
  "achievements": [
    {
      "id": "streak_5",
      "unlocked_at": "2025-11-10T15:45:00Z"
    }
  ]
}
```

**Privacy**:
- Export contains only YOUR data
- No other users' data included
- Encrypted during transfer
- Not stored on our servers after download

---

## Performance & Technical

### Best Browsers for Optimal Performance

**Recommended Browsers** (in order):

1. **Google Chrome** (Best overall)
   - Fastest JavaScript engine (V8)
   - Best PWA support
   - Excellent developer tools
   - Version 100+

2. **Microsoft Edge** (Chromium-based)
   - Same engine as Chrome
   - Slightly better memory management
   - Great Windows integration
   - Version 100+

3. **Mozilla Firefox**
   - Strong privacy features
   - Good performance
   - Excellent developer tools
   - Version 100+

4. **Apple Safari** (macOS/iOS only)
   - Required for iOS PWA installation
   - Good performance on Apple devices
   - Version 15+

**Not Recommended**:
- ❌ Internet Explorer (not supported)
- ❌ Old browser versions (pre-2020)
- ❌ Obscure browsers without modern JavaScript support

**Mobile Browsers**:
- ✅ Chrome Mobile (Android)
- ✅ Safari Mobile (iOS)
- ✅ Samsung Internet
- ✅ Firefox Mobile

**Performance Tips**:
- Keep browser updated to latest version
- Use hardware acceleration (enable in settings)
- Close unnecessary tabs
- Disable heavy browser extensions

---

### How to Clear Cache

**Why Clear Cache?**
- Fix loading issues
- Update to latest version
- Clear corrupted data
- Free up storage space

**Google Chrome**:
1. Click **Menu** (three dots, top-right)
2. Settings → Privacy and Security
3. Click **"Clear browsing data"**
4. Select time range: "All time"
5. Check:
   - ✅ Cookies and other site data
   - ✅ Cached images and files
6. Click **"Clear data"**
7. Restart browser

**Mozilla Firefox**:
1. Click **Menu** (three lines, top-right)
2. Options → Privacy & Security
3. Scroll to **Cookies and Site Data**
4. Click **"Clear Data"**
5. Check both options
6. Click **"Clear"**
7. Restart browser

**Apple Safari**:
1. Safari → Preferences
2. Privacy tab
3. Click **"Manage Website Data"**
4. Click **"Remove All"**
5. Confirm
6. Restart browser

**Microsoft Edge**:
1. Click **Menu** (three dots, top-right)
2. Settings → Privacy, search, and services
3. Click **"Choose what to clear"**
4. Select time range: "All time"
5. Check relevant options
6. Click **"Clear now"**
7. Restart browser

**Hard Refresh** (faster alternative):
- **Windows**: Ctrl + Shift + R
- **Mac**: Cmd + Shift + R
- Forces reload without clearing all data

---

### Recommended Settings for Best Performance

**Browser Settings**:
1. **Enable hardware acceleration**
   - Chrome: Settings → Advanced → System → "Use hardware acceleration"
   - Firefox: Options → General → Performance → "Use recommended performance settings"

2. **Disable unnecessary extensions**
   - Go to Extensions manager
   - Disable/remove unused extensions
   - Keep only essential ones

3. **Clear storage regularly**
   - Clear cache monthly
   - Clear cookies if not logged in automatically

**Game Settings**:
1. **Disable animations** (if laggy)
   - Settings → Appearance → "Reduce animations"

2. **Auto-save frequency** (balance performance vs safety)
   - Default: Every move (safest, slight performance cost)
   - Option: Every 5 moves (faster, slight risk)

3. **Timer precision**
   - Standard: 1-second precision (best performance)
   - High: 100ms precision (more accurate, slight performance cost)

**Network Settings**:
1. **Use stable connection**
   - Prefer WiFi over cellular
   - Avoid public WiFi with restrictions

2. **Preload content**
   - Enable "Preload puzzles" in settings (future feature)
   - Downloads tomorrow's puzzles in advance

**Device Settings**:
1. **Close background apps**
   - Free up RAM
   - Reduce CPU usage

2. **Keep device charged**
   - Some devices throttle performance on low battery

3. **Update OS and browser**
   - Latest versions have performance improvements

---

### Troubleshooting Slow Performance

**Symptoms**: Lag when moving cells, slow puzzle loading, delayed input

**Quick Fixes**:
1. **Hard refresh**: Ctrl + Shift + R (Cmd + Shift + R on Mac)
2. **Close other tabs**: Free up browser resources
3. **Restart browser**: Clear temporary memory leaks

**Browser-Level Solutions**:
1. **Disable extensions**:
   - Ad blockers can cause lag
   - Privacy extensions may interfere
   - Try incognito mode to test

2. **Clear cache** (see above section)

3. **Update browser**:
   - Chrome: Settings → About Chrome
   - Firefox: Help → About Firefox
   - Auto-updates if available

4. **Enable hardware acceleration**:
   - Chrome: Settings → Advanced → System
   - Check "Use hardware acceleration when available"

5. **Increase browser memory limit** (advanced):
   - Chrome: chrome://flags → Search "renderer"
   - Increase renderer process limit

**System-Level Solutions**:
1. **Close background apps**:
   - Task Manager (Windows): Ctrl + Shift + Esc
   - Activity Monitor (Mac): Applications → Utilities
   - Close memory-heavy apps

2. **Free up disk space**:
   - At least 1GB free recommended
   - Delete temporary files

3. **Restart device**:
   - Clears memory leaks
   - Refreshes system resources

4. **Update device drivers** (Windows):
   - Graphics drivers especially important
   - Visit manufacturer website

**Network Solutions**:
1. **Check internet speed**:
   - Visit speedtest.net
   - Minimum: 5 Mbps recommended

2. **Switch networks**:
   - Try WiFi vs cellular
   - Test different WiFi networks

3. **Restart router**:
   - Unplug for 30 seconds
   - Plug back in

**Still Slow?**
- Try a different browser
- Test on a different device
- [Contact Support](#contact-support) with:
  - Browser and version
  - Device type and OS
  - Network speed test results

---

## Mobile & PWA

### Installing on Home Screen (iOS)

**Requirements**:
- iOS 12+ (recommended: iOS 15+)
- Safari browser (required for installation)
- Active internet connection

**Step-by-Step**:
1. Open **Safari** browser
2. Navigate to **thelondonsudoku.com**
3. Log in (optional, but recommended)
4. Tap **Share** button (square with arrow pointing up)
5. Scroll down in share menu
6. Tap **"Add to Home Screen"**
7. Edit name if desired (default: "The London Sudoku")
8. Tap **"Add"** (top-right)
9. Icon appears on home screen

**Using the PWA**:
1. Tap icon on home screen
2. App opens in full-screen mode (no browser UI)
3. Works like a native app
4. Push notifications enabled (future feature)

**Troubleshooting iOS PWA**:
- **Icon doesn't appear**: Check home screen pages (may be on another page)
- **Can't find "Add to Home Screen"**: Update iOS to latest version
- **App opens in Safari**: Delete and reinstall PWA
- **Offline doesn't work**: Ensure PWA was fully loaded before going offline

---

### Installing on Home Screen (Android)

**Requirements**:
- Android 5+ (recommended: Android 10+)
- Chrome or Samsung Internet browser
- Active internet connection

**Step-by-Step (Chrome)**:
1. Open **Chrome** browser
2. Navigate to **thelondonsudoku.com**
3. Log in (optional, but recommended)
4. Tap **Menu** (three dots, top-right)
5. Select **"Install app"** or **"Add to Home Screen"**
6. Confirm installation
7. Icon appears on home screen

**Step-by-Step (Samsung Internet)**:
1. Open **Samsung Internet** browser
2. Navigate to **thelondonsudoku.com**
3. Tap **Menu** (three lines, bottom-right)
4. Select **"Add page to"**
5. Tap **"Home screen"**
6. Confirm
7. Icon appears on home screen

**Using the PWA**:
1. Tap icon on home screen
2. App opens in full-screen mode
3. Works like a native app
4. Can be managed like any app

**Troubleshooting Android PWA**:
- **No "Install app" option**: Update Chrome to latest version
- **Installation fails**: Clear Chrome cache and retry
- **App opens in browser**: Uninstall and reinstall PWA
- **Offline features don't work**: Grant storage permissions in app settings

---

### Offline Capabilities

**What Works Offline?**:
- ✅ Complete already-loaded puzzles
- ✅ View cached statistics
- ✅ Access settings (cached)
- ✅ View achievements (cached)
- ✅ Navigate app pages (cached)

**What Requires Internet?**:
- ❌ Fetch new daily puzzles
- ❌ Submit completed puzzles
- ❌ Update leaderboards
- ❌ Sync progress across devices
- ❌ View friends' profiles
- ❌ Check league standings

**Offline Behavior**:
1. **Mid-Puzzle Offline**: Can continue playing, progress saved locally, syncs when reconnected
2. **Start Puzzle Offline**: Can only play cached puzzles (if any)
3. **Complete Puzzle Offline**: Saved locally, submitted automatically when reconnected

**Managing Offline Data**:
- **Cache size**: ~5-10MB (minimal storage)
- **Cache duration**: 24 hours (puzzles), 7 days (app shell)
- **Manual refresh**: Hard refresh clears cache
- **Auto-update**: Cache updates automatically when online

**Tips for Offline Use**:
1. Load puzzles while online (they cache automatically)
2. Complete cached puzzles offline
3. Reconnect to submit and sync progress
4. PWA has better offline support than browser

---

## Contact Support

### How to Report Bugs

**Before Reporting**:
1. ✅ Check this Help Center for solutions
2. ✅ Try the [Common Issues](#common-issues) fixes
3. ✅ Test in different browser/device (isolate the issue)

**Information to Include**:
1. **Clear description**: What happened vs what you expected
2. **Steps to reproduce**: How to recreate the bug
3. **Browser & version**: Chrome 120, Firefox 121, etc.
4. **Device & OS**: Windows 11, macOS Ventura, iPhone 14 (iOS 17)
5. **Screenshots**: Visual evidence (press PrtScn or Cmd+Shift+4)
6. **Console errors**: Press F12 → Console tab → screenshot errors
7. **Network errors**: Press F12 → Network tab → screenshot failed requests
8. **Date & time**: When did it happen? (include timezone)

**Where to Report**:
- **Email**: support@thelondonsudoku.com (replace with actual email)
- **Settings Page**: Settings → "Report Bug" form
- **GitHub Issues**: (if public repo available)

**What Happens Next**:
1. **Acknowledgment**: You'll receive confirmation email within 24 hours
2. **Investigation**: Support team investigates (1-3 days)
3. **Updates**: You'll be notified of progress
4. **Resolution**: Bug fixed in next update, or workaround provided

**Priority Levels**:
- 🔴 **Critical**: App completely broken, data loss → Fixed within 24-48 hours
- 🟡 **High**: Major feature broken, affects many users → Fixed within 1 week
- 🟢 **Medium**: Minor bug, workaround available → Fixed in next update
- 🔵 **Low**: Cosmetic issue, rare edge case → Fixed when possible

---

### Where to Give Feedback

**We love feedback!** Your input helps improve The London Sudoku.

**Feedback Channels**:
1. **Email**: feedback@thelondonsudoku.com
2. **Settings Page**: Settings → "Send Feedback" form
3. **Social Media**: (links to Twitter, Discord, etc.)
4. **Community Forum**: (if available)

**Types of Feedback**:
- 💡 **Feature Requests**: New features or improvements
- 🎨 **Design Feedback**: UI/UX suggestions
- 📝 **Content Feedback**: Puzzle quality, difficulty balance
- 🐛 **Bug Reports**: (use bug reporting process above)
- ⭐ **General Praise**: Tell us what you love!

**What to Include**:
- **Clear description**: What you'd like to see
- **Use case**: Why it would be helpful
- **Priority**: How important is it to you?
- **Examples**: Screenshots, mockups, or references from other apps

**Response Time**:
- **Acknowledgment**: Within 48-72 hours
- **Consideration**: All feedback reviewed monthly
- **Implementation**: Popular requests prioritized for future updates
- **Updates**: Major feature requests tracked in public roadmap (future)

---

### Community & Social

**Official Channels**:
- **Website**: https://thelondonsudoku.com
- **Twitter**: @LondonSudoku (replace with actual handle)
- **Discord**: (invite link if available)
- **Reddit**: r/TheLondonSudoku (replace with actual subreddit)

**Community Features**:
- **Discussion Forums**: Ask questions, share tips
- **Strategy Guides**: Community-contributed solving strategies
- **Leaderboard Discussions**: Celebrate top performers
- **Bug Reports**: Community-tracked issues
- **Feature Voting**: Vote on upcoming features

**Stay Updated**:
- **Newsletter**: Subscribe via settings for monthly updates
- **Release Notes**: Check website for new feature announcements
- **Social Media**: Follow for daily tips and updates

---

## 📚 Additional Resources

- **[FAQ](USER_FAQ.md)**: Comprehensive questions and answers
- **[Sudoku Strategies](SUDOKU_STRATEGIES.md)**: Learn solving techniques
- **[Quick Start Guide](QUICK_START.md)**: 5-minute intro for new players
- **[Keyboard Shortcuts](KEYBOARD_SHORTCUTS.md)**: Complete shortcut reference

---

**Still need help?** Don't hesitate to [contact support](#contact-support). We're here to help you enjoy The London Sudoku! 🧩✨
