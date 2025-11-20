/* eslint-disable no-restricted-globals */
// Service Worker for King Ice Quiz App - Push Notifications
const CACHE_NAME = 'king-ice-quiz-push-v1';
const APP_SHELL_CACHE = 'app-shell-v1';

// URLs to cache
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
  console.log('🟢 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('📦 Caching app shell');
        return cache.addAll(APP_SHELL_URLS);
      })
      .then(() => {
        console.log('⚡ Installation complete - skipping waiting');
        return self.skipWaiting();
      })
  );
});

// ==================== ACTIVATE EVENT ====================
self.addEventListener('activate', (event) => {
  console.log('🟢 Service Worker: Activated');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== APP_SHELL_CACHE) {
              console.log('🗑️ Removing old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('👑 Service Worker ready for push notifications');
        return self.clients.claim();
      })
  );
});

// ==================== PUSH NOTIFICATIONS ====================
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received', event);
  
  if (!event.data) {
    console.log('❌ Push event has no data');
    return;
  }
  
  let data;
  try {
    data = event.data.json();
    console.log('📨 Push data:', data);
  } catch (error) {
    console.error('❌ Error parsing push data:', error);
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
    vibrate: data.vibrate || [200, 100, 200],
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      roomId: data.roomId,
      sender: data.sender,
      timestamp: data.timestamp || new Date().toISOString()
    },
    actions: data.actions || [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    tag: data.tag || `notification-${Date.now()}`,
    renotify: true,
    requireInteraction: false
  };

  console.log('🔄 Showing notification:', options);

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
        for (let client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            console.log('🔍 Focusing existing client');
            return client.focus();
          }
        }
        
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
  console.log('❌ Notification dismissed');
});

// ==================== FETCH EVENT ====================
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/static/') || 
      requestUrl.pathname.endsWith('.png') ||
      requestUrl.pathname.endsWith('.jpg') ||
      requestUrl.pathname.endsWith('.css') ||
      requestUrl.pathname.endsWith('.js')) {
    event.respondWith(cacheFirstStrategy(event.request));
    return;
  }

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
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('You are offline', {
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
    return new Response('Resource not available offline', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

// ==================== MESSAGE HANDLING ====================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('👑 King Ice Quiz Service Worker loaded - Push Ready!');