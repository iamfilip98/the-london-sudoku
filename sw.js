/**
 * Service Worker for The London Sudoku
 *
 * Provides offline support and caching for PWA functionality
 * - Caches critical assets (HTML, CSS, JS, fonts)
 * - Caches puzzle data for offline play
 * - Implements cache-first strategy for static assets
 * - Implements network-first strategy for API calls
 * - Queues failed API requests for retry when online
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `london-sudoku-${CACHE_VERSION}`;

// Assets to cache immediately on install
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/enhanced-design-system.css',
  '/css/battle-pass.css',
  '/css/leagues.css',
  '/css/lessons.css',
  '/js/app.js',
  '/js/sudoku.js',
  '/js/achievements.js',
  '/js/battle-pass.js',
  '/js/leagues.js',
  '/js/lessons.js',
  '/js/analytics.js',
  '/js/error-boundary.js',
  '/lib/monitoring.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// API endpoints to cache
const CACHEABLE_API_ENDPOINTS = [
  '/api/puzzles',
  '/api/achievements',
  '/api/stats'
];

// Maximum age for cached API responses (24 hours)
const API_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

/**
 * Install event - cache critical assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching critical assets');
        return cache.addAll(CRITICAL_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[ServiceWorker] Critical assets cached');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[ServiceWorker] Cache failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activated');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API requests with network-first strategy
 * Falls back to cache if offline
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful GET requests
    if (request.method === 'GET' && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', url.pathname);

    // Try cache as fallback
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Check if cached response is too old
      const cachedDate = cachedResponse.headers.get('date');
      if (cachedDate) {
        const age = Date.now() - new Date(cachedDate).getTime();
        if (age < API_CACHE_MAX_AGE) {
          console.log('[ServiceWorker] Serving from cache:', url.pathname);
          return cachedResponse;
        }
      }
    }

    // If POST/PUT/DELETE, queue for retry
    if (request.method !== 'GET') {
      await queueFailedRequest(request);
    }

    // Return offline response
    return new Response(
      JSON.stringify({
        offline: true,
        error: 'You are offline. This request will be retried when you reconnect.',
        timestamp: Date.now()
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handle static asset requests with cache-first strategy
 * Falls back to network if not in cache
 */
async function handleStaticRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    // Update cache in background if stale
    updateCacheInBackground(request);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;

  } catch (error) {
    console.log('[ServiceWorker] Both cache and network failed:', request.url);

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineCache = await caches.match('/offline.html');
      if (offlineCache) return offlineCache;
    }

    return new Response('Offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Update cache in background for stale assets
 */
function updateCacheInBackground(request) {
  fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, networkResponse);
        });
      }
    })
    .catch(() => {
      // Network failed, keep using cached version
    });
}

/**
 * Queue failed requests for retry when online
 */
async function queueFailedRequest(request) {
  try {
    const requestData = {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: request.method !== 'GET' ? await request.clone().text() : null,
      timestamp: Date.now()
    };

    // Store in IndexedDB (simplified - would use idb library in production)
    const db = await openDatabase();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    store.add(requestData);

    console.log('[ServiceWorker] Queued request for retry:', request.url);
  } catch (error) {
    console.error('[ServiceWorker] Failed to queue request:', error);
  }
}

/**
 * Open IndexedDB for request queue
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SudokuOfflineQueue', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'timestamp' });
      }
    };
  });
}

/**
 * Message handler for sync and other commands
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;

    case 'CLEAR_CACHE':
      clearCache();
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;

    default:
      console.log('[ServiceWorker] Unknown message type:', type);
  }
});

/**
 * Cache specific URLs on demand
 */
async function cacheUrls(urls) {
  const cache = await caches.open(CACHE_NAME);
  return cache.addAll(urls);
}

/**
 * Clear all caches
 */
async function clearCache() {
  const cacheNames = await caches.keys();
  return Promise.all(cacheNames.map(name => caches.delete(name)));
}

/**
 * Get total cache size
 */
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();

    for (const request of requests) {
      const response = await cache.match(request);
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }

  return totalSize;
}

/**
 * Background sync event (when connection is restored)
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync event:', event.tag);

  if (event.tag === 'sync-queued-requests') {
    event.waitUntil(syncQueuedRequests());
  }
});

/**
 * Sync all queued requests when back online
 */
async function syncQueuedRequests() {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(['queue'], 'readwrite');
    const store = transaction.objectStore('queue');
    const requests = await getAllFromStore(store);

    console.log(`[ServiceWorker] Syncing ${requests.length} queued requests`);

    for (const requestData of requests) {
      try {
        await fetch(requestData.url, {
          method: requestData.method,
          headers: requestData.headers,
          body: requestData.body
        });

        // Remove from queue on success
        store.delete(requestData.timestamp);
        console.log('[ServiceWorker] Synced request:', requestData.url);

      } catch (error) {
        console.error('[ServiceWorker] Failed to sync request:', requestData.url, error);
        // Keep in queue for next sync attempt
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
  }
}

/**
 * Get all items from IndexedDB store
 */
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

console.log('[ServiceWorker] Loaded');
