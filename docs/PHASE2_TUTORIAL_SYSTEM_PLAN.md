# Phase 2: Tutorial System - Master Implementation Plan

**Start Date**: November 12, 2025
**Duration**: 3 weeks
**Status**: 🟡 **PLANNING**
**Priority**: 🟠 **HIGH**

---

## 🎯 Executive Summary

Building a comprehensive, interactive tutorial system with **20 lessons** covering basic to advanced Sudoku techniques. This addresses **USER CONCERN #3** (need lessons/tutorials) with a premium learning experience.

### Goals:
- ✅ 20 interactive lessons (6 beginner FREE, 8 intermediate mixed, 6 variant PREMIUM)
- ✅ Interactive practice puzzles with instant feedback
- ✅ Progress tracking and XP rewards
- ✅ Premium glassmorphism UI matching dashboard quality
- ✅ Mobile-responsive and accessible (WCAG 2.1 AA)

---

## 📚 Lesson Catalog (20 Total)

### **BEGINNER COURSE (FREE) - 6 Lessons**

| # | Title | Duration | Topics | Practice Puzzles |
|---|-------|----------|--------|------------------|
| 1 | Sudoku Basics | 10 min | Grid structure, rules, basic filling | 3 very easy |
| 2 | Naked Singles | 12 min | Definition, spotting, elimination | 4 easy |
| 3 | Hidden Singles | 15 min | Row/column/box scanning, differences | 4 easy |
| 4 | Scanning Techniques | 15 min | Row/column/box scanning, cross-hatching | 5 easy |
| 5 | Naked Pairs | 20 min | Two-cell patterns, elimination | 5 medium |
| 6 | Hidden Pairs | 20 min | Hidden patterns, advanced elimination | 5 medium |

**Total**: 92 minutes, 26 practice puzzles
**Completion Award**: "Beginner Master" (+100 XP)

### **INTERMEDIATE COURSE (3 FREE + 5 PREMIUM) - 8 Lessons**

| # | Title | Access | Duration | Topics |
|---|-------|--------|----------|--------|
| 7 | Naked Triples | FREE | 25 min | Three-cell patterns |
| 8 | Hidden Triples | FREE | 25 min | Advanced scanning |
| 9 | Box/Line Reduction | FREE | 20 min | Pointing pairs, intersections |
| 10 | X-Wing | PREMIUM 👑 | 30 min | Pattern recognition, intersections |
| 11 | Swordfish | PREMIUM 👑 | 30 min | Advanced 3x3 patterns |
| 12 | XY-Wing | PREMIUM 👑 | 35 min | Chain logic, pivot + pincers |
| 13 | XYZ-Wing | PREMIUM 👑 | 35 min | Three-cell chains |
| 14 | Simple Coloring | PREMIUM 👑 | 40 min | Candidate coloring |

**Total**: 240 minutes, 54 practice puzzles
**Completion Award**: "Intermediate Expert" (+200 XP)

### **VARIANT-SPECIFIC COURSES (6 Lessons - ALL PREMIUM)**

| # | Title | Duration | Variant | Topics |
|---|-------|----------|---------|--------|
| 15 | X-Sudoku Strategies | 25 min | X-Sudoku | Diagonal constraints |
| 16 | Killer Sudoku Mastery | 30 min | Killer | Cage sums, combinations |
| 17 | Anti-Knight Tactics | 25 min | Anti-Knight | Knight move constraints |
| 18 | Thermo Sudoku Techniques | 25 min | Thermo | Ascending order logic |
| 19 | Jigsaw Sudoku Strategies | 25 min | Jigsaw | Irregular regions |
| 20 | Advanced Combinations | 40 min | Mixed | Tournament strategies |

**Total**: 170 minutes, 41 practice puzzles
**Completion Award**: "Sudoku Sensei" (+500 XP) 🏆

---

## 🎓 Pedagogical Design

### Learning Principles:

