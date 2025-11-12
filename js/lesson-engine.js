/**
 * Lesson Engine - Interactive Tutorial System
 * Handles lesson loading, navigation, practice, and progress tracking
 * Phase 2: Tutorial System
 */

class LessonEngine {
    constructor() {
        this.currentLesson = null;
        this.currentStep = 0;
        this.lessonProgress = {};
        this.practiceAttempts = [];
        this.quizAnswers = [];
        this.startTime = null;
        this.hintsUsed = 0;

        // DOM elements (will be initialized when page loads)
        this.lessonContainer = null;
        this.progressBar = null;
        this.navigationButtons = null;

        // User data
        this.userId = null;
        this.isPremium = false;

        this.init();
    }

    /**
     * Initialize the lesson engine
     */
    async init() {
        console.log('Lesson Engine: Initializing...');

        // Get user info from session
        this.userId = sessionStorage.getItem('clerk_user_id') || sessionStorage.getItem('currentPlayer');
        this.isPremium = sessionStorage.getItem('userPremium') === 'true';

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupDOM());
        } else {
            this.setupDOM();
        }
    }

    /**
     * Set up DOM elements and event listeners
     */
    setupDOM() {
        this.lessonContainer = document.getElementById('lessonContainer');
        this.progressBar = document.getElementById('lessonProgressBar');

        // Set up navigation button listeners
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep());
        }

        // Check if we should load a lesson from URL
        const urlParams = new URLSearchParams(window.location.search);
        const lessonId = urlParams.get('lesson');

        if (lessonId) {
            this.loadLesson(lessonId);
        }

        console.log('Lesson Engine: Initialized successfully');
    }

    /**
     * Load a lesson by ID
     * @param {string} lessonId - Lesson identifier (e.g., 'lesson-01-sudoku-basics')
     */
    async loadLesson(lessonId) {
        try {
            console.log(`Loading lesson: ${lessonId}`);

            // Show loading state
            this.showLoadingState();

            // Fetch lesson content
            const response = await fetch(`/api/lessons/${lessonId}`);

            if (!response.ok) {
                throw new Error(`Failed to load lesson: ${response.status}`);
            }

            const lesson = await response.json();

            // Check premium access
            if (lesson.premium && !this.isPremium) {
                this.showPremiumWall(lesson);
                return;
            }

            // Load user progress
            await this.loadProgress(lessonId);

            // Set current lesson
            this.currentLesson = lesson;
            this.currentStep = this.lessonProgress.current_step || 0;
            this.startTime = Date.now();

            // Render the lesson
            this.renderLesson();

            console.log(`Lesson loaded: ${lesson.title}`);

        } catch (error) {
            console.error('Error loading lesson:', error);
            this.showError('Failed to load lesson. Please try again.');
        }
    }

    /**
     * Load user progress for a lesson
     * @param {string} lessonId - Lesson identifier
     */
    async loadProgress(lessonId) {
        try {
            const response = await fetch(`/api/lessons/${lessonId}/progress`);

            if (response.ok) {
                this.lessonProgress = await response.json();
            } else {
                // No progress yet - start fresh
                this.lessonProgress = {
                    status: 'not_started',
                    current_step: 0,
                    quiz_score: null,
                    practice_completed: false,
                    time_spent: 0,
                    hints_used: 0
                };
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            // Continue with empty progress
            this.lessonProgress = {
                status: 'not_started',
                current_step: 0
            };
        }
    }

    /**
     * Render the current lesson
     */
    renderLesson() {
        if (!this.currentLesson) return;

        // Update lesson header
        this.updateHeader();

        // Update progress bar
        this.updateProgressBar();

        // Render current step
        this.renderStep(this.currentStep);

        // Update navigation buttons
        this.updateNavigation();
    }

    /**
     * Update lesson header
     */
    updateHeader() {
        const header = document.getElementById('lessonHeader');
        if (!header) return;

        const { number, title, duration, course } = this.currentLesson;
        const durationMin = Math.floor(duration / 60);

        header.innerHTML = `
            <div class="lesson-meta">
                <span class="lesson-course">${this.formatCourseName(course)}</span>
                <span class="lesson-separator">•</span>
                <span class="lesson-number">Lesson ${number}</span>
                ${this.currentLesson.premium ? '<span class="premium-badge">👑 Premium</span>' : ''}
            </div>
            <h1 class="lesson-title">${title}</h1>
            <div class="lesson-info">
                <span class="lesson-duration">
                    <i class="far fa-clock"></i> ${durationMin} minutes
                </span>
                <span class="lesson-xp">
                    <i class="fas fa-bolt"></i> ${this.currentLesson.xp_reward} XP
                </span>
            </div>
        `;
    }

    /**
     * Update progress bar
     */
    updateProgressBar() {
        if (!this.progressBar) return;

        const totalSteps = this.currentLesson.steps.length;
        const progress = ((this.currentStep + 1) / totalSteps) * 100;

        const fill = this.progressBar.querySelector('.progress-fill');
        const text = this.progressBar.querySelector('.progress-text');

        if (fill) {
            fill.style.width = `${progress}%`;
        }

        if (text) {
            text.textContent = `Step ${this.currentStep + 1} of ${totalSteps}`;
        }
    }

    /**
     * Render a specific step
     * @param {number} stepIndex - Step index to render
     */
    renderStep(stepIndex) {
        if (!this.lessonContainer) return;

        const step = this.currentLesson.steps[stepIndex];
        if (!step) return;

        // Render based on step type
        switch (step.type) {
            case 'introduction':
                this.renderIntroduction(step);
                break;
            case 'explanation':
                this.renderExplanation(step);
                break;
            case 'practice':
                this.renderPractice(step);
                break;
            case 'quiz':
                this.renderQuiz(step);
                break;
            case 'summary':
                this.renderSummary(step);
                break;
            default:
                console.warn(`Unknown step type: ${step.type}`);
        }

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Render introduction step
     */
    renderIntroduction(step) {
        this.lessonContainer.innerHTML = `
            <div class="lesson-step lesson-introduction">
                <h2 class="step-title">${step.title}</h2>
                <div class="step-content">
                    ${this.formatContent(step.content)}
                </div>
                ${step.media ? this.renderMedia(step.media) : ''}
            </div>
        `;
    }

    /**
     * Render explanation step
     */
    renderExplanation(step) {
        let html = `
            <div class="lesson-step lesson-explanation">
                <h2 class="step-title">${step.title}</h2>
                <div class="step-content">
                    ${this.formatContent(step.content)}
                </div>
        `;

        // Render diagrams if present
        if (step.diagrams && step.diagrams.length > 0) {
            html += '<div class="diagrams-container">';
            step.diagrams.forEach((diagram, index) => {
                html += this.renderDiagram(diagram, index);
            });
            html += '</div>';
        }

        // Render key points if present
        if (step.key_points && step.key_points.length > 0) {
            html += `
                <div class="key-points">
                    <h3><i class="fas fa-key"></i> Key Points</h3>
                    <ul>
                        ${step.key_points.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                </div>
            `;
        }

        html += '</div>';
        this.lessonContainer.innerHTML = html;
    }

    /**
     * Render practice step
     */
    renderPractice(step) {
        const puzzles = step.puzzles || [];
        const currentPuzzleIndex = this.practiceAttempts.length;

        if (currentPuzzleIndex >= puzzles.length) {
            // All puzzles completed
            this.showPracticeComplete(step);
            return;
        }

        const puzzle = puzzles[currentPuzzleIndex];

        this.lessonContainer.innerHTML = `
            <div class="lesson-step lesson-practice">
                <h2 class="step-title">${step.title}</h2>
                <div class="step-content">
                    ${this.formatContent(step.content)}
                </div>

                <div class="practice-puzzle">
                    <div class="puzzle-header">
                        <h3>${puzzle.title}</h3>
                        <span class="puzzle-number">Puzzle ${currentPuzzleIndex + 1} of ${puzzles.length}</span>
                    </div>

                    <div class="puzzle-grid-container">
                        <canvas id="practiceSudokuGrid" width="450" height="450"></canvas>
                    </div>

                    <div class="puzzle-controls">
                        <button class="hint-btn" onclick="lessonEngine.showHint('${puzzle.id}')">
                            <i class="fas fa-lightbulb"></i> Hint
                        </button>
                        <button class="check-btn" onclick="lessonEngine.checkPractice('${puzzle.id}')">
                            <i class="fas fa-check"></i> Check Answer
                        </button>
                    </div>

                    <div id="hintDisplay" class="hint-display" style="display: none;"></div>
                    <div id="feedbackDisplay" class="feedback-display" style="display: none;"></div>
                </div>
            </div>
        `;

        // Initialize puzzle grid
        setTimeout(() => this.initializePracticeGrid(puzzle), 100);
    }

    /**
     * Render quiz step
     */
    renderQuiz(step) {
        const questions = step.questions || [];

        this.lessonContainer.innerHTML = `
            <div class="lesson-step lesson-quiz">
                <h2 class="step-title">${step.title}</h2>
                <div class="step-content">
                    ${this.formatContent(step.content)}
                </div>

                <div class="quiz-container">
                    ${questions.map((q, index) => this.renderQuizQuestion(q, index)).join('')}
                </div>

                <div class="quiz-submit">
                    <button class="btn-primary" onclick="lessonEngine.submitQuiz()">
                        <i class="fas fa-paper-plane"></i> Submit Quiz
                    </button>
                </div>

                <div id="quizResults" class="quiz-results" style="display: none;"></div>
            </div>
        `;
    }

    /**
     * Render quiz question
     */
    renderQuizQuestion(question, index) {
        const { id, question: text, options, type } = question;

        return `
            <div class="quiz-question" data-question-id="${id}">
                <h3 class="question-text">
                    <span class="question-number">${index + 1}.</span>
                    ${text}
                </h3>
                <div class="question-options">
                    ${options.map((option, i) => `
                        <label class="option-label">
                            <input
                                type="radio"
                                name="question-${index}"
                                value="${i}"
                                data-question-id="${id}"
                            >
                            <span class="option-text">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render summary step
     */
    renderSummary(step) {
        const { title, content, key_takeaways, next_lesson, rewards } = step;

        this.lessonContainer.innerHTML = `
            <div class="lesson-step lesson-summary">
                <div class="summary-header">
                    <div class="completion-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <h2 class="step-title">${title}</h2>
                </div>

                <div class="step-content">
                    ${this.formatContent(content)}
                </div>

                ${key_takeaways ? `
                    <div class="key-takeaways">
                        <h3><i class="fas fa-list-check"></i> What You Learned</h3>
                        <ul>
                            ${key_takeaways.map(point => `<li>${point}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${rewards ? `
                    <div class="rewards-earned">
                        <h3><i class="fas fa-gift"></i> Rewards Earned</h3>
                        <div class="rewards-grid">
                            <div class="reward-card xp-reward">
                                <i class="fas fa-bolt"></i>
                                <span class="reward-value">+${rewards.xp} XP</span>
                                <span class="reward-label">Experience Points</span>
                            </div>
                            ${rewards.achievement ? `
                                <div class="reward-card achievement-reward">
                                    <i class="fas fa-${rewards.achievement.icon}"></i>
                                    <span class="reward-value">${rewards.achievement.name}</span>
                                    <span class="reward-label">Achievement Unlocked</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}

                ${next_lesson ? `
                    <div class="next-lesson">
                        <h3><i class="fas fa-arrow-right"></i> What's Next</h3>
                        <p>${next_lesson.teaser}</p>
                        <button class="btn-primary" onclick="lessonEngine.loadLesson('${next_lesson.id}')">
                            Start ${next_lesson.title} →
                        </button>
                    </div>
                ` : `
                    <div class="course-complete">
                        <button class="btn-primary" onclick="window.location.href='lessons.html'">
                            <i class="fas fa-list"></i> Back to Lesson List
                        </button>
                    </div>
                `}
            </div>
        `;

        // Mark lesson as complete
        this.markLessonComplete();
    }

    /**
     * Navigate to previous step
     */
    previousStep() {
        if (this.currentStep > 0) {
            this.currentStep--;
            this.renderLesson();
            this.saveProgress();
        }
    }

    /**
     * Navigate to next step
     */
    async nextStep() {
        const totalSteps = this.currentLesson.steps.length;

        if (this.currentStep < totalSteps - 1) {
            const currentStepData = this.currentLesson.steps[this.currentStep];

            // Validate step completion before advancing
            if (!await this.validateStepCompletion(currentStepData)) {
                return;
            }

            this.currentStep++;
            this.renderLesson();
            this.saveProgress();
        }
    }

    /**
     * Validate if current step is complete
     */
    async validateStepCompletion(step) {
        // Introduction and explanation steps can always advance
        if (step.type === 'introduction' || step.type === 'explanation') {
            return true;
        }

        // Practice step requires puzzle completion
        if (step.type === 'practice') {
            const puzzles = step.puzzles || [];
            const requiredPuzzles = step.success_criteria?.min_puzzles || puzzles.length;

            if (this.practiceAttempts.length < requiredPuzzles) {
                alert(`Please complete at least ${requiredPuzzles} practice puzzle(s) before continuing.`);
                return false;
            }
            return true;
        }

        // Quiz step requires passing score
        if (step.type === 'quiz') {
            const questions = step.questions || [];
            const passingScore = step.passing_score || Math.ceil(questions.length * 0.67);

            if (this.quizAnswers.length < questions.length) {
                alert('Please answer all quiz questions before continuing.');
                return false;
            }

            const score = this.calculateQuizScore();
            if (score < passingScore) {
                alert(`You need a score of ${passingScore}/${questions.length} to pass. Please review and try again.`);
                return false;
            }
            return true;
        }

        return true;
    }

    /**
     * Update navigation button states
     */
    updateNavigation() {
        const prevBtn = document.getElementById('prevStepBtn');
        const nextBtn = document.getElementById('nextStepBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
            prevBtn.style.opacity = this.currentStep === 0 ? '0.5' : '1';
        }

        if (nextBtn) {
            const totalSteps = this.currentLesson.steps.length;
            const isLastStep = this.currentStep === totalSteps - 1;

            nextBtn.textContent = isLastStep ? 'Complete Lesson ✓' : 'Next Step →';
            nextBtn.style.opacity = '1';
        }
    }

    /**
     * Save progress to backend
     */
    async saveProgress() {
        if (!this.userId || !this.currentLesson) return;

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        const progressData = {
            lesson_id: this.currentLesson.id,
            current_step: this.currentStep,
            total_steps: this.currentLesson.steps.length,
            time_spent: timeSpent,
            hints_used: this.hintsUsed,
            status: this.currentStep === this.currentLesson.steps.length - 1 ? 'completed' : 'in_progress'
        };

        try {
            await fetch(`/api/lessons/${this.currentLesson.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(progressData)
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    /**
     * Mark lesson as complete and award XP
     */
    async markLessonComplete() {
        if (!this.userId || !this.currentLesson) return;

        try {
            const response = await fetch(`/api/lessons/${this.currentLesson.id}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Lesson completed:', result);

                // Show achievement notification if earned
                if (result.achievement_unlocked) {
                    this.showAchievementNotification(result.achievement_unlocked);
                }
            }
        } catch (error) {
            console.error('Error marking lesson complete:', error);
        }
    }

    /**
     * Format content with markdown-style formatting
     */
    formatContent(content) {
        if (!content) return '';

        // Convert markdown-style formatting to HTML
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^/g, '<p>')
            .replace(/$/g, '</p>')
            .replace(/## (.*?)$/gm, '<h3>$1</h3>')
            .replace(/- (.*?)$/gm, '<li>$1</li>');
    }

    /**
     * Format course name for display
     */
    formatCourseName(course) {
        const names = {
            'beginner': 'Beginner Course',
            'intermediate': 'Intermediate Course',
            'variants': 'Variant Mastery'
        };
        return names[course] || course;
    }

    /**
     * Show loading state
     */
    showLoadingState() {
        if (this.lessonContainer) {
            this.lessonContainer.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading lesson...</p>
                </div>
            `;
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        if (this.lessonContainer) {
            this.lessonContainer.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Oops! Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn-primary" onclick="window.location.href='lessons.html'">
                        Back to Lessons
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show premium paywall
     */
    showPremiumWall(lesson) {
        if (this.lessonContainer) {
            this.lessonContainer.innerHTML = `
                <div class="premium-wall">
                    <div class="premium-icon">
                        <i class="fas fa-crown"></i>
                    </div>
                    <h2>Premium Lesson</h2>
                    <p><strong>${lesson.title}</strong> is a premium lesson available to subscribers.</p>
                    <p>Upgrade to Premium to unlock all ${lesson.course === 'intermediate' ? '5 intermediate' : '6 variant'} lessons and master advanced techniques!</p>
                    <button class="btn-primary" onclick="window.location.href='/subscribe.html'">
                        <i class="fas fa-crown"></i> Upgrade to Premium
                    </button>
                    <button class="btn-secondary" onclick="window.location.href='lessons.html'">
                        Back to Lessons
                    </button>
                </div>
            `;
        }
    }

    /**
     * Show achievement notification
     */
    showAchievementNotification(achievement) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-content">
                <i class="fas fa-trophy"></i>
                <div>
                    <h4>Achievement Unlocked!</h4>
                    <p>${achievement.name}</p>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);

        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Create global instance
let lessonEngine;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        lessonEngine = new LessonEngine();
    });
} else {
    lessonEngine = new LessonEngine();
}
