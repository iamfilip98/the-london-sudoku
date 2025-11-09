/**
 * PHASE 2 MONTH 18: Tutorial Manager
 *
 * Manages interactive tutorials for all Sudoku variants.
 * Handles tutorial state, navigation, progress tracking, and integration with the Sudoku engine.
 */

class TutorialManager {
    constructor(sudokuEngine) {
        this.engine = sudokuEngine;
        this.currentTutorial = null;
        this.currentStep = 0;
        this.isActive = false;
        this.completedTutorials = new Set();
        this.tutorialProgress = {};

        // Load tutorial content
        if (typeof TUTORIAL_CONTENT !== 'undefined') {
            this.tutorials = TUTORIAL_CONTENT;
        } else {
            console.error('Tutorial content not loaded');
            this.tutorials = {};
        }

        // Load saved progress
        this.loadProgress();
    }

    /**
     * Start a tutorial for a specific variant
     */
    startTutorial(variantId, resumeFromStep = 0) {
        if (!this.tutorials[variantId]) {
            console.error(`Tutorial not found for variant: ${variantId}`);
            return false;
        }

        this.currentTutorial = variantId;
        this.currentStep = resumeFromStep;
        this.isActive = true;

        // Initialize tutorial progress
        if (!this.tutorialProgress[variantId]) {
            this.tutorialProgress[variantId] = {
                started: Date.now(),
                currentStep: 0,
                completed: false
            };
        }

        this.showTutorialUI();
        this.renderCurrentStep();

        return true;
    }

    /**
     * Navigate to the next step
     */
    nextStep() {
        if (!this.isActive) return;

        const tutorial = this.tutorials[this.currentTutorial];

        // Check if current step has a required task
        const currentStepData = tutorial.steps[this.currentStep];
        if (currentStepData.type === 'interactive' && currentStepData.task) {
            if (!this.validateStepCompletion(currentStepData)) {
                this.showError('Please complete the required task before continuing.');
                return;
            }
        }

        this.currentStep++;

        // Check if tutorial is complete
        if (this.currentStep >= tutorial.steps.length) {
            this.completeTutorial();
            return;
        }

        // Update progress
        this.tutorialProgress[this.currentTutorial].currentStep = this.currentStep;
        this.saveProgress();

        this.renderCurrentStep();
    }

    /**
     * Navigate to the previous step
     */
    previousStep() {
        if (!this.isActive || this.currentStep === 0) return;

        this.currentStep--;
        this.tutorialProgress[this.currentTutorial].currentStep = this.currentStep;
        this.saveProgress();

        this.renderCurrentStep();
    }

    /**
     * Skip the current tutorial
     */
    skipTutorial() {
        if (!this.isActive) return;

        const confirmed = confirm('Are you sure you want to skip this tutorial? You can restart it anytime from the help menu.');

        if (confirmed) {
            this.closeTutorial();
        }
    }

    /**
     * Close the tutorial
     */
    closeTutorial() {
        this.isActive = false;
        this.currentTutorial = null;
        this.currentStep = 0;
        this.hideTutorialUI();

        // Clear any tutorial-specific highlights or overlays
        this.clearTutorialHighlights();
    }

    /**
     * Complete the current tutorial
     */
    completeTutorial() {
        if (!this.currentTutorial) return;

        // Mark as completed
        this.completedTutorials.add(this.currentTutorial);
        this.tutorialProgress[this.currentTutorial].completed = true;
        this.tutorialProgress[this.currentTutorial].completedAt = Date.now();
        this.saveProgress();

        // PHASE 2 MONTH 19: Track tutorial completion in variant stats
        if (window.variantStatsManager) {
            window.variantStatsManager.completeTutorial(this.currentTutorial);
        }

        // Show completion screen
        this.showCompletionScreen();

        // Track achievement
        this.trackTutorialAchievement();
    }

    /**
     * Render the current tutorial step
     */
    renderCurrentStep() {
        if (!this.isActive || !this.currentTutorial) return;

        const tutorial = this.tutorials[this.currentTutorial];
        const step = tutorial.steps[this.currentStep];

        // Update UI elements
        this.updateStepContent(step);
        this.updateProgressIndicator();
        this.applyStepVisuals(step);

        // Handle interactive steps
        if (step.type === 'interactive') {
            this.setupInteractiveStep(step);
        }
    }

