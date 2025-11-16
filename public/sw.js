/* eslint-disable no-restricted-globals */
// Service Worker for King Ice Quiz App
// Version: 2.1.0
// Cache Strategy: Network First for APIs, Cache First for static assets

const CACHE_NAME = 'king-ice-quiz-v2.1.0';
const APP_SHELL_CACHE = 'app-shell-v1';

// URLs to cache immediately on install (App Shell)
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/brain-icon.png',
  '/favicon.ico'
];

// ==================== INSTALL EVENT ====================
// Fired when the service worker is first installed
self.addEventListener('install', (event) => {
  console.log('🟢 Service Worker: Installing King Ice Quiz App...');
  
  // Pre-cache the app shell (essential files for offline functionality)
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        console.log('⚡ Service Worker: Installation complete - skipping waiting');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// ==================== ACTIVATE EVENT ====================
// Fired when the service worker becomes active
self.addEventListener('activate', (event) => {
  console.log('🟢 Service Worker: King Ice Quiz App activated');
  
  event.waitUntil(
    // Clean up old caches
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any old caches that aren't current
            if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
              console.log('🗑️ Service Worker: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('👑 Service Worker: Now controlling all clients');
        // Take immediate control of all pages
        return self.clients.claim();
      })
  );
});

// ==================== FETCH EVENT ====================
// Intercepts all network requests from the app
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // ========== API REQUESTS ==========
  // For dynamic data (quizzes, users, chat), try network first
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(
      networkFirstStrategy(event.request)
    );
    return;
  }

  // ========== STATIC ASSETS ==========
  // For CSS, JS, images, use cache first for performance
  if (requestUrl.pathname.startsWith('/static/') || 
      requestUrl.pathname.endsWith('.png') ||
      requestUrl.pathname.endsWith('.jpg') ||
      requestUrl.pathname.endsWith('.css') ||
      requestUrl.pathname.endsWith('.js')) {
    event.respondWith(
      cacheFirstStrategy(event.request)
    );
    return;
  }

  // ========== HTML PAGES ==========
  // For navigation requests, use network first but fall back to cache
  event.respondWith(
    networkFirstStrategy(event.request)
  );
});

// ==================== STRATEGIES ====================

/**
 * Network First Strategy - For dynamic content
 * Try network first, fall back to cache if offline
 */
async function networkFirstStrategy(request) {
  try {
    // First, try to get fresh data from network
    const networkResponse = await fetch(request);
    
    // If successful, cache the response for future offline use
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed - try to serve from cache
    console.log('🌐 Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    // If not in cache either, return error or offline page
    console.error('❌ Both network and cache failed for:', request.url);
    return new Response('You are offline and this content is not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

/**
 * Cache First Strategy - For static assets
 * Try cache first, fall back to network if not cached
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Serve from cache
    return cachedResponse;
  }
  
  try {
    // Not in cache - fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the new response for future visits
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    // Both cache and network failed
    console.error('❌ Failed to fetch:', request.url, error);
    
    // For images, return a placeholder
    if (request.url.match(/\.(png|jpg|jpeg|gif)$/)) {
      return new Response(
        '<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e2e8f0"/><text x="50" y="50" font-family="Arial" font-size="10" text-anchor="middle" fill="#4a5568">Image</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    return new Response('Resource not available offline.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ==================== BACKGROUND SYNC ====================
// Handle background sync for offline actions (future enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    console.log('🔄 Background sync triggered for messages');
    event.waitUntil(syncOfflineMessages());
  }
});

// ==================== PUSH NOTIFICATIONS ====================
// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from King Ice Quiz',
    icon: '/brain-icon.png',
    badge: '/brain-icon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'King Ice Quiz', options)
  );
});

// ==================== NOTIFICATION CLICK ====================
// Handle when user clicks on notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing app window or open new one
      for (const client of clientList) {
        if (client.url === event.notification.data.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});

// ==================== MESSAGE HANDLING ====================
// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Skipping waiting phase');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    // Report cache status back to app
    caches.has(CACHE_NAME).then((hasCache) => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        hasCache: hasCache
      });
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Sync offline messages when coming back online
 */
async function syncOfflineMessages() {
  // Future: Sync any pending chat messages or quiz results
  console.log('🔄 Syncing offline data...');
  return Promise.resolve();
}

/**
 * Pre-cache additional resources in background
 */
async function precacheAdditionalResources() {
  // Future: Pre-cache popular quizzes or user data
  console.log('📚 Pre-caching additional resources...');
}

console.log('👑 King Ice Quiz Service Worker loaded successfully!');