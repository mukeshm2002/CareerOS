import api from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

class PushNotificationService {
  isSupported() {
    if (typeof window === 'undefined') return false;
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  async getStatus() {
    const response = await api.get('/push/status');
    return response.data;
  }

  async getCurrentBrowserSubscription() {
    if (!this.isSupported()) return null;
    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (err) {
      console.warn('[PUSH] Failed to get browser subscription:', err);
      return null;
    }
  }

  async isSubscribedOnThisDevice() {
    const sub = await this.getCurrentBrowserSubscription();
    return sub !== null;
  }

  /**
   * Explicit user-initiated push subscription
   * Must only be called from an explicit button click
   */
  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported by this browser.');
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      const err = new Error(
        permission === 'denied'
          ? 'Notifications are blocked in your browser settings.'
          : 'Notification permission was not granted.'
      );
      err.code = permission === 'denied' ? 'PERMISSION_DENIED' : 'PERMISSION_DISMISSED';
      throw err;
    }

    // 2. Ready service worker
    const registration = await navigator.serviceWorker.ready;

    // 3. Get VAPID key
    let vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      const statusRes = await this.getStatus();
      vapidPublicKey = statusRes?.data?.vapidPublicKey;
    }

    if (!vapidPublicKey) {
      throw new Error('VAPID public key is not available on server or client.');
    }

    // 4. Subscribe via PushManager
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
    }

    // 5. Send to backend
    const rawSub = subscription.toJSON();
    const payload = {
      endpoint: rawSub.endpoint,
      keys: {
        p256dh: rawSub.keys?.p256dh,
        auth: rawSub.keys?.auth,
      },
      userAgent: navigator.userAgent,
    };

    const res = await api.post('/push/subscribe', payload);
    return res.data;
  }

  /**
   * Unsubscribe this device from push notifications
   */
  async unsubscribe() {
    if (!this.isSupported()) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        await api.delete('/push/unsubscribe', { data: { endpoint } });
      }
    } catch (err) {
      console.warn('[PUSH] Unsubscribe error:', err);
    }
  }

  async sendTestNotification() {
    const res = await api.post('/push/test');
    return res.data;
  }

  async listSubscriptions() {
    const res = await api.get('/push/subscriptions');
    return res.data;
  }

  async deleteSubscription(id) {
    const res = await api.delete(`/push/subscriptions/${id}`);
    return res.data;
  }
}

export const pushNotificationService = new PushNotificationService();