1. **Scaffolding**: Build from basics (Lesson 1) to advanced (Lesson 20)
2. **Active Learning**: Interactive practice, not passive reading
3. **Immediate Feedback**: Highlight correct moves, explain mistakes
4. **Spaced Repetition**: Review earlier concepts in later lessons
5. **Gamification**: XP rewards, achievement badges, progress tracking

### Lesson Structure (5 Steps):

Each lesson follows this consistent format:

```
┌─────────────────────────────────────────┐
│ 1. INTRODUCTION (30 seconds)            │
│    - What you'll learn                  │
│    - Why it's important                 │
│    - Real-world example                 │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 2. CONCEPT EXPLANATION (2 minutes)      │
│    - Visual diagrams                    │
│    - Step-by-step breakdown             │
│    - Animated demonstrations            │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 3. INTERACTIVE PRACTICE (5 minutes)     │
│    - 3-5 practice puzzles               │
│    - Hint system available              │
│    - Immediate feedback on mistakes     │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 4. QUIZ (2 minutes)                     │
│    - 3 questions to test understanding  │
│    - Must score 2/3 to pass             │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 5. SUMMARY & NEXT STEPS (30 seconds)   │
│    - Key takeaways                      │
│    - Next lesson preview                │
│    - XP reward notification             │
└─────────────────────────────────────────┘
```

---

## 🗂️ Technical Architecture

### Folder Structure:

```
the-london-sudoku/
├── lessons/
│   ├── beginner/
│   │   ├── lesson-01-sudoku-basics.json
│   │   ├── lesson-02-naked-singles.json
│   │   ├── lesson-03-hidden-singles.json
│   │   ├── lesson-04-scanning-techniques.json
│   │   ├── lesson-05-naked-pairs.json
│   │   └── lesson-06-hidden-pairs.json
│   ├── intermediate/
│   │   ├── lesson-07-naked-triples.json
│   │   ├── lesson-08-hidden-triples.json
│   │   ├── lesson-09-box-line-reduction.json
│   │   ├── lesson-10-x-wing.json (PREMIUM)
│   │   ├── lesson-11-swordfish.json (PREMIUM)
│   │   ├── lesson-12-xy-wing.json (PREMIUM)
│   │   ├── lesson-13-xyz-wing.json (PREMIUM)
│   │   └── lesson-14-simple-coloring.json (PREMIUM)
│   └── variants/
│       ├── lesson-15-x-sudoku.json (PREMIUM)
│       ├── lesson-16-killer-sudoku.json (PREMIUM)
│       ├── lesson-17-anti-knight.json (PREMIUM)
│       ├── lesson-18-thermo-sudoku.json (PREMIUM)
│       ├── lesson-19-jigsaw-sudoku.json (PREMIUM)
│       └── lesson-20-advanced-combinations.json (PREMIUM)
├── js/
│   ├── lesson-engine.js (NEW)
│   ├── practice-validator.js (NEW)
│   └── lesson-progress.js (NEW)
├── css/
│   └── lessons.css (NEW)
├── lessons.html (NEW)
└── api/
    └── lessons.js (NEW)
```

### Lesson JSON Schema:

