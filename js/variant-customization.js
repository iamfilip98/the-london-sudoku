/**
 * PHASE 2 MONTH 24: Variant Customization Manager
 *
 * Manages custom difficulty settings, game modifiers, and preset configurations.
 * Allows users to fine-tune their Sudoku experience.
 */

class VariantCustomizationManager {
    constructor() {
        // LocalStorage versioning
        this.STORAGE_VERSION = 1;
        this.STORAGE_KEY = 'variantCustomization';

        // Default difficulty clue counts
        this.defaultClueCounts = {
            'classic': { easy: 42, medium: 28, hard: 25 },
            'x-sudoku': { easy: 40, medium: 26, hard: 23 },
            'mini': { easy: 20, medium: 15, hard: 12 },
            'anti-knight': { easy: 38, medium: 25, hard: 22 },
            'killer-sudoku': { easy: 35, medium: 22, hard: 18 },
            'hyper-sudoku': { easy: 38, medium: 25, hard: 22 },
            'consecutive-sudoku': { easy: 38, medium: 25, hard: 22 },
            'thermo-sudoku': { easy: 35, medium: 22, hard: 18 },
            'jigsaw-sudoku': { easy: 38, medium: 25, hard: 22 }
        };

        // Built-in presets
        this.builtInPresets = {
            'casual': {
                name: 'Casual Play',
                description: 'Relaxed gameplay with generous hints and no time pressure',
                icon: '😊',
                settings: {
                    hintsEnabled: true,
                    unlimitedHints: true,
                    timerEnabled: false,
                    mistakesLimit: null, // unlimited
                    autoCheckErrors: true,
                    showCandidates: true,
                    highlightConflicts: true,
                    scoreMultiplier: 0.8
                }
            },
            'standard': {
                name: 'Standard',
                description: 'Balanced gameplay with default settings',
                icon: '🎯',
                settings: {
                    hintsEnabled: true,
                    unlimitedHints: false,
                    maxHints: 3,
                    timerEnabled: true,
                    mistakesLimit: null,
                    autoCheckErrors: true,
                    showCandidates: true,
                    highlightConflicts: true,
                    scoreMultiplier: 1.0
                }
            },
            'hardcore': {
                name: 'Hardcore',
                description: 'No assists, pure solving skill required',
                icon: '💀',
                settings: {
                    hintsEnabled: false,
                    timerEnabled: true,
                    mistakesLimit: 3, // 3 strikes rule
                    autoCheckErrors: false,
                    showCandidates: false,
                    highlightConflicts: false,
                    scoreMultiplier: 1.5
                }
            },
            'speedrun': {
                name: 'Speedrun',
                description: 'Race against the clock with time limits',
                icon: '⚡',
                settings: {
                    hintsEnabled: true,
                    unlimitedHints: false,
                    maxHints: 1,
                    timerEnabled: true,
                    timeLimit: {
                        easy: 600, // 10 minutes
                        medium: 480, // 8 minutes
                        hard: 900 // 15 minutes
                    },
                    mistakesLimit: 5,
                    autoCheckErrors: true,
                    showCandidates: true,
                    highlightConflicts: true,
                    scoreMultiplier: 1.3,
                    timeBonus: true // Extra points for finishing early
                }
            },
            'zen': {
                name: 'Zen Mode',
                description: 'Peaceful solving without timer or pressure',
                icon: '🧘',
                settings: {
                    hintsEnabled: true,
                    unlimitedHints: true,
                    timerEnabled: false,
                    mistakesLimit: null,
                    autoCheckErrors: true,
                    showCandidates: true,
                    highlightConflicts: true,
                    hideScore: true, // Don't show score
                    scoreMultiplier: 0.5
                }
            }
        };

        // Load saved data
        this.loadData();
    }

    /**
     * Get active preset
     */
    getActivePreset() {
        return this.activePreset || 'standard';
    }

    /**
     * Get preset settings
     */
    getPresetSettings(presetId) {
        // Check built-in presets
        if (this.builtInPresets[presetId]) {
            return this.builtInPresets[presetId].settings;
        }

        // Check custom presets
        if (this.customPresets && this.customPresets[presetId]) {
            return this.customPresets[presetId].settings;
        }

        // Default to standard
        return this.builtInPresets['standard'].settings;
    }

