// Service Worker for Fleeks PWA
const CACHE_NAME = 'fleeks-v1';
const urlsToCache = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/_next/static/js/app.js',
];

// AI Model caches
const MODEL_CACHE = 'fleeks-ai-models-v1';
const modelUrls = [
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/handpose',
  'https://cdn.jsdelivr.net/npm/@tensorflow-models/facemesh',
  'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh',
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      }),
      caches.open(MODEL_CACHE).then((cache) => {
        return cache.addAll(modelUrls);
      }),
    ])
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== MODEL_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Handle AI model requests
  if (event.request.url.includes('tensorflow') || 
      event.request.url.includes('mediapipe')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(MODEL_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
    );
    return;
  }

  // Handle API requests - network first, fallback to cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Handle other requests - cache first, fallback to network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-user-preferences') {
    event.waitUntil(syncUserPreferences());
  }
  if (event.tag === 'sync-ai-learning') {
    event.waitUntil(syncAILearning());
  }
});

async function syncUserPreferences() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const requests = await cache.keys();
    const preferencesRequests = requests.filter(req => 
      req.url.includes('/api/preferences')
    );
    
    for (const request of preferencesRequests) {
      const response = await cache.match(request);
      if (response) {
        const data = await response.json();
        await fetch('/api/preferences/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

async function syncAILearning() {
  try {
    // Sync AI learning data when back online
    const db = await openDB();
    const tx = db.transaction(['ai-patterns'], 'readonly');
    const store = tx.objectStore('ai-patterns');
    const patterns = await store.getAll();
    
    if (patterns.length > 0) {
      await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patterns }),
      });
      
      // Clear synced patterns
      const clearTx = db.transaction(['ai-patterns'], 'readwrite');
      await clearTx.objectStore('ai-patterns').clear();
    }
  } catch (error) {
    console.error('AI sync failed:', error);
  }
}

// Push notifications for personalized updates
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New beauty recommendations for you!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/icons/checkmark.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('Fleeks Beauty', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://fleeks.com/recommendations')
    );
  }
});