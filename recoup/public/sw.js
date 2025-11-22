/**
 * Recoup Service Worker
 *
 * Provides offline support, caching, and background sync for PWA
 *
 * Features:
 * - Cache static assets (CSS, JS, images)
 * - Cache API responses with network-first strategy
 * - Offline fallback pages
 * - Background sync for failed requests
 * - Push notification handling
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `recoup-cache-${CACHE_VERSION}`;
const DATA_CACHE_NAME = `recoup-data-${CACHE_VERSION}`;

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/offline',
  '/manifest.json',
];

// API endpoints to cache (network-first strategy)
const CACHED_API_ENDPOINTS = [
  '/api/dashboard/summary',
  '/api/invoices',
  '/api/clients',
  '/api/analytics',
];

// ============================================================================
// INSTALL EVENT - Cache static assets
// ============================================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      // Activate immediately
      return self.skipWaiting();
    })
  );
});

// ============================================================================
// ACTIVATE EVENT - Clean up old caches
// ============================================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control immediately
      return self.clients.claim();
    })
  );
});

// ============================================================================
// FETCH EVENT - Network requests with caching strategies
// ============================================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API requests: Network-first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(request, DATA_CACHE_NAME)
    );
    return;
  }

  // Static assets: Cache-first, fallback to network
  event.respondWith(
    cacheFirstStrategy(request, CACHE_NAME)
  );
});

// ============================================================================
// CACHING STRATEGIES
// ============================================================================

/**
 * Network-first strategy
 * Try network first, fallback to cache if offline
 * Good for: API data that should be fresh
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache (offline):', request.url);
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline');
      if (offlinePage) return offlinePage;
    }

    throw error;
  }
}

/**
 * Cache-first strategy
 * Serve from cache if available, otherwise fetch from network
 * Good for: Static assets that rarely change
 */
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log('[SW] Serving from cache:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// ============================================================================
// BACKGROUND SYNC - Retry failed requests when back online
// ============================================================================
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  }

  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

async function syncInvoices() {
  console.log('[SW] Syncing invoices...');
  // Implement invoice sync logic
  // This would retry any failed invoice creation/updates
}

async function syncPayments() {
  console.log('[SW] Syncing payments...');
  // Implement payment sync logic
}

// ============================================================================
// PUSH NOTIFICATIONS - Handle push events
// ============================================================================
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      url: data.url || '/dashboard',
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png',
      },
    ],
    requireInteraction: data.requireInteraction || false,
    tag: data.tag || 'notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Recoup', options)
  );
});

// ============================================================================
// NOTIFICATION CLICK - Handle notification interactions
// ============================================================================
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  const urlToOpen = event.notification.data.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// ============================================================================
// MESSAGE - Handle messages from the app
// ============================================================================
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// ============================================================================
// PERIODIC BACKGROUND SYNC - Update data periodically (if supported)
// ============================================================================
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);

  if (event.tag === 'update-invoices') {
    event.waitUntil(updateInvoicesInBackground());
  }
});

async function updateInvoicesInBackground() {
  console.log('[SW] Updating invoices in background...');

  try {
    const response = await fetch('/api/invoices?limit=10');
    const data = await response.json();

    // Cache the fresh data
    const cache = await caches.open(DATA_CACHE_NAME);
    await cache.put('/api/invoices', new Response(JSON.stringify(data)));

    console.log('[SW] Invoices updated successfully');
  } catch (error) {
    console.error('[SW] Failed to update invoices:', error);
  }
}

console.log('[SW] Service worker loaded successfully');