```json
{
  "id": "lesson-02-naked-singles",
  "number": 2,
  "title": "Naked Singles",
  "course": "beginner",
  "duration": 720,
  "premium": false,
  "xp_reward": 50,
  "prerequisites": ["lesson-01-sudoku-basics"],

  "steps": [
    {
      "type": "introduction",
      "title": "What You'll Learn",
      "content": "In this lesson, you'll learn to identify naked singles...",
      "duration": 30,
      "media": {
        "type": "image",
        "url": "/assets/lessons/naked-singles-intro.png"
      }
    },
    {
      "type": "explanation",
      "title": "Understanding Naked Singles",
      "content": "A naked single is a cell that can only contain...",
      "duration": 120,
      "diagrams": [
        {
          "grid": "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......",
          "highlights": [[0, 1]],
          "caption": "Cell R1C2 can only be 6"
        }
      ],
      "animations": [
        {
          "type": "elimination",
          "steps": [
            "Show row candidates",
            "Show column candidates",
            "Show box candidates",
            "Highlight only remaining value"
          ]
        }
      ]
    },
    {
      "type": "practice",
      "title": "Practice Time!",
      "puzzles": [
        {
          "id": "practice-ns-01",
          "difficulty": "easy",
          "grid": "4.....8.5.3..........7......2.....6.....8.4......1.......6.3.7.5..2.....1.4......",
          "target_cells": [[0, 1], [2, 4]],
          "hints": [
            "Look at row 1, column 2",
            "What digits are already in row 1?",
            "Only one digit fits!"
          ]
        }
      ],
      "success_message": "Great job! You found all the naked singles!",
      "failure_message": "Not quite. Let's try again with a hint."
    },
    {
      "type": "quiz",
      "title": "Test Your Knowledge",
      "questions": [
        {
          "question": "What is a naked single?",
          "options": [
            "A cell with only one possible value",
            "A cell with two possible values",
            "A hidden pattern",
            "A complex technique"
          ],
          "correct": 0,
          "explanation": "A naked single is a cell where only one digit fits."
        }
      ],
      "passing_score": 2
    },
    {
      "type": "summary",
      "title": "Lesson Complete!",
      "content": "You've learned to identify and use naked singles...",
      "key_takeaways": [
        "Naked singles have only one possible value",
        "Check row, column, and box to find them",
        "They're the most basic solving technique"
      ],
      "next_lesson": "lesson-03-hidden-singles",
      "xp_earned": 50
    }
  ],

  "achievements": [
    {
      "id": "lesson_02_complete",
      "name": "Naked Single Master",
      "description": "Complete Lesson 2: Naked Singles",
      "xp": 50
    }
  ]
}
```

---

## 🛠️ Implementation Plan

### Week 1: Foundation & Core Lessons (Nov 13-19)

**Day 1-2: Setup & Architecture**
- [ ] Create folder structure (`lessons/`, `js/`, `css/`)
- [ ] Build lesson engine (`lesson-engine.js`)
- [ ] Create lesson viewer page (`lessons.html`)
- [ ] Set up database schema for progress tracking
- [ ] Create API endpoint (`/api/lessons.js`)

**Day 3-4: Beginner Lessons (1-3)**
- [ ] Lesson 1: Sudoku Basics (JSON + practice puzzles)
- [ ] Lesson 2: Naked Singles (JSON + practice puzzles)
- [ ] Lesson 3: Hidden Singles (JSON + practice puzzles)
- [ ] Test progression system

**Day 5-7: Beginner Lessons (4-6) + Polish**
- [ ] Lesson 4: Scanning Techniques
- [ ] Lesson 5: Naked Pairs
- [ ] Lesson 6: Hidden Pairs
- [ ] Implement hint system
- [ ] Add animations and transitions
- [ ] Mobile responsiveness

**Deliverables**:
- ✅ Lesson engine functional
- ✅ 6 beginner lessons complete
- ✅ Progress tracking working
- ✅ XP rewards integrated

---

### Week 2: Intermediate & Premium Lessons (Nov 20-26)

**Day 1-3: Intermediate Lessons (7-11)**
- [ ] Lesson 7: Naked Triples (FREE)
- [ ] Lesson 8: Hidden Triples (FREE)
- [ ] Lesson 9: Box/Line Reduction (FREE)
- [ ] Lesson 10: X-Wing (PREMIUM)
- [ ] Lesson 11: Swordfish (PREMIUM)
- [ ] Implement premium access check

**Day 4-7: Intermediate Lessons (12-14)**
- [ ] Lesson 12: XY-Wing (PREMIUM)
- [ ] Lesson 13: XYZ-Wing (PREMIUM)
- [ ] Lesson 14: Simple Coloring (PREMIUM)
- [ ] Add intermediate course completion badge

