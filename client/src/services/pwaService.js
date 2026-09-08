/**
 * CareerOS Progressive Web App Client Service
 *
 * Handles:
 * - Service worker registration
 * - App update notifications
 * - Standalone display-mode detection
 * - BeforeInstallPrompt event management
 */

class PWAService {
  constructor() {
    this.deferredPrompt = null;
    this.installListeners = new Set();
    this.updateListeners = new Set();
    this.swRegistration = null;
    this.isUpdateAvailable = false;

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    // Check if running in standalone mode (installed PWA)
    this.isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://');

    // Capture install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.notifyInstallListeners(true);
    });

    // App installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isStandaloneMode = true;
      this.notifyInstallListeners(false);
    });

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            this.swRegistration = registration;

            // Check for worker updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    this.isUpdateAvailable = true;
                    this.notifyUpdateListeners(true);
                  }
                });
              }
            });
          })
          .catch((err) => {
            console.warn('[PWA] Service worker registration failed:', err.message);
          });
      });
    }
  }

  isStandalone() {
    if (typeof window === 'undefined') return false;
    return (
      this.isStandaloneMode ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  }

  canInstall() {
    return !this.isStandalone() && this.deferredPrompt !== null;
  }

  async promptInstall() {
    if (!this.deferredPrompt) {
      return { outcome: 'unavailable' };
    }

    this.deferredPrompt.prompt();
    const choiceResult = await this.deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      this.deferredPrompt = null;
      this.notifyInstallListeners(false);
    }
    return choiceResult;
  }

  updateApp() {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  onInstallChange(callback) {
    this.installListeners.add(callback);
    callback(this.canInstall());
    return () => this.installListeners.delete(callback);
  }

  onUpdateChange(callback) {
    this.updateListeners.add(callback);
    callback(this.isUpdateAvailable);
    return () => this.updateListeners.delete(callback);
  }

  notifyInstallListeners(canInstall) {
    this.installListeners.forEach((cb) => cb(canInstall));
  }

  notifyUpdateListeners(hasUpdate) {
    this.updateListeners.forEach((cb) => cb(hasUpdate));
  }
}

export const pwaService = new PWAService();
