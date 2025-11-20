/* eslint-disable no-restricted-globals */
// Service Worker for King Ice Quiz App
// Version: 3.0.0 - Push Notifications Enabled
// Cache Strategy: Network First for APIs, Cache First for static assets

const CACHE_NAME = 'king-ice-quiz-v3.0.0';
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
self.addEventListener('install', (event) => {
  console.log('🟢 Service Worker: Installing King Ice Quiz App...');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('📦 Service Worker: Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        console.log('⚡ Service Worker: Installation complete - skipping waiting');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  console.log('🟢 Service Worker: King Ice Quiz App activated');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
              console.log('🗑️ Service Worker: Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('👑 Service Worker: Now controlling all clients');
        return self.clients.claim();
      })
  );
});

// ==================== PUSH NOTIFICATIONS ====================
// Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received', event);
  
  if (!event.data) {
    console.log('❌ Push event has no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
    console.log('📨 Push notification data:', data);
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
    // Try to get text data as fallback
    data = {
      title: 'King Ice Quiz',
      body: event.data.text() || 'New notification',
      icon: '/brain-icon.png'
    };
  }

  const options = {
    body: data.body || 'New notification from King Ice Quiz',
    icon: data.icon || '/brain-icon.png',
    badge: '/brain-icon.png',
    image: data.image || null,
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      quizId: data.quizId,
      timestamp: data.timestamp || new Date().toISOString()
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss', 
        title: 'Dismiss'
      }
    ],
    tag: data.type || 'general',
    renotify: true,
    requireInteraction: false
  };

  console.log('🔄 Showing notification with options:', options);

  event.waitUntil(
    self.registration.showNotification(data.title || 'King Ice Quiz', options)
      .then(() => {
        console.log('✅ Notification shown successfully');
      })
      .catch(error => {
        console.error('❌ Failed to show notification:', error);
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.data);
  
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Check if app is already open
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🔍 Found existing client, focusing:', client.url);
            return client.focus();
          }
        }
        
        // Open new window if app isn't open
        if (clients.openWindow) {
          console.log('🪟 Opening new window:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(error => {
        console.error('❌ Error handling notification click:', error);
      })
  );
});

// Handle notification dismiss
self.addEventListener('notificationclose', (event) => {
  console.log('❌ Notification dismissed:', event.notification.data);
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  // API REQUESTS - Network first
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  // STATIC ASSETS - Cache first
  if (requestUrl.pathname.startsWith('/static/') || 
      requestUrl.pathname.endsWith('.png') ||
      requestUrl.pathname.endsWith('.jpg') ||
      requestUrl.pathname.endsWith('.css') ||
      requestUrl.pathname.endsWith('.js')) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

  // HTML PAGES - Network first
  event.respondWith(networkFirstStrategy(event.request));
});

// ==================== STRATEGIES ====================
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('🌐 Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      console.log('💾 Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.error('❌ Both network and cache failed for:', request.url);
    return new Response('You are offline and this content is not cached.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.status === 200) {
      const responseClone = networkResponse.clone();
      caches.open(CACHE_NAME).then((cache) => {
        cache.put(request, responseClone);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Failed to fetch:', request.url, error);
    
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
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    console.log('🔄 Background sync triggered for messages');
    event.waitUntil(syncOfflineMessages());
  }
  
  if (event.tag === 'background-sync-notifications') {
    console.log('🔄 Background sync for notifications');
    event.waitUntil(syncPendingNotifications());
  }
});

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('⏩ Skipping waiting phase');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_STATUS') {
    caches.has(CACHE_NAME).then((hasCache) => {
      event.ports[0].postMessage({
        type: 'CACHE_STATUS',
        hasCache: hasCache
      });
    });
  }

  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('Test from Service Worker', {
      body: 'This is a test notification from the service worker!',
      icon: '/brain-icon.png',
      badge: '/brain-icon.png'
    });
  }
});

// ==================== HELPER FUNCTIONS ====================
async function syncOfflineMessages() {
  console.log('🔄 Syncing offline messages...');
  // Implement offline message sync logic here
  return Promise.resolve();
}

async function syncPendingNotifications() {
  console.log('🔄 Syncing pending notifications...');
  // Implement notification sync logic here
  return Promise.resolve();
}

console.log('👑 King Ice Quiz Service Worker v3.0.0 loaded successfully!');