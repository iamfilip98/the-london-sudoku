/**
 * PWA Manager
 *
 * Handles Progressive Web App functionality:
 * - Service worker registration
 * - Install prompt handling
 * - Offline/online detection
 * - Update notifications
 * - Cache management
 */

class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.updateAvailable = false;

    this.init();
  }

  /**
   * Initialize PWA manager
   */
  async init() {
    // Check if already installed
    this.checkIfInstalled();

    // Register service worker
    if ('serviceWorker' in navigator) {
      await this.registerServiceWorker();
    }

    // Setup offline/online listeners
    this.setupConnectionListeners();

    // Setup install prompt listener
    this.setupInstallPrompt();

    // Setup update listener
    this.setupUpdateListener();

  }

  /**
   * Check if app is installed
   */
  checkIfInstalled() {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      this.isInstalled = true;
    }
  }

  /**
   * Register service worker
   */
  async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      this.serviceWorker = registration;

      // Check for updates
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

      return registration;

    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle service worker update
   */
  handleServiceWorkerUpdate(registration) {
    const newWorker = registration.installing;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New version available
        this.updateAvailable = true;
        this.showUpdateNotification();
      }
    });
  }

  /**
   * Show update notification
   */
  showUpdateNotification() {
    // Create update banner
    const banner = document.createElement('div');
    banner.id = 'pwa-update-banner';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: 'Roboto', sans-serif;
      animation: slideDown 0.3s ease-out;
    `;

    banner.innerHTML = `
      <span>✨ New version available!</span>
      <button
        id="pwa-update-button"
        style="
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          font-weight: 500;
        "
      >
        Update Now
      </button>
      <button
        id="pwa-update-dismiss"
        style="
          background: none;
          border: none;
          color: white;
          font-size: 20px;
          cursor: pointer;
          opacity: 0.7;
        "
      >
        ×
      </button>
    `;

    document.body.appendChild(banner);

    // Update button handler
    document.getElementById('pwa-update-button').addEventListener('click', () => {
      this.applyUpdate();
    });

    // Dismiss button handler
    document.getElementById('pwa-update-dismiss').addEventListener('click', () => {
      banner.remove();
    });
  }

  /**
   * Apply service worker update
   */
  applyUpdate() {
    if (this.serviceWorker && this.serviceWorker.waiting) {
      // Tell service worker to skip waiting
      this.serviceWorker.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload page when new service worker activates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Setup install prompt
   */
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (event) => {
      // Prevent default install prompt
      event.preventDefault();

      // Store event for later use
      this.deferredPrompt = event;


      // Show custom install button
      this.showInstallButton();
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallButton();

      // Track installation
      if (window.Monitoring) {
        window.Monitoring.trackEvent('pwa_installed', {
          platform: this.getPlatform(),
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Show install button
   */
  showInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-install-button')) {
      return;
    }

    // Create install button
    const button = document.createElement('button');
    button.id = 'pwa-install-button';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 16px 24px;
      border-radius: 12px;
      cursor: pointer;
      font-family: 'Orbitron', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: slideUp 0.3s ease-out;
    `;

    button.innerHTML = `
      <span style="font-size: 20px;">📱</span>
      <span>Install App</span>
    `;

    button.addEventListener('click', () => {
      this.promptInstall();
    });

    document.body.appendChild(button);
  }

  /**
   * Hide install button
   */
  hideInstallButton() {
    const button = document.getElementById('pwa-install-button');
    if (button) {
      button.remove();
    }
  }

  /**
   * Prompt user to install app
   */
  async promptInstall() {
    if (!this.deferredPrompt) {
      return;
    }

    // Show install prompt
    this.deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await this.deferredPrompt.userChoice;


    // Track prompt outcome
    if (window.Monitoring) {
      window.Monitoring.trackEvent('pwa_install_prompt', {
        outcome,
        platform: this.getPlatform()
      });
    }

    // Clear deferred prompt
    this.deferredPrompt = null;

    // Hide install button if accepted
    if (outcome === 'accepted') {
      this.hideInstallButton();
    }
  }

  /**
   * Setup connection listeners
   */
  setupConnectionListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.showConnectionStatus('online');
      this.syncQueuedRequests();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.showConnectionStatus('offline');
    });

    // Show initial status if offline
    if (!this.isOnline) {
      this.showConnectionStatus('offline');
    }
  }

  /**
   * Show connection status indicator
   */
  showConnectionStatus(status) {
    // Remove existing indicator
    const existing = document.getElementById('pwa-connection-status');
    if (existing) {
      existing.remove();
    }

    // Create status indicator
    const indicator = document.createElement('div');
    indicator.id = 'pwa-connection-status';
    indicator.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: ${status === 'online' ? '#10b981' : '#ef4444'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      z-index: 10000;
      font-family: 'Roboto', sans-serif;
      font-size: 14px;
      animation: slideDown 0.3s ease-out;
    `;

    indicator.textContent = status === 'online' ? '✅ Back online' : '⚠️ You are offline';

    document.body.appendChild(indicator);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      indicator.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => indicator.remove(), 300);
    }, 3000);
  }

  /**
   * Sync queued requests
   */
  async syncQueuedRequests() {
    if ('serviceWorker' in navigator && 'sync' in registration) {
      try {
        await this.serviceWorker.sync.register('sync-queued-requests');
      } catch (error) {
      }
    }
  }

  /**
   * Get platform info
   */
  getPlatform() {
    const ua = navigator.userAgent;

    if (/android/i.test(ua)) {
      return 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      return 'ios';
    } else if (/Windows/.test(ua)) {
      return 'windows';
    } else if (/Mac/.test(ua)) {
      return 'mac';
    } else if (/Linux/.test(ua)) {
      return 'linux';
    }

    return 'unknown';
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls) {
    if (this.serviceWorker) {
      this.serviceWorker.active.postMessage({
        type: 'CACHE_URLS',
        data: { urls }
      });
    }
  }

  /**
   * Clear all caches
   */
  async clearCache() {
    if (this.serviceWorker) {
      this.serviceWorker.active.postMessage({ type: 'CLEAR_CACHE' });
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize() {
    return new Promise((resolve) => {
      if (!this.serviceWorker) {
        resolve(0);
        return;
      }

      const channel = new MessageChannel();

      channel.port1.onmessage = (event) => {
        resolve(event.data.size);
      };

      this.serviceWorker.active.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [channel.port2]
      );
    });
  }

  /**
   * Get PWA status
   */
  getStatus() {
    return {
      isInstalled: this.isInstalled,
      isOnline: this.isOnline,
      updateAvailable: this.updateAvailable,
      serviceWorkerActive: !!this.serviceWorker,
      platform: this.getPlatform()
    };
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      transform: translate(-50%, -100px);
      opacity: 0;
    }
    to {
      transform: translate(-50%, 0);
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(-100px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize PWA Manager
const pwaManager = new PWAManager();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PWAManager;
}

// Make available globally
window.PWAManager = pwaManager;
