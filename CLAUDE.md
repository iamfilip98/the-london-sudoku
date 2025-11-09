# Development Guidelines for Claude

⚠️ **DO NOT REMOVE THE CRITICAL RULES SECTION** ⚠️
This section contains essential workflow rules. Add new rules, but never delete existing ones without explicit user approval.

## Critical Rules
1. **README is Source of Truth**: Every code change MUST be reflected in README.md
2. **Update README with Every Change**: Algorithm, scoring, features, API - document everything
3. **No Hardcoding**: All puzzles come from pre-generated database, zero fallbacks
4. **Gameplay-Driven Validation**: Validation must match actual gameplay experience
5. **Pre-Generation Pattern**: Never generate puzzles on-demand for users
6. **Professional Git Workflow**: Follow branch-based development workflow (see Git Workflow section below)
7. **Efficient Testing**: For complex features, use Playwright tests. For simple CSS/visual fixes, verify with grep/manual inspection. If server/test setup fails once, STOP - don't debug infrastructure, just verify the code fix is correct and commit
8. **Root Cause Analysis**: Always seek the root cause of issues - don't just fix symptoms
9. **Rule Protection**: Never remove or modify existing Critical Rules without explicit user approval - only add new ones
10. **Token Efficiency**: Don't waste tokens debugging test infrastructure. If automated testing fails, fall back to code inspection and move on
11. **Automatic PR Creation**: After each meaningful change, automatically create a PR with a clear, descriptive message. Use curl with GitHub API directly (token in .github-token file). Never wait for user to create PRs
12. **Full Autonomy**: You must solve ALL issues yourself without user help. If you need access, tokens, or permissions, explicitly ask for them. Never give up or ask user to do manual work
13. **Ultrathinking for Solutions**: When facing any issue or blocker, think deeply about alternative approaches. Try multiple solutions, research documentation, analyze error messages thoroughly. Persistence is required

## Git Workflow - Professional Branch Strategy

This project follows a professional multi-person development workflow. **NEVER push directly to `main`**.

### Branch Structure
- **`main`**: Production-ready code only. Protected branch.
- **`develop`**: Integration branch for features. All feature branches merge here first.
- **`feat/*`**: Feature branches (e.g., `feat/performance-optimization`)
- **`fix/*`**: Bug fix branches (e.g., `fix/authentication-bug`)
- **`chore/*`**: Maintenance branches (e.g., `chore/code-cleanup`)
- **`docs/*`**: Documentation branches (e.g., `docs/phase5-readme-update`)

### Workflow Process
1. **Create Feature Branch**: Branch from `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

2. **Develop & Test**: Make changes, commit frequently with meaningful messages
   ```bash
   git add .
   git commit -m "feat: add feature description"
   ```

3. **Push & Create PR**: Push to remote and create Pull Request to `develop`
   ```bash
   git push -u origin feat/your-feature-name
   gh pr create --base develop --title "Feature: Description" --body "Details..."
   ```

4. **Merge to Develop**: After review/testing, merge PR to `develop`
   ```bash
   gh pr merge --merge
   ```

5. **Merge to Main**: Periodically merge `develop` to `main` for production releases
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

### Commit Message Convention
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `docs:` - Documentation updates
- `test:` - Test additions/modifications
- `perf:` - Performance improvements

### Testing Requirements
- All changes must be tested before creating PR
- Use appropriate testing method (Playwright, manual, code inspection)
- Document test results in PR description

### Automated PR Creation
Claude MUST create PRs automatically after meaningful changes. Use this exact method:

```bash
# Method: Direct GitHub API call with curl
GITHUB_TOKEN=$(cat /home/user/the-london-sudoku/.github-token) && curl -X POST \
  -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  "https://api.github.com/repos/iamfilip98/the-london-sudoku/pulls" \
  -d '{
    "title": "feat: Your Feature Title",
    "head": "your-branch-name",
    "base": "main",
    "body": "## Summary\n- Changes made\n\n## Impact\nDescription"
  }'