    /**
     * Get preset metadata
     */
    getPresetMetadata(presetId) {
        if (this.builtInPresets[presetId]) {
            return {
                id: presetId,
                ...this.builtInPresets[presetId],
                isBuiltIn: true
            };
        }

        if (this.customPresets && this.customPresets[presetId]) {
            return {
                id: presetId,
                ...this.customPresets[presetId],
                isBuiltIn: false
            };
        }

        return null;
    }

    /**
     * Get all presets (built-in + custom)
     */
    getAllPresets() {
        const presets = [];

        // Add built-in presets
        Object.keys(this.builtInPresets).forEach(id => {
            presets.push(this.getPresetMetadata(id));
        });

        // Add custom presets
        if (this.customPresets) {
            Object.keys(this.customPresets).forEach(id => {
                presets.push(this.getPresetMetadata(id));
            });
        }

        return presets;
    }

    /**
     * Activate a preset
     */
    activatePreset(presetId) {
        const preset = this.getPresetMetadata(presetId);
        if (!preset) {
            return { success: false, error: 'Preset not found' };
        }

        this.activePreset = presetId;
        this.saveData();

        return { success: true };
    }

    /**
     * Create custom preset
     */
    createCustomPreset(name, description, icon, settings) {
        if (!this.customPresets) {
            this.customPresets = {};
        }

        const id = 'custom-' + Date.now();

        this.customPresets[id] = {
            name: name,
            description: description,
            icon: icon || '⚙️',
            settings: settings,
            createdAt: Date.now()
        };

        this.saveData();

        return { success: true, presetId: id };
    }

    /**
     * Update custom preset
     */
    updateCustomPreset(presetId, name, description, icon, settings) {
        if (!this.customPresets || !this.customPresets[presetId]) {
            return { success: false, error: 'Custom preset not found' };
        }

        this.customPresets[presetId] = {
            ...this.customPresets[presetId],
            name: name,
            description: description,
            icon: icon,
            settings: settings,
            updatedAt: Date.now()
        };

        this.saveData();

        return { success: true };
    }

    /**
     * Delete custom preset
     */
    deleteCustomPreset(presetId) {
        if (!this.customPresets || !this.customPresets[presetId]) {
            return { success: false, error: 'Custom preset not found' };
        }

        // Can't delete if it's the active preset
        if (this.activePreset === presetId) {
            this.activePreset = 'standard';
        }

        delete this.customPresets[presetId];
        this.saveData();

        return { success: true };
    }

    /**
     * Duplicate preset
     */
    duplicatePreset(presetId) {
        const preset = this.getPresetMetadata(presetId);
        if (!preset) {
            return { success: false, error: 'Preset not found' };
        }

        const newName = preset.name + ' (Copy)';
        const result = this.createCustomPreset(
            newName,
            preset.description,
            preset.icon,
            { ...preset.settings }
        );

        return result;
    }

    /**
     * Export preset as JSON
     */
    exportPreset(presetId) {
        const preset = this.getPresetMetadata(presetId);
        if (!preset) {
            return null;
        }

        return JSON.stringify({
            name: preset.name,
            description: preset.description,
            icon: preset.icon,
            settings: preset.settings,
            exportedAt: Date.now(),
            version: this.STORAGE_VERSION
        }, null, 2);
    }

