/**
 * PHASE 2 MONTH 24: Variant Customization UI Manager
 *
 * Manages the visual interface for game customization.
 * Renders presets, settings editor, and clue count controls.
 */

class VariantCustomizationUI {
    constructor(customizationManager) {
        this.customizationManager = customizationManager;
        this.currentView = 'presets'; // 'presets', 'editor', 'clue-counts'
        this.editingPreset = null; // For preset editor
        this.isCreatingNew = false;

        // Variant info for display
        this.variantInfo = {
            'classic': { name: 'Classic', icon: '🎯' },
            'x-sudoku': { name: 'X-Sudoku', icon: '✖️' },
            'mini': { name: 'Mini 6×6', icon: '📐' },
            'anti-knight': { name: 'Anti-Knight', icon: '♞' },
            'killer-sudoku': { name: 'Killer', icon: '🔪' },
            'hyper-sudoku': { name: 'Hyper', icon: '🎯' },
            'consecutive-sudoku': { name: 'Consecutive', icon: '🔢' },
            'thermo-sudoku': { name: 'Thermo', icon: '🌡️' },
            'jigsaw-sudoku': { name: 'Jigsaw', icon: '🧩' }
        };

        // Difficulty labels
        this.difficultyInfo = {
            'easy': { name: 'Easy', icon: '🟢', color: '#4CAF50' },
            'medium': { name: 'Medium', icon: '🟡', color: '#FF9800' },
            'hard': { name: 'Hard', icon: '🔴', color: '#F44336' }
        };
    }