    /**
     * Update step content in UI
     */
    updateStepContent(step) {
        const container = document.getElementById('tutorialContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tutorial-step">
                <div class="tutorial-step-header">
                    <h2 class="tutorial-step-title">${step.title}</h2>
                    <div class="tutorial-step-number">
                        Step ${this.currentStep + 1} of ${this.tutorials[this.currentTutorial].steps.length}
                    </div>
                </div>
                <div class="tutorial-step-content">
                    ${this.formatStepContent(step.content)}
                    ${step.examples ? this.renderExamples(step.examples) : ''}
                    ${step.counterexamples ? this.renderCounterexamples(step.counterexamples) : ''}
                    ${step.hint ? `<div class="tutorial-hint">💡 Hint: ${step.hint}</div>` : ''}
                </div>
                ${step.type === 'interactive' ? this.renderInteractiveControls(step) : ''}
            </div>
        `;
    }

    /**
     * Format step content (convert newlines to HTML)
     */
    formatStepContent(content) {
        return content.split('\n').map(line => {
            if (line.startsWith('•')) {
                return `<li>${line.substring(1).trim()}</li>`;
            }
            return `<p>${line}</p>`;
        }).join('');
    }

    /**
     * Render examples
     */
    renderExamples(examples) {
        return `
            <div class="tutorial-examples">
                <strong>✅ Valid Examples:</strong>
                <ul>
                    ${examples.map(ex => `<li><code>${ex}</code></li>`).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Render counterexamples
     */
    renderCounterexamples(counterexamples) {
        return `
            <div class="tutorial-counterexamples">
                <strong>❌ Invalid Examples:</strong>
                <ul>
                    ${counterexamples.map(ex => `<li><code>${ex}</code></li>`).join('')}
                </ul>
            </div>
        `;
    }

    /**
     * Render interactive controls for interactive steps
     */
    renderInteractiveControls(step) {
        return `
            <div class="tutorial-interactive-controls">
                <div class="tutorial-task-status" id="tutorialTaskStatus">
                    ${step.task === 'place-number' ? '👆 Click on the highlighted cell and enter the correct number' : ''}
                    ${step.allowExploration ? '👆 Click on cells to explore' : ''}
                </div>
            </div>
        `;
    }

    /**
     * Update progress indicator
     */
    updateProgressIndicator() {
        const tutorial = this.tutorials[this.currentTutorial];
        const progress = ((this.currentStep + 1) / tutorial.steps.length) * 100;

        const progressBar = document.getElementById('tutorialProgressBar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }

        const stepCounter = document.getElementById('tutorialStepCounter');
        if (stepCounter) {
            stepCounter.textContent = `${this.currentStep + 1} / ${tutorial.steps.length}`;
        }
    }

    /**
     * Apply visual highlights for the current step
     */
    applyStepVisuals(step) {
        // Clear previous highlights
        this.clearTutorialHighlights();

        if (!step.highlights) return;

        // Apply new highlights based on step configuration
        step.highlights.forEach(highlight => {
            switch (highlight) {
                case 'row':
                    this.highlightRows();
                    break;
                case 'column':
                    this.highlightColumns();
                    break;
                case 'box':
                    this.highlightBoxes();
                    break;
                case 'main-diagonal':
                    this.highlightMainDiagonal();
                    break;
                case 'anti-diagonal':
                    this.highlightAntiDiagonal();
                    break;
                case 'initial-cells':
                    this.highlightInitialCells();
                    break;
                // Add more highlight types as needed
            }
        });

        // Highlight specific cells if needed
        if (step.targetCell) {
            this.highlightCell(step.targetCell[0], step.targetCell[1], 'tutorial-target');
        }
    }

    /**
     * Setup interactive step behavior
     */
    setupInteractiveStep(step) {
        // Enable/disable grid interaction based on step requirements
        if (step.task === 'place-number' || step.task === 'place-diagonal') {
            this.enableGridInteraction(step);
        } else if (step.allowExploration) {
            this.enableExplorationMode();
        }
    }

    /**
     * Enable grid interaction for interactive tasks
     */
    enableGridInteraction(step) {
        // Temporarily hook into Sudoku engine's input handling
        this.originalHandleInput = this.engine.handleCellInput;

        this.engine.handleCellInput = (row, col, value) => {
            // Check if this matches the tutorial task
            if (step.targetCell && row === step.targetCell[0] && col === step.targetCell[1]) {
                if (value === step.expectedValue) {
                    this.showSuccess('Perfect! You placed the correct number.');
                    this.markStepAsCompleted();
                    // Allow proceeding to next step
                    setTimeout(() => this.nextStep(), 1500);
                } else {
                    this.showError('Not quite. Try again or use the hint!');
                }
            } else {
                this.showInfo('Focus on the highlighted cell for this tutorial step.');
            }
        };
    }

    /**
     * Validate step completion
     */
    validateStepCompletion(step) {
        // Check if the required task has been completed
        if (step.task === 'place-number' && step.targetCell) {
            const [row, col] = step.targetCell;
            return this.engine.playerGrid[row][col] === step.expectedValue;
        }

        // Other validation logic for different task types
        return true;
    }

    /**
     * Mark step as completed
     */
    markStepAsCompleted() {
        const statusEl = document.getElementById('tutorialTaskStatus');
        if (statusEl) {
            statusEl.innerHTML = '✅ Task completed!';
            statusEl.classList.add('completed');
        }
    }

    /**
     * Highlight specific cells
     */
    highlightCell(row, col, className = 'tutorial-highlight') {
        const cell = document.querySelector(`.sudoku-cell[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.classList.add(className);
        }
    }

    /**
     * Highlight main diagonal
     */
    highlightMainDiagonal() {
        for (let i = 0; i < 9; i++) {
            this.highlightCell(i, i, 'tutorial-diagonal');
        }
    }

    /**
     * Highlight anti-diagonal
     */
    highlightAntiDiagonal() {
        for (let i = 0; i < 9; i++) {
            this.highlightCell(i, 8 - i, 'tutorial-diagonal');
        }
    }

    /**
     * Highlight initial (given) cells
     */
    highlightInitialCells() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.engine.initialGrid[row][col] !== 0) {
                    this.highlightCell(row, col, 'tutorial-initial');
                }
            }
        }
    }

    /**
     * Highlight rows (visual demonstration)
     */
    highlightRows() {
        // Add visual indicator for rows (e.g., subtle background on row 0)
        for (let col = 0; col < 9; col++) {
            this.highlightCell(0, col, 'tutorial-row-example');
        }
    }

    /**
     * Highlight columns (visual demonstration)
     */
    highlightColumns() {
        // Add visual indicator for columns (e.g., subtle background on column 0)
        for (let row = 0; row < 9; row++) {
            this.highlightCell(row, 0, 'tutorial-column-example');
        }
    }

    /**
     * Highlight boxes (visual demonstration)
     */
    highlightBoxes() {
        // Highlight top-left box as an example
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                this.highlightCell(row, col, 'tutorial-box-example');
            }
        }
    }

    /**
     * Clear all tutorial highlights
     */
    clearTutorialHighlights() {
        const cells = document.querySelectorAll('.sudoku-cell');
        cells.forEach(cell => {
            cell.classList.remove(
                'tutorial-highlight',
                'tutorial-target',
                'tutorial-diagonal',
                'tutorial-initial',
                'tutorial-row-example',
                'tutorial-column-example',
                'tutorial-box-example'
            );
        });
    }

    /**
     * Show tutorial UI
     */
    showTutorialUI() {
        let tutorialOverlay = document.getElementById('tutorialOverlay');

        if (!tutorialOverlay) {
            tutorialOverlay = document.createElement('div');
            tutorialOverlay.id = 'tutorialOverlay';
            tutorialOverlay.className = 'tutorial-overlay';
            tutorialOverlay.innerHTML = `
                <div class="tutorial-modal">
                    <div class="tutorial-header">
                        <div class="tutorial-title">
                            <span class="tutorial-icon">${this.tutorials[this.currentTutorial].icon}</span>
                            <span class="tutorial-name">${this.tutorials[this.currentTutorial].name}</span>
                        </div>
                        <button class="tutorial-close-btn" id="tutorialCloseBtn">✕</button>
                    </div>
                    <div class="tutorial-progress-container">
                        <div class="tutorial-progress-bar" id="tutorialProgressBar"></div>
                        <div class="tutorial-step-counter" id="tutorialStepCounter"></div>
                    </div>
                    <div class="tutorial-body" id="tutorialContent">
                        <!-- Step content goes here -->
                    </div>
                    <div class="tutorial-footer">
                        <button class="tutorial-btn tutorial-btn-secondary" id="tutorialPrevBtn">← Previous</button>
                        <button class="tutorial-btn tutorial-btn-skip" id="tutorialSkipBtn">Skip Tutorial</button>
                        <button class="tutorial-btn tutorial-btn-primary" id="tutorialNextBtn">Next →</button>
                    </div>
                </div>
            `;
            document.body.appendChild(tutorialOverlay);

            // Setup event listeners
            document.getElementById('tutorialNextBtn').addEventListener('click', () => this.nextStep());
            document.getElementById('tutorialPrevBtn').addEventListener('click', () => this.previousStep());
            document.getElementById('tutorialSkipBtn').addEventListener('click', () => this.skipTutorial());
            document.getElementById('tutorialCloseBtn').addEventListener('click', () => this.skipTutorial());
        }

        tutorialOverlay.classList.add('active');

        // Update navigation buttons
        this.updateNavigationButtons();
    }

    /**
     * Hide tutorial UI
     */
    hideTutorialUI() {
        const tutorialOverlay = document.getElementById('tutorialOverlay');
        if (tutorialOverlay) {
            tutorialOverlay.classList.remove('active');
        }

        // Restore original engine behavior
        if (this.originalHandleInput) {
            this.engine.handleCellInput = this.originalHandleInput;
        }
    }

    /**
     * Update navigation button states
     */
    updateNavigationButtons() {
        const prevBtn = document.getElementById('tutorialPrevBtn');
        const nextBtn = document.getElementById('tutorialNextBtn');

        if (prevBtn) {
            prevBtn.disabled = this.currentStep === 0;
        }

        const tutorial = this.tutorials[this.currentTutorial];
        if (nextBtn && tutorial) {
            const isLastStep = this.currentStep === tutorial.steps.length - 1;
            nextBtn.textContent = isLastStep ? 'Complete Tutorial ✓' : 'Next →';
        }
    }

    /**
     * Show completion screen
     */
    showCompletionScreen() {
        const tutorial = this.tutorials[this.currentTutorial];

        const container = document.getElementById('tutorialContent');
        if (!container) return;

        container.innerHTML = `
            <div class="tutorial-completion">
                <div class="tutorial-completion-icon">🎉</div>
                <h2>Tutorial Complete!</h2>
                <p>Congratulations! You've completed the <strong>${tutorial.name}</strong> tutorial.</p>
                <div class="tutorial-completion-stats">
                    <div class="stat">
                        <div class="stat-label">Steps Completed</div>
                        <div class="stat-value">${tutorial.steps.length}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Variant Mastered</div>
                        <div class="stat-value">${tutorial.icon} ${tutorial.name}</div>
                    </div>
                </div>
                <p>You're now ready to play ${tutorial.name} puzzles!</p>
                <button class="tutorial-btn tutorial-btn-primary" id="tutorialFinishBtn">
                    Start Playing
                </button>
            </div>
        `;

        document.getElementById('tutorialFinishBtn').addEventListener('click', () => {
            this.closeTutorial();
            // Optionally start a puzzle of this variant
            this.startVariantPuzzle(this.currentTutorial);
        });

        // Hide navigation buttons
        document.getElementById('tutorialPrevBtn').style.display = 'none';
        document.getElementById('tutorialNextBtn').style.display = 'none';
        document.getElementById('tutorialSkipBtn').style.display = 'none';
    }

    /**
     * Start a puzzle of the completed tutorial variant
     */
    startVariantPuzzle(variantId) {
        // Set the variant in session storage
        sessionStorage.setItem('selectedVariant', variantId);
        sessionStorage.setItem('selectedDifficulty', 'easy');

        // Reload the game with the new variant
        if (this.engine.loadDailyPuzzles) {
            this.engine.loadDailyPuzzles();
        }
    }

    /**
     * Track tutorial completion achievement
     */
    trackTutorialAchievement() {
        // Could integrate with achievement system
        console.log(`Tutorial completed: ${this.currentTutorial}`);

        // Check if all tutorials completed
        const allTutorials = Object.keys(this.tutorials);
        const completedCount = [...this.completedTutorials].length;

        if (completedCount === allTutorials.length) {
            console.log('🏆 All tutorials completed! Master achievement unlocked.');
        }
    }

    /**
     * Show success message
     */
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showNotification(message, 'error');
    }

    /**
     * Show info message
     */
    showInfo(message) {
        this.showNotification(message, 'info');
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `tutorial-notification tutorial-notification-${type}`;
        notification.textContent = message;

        const overlay = document.getElementById('tutorialOverlay');
        if (overlay) {
            overlay.appendChild(notification);

            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }

    /**
     * Check if a tutorial has been completed
     */
    isTutorialCompleted(variantId) {
        return this.completedTutorials.has(variantId);
    }

    /**
     * Get tutorial progress for a variant
     */
    getTutorialProgress(variantId) {
        return this.tutorialProgress[variantId] || null;
    }

    /**
     * Save tutorial progress to localStorage
     */
    saveProgress() {
        try {
            localStorage.setItem('tutorialProgress', JSON.stringify({
                completed: Array.from(this.completedTutorials),
                progress: this.tutorialProgress
            }));
        } catch (e) {
            console.error('Failed to save tutorial progress:', e);
        }
    }

    /**
     * Load tutorial progress from localStorage
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('tutorialProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.completedTutorials = new Set(data.completed || []);
                this.tutorialProgress = data.progress || {};
            }
        } catch (e) {
            console.error('Failed to load tutorial progress:', e);
            this.completedTutorials = new Set();
            this.tutorialProgress = {};
        }
    }

    /**
     * Reset all tutorial progress (for testing or user request)
     */
    resetProgress() {
        const confirmed = confirm('Are you sure you want to reset all tutorial progress? This cannot be undone.');

        if (confirmed) {
            this.completedTutorials.clear();
            this.tutorialProgress = {};
            this.saveProgress();
            console.log('Tutorial progress reset');
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TutorialManager;
}