    /**
     * Import preset from JSON
     */
    importPreset(jsonString) {
        try {
            const data = JSON.parse(jsonString);

            // Validate structure
            if (!data.name || !data.settings) {
                return { success: false, error: 'Invalid preset format' };
            }

            // Create custom preset
            const result = this.createCustomPreset(
                data.name,
                data.description || 'Imported preset',
                data.icon || '📥',
                data.settings
            );

            return result;
        } catch (error) {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    /**
     * Get custom clue count for variant/difficulty
     */
    getCustomClueCount(variantId, difficulty) {
        if (!this.customClueCounts) return null;
        return this.customClueCounts[variantId]?.[difficulty] || null;
    }

    /**
     * Set custom clue count
     */
    setCustomClueCount(variantId, difficulty, count) {
        if (!this.customClueCounts) {
            this.customClueCounts = {};
        }

        if (!this.customClueCounts[variantId]) {
            this.customClueCounts[variantId] = {};
        }

        this.customClueCounts[variantId][difficulty] = count;
        this.saveData();
    }

    /**
     * Reset clue count to default
     */
    resetClueCount(variantId, difficulty) {
        if (!this.customClueCounts || !this.customClueCounts[variantId]) {
            return;
        }

        delete this.customClueCounts[variantId][difficulty];

        // Clean up empty objects
        if (Object.keys(this.customClueCounts[variantId]).length === 0) {
            delete this.customClueCounts[variantId];
        }

        this.saveData();
    }

    /**
     * Get effective clue count (custom or default)
     */
    getEffectiveClueCount(variantId, difficulty) {
        const custom = this.getCustomClueCount(variantId, difficulty);
        if (custom !== null) return custom;

        return this.defaultClueCounts[variantId]?.[difficulty] || 30;
    }

    /**
     * Get clue count range for variant/difficulty
     */
    getClueCountRange(variantId, difficulty) {
        const defaults = this.defaultClueCounts[variantId];
        if (!defaults) return { min: 17, max: 60 };

        const baseCount = defaults[difficulty];
        const min = Math.max(17, baseCount - 10);
        const max = Math.min(60, baseCount + 10);

        return { min, max, default: baseCount };
    }

    /**
     * Apply current settings to game
     */
    applySettingsToGame(sudokuEngine) {
        const settings = this.getPresetSettings(this.getActivePreset());

        // Apply hint settings
        if (settings.hintsEnabled !== undefined) {
            sudokuEngine.hintsEnabled = settings.hintsEnabled;
        }

        if (settings.maxHints !== undefined) {
            sudokuEngine.maxHints = settings.maxHints;
        }

        // Apply timer settings
        if (settings.timerEnabled !== undefined) {
            sudokuEngine.timerEnabled = settings.timerEnabled;
        }

        if (settings.timeLimit && sudokuEngine.currentDifficulty) {
            const timeLimit = settings.timeLimit[sudokuEngine.currentDifficulty];
            if (timeLimit) {
                sudokuEngine.timeLimit = timeLimit;
            }
        }

        // Apply error checking
        if (settings.autoCheckErrors !== undefined) {
            sudokuEngine.autoCheckErrors = settings.autoCheckErrors;
        }

        if (settings.mistakesLimit !== undefined) {
            sudokuEngine.mistakesLimit = settings.mistakesLimit;
        }

        // Apply UI settings
        if (settings.showCandidates !== undefined) {
            sudokuEngine.showCandidates = settings.showCandidates;
        }

        if (settings.highlightConflicts !== undefined) {
            sudokuEngine.highlightConflicts = settings.highlightConflicts;
        }

        // Apply score multiplier
        if (settings.scoreMultiplier !== undefined) {
            sudokuEngine.scoreMultiplier = settings.scoreMultiplier;
        }

        return settings;
    }

    /**
     * Save data to localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.STORAGE_VERSION,
                activePreset: this.activePreset || 'standard',
                customPresets: this.customPresets || {},
                customClueCounts: this.customClueCounts || {},
                lastUpdated: Date.now()
            }));
        } catch (error) {
            console.error('Failed to save customization data:', error);
        }
    }

    /**
     * Load data from localStorage
     */
    loadData() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (!saved) {
                console.log('No saved customization data found');
                this.activePreset = 'standard';
                this.customPresets = {};
                this.customClueCounts = {};
                return;
            }

            const data = JSON.parse(saved);

            // Check version compatibility
            if (data.version !== this.STORAGE_VERSION) {
                console.warn(`Customization storage version mismatch. Expected v${this.STORAGE_VERSION}, found v${data.version || 'none'}. Resetting data.`);
                this.activePreset = 'standard';
                this.customPresets = {};
                this.customClueCounts = {};
                return;
            }

            // Safe to load - versions match
            this.activePreset = data.activePreset || 'standard';
            this.customPresets = data.customPresets || {};
            this.customClueCounts = data.customClueCounts || {};

            console.log('✅ Customization data loaded successfully');
        } catch (error) {
            console.error('Failed to load customization data:', error);
            this.activePreset = 'standard';
            this.customPresets = {};
            this.customClueCounts = {};
        }
    }

    /**
     * Reset all data
     */
    resetData() {
        const confirmed = confirm('Are you sure you want to reset all customization settings? This cannot be undone.');
        if (confirmed) {
            this.activePreset = 'standard';
            this.customPresets = {};
            this.customClueCounts = {};
            this.saveData();
            console.log('✅ Customization settings have been reset');
            return true;
        }
        return false;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VariantCustomizationManager;
}