**Deliverables**:
- ✅ 8 intermediate lessons complete
- ✅ Premium paywall working
- ✅ Complex techniques explained
- ✅ Intermediate course achievement

---

### Week 3: Variant Lessons & Polish (Nov 27-Dec 3)

**Day 1-3: Variant Lessons (15-18)**
- [ ] Lesson 15: X-Sudoku Strategies
- [ ] Lesson 16: Killer Sudoku Mastery
- [ ] Lesson 17: Anti-Knight Tactics
- [ ] Lesson 18: Thermo Sudoku Techniques

**Day 4-5: Final Lessons (19-20)**
- [ ] Lesson 19: Jigsaw Sudoku Strategies
- [ ] Lesson 20: Advanced Combinations
- [ ] "Sudoku Sensei" master achievement

**Day 6-7: Polish & Testing**
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Performance optimization
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] User acceptance testing

**Deliverables**:
- ✅ All 20 lessons complete
- ✅ Full course achievements
- ✅ Production-ready quality
- ✅ Comprehensive documentation

---

## 🗄️ Database Schema

### Lesson Progress Table:

```sql
CREATE TABLE lesson_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    lesson_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'not_started',
    current_step INTEGER DEFAULT 0,
    quiz_score INTEGER,
    practice_completed BOOLEAN DEFAULT FALSE,
    time_spent INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, lesson_id),
    CHECK (status IN ('not_started', 'in_progress', 'completed')),
    CHECK (quiz_score IS NULL OR (quiz_score >= 0 AND quiz_score <= 3))
);

CREATE INDEX idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);
CREATE INDEX idx_lesson_progress_completed ON lesson_progress(completed_at);
```

### Lesson Practice Attempts:

```sql
CREATE TABLE lesson_practice_attempts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    lesson_id VARCHAR(50) NOT NULL,
    puzzle_id VARCHAR(50) NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    success BOOLEAN DEFAULT FALSE,
    time_taken INTEGER,
    hints_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_practice_attempts_user ON lesson_practice_attempts(user_id);
CREATE INDEX idx_practice_attempts_lesson ON lesson_practice_attempts(lesson_id);
```

---

## 🎨 UI Design (Glassmorphism)

### Lesson Viewer Layout:

```
┌────────────────────────────────────────────┐
│  [🏠 Dashboard] [📚 Lessons] [🏆 Profile]  │ ← Navigation
├────────────────────────────────────────────┤
│  ┌──────────────────────────────────────┐  │
│  │  Lesson 2: Naked Singles      ⏱️ 12m │  │ ← Header
│  │  Progress: ████████░░░░░░░ 60%       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │  Step 2 of 5: Concept Explanation   │  │ ← Content
│  │                                       │  │
│  │  Understanding Naked Singles         │  │
│  │                                       │  │
│  │  A naked single is a cell that...   │  │
│  │                                       │  │
│  │  [Grid Diagram]                      │  │
│  │   4 . . . . . 8 . 5                 │  │
│  │   . 3 . . . . . . .                 │  │
│  │   ...                               │  │
│  │                                       │  │
│  │  [▶ Play Animation]                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [← Previous]              [Next Step →]   │ ← Navigation
└────────────────────────────────────────────┘
```

### CSS Variables (Consistent with Dashboard):

```css
/* lessons.css */
:root {
    --lesson-bg: rgba(255, 255, 255, 0.05);
    --lesson-border: rgba(255, 255, 255, 0.1);
    --lesson-glass-blur: blur(10px);
    --lesson-progress-fill: linear-gradient(90deg, #fbbf24, #fb923c);
    --lesson-success: #22c55e;
    --lesson-error: #ef4444;
    --lesson-hint: #60a5fa;
}

.lesson-viewer {
    max-width: 1000px;
    margin: 0 auto;
    padding: var(--space-6);
}

.lesson-content {
    background: var(--lesson-bg);
    border: 1px solid var(--lesson-border);
    border-radius: var(--radius-2xl);
    padding: var(--space-8);
    backdrop-filter: var(--lesson-glass-blur);
    -webkit-backdrop-filter: var(--lesson-glass-blur);
    box-shadow: var(--shadow-glass);
}

/* Touch-friendly buttons */
.lesson-navigation button {
    min-height: 44px;
    min-width: 120px;
    padding: var(--space-3) var(--space-6);
}
```

---

## 🚀 API Endpoints

### GET `/api/lessons`
**Purpose**: Fetch all lessons or filter by course

**Query Parameters**:
- `course` (optional): "beginner" | "intermediate" | "variants"
- `premium` (optional): true | false

**Response**:
```json
{
  "success": true,
  "lessons": [
    {
      "id": "lesson-02-naked-singles",
      "number": 2,
      "title": "Naked Singles",
      "course": "beginner",
      "duration": 720,
      "premium": false,
      "xp_reward": 50,
      "progress": {
        "status": "in_progress",
        "current_step": 2,
        "completion_percentage": 40
      }
    }
  ]
}
```

### GET `/api/lessons/:id`
**Purpose**: Fetch full lesson content

**Response**: Full lesson JSON (as defined in schema above)

### POST `/api/lessons/:id/progress`
**Purpose**: Update user progress

**Body**:
```json
{
  "current_step": 3,
  "quiz_score": 2,
  "practice_completed": true,
  "time_spent": 180
}
```

### POST `/api/lessons/:id/complete`
**Purpose**: Mark lesson as complete, award XP

**Response**:
```json
{
  "success": true,
  "xp_earned": 50,
  "achievement_unlocked": {
    "id": "lesson_02_complete",
    "name": "Naked Single Master"
  },
  "next_lesson": "lesson-03-hidden-singles"
}
```

---

## 📊 Success Metrics

### Phase 2 Goals:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Lessons Created | 20 | Count lesson JSON files |
| Completion Rate | 60%+ | Users completing ≥1 lesson |
| Average Lessons/User | 5+ | Avg lessons completed per user |
| Premium Conversion | 15%+ | Users accessing premium lessons |
| XP Distribution | 10K+ XP avg | Total XP earned from lessons |
| Mobile Accessibility | WCAG 2.1 AA | Lighthouse audit |
| Performance | 90+ | Lighthouse score |

---

## 🎯 Milestones

| Date | Milestone | Deliverables |
|------|-----------|--------------|
| **Nov 13** | Kickoff | Planning complete, structure created |
| **Nov 15** | Foundation | Lesson engine working, first 3 lessons |
| **Nov 19** | Week 1 Complete | 6 beginner lessons functional |
| **Nov 22** | Intermediate Progress | 8 intermediate lessons (3 free + 5 premium) |
| **Nov 26** | Week 2 Complete | All intermediate lessons done |
| **Nov 29** | Variant Lessons | 6 variant-specific lessons |
| **Dec 3** | Phase 2 Complete | All 20 lessons + polish + testing |

---

## 🔗 Integration Points

### With Existing Systems:

1. **XP System**: Award XP on lesson completion
2. **Achievements**: Unlock achievements for lesson milestones
3. **Battle Pass**: Lessons count toward battle pass XP
4. **Premium Subscriptions**: Gate premium lessons behind paywall
5. **Analytics**: Track lesson engagement with PostHog

---

## 🎓 Next Steps

### Immediate Actions (Today):

1. ✅ Create folder structure
2. ✅ Set up database schema (migration file)
3. ✅ Build basic lesson engine skeleton
4. ✅ Create lesson-01-sudoku-basics.json
5. ✅ Implement lesson viewer HTML

**Estimated Time**: 4-6 hours

---

**Status**: Ready to begin implementation
**Next**: Create folder structure and database migration
