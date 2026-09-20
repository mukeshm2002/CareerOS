/**
 * EYTHU Progressive Web App — Service Worker
 *
 * Responsibilities:
 * 1. Static asset & offline fallback caching
 * 2. Secure Web Push notification handling
 * 3. Notification click navigation (internal routes only)
 *
 * NOTE: Authenticated API responses and personal data are NEVER cached in this service worker.
 */

const CACHE_NAME = 'eythu-static-v4';
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/favicon.png',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-512x512.png',
];

// Install Event: pre-cache static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate Event: purge stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch Event: network-first strategy for navigation, fallback to offline.html
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept or cache API requests or non-GET requests
  if (request.url.includes('/api/') || request.method !== 'GET') {
    return;
  }

  // Handle navigation requests (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }

  // Static assets: Stale-while-revalidate for cached static resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch update in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(request);
    })
  );
});

// Push Event: Handle incoming Web Push message
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'EYTHU Reminder', body: event.data.text() };
    }
  }

  const title = data.title || 'EYTHU Reminder';
  const options = {
    body: data.body || 'Time for your scheduled focus.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/app/today',
      type: data.type || 'REMINDER',
      notificationId: data.notificationId || null,
    },
    tag: data.notificationId || 'eythu-reminder',
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Event: Navigate safely to internal route
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const payloadData = event.notification.data || {};
  let targetPath = payloadData.url || '/app/today';

  // Ensure target URL is strictly an internal relative path
  if (!targetPath.startsWith('/')) {
    targetPath = '/app/today';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If an EYTHU window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(targetPath);
          return client.focus();
        }
      }
      // Otherwise open a new standalone window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetPath);
      }
    })
  );
});
