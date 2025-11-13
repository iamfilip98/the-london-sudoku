/**
 * Cookie Consent Manager - GDPR Compliant
 * Handles cookie consent banner and user preferences
 */

class CookieConsent {
    constructor() {
        this.consentKey = 'sudoku_cookie_consent';
        this.preferencesKey = 'sudoku_cookie_preferences';
        this.defaultPreferences = {
            necessary: true,      // Always on
            analytics: false,     // PostHog
            functional: false     // User preferences, themes, etc.
        };

        this.init();
    }

    init() {
        // Check if consent has been given
        const consent = this.getConsent();

        if (!consent) {
            // Show banner after a short delay
            setTimeout(() => this.showBanner(), 1000);
        } else {
            // Apply saved preferences
            this.applyPreferences();
        }
    }

    showBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.classList.add('show');
        }
    }

    hideBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) {
            banner.classList.remove('show');
        }
    }

    acceptAll() {
        const preferences = {
            necessary: true,
            analytics: true,
            functional: true
        };

        this.saveConsent(preferences);
        this.hideBanner();
        this.applyPreferences();

        // Track consent acceptance
        if (window.Monitoring) {
            window.Monitoring.trackEvent('cookie_consent_accepted', { type: 'accept_all' });
        }
    }

    declineAll() {
        const preferences = {
            necessary: true,      // Can't disable necessary
            analytics: false,
            functional: false
        };

        this.saveConsent(preferences);
        this.hideBanner();
        this.applyPreferences();

        // Track consent decline
        if (window.Monitoring) {
            window.Monitoring.trackEvent('cookie_consent_declined', { type: 'decline_all' });
        }
    }

    showSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.add('show');

            // Load current preferences
            const preferences = this.getPreferences();
            document.getElementById('analyticsToggle').checked = preferences.analytics;
            document.getElementById('functionalToggle').checked = preferences.functional;
        }
    }

    hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (modal) {
            modal.classList.remove('show');
        }
    }

    saveSettings() {
        const preferences = {
            necessary: true,      // Always on
            analytics: document.getElementById('analyticsToggle').checked,
            functional: document.getElementById('functionalToggle').checked
        };

        this.saveConsent(preferences);
        this.hideSettings();
        this.hideBanner();
        this.applyPreferences();

        // Track custom settings
        if (window.Monitoring && preferences.analytics) {
            window.Monitoring.trackEvent('cookie_consent_customized', preferences);
        }
    }

    saveConsent(preferences) {
        localStorage.setItem(this.consentKey, 'true');
        localStorage.setItem(this.preferencesKey, JSON.stringify(preferences));
    }

    getConsent() {
        return localStorage.getItem(this.consentKey) === 'true';
    }

    getPreferences() {
        const saved = localStorage.getItem(this.preferencesKey);
        return saved ? JSON.parse(saved) : this.defaultPreferences;
    }

    applyPreferences() {
        const preferences = this.getPreferences();

        // Apply analytics preference
        if (!preferences.analytics && window.posthog) {
            window.posthog.opt_out_capturing();
        } else if (preferences.analytics && window.posthog) {
            window.posthog.opt_in_capturing();
        }

        // Apply functional preferences
        if (!preferences.functional) {
            // Clear non-essential localStorage items
            const keysToKeep = [this.consentKey, this.preferencesKey, 'sudokuAuth', 'currentPlayer', 'clerk_token'];
            Object.keys(localStorage).forEach(key => {
                if (!keysToKeep.includes(key)) {
                    // Don't remove, just note it
                    console.info('Functional cookies disabled');
                }
            });
        }
    }

    reset() {
        localStorage.removeItem(this.consentKey);
        localStorage.removeItem(this.preferencesKey);
        window.location.reload();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.cookieConsent = new CookieConsent();
    });
} else {
    window.cookieConsent = new CookieConsent();
}
