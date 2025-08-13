// Service Worker for FLEEKS PWA
const CACHE_NAME = 'fleeks-v1';
const STATIC_CACHE = 'fleeks-static-v1';
const DYNAMIC_CACHE = 'fleeks-dynamic-v1';

// キャッシュするファイル
const urlsToCache = [
  '/',
  '/education',
  '/offline.html',
  '/manifest.json'
];

// インストール時の処理
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時の処理
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map(cacheName => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時の処理
self.addEventListener('fetch', event => {
  const { request } = event;

  // APIリクエストの処理
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // 成功したAPIレスポンスをキャッシュ
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          return caches.match(request);
        })
    );
    return;
  }

  // 静的リソースの処理
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          // キャッシュがあればそれを返す
          return response;
        }

        // キャッシュがなければネットワークから取得
        return fetch(request).then(response => {
          // 404の場合は何もしない
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // レスポンスをキャッシュに保存
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
      .catch(() => {
        // オフライン時のフォールバック
        if (request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forum-posts') {
    event.waitUntil(syncForumPosts());
  }
});

// プッシュ通知の処理
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : '新しいお知らせがあります',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '表示',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('FLEEKS', options)
  );
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// フォーラム投稿の同期
async function syncForumPosts() {
  try {
    const cache = await caches.open('fleeks-pending-posts');
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      const data = await response.json();
      
      // サーバーに送信
      const serverResponse = await fetch('/api/forum/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (serverResponse.ok) {
        // 成功したら削除
        await cache.delete(request);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}