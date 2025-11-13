/**
 * Lesson List - Display available lessons with progress
 * Phase 2: Tutorial System
 */

// Lesson catalog (static data matching lesson JSON files)
const LESSON_CATALOG = [
    // Beginner Course (FREE)
    { id: 'lesson-01-sudoku-basics', number: 1, title: 'Sudoku Basics', course: 'beginner', duration: 10, xp: 25, premium: false, description: 'Learn the fundamental rules of Sudoku and how to play the game' },
    { id: 'lesson-02-naked-singles', number: 2, title: 'Naked Singles', course: 'beginner', duration: 12, xp: 50, premium: false, description: 'Master the most basic solving technique - spotting cells with only one possible value' },
    { id: 'lesson-03-hidden-singles', number: 3, title: 'Hidden Singles', course: 'beginner', duration: 15, xp: 50, premium: false, description: 'Learn to find digits that can only go in one cell within a unit' },
    { id: 'lesson-04-scanning-techniques', number: 4, title: 'Scanning Techniques', course: 'beginner', duration: 15, xp: 50, premium: false, description: 'Master row, column, and box scanning with cross-hatching' },
    { id: 'lesson-05-naked-pairs', number: 5, title: 'Naked Pairs', course: 'beginner', duration: 20, xp: 75, premium: false, description: 'Identify two cells with the same two candidates and eliminate them from other cells' },
    { id: 'lesson-06-hidden-pairs', number: 6, title: 'Hidden Pairs', course: 'beginner', duration: 20, xp: 75, premium: false, description: 'Find two digits confined to the same two cells and use them to solve puzzles' },

    // Intermediate Course (3 FREE + 5 PREMIUM)
    { id: 'lesson-07-naked-triples', number: 7, title: 'Naked Triples', course: 'intermediate', duration: 25, xp: 100, premium: false, description: 'Three cells with the same three candidates - take your solving to the next level' },
    { id: 'lesson-08-hidden-triples', number: 8, title: 'Hidden Triples', course: 'intermediate', duration: 25, xp: 100, premium: false, description: 'Three digits confined to three cells - advanced pattern recognition' },
    { id: 'lesson-09-box-line-reduction', number: 9, title: 'Box/Line Reduction', course: 'intermediate', duration: 20, xp: 100, premium: false, description: 'Use pointing pairs and box/line intersections to eliminate candidates' },
    { id: 'lesson-10-x-wing', number: 10, title: 'X-Wing', course: 'intermediate', duration: 30, xp: 150, premium: true, description: 'Master this powerful pattern recognition technique for difficult puzzles' },
    { id: 'lesson-11-swordfish', number: 11, title: 'Swordfish', course: 'intermediate', duration: 30, xp: 150, premium: true, description: 'Advanced 3x3 pattern - when X-Wing is not enough' },
    { id: 'lesson-12-xy-wing', number: 12, title: 'XY-Wing', course: 'intermediate', duration: 35, xp: 150, premium: true, description: 'Chain logic introduction - pivot cell and pincers' },
    { id: 'lesson-13-xyz-wing', number: 13, title: 'XYZ-Wing', course: 'intermediate', duration: 35, xp: 150, premium: true, description: 'Three-cell chains for advanced elimination' },
    { id: 'lesson-14-simple-coloring', number: 14, title: 'Simple Coloring', course: 'intermediate', duration: 40, xp: 200, premium: true, description: 'Candidate coloring technique for complex puzzles' },

    // Variant Courses (ALL PREMIUM)
    { id: 'lesson-15-x-sudoku', number: 15, title: 'X-Sudoku Strategies', course: 'variants', duration: 25, xp: 150, premium: true, description: 'Master diagonal constraints and modified techniques for X-Sudoku' },
    { id: 'lesson-16-killer-sudoku', number: 16, title: 'Killer Sudoku Mastery', course: 'variants', duration: 30, xp: 150, premium: true, description: 'Cage sum logic, combination tables, and cage interaction' },
    { id: 'lesson-17-anti-knight', number: 17, title: 'Anti-Knight Tactics', course: 'variants', duration: 25, xp: 150, premium: true, description: 'Knight move constraints and pattern avoidance techniques' },
    { id: 'lesson-18-thermo-sudoku', number: 18, title: 'Thermo Sudoku Techniques', course: 'variants', duration: 25, xp: 150, premium: true, description: 'Thermometer constraints and ascending order logic' },
    { id: 'lesson-19-jigsaw-sudoku', number: 19, title: 'Jigsaw Sudoku Strategies', course: 'variants', duration: 25, xp: 150, premium: true, description: 'Irregular regions and advanced region navigation' },
    { id: 'lesson-20-advanced-combinations', number: 20, title: 'Advanced Combinations', course: 'variants', duration: 40, xp: 200, premium: true, description: 'Mixing techniques and tournament-level strategies' }
];

class LessonListManager {
    constructor() {
        this.lessons = LESSON_CATALOG;
        this.userProgress = {};
        this.isPremium = false;
        this.init();
    }

    async init() {
        // Get user premium status
        this.isPremium = sessionStorage.getItem('userPremium') === 'true';

        // Load user progress
        await this.loadUserProgress();

        // Render lessons
        this.renderLessons();

        // Update stats
        this.updateStats();

        // Track lessons page view (PHASE 2: PostHog Analytics)
        if (window.posthog) {
            const completedCount = Object.values(this.userProgress).filter(p => p.status === 'completed').length;
            window.posthog.capture('lessons_page_viewed', {
                total_lessons: this.lessons.length,
                completed_lessons: completedCount,
                is_premium: this.isPremium
            });
        }
    }

    async loadUserProgress() {
        try {
            const response = await fetch('/api/stats?type=lesson-progress');
            if (response.ok) {
                const progress = await response.json();
                // Convert array to object for easy lookup
                this.userProgress = progress.reduce((acc, p) => {
                    acc[p.lesson_id] = p;
                    return acc;
                }, {});
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            // Continue without progress data
        }
    }

    renderLessons() {
        const grid = document.getElementById('lessonsGrid');
        if (!grid) return;

        grid.innerHTML = this.lessons.map(lesson => this.createLessonCard(lesson)).join('');
    }

    createLessonCard(lesson) {
        const progress = this.userProgress[lesson.id] || {};
        const isCompleted = progress.status === 'completed';
        const isInProgress = progress.status === 'in_progress';
        const isLocked = lesson.premium && !this.isPremium;

        const completionPercent = progress.current_step && progress.total_steps
            ? Math.floor((progress.current_step / progress.total_steps) * 100)
            : 0;

        return `
            <div class="lesson-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}"
                 data-course="${lesson.course}"
                 onclick="${isLocked ? 'this.blur()' : `window.location.href='lesson-viewer.html?lesson=${lesson.id}'`}">

                <div class="lesson-card-header">
                    <div class="lesson-number">
                        ${isCompleted ? '<i class="fas fa-check"></i>' : lesson.number}
                    </div>
                    <div class="lesson-card-meta">
                        <span class="lesson-course-badge">${this.formatCourseName(lesson.course)}</span>
                        <h3 class="lesson-title">${lesson.title}</h3>
                    </div>
                </div>

                <p class="lesson-description">${lesson.description}</p>

                <div class="lesson-card-footer">
                    <div class="lesson-stats">
                        <div class="lesson-stat">
                            <i class="far fa-clock"></i>
                            <span>${lesson.duration} min</span>
                        </div>
                        <div class="lesson-stat">
                            <i class="fas fa-bolt"></i>
                            <span>${lesson.xp} XP</span>
                        </div>
                    </div>

                    <div class="lesson-action">
                        ${lesson.premium ? '<span class="premium-badge"><i class="fas fa-crown"></i> Premium</span>' : ''}
                        ${isCompleted ? '<i class="fas fa-check-circle" style="color: var(--accent-green); font-size: 1.5rem;"></i>' : ''}
                        ${isInProgress ? `<span style="color: var(--accent-blue); font-size: 0.875rem;">${completionPercent}%</span>` : ''}
                        ${isLocked ? '<i class="fas fa-lock" style="color: var(--text-muted);"></i>' : ''}
                    </div>
                </div>

                ${isInProgress && completionPercent > 0 ? `
                    <div class="lesson-progress-mini" style="
                        height: 4px;
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 2px;
                        overflow: hidden;
                        margin-top: var(--space-3);
                    ">
                        <div style="
                            width: ${completionPercent}%;
                            height: 100%;
                            background: linear-gradient(90deg, var(--accent-blue), var(--accent-purple));
                            transition: width 0.3s ease-out;
                        "></div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    formatCourseName(course) {
        const names = {
            'beginner': 'Beginner',
            'intermediate': 'Intermediate',
            'variants': 'Variant'
        };
        return names[course] || course;
    }

    updateStats() {
        const completedLessons = Object.values(this.userProgress).filter(p => p.status === 'completed').length;
        const totalXP = this.lessons.reduce((sum, lesson) => {
            const progress = this.userProgress[lesson.id];
            return sum + (progress?.status === 'completed' ? lesson.xp : 0);
        }, 0);
        const completionPercent = Math.floor((completedLessons / this.lessons.length) * 100);

        // Update display
        const elements = {
            completedLessons: document.getElementById('completedLessons'),
            totalXP: document.getElementById('totalXP'),
            completionPercent: document.getElementById('completionPercent')
        };

        if (elements.completedLessons) {
            elements.completedLessons.textContent = completedLessons;
        }
        if (elements.totalXP) {
            elements.totalXP.textContent = totalXP.toLocaleString();
        }
        if (elements.completionPercent) {
            elements.completionPercent.textContent = `${completionPercent}%`;
        }
    }
}

// Initialize when DOM is ready
let lessonListManager;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lessonListManager = new LessonListManager();
    });
} else {
    lessonListManager = new LessonListManager();
}