    /**
     * Initialize the customization UI
     */
    initialize() {
        this.setupEventListeners();
        this.render();
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // View tabs
        const viewButtons = document.querySelectorAll('.customization-view-tab');
        viewButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentView = button.getAttribute('data-view');
                this.updateActiveTabs(viewButtons, button);
                this.render();
            });
        });

        // Close modal button
        const closeBtn = document.querySelector('.close-customization-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeCustomization());
        }

        // Click outside modal to close
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCustomization();
                }
            });
        }
    }

    /**
     * Update active state for tabs
     */
    updateActiveTabs(buttons, activeButton) {
        buttons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    /**
     * Open customization modal
     */
    openCustomization(initialView = 'presets') {
        this.currentView = initialView;
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.classList.remove('hidden');
            this.render();
        }
    }

    /**
     * Close customization modal
     */
    closeCustomization() {
        const modal = document.getElementById('customizationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingPreset = null;
        this.isCreatingNew = false;
    }

    /**
     * Render the complete customization interface
     */
    render() {
        switch (this.currentView) {
            case 'presets':
                this.renderPresetsView();
                break;
            case 'editor':
                this.renderEditorView();
                break;
            case 'clue-counts':
                this.renderClueCountsView();
                break;
        }
    }

    /**
     * Render presets view
     */
    renderPresetsView() {
        const container = document.getElementById('customizationContent');
        if (!container) return;

        const presets = this.customizationManager.getAllPresets();
        const activePresetId = this.customizationManager.getActivePreset();

        container.innerHTML = `
            <div class="presets-view">
                <div class="view-header">
                    <h2>Game Presets</h2>
                    <p class="view-description">Choose how you want to play. Each preset adjusts hints, timers, and difficulty.</p>
                </div>

                <div class="presets-grid">
                    ${presets.map(preset => this.renderPresetCard(preset, activePresetId)).join('')}
                </div>

                <div class="preset-actions">
                    <button class="create-preset-btn" onclick="window.variantCustomizationUI.createNewPreset()">
                        ➕ Create Custom Preset
                    </button>
                    <button class="import-preset-btn" onclick="window.variantCustomizationUI.showImportDialog()">
                        📥 Import Preset
                    </button>
                </div>
            </div>
        `;

        // Add click handlers for preset cards
        container.querySelectorAll('.preset-card').forEach(card => {
            const presetId = card.getAttribute('data-preset-id');
            const isActive = card.classList.contains('active');

            // Activate on click if not already active
            if (!isActive) {
                card.addEventListener('click', () => this.activatePreset(presetId));
            }
        });

        // Add handlers for preset actions (edit/duplicate/delete)
        this.setupPresetActionHandlers(container);
    }

    /**
     * Render a single preset card
     */
    renderPresetCard(preset, activePresetId) {
        const isActive = preset.id === activePresetId;
        const settings = preset.settings;

        return `
            <div class="preset-card ${isActive ? 'active' : ''} ${preset.isBuiltIn ? 'built-in' : 'custom'}"
                 data-preset-id="${preset.id}">

                ${isActive ? '<div class="active-badge">✓ Active</div>' : ''}

                <div class="preset-header">
                    <div class="preset-icon">${preset.icon}</div>
                    <div class="preset-title">
                        <h3>${this.escapeHtml(preset.name)}</h3>
                        ${preset.isBuiltIn ? '<span class="built-in-badge">Built-in</span>' : '<span class="custom-badge">Custom</span>'}
                    </div>
                </div>

                <p class="preset-description">${this.escapeHtml(preset.description)}</p>

                <div class="preset-settings-summary">
                    <div class="setting-item ${settings.hintsEnabled ? 'enabled' : 'disabled'}">
                        ${settings.hintsEnabled ? '✓' : '✗'} Hints
                        ${settings.unlimitedHints ? ' (Unlimited)' : settings.maxHints ? ` (${settings.maxHints})` : ''}
                    </div>
                    <div class="setting-item ${settings.timerEnabled ? 'enabled' : 'disabled'}">
                        ${settings.timerEnabled ? '✓' : '✗'} Timer
                        ${settings.timeLimit ? ' (Limited)' : ''}
                    </div>
                    <div class="setting-item ${settings.autoCheckErrors ? 'enabled' : 'disabled'}">
                        ${settings.autoCheckErrors ? '✓' : '✗'} Auto-check
                    </div>
                    <div class="setting-item">
                        Score: ×${settings.scoreMultiplier}
                    </div>
                </div>

                ${!preset.isBuiltIn ? `
                    <div class="preset-actions">
                        <button class="preset-action-btn edit-btn" data-preset-id="${preset.id}" title="Edit">
                            ✏️
                        </button>
                        <button class="preset-action-btn duplicate-btn" data-preset-id="${preset.id}" title="Duplicate">
                            📋
                        </button>
                        <button class="preset-action-btn export-btn" data-preset-id="${preset.id}" title="Export">
                            📤
                        </button>
                        <button class="preset-action-btn delete-btn" data-preset-id="${preset.id}" title="Delete">
                            🗑️
                        </button>
                    </div>
                ` : `
                    <div class="preset-actions">
                        <button class="preset-action-btn duplicate-btn" data-preset-id="${preset.id}" title="Duplicate">
                            📋 Duplicate
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    /**
     * Setup handlers for preset action buttons
     */
    setupPresetActionHandlers(container) {
        // Edit buttons
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = btn.getAttribute('data-preset-id');
                this.editPreset(presetId);
            });
        });

        // Duplicate buttons
        container.querySelectorAll('.duplicate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = btn.getAttribute('data-preset-id');
                this.duplicatePreset(presetId);
            });
        });

        // Export buttons
        container.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = btn.getAttribute('data-preset-id');
                this.exportPreset(presetId);
            });
        });

        // Delete buttons
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const presetId = btn.getAttribute('data-preset-id');
                this.deletePreset(presetId);
            });
        });
    }

    /**
     * Render preset editor view
     */
    renderEditorView() {
        const container = document.getElementById('customizationContent');
        if (!container) return;

        const preset = this.editingPreset ?
            this.customizationManager.getPresetMetadata(this.editingPreset) :
            null;

        const settings = preset ? preset.settings : {
            hintsEnabled: true,
            unlimitedHints: false,
            maxHints: 3,
            timerEnabled: true,
            mistakesLimit: null,
            autoCheckErrors: true,
            showCandidates: true,
            highlightConflicts: true,
            scoreMultiplier: 1.0
        };

        container.innerHTML = `
            <div class="editor-view">
                <div class="view-header">
                    <button class="back-btn" onclick="window.variantCustomizationUI.backToPresets()">← Back</button>
                    <h2>${this.isCreatingNew ? 'Create Custom Preset' : 'Edit Preset'}</h2>
                </div>

                <form class="preset-editor-form" onsubmit="window.variantCustomizationUI.savePreset(event)">
                    <!-- Basic Info -->
                    <div class="form-section">
                        <h3>Basic Information</h3>

                        <div class="form-group">
                            <label for="presetName">Preset Name</label>
                            <input type="text" id="presetName" name="name"
                                   value="${preset ? this.escapeHtml(preset.name) : ''}"
                                   placeholder="e.g., My Custom Mode" required>
                        </div>

                        <div class="form-group">
                            <label for="presetDescription">Description</label>
                            <textarea id="presetDescription" name="description"
                                      placeholder="Describe your preset...">${preset ? this.escapeHtml(preset.description) : ''}</textarea>
                        </div>

                        <div class="form-group">
                            <label for="presetIcon">Icon (Emoji)</label>
                            <input type="text" id="presetIcon" name="icon"
                                   value="${preset ? preset.icon : '⚙️'}"
                                   placeholder="🎮" maxlength="2">
                        </div>
                    </div>

                    <!-- Hints Settings -->
                    <div class="form-section">
                        <h3>Hints & Assistance</h3>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="hintsEnabled"
                                       ${settings.hintsEnabled ? 'checked' : ''}
                                       onchange="window.variantCustomizationUI.toggleHintsOptions(this)">
                                Enable Hints
                            </label>
                        </div>

                        <div id="hintsOptions" class="sub-options ${settings.hintsEnabled ? '' : 'hidden'}">
                            <div class="form-group checkbox">
                                <label>
                                    <input type="checkbox" name="unlimitedHints"
                                           ${settings.unlimitedHints ? 'checked' : ''}
                                           onchange="window.variantCustomizationUI.toggleUnlimitedHints(this)">
                                    Unlimited Hints
                                </label>
                            </div>

                            <div id="maxHintsOption" class="form-group ${settings.unlimitedHints ? 'hidden' : ''}">
                                <label for="maxHints">Max Hints</label>
                                <input type="number" id="maxHints" name="maxHints"
                                       value="${settings.maxHints || 3}"
                                       min="1" max="20">
                            </div>
                        </div>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="autoCheckErrors"
                                       ${settings.autoCheckErrors ? 'checked' : ''}>
                                Auto-Check Errors
                            </label>
                        </div>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="showCandidates"
                                       ${settings.showCandidates ? 'checked' : ''}>
                                Show Candidate Numbers
                            </label>
                        </div>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="highlightConflicts"
                                       ${settings.highlightConflicts ? 'checked' : ''}>
                                Highlight Conflicts
                            </label>
                        </div>
                    </div>

                    <!-- Timer Settings -->
                    <div class="form-section">
                        <h3>Timer & Limits</h3>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="timerEnabled"
                                       ${settings.timerEnabled ? 'checked' : ''}>
                                Enable Timer
                            </label>
                        </div>

                        <div class="form-group">
                            <label for="mistakesLimit">Mistakes Limit (0 = unlimited)</label>
                            <input type="number" id="mistakesLimit" name="mistakesLimit"
                                   value="${settings.mistakesLimit || 0}"
                                   min="0" max="10">
                        </div>
                    </div>

                    <!-- Scoring -->
                    <div class="form-section">
                        <h3>Scoring</h3>

                        <div class="form-group">
                            <label for="scoreMultiplier">Score Multiplier</label>
                            <input type="number" id="scoreMultiplier" name="scoreMultiplier"
                                   value="${settings.scoreMultiplier}"
                                   min="0.1" max="2.0" step="0.1">
                            <small>Hardcore = 1.5x, Casual = 0.8x</small>
                        </div>

                        <div class="form-group checkbox">
                            <label>
                                <input type="checkbox" name="hideScore"
                                       ${settings.hideScore ? 'checked' : ''}>
                                Hide Score (Zen Mode)
                            </label>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="form-actions">
                        <button type="button" class="cancel-btn" onclick="window.variantCustomizationUI.backToPresets()">
                            Cancel
                        </button>
                        <button type="submit" class="save-btn">
                            💾 Save Preset
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Render clue counts customization view
     */
    renderClueCountsView() {
        const container = document.getElementById('customizationContent');
        if (!container) return;

        container.innerHTML = `
            <div class="clue-counts-view">
                <div class="view-header">
                    <h2>Clue Count Customization</h2>
                    <p class="view-description">Adjust the number of starting clues for each variant and difficulty.</p>
                </div>

                <div class="clue-counts-grid">
                    ${Object.keys(this.variantInfo).map(variantId =>
                        this.renderVariantClueCountSection(variantId)
                    ).join('')}
                </div>

                <div class="clue-counts-info">
                    <h3>ℹ️ About Clue Counts</h3>
                    <ul>
                        <li>Higher clue counts = easier puzzles (less empty cells)</li>
                        <li>Lower clue counts = harder puzzles (more empty cells)</li>
                        <li>Recommended range: 17-60 clues</li>
                        <li>Changes apply to new puzzles only</li>
                    </ul>
                </div>
            </div>
        `;

        // Setup slider event listeners
        this.setupClueCountSliders(container);
    }

    /**
     * Render clue count section for a variant
     */
    renderVariantClueCountSection(variantId) {
        const variantInfo = this.variantInfo[variantId];
        const difficulties = ['easy', 'medium', 'hard'];

        return `
            <div class="variant-clue-section">
                <div class="variant-clue-header">
                    <span class="variant-icon">${variantInfo.icon}</span>
                    <h3>${variantInfo.name}</h3>
                </div>

                <div class="difficulty-sliders">
                    ${difficulties.map(diff => {
                        const range = this.customizationManager.getClueCountRange(variantId, diff);
                        const current = this.customizationManager.getEffectiveClueCount(variantId, diff);
                        const custom = this.customizationManager.getCustomClueCount(variantId, diff);
                        const diffInfo = this.difficultyInfo[diff];

                        return `
                            <div class="slider-group">
                                <div class="slider-header">
                                    <span class="difficulty-badge" style="background-color: ${diffInfo.color}">
                                        ${diffInfo.icon} ${diffInfo.name}
                                    </span>
                                    <span class="clue-count-value" id="${variantId}-${diff}-value">
                                        ${current} clues
                                    </span>
                                </div>

                                <input type="range"
                                       class="clue-count-slider"
                                       data-variant="${variantId}"
                                       data-difficulty="${diff}"
                                       min="${range.min}"
                                       max="${range.max}"
                                       value="${current}"
                                       step="1">

                                <div class="slider-footer">
                                    <span class="range-label">${range.min}</span>
                                    <span class="default-label">
                                        Default: ${range.default}
                                        ${custom !== null ? ' (Modified)' : ''}
                                    </span>
                                    <span class="range-label">${range.max}</span>
                                </div>

                                ${custom !== null ? `
                                    <button class="reset-clue-btn"
                                            data-variant="${variantId}"
                                            data-difficulty="${diff}">
                                        Reset to Default
                                    </button>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Setup clue count slider event listeners
     */
    setupClueCountSliders(container) {
        const sliders = container.querySelectorAll('.clue-count-slider');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const variantId = e.target.getAttribute('data-variant');
                const difficulty = e.target.getAttribute('data-difficulty');
                const value = parseInt(e.target.value);

                // Update display
                const valueDisplay = document.getElementById(`${variantId}-${difficulty}-value`);
                if (valueDisplay) {
                    valueDisplay.textContent = `${value} clues`;
                }
            });

            slider.addEventListener('change', (e) => {
                const variantId = e.target.getAttribute('data-variant');
                const difficulty = e.target.getAttribute('data-difficulty');
                const value = parseInt(e.target.value);

                // Save to manager
                this.customizationManager.setCustomClueCount(variantId, difficulty, value);
                this.showNotification(`Updated ${this.variantInfo[variantId].name} ${difficulty} to ${value} clues`, 'success');

                // Re-render to show reset button
                this.render();
            });
        });

        // Reset buttons
        container.querySelectorAll('.reset-clue-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const variantId = btn.getAttribute('data-variant');
                const difficulty = btn.getAttribute('data-difficulty');

                this.customizationManager.resetClueCount(variantId, difficulty);
                this.showNotification(`Reset ${this.variantInfo[variantId].name} ${difficulty} to default`, 'success');
                this.render();
            });
        });
    }

    /**
     * Toggle hints options visibility
     */
    toggleHintsOptions(checkbox) {
        const options = document.getElementById('hintsOptions');
        if (options) {
            options.classList.toggle('hidden', !checkbox.checked);
        }
    }

    /**
     * Toggle unlimited hints option
     */
    toggleUnlimitedHints(checkbox) {
        const maxHintsOption = document.getElementById('maxHintsOption');
        if (maxHintsOption) {
            maxHintsOption.classList.toggle('hidden', checkbox.checked);
        }
    }

    /**
     * Activate a preset
     */
    activatePreset(presetId) {
        const result = this.customizationManager.activatePreset(presetId);

        if (result.success) {
            const preset = this.customizationManager.getPresetMetadata(presetId);
            this.showNotification(`Activated preset: ${preset.name}`, 'success');
            this.render();

            // Apply settings to current game if playing
            if (window.sudoku) {
                this.customizationManager.applySettingsToGame(window.sudoku);
            }
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Create new preset
     */
    createNewPreset() {
        this.isCreatingNew = true;
        this.editingPreset = null;
        this.currentView = 'editor';
        this.render();
    }

    /**
     * Edit existing preset
     */
    editPreset(presetId) {
        this.isCreatingNew = false;
        this.editingPreset = presetId;
        this.currentView = 'editor';
        this.render();
    }

    /**
     * Save preset (create or update)
     */
    savePreset(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const name = formData.get('name');
        const description = formData.get('description') || '';
        const icon = formData.get('icon') || '⚙️';

        const settings = {
            hintsEnabled: formData.get('hintsEnabled') === 'on',
            unlimitedHints: formData.get('unlimitedHints') === 'on',
            maxHints: parseInt(formData.get('maxHints')) || 3,
            timerEnabled: formData.get('timerEnabled') === 'on',
            mistakesLimit: parseInt(formData.get('mistakesLimit')) || null,
            autoCheckErrors: formData.get('autoCheckErrors') === 'on',
            showCandidates: formData.get('showCandidates') === 'on',
            highlightConflicts: formData.get('highlightConflicts') === 'on',
            scoreMultiplier: parseFloat(formData.get('scoreMultiplier')) || 1.0,
            hideScore: formData.get('hideScore') === 'on'
        };

        // Normalize mistakesLimit
        if (settings.mistakesLimit === 0) {
            settings.mistakesLimit = null;
        }

        let result;
        if (this.isCreatingNew) {
            result = this.customizationManager.createCustomPreset(name, description, icon, settings);
        } else {
            result = this.customizationManager.updateCustomPreset(this.editingPreset, name, description, icon, settings);
        }

        if (result.success) {
            this.showNotification(
                this.isCreatingNew ? 'Preset created successfully!' : 'Preset updated successfully!',
                'success'
            );
            this.backToPresets();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Duplicate preset
     */
    duplicatePreset(presetId) {
        const result = this.customizationManager.duplicatePreset(presetId);

        if (result.success) {
            this.showNotification('Preset duplicated successfully!', 'success');
            this.render();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Export preset
     */
    exportPreset(presetId) {
        const json = this.customizationManager.exportPreset(presetId);

        if (json) {
            // Copy to clipboard
            navigator.clipboard.writeText(json).then(() => {
                this.showNotification('Preset JSON copied to clipboard!', 'success');
            }).catch(() => {
                // Fallback: show in dialog
                this.showExportDialog(json);
            });
        } else {
            this.showNotification('Failed to export preset', 'error');
        }
    }

    /**
     * Show export dialog
     */
    showExportDialog(json) {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="export-dialog">
                <h3>Export Preset</h3>
                <p>Copy this JSON to share your preset:</p>
                <textarea readonly>${json}</textarea>
                <div class="dialog-actions">
                    <button class="copy-btn" onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value); this.textContent = '✓ Copied!'">
                        📋 Copy
                    </button>
                    <button class="close-btn" onclick="this.closest('.export-modal').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Delete preset
     */
    deletePreset(presetId) {
        const preset = this.customizationManager.getPresetMetadata(presetId);

        if (confirm(`Are you sure you want to delete "${preset.name}"?`)) {
            const result = this.customizationManager.deleteCustomPreset(presetId);

            if (result.success) {
                this.showNotification('Preset deleted successfully!', 'success');
                this.render();
            } else {
                this.showNotification(result.error, 'error');
            }
        }
    }

    /**
     * Show import dialog
     */
    showImportDialog() {
        const modal = document.createElement('div');
        modal.className = 'import-modal';
        modal.innerHTML = `
            <div class="import-dialog">
                <h3>Import Preset</h3>
                <p>Paste the preset JSON below:</p>
                <textarea placeholder="Paste JSON here..."></textarea>
                <div class="dialog-actions">
                    <button class="import-btn" onclick="window.variantCustomizationUI.importFromDialog(this)">
                        📥 Import
                    </button>
                    <button class="close-btn" onclick="this.closest('.import-modal').remove()">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    /**
     * Import from dialog
     */
    importFromDialog(button) {
        const textarea = button.parentElement.previousElementSibling;
        const json = textarea.value.trim();

        if (!json) {
            this.showNotification('Please paste a preset JSON', 'error');
            return;
        }

        const result = this.customizationManager.importPreset(json);

        if (result.success) {
            this.showNotification('Preset imported successfully!', 'success');
            button.closest('.import-modal').remove();
            this.render();
        } else {
            this.showNotification(result.error, 'error');
        }
    }

    /**
     * Back to presets view
     */
    backToPresets() {
        this.currentView = 'presets';
        this.editingPreset = null;
        this.isCreatingNew = false;
        this.render();
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `customization-notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh the display
     */
    refresh() {
        this.render();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantCustomizationUI;
}