```

**Why this method:**
- Git remote uses local proxy (127.0.0.1:17187) which breaks node scripts
- Direct curl to api.github.com bypasses proxy issues
- Token stored in .github-token file (already configured)
- Works reliably in this environment

**When to create PRs:**
- After implementing a feature
- After fixing a bug
- After meaningful refactoring
- After documentation updates
- When work on current branch is complete and ready for review

## Clue Counts - Single Source of Truth

These values are FINAL and should NEVER be changed without explicit user approval:

```javascript
const CLUE_COUNTS = {
  easy: 42,    // 39 empty cells - PERFECT, do not change
  medium: 28,  // 53 empty cells - requires candidates, forces thinking
  hard: 25     // 56 empty cells - challenging but fair (adjusted from 24)
};
```

## Gameplay Requirements (Never Compromise)

### Easy Difficulty
**Goal**: "Playable without candidates, challenging but smooth"

**MUST**:
- Be solvable WITHOUT candidate tracking
- Have smooth progression (1-3 obvious moves always available)
- Have 15+ naked singles throughout the solve
- Have 0-2 hidden techniques (adds slight challenge)
- Have 0 bottlenecks (smooth flow)

### Medium Difficulty
**Goal**: "Requires candidates, forces thinking, smooth but not trivial"

**MUST**:
- REQUIRE candidate tracking to solve
- Have moderate candidate density early (avg 2.5-3.3 candidates per cell in first 20 moves)
- Have decent naked singles early (6-15 in first 20 moves - progress without being easy)
- Have 2-4 immediate naked singles at any point (consistent options)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Requires candidates but provides smooth progression
- Forces thinking without getting stuck
- Clear separation from Easy (requires candidates) and Hard (harder metrics)

### Hard Difficulty
**Goal**: "Requires heavy candidate work, significantly harder than Medium"

**MUST**:
- REQUIRE candidate tracking to solve
- Have HIGH candidate density early (avg 3.4-5.0 candidates per cell in first 20 moves)
- Have VERY FEW naked singles early (max 5 in first 20 moves - forces candidate work)
- Have limited total naked singles (max 12 total - requires more thinking)
- Hidden techniques are informational only (not used for validation)
- Bottlenecks are informational only (natural variation expected)

**VALIDATION ENSURES**:
- Day-to-day consistency in difficulty
- Significantly harder than Medium (3.4+ candidates vs 3.3 max)
- Forces heavy candidate work (max 5 naked singles vs min 6 for Medium)
- Challenging but fair (playable within 7-minute target)
- Clear separation: Hard always has higher candidate density AND fewer naked singles

## Pre-Generation System

### Architecture
**OLD**: Generate puzzles on-demand when user requests (causes timeouts)
**NEW**: Generate puzzles at 11 PM daily for NEXT day (allows strict quality control)

### Flow
1. **11:00 PM**: Scheduled job starts
2. **11:00-11:10 PM**: Generate and validate 100-200 candidates per difficulty
3. **11:10 PM**: Select best puzzles, store in database
4. **12:00 AM**: New puzzles available to players instantly

## Target Solve Times

```javascript
const targetTimes = {
  easy: 210,    // 3:30
  medium: 180,  // 3:00
  hard: 420     // 7:00
};
```

## Success Criteria

- ✅ Puzzles pre-generated at 11 PM daily
- ✅ Zero hardcoded puzzles
- ✅ Zero dead code
- ✅ Validation matches gameplay experience
- ✅ Users get instant load times
- ✅ README is 100% accurate
- ✅ Easy: Playable without candidates (comprehensive validation)
- ✅ Medium: Requires candidates and thinking (comprehensive validation)
- ✅ Hard: Challenging but fair (comprehensive validation)
- ✅ All clue counts match targets (42/28/25)
- ✅ Day-to-day consistency guaranteed across all difficulties
