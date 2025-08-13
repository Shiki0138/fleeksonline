# PWA（Progressive Web App）実装提案書

## 概要
FLEEKSをPWA化することで、ネイティブアプリのような体験を提供し、ユーザーエンゲージメントを向上させます。

## PWA化のメリット

### ユーザー側のメリット
- **オフライン対応**: 記事やコンテンツをオフラインでも閲覧可能
- **高速起動**: アプリアイコンからワンタップで起動
- **プッシュ通知**: フォーラムの回答やお知らせをリアルタイムで受信
- **省データ通信**: キャッシュ活用で通信量削減
- **ホーム画面追加**: スマホのホーム画面にアイコン設置

### ビジネス側のメリット
- **開発コスト削減**: iOS/Android別々の開発不要
- **更新の即時反映**: アプリストア審査不要
- **エンゲージメント向上**: プッシュ通知でリテンション改善
- **SEO効果**: PWAはSEOにも有利

## 主要機能実装

### 1. Service Worker 実装
```javascript
// service-worker.js
const CACHE_NAME = 'fleeks-v1';
const urlsToCache = [
  '/',
  '/education',
  '/static/css/main.css',
  '/static/js/main.js',
  '/offline.html'
];

// インストール時のキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// オフライン対応
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then(response => {
            // 動的にキャッシュを追加
            if (!response || response.status !== 200) {
              return response;
            }
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            return response;
          });
      })
      .catch(() => {
        // オフライン時のフォールバック
        return caches.match('/offline.html');
      })
  );
});

// バックグラウンド同期
self.addEventListener('sync', event => {
  if (event.tag === 'sync-forum-posts') {
    event.waitUntil(syncForumPosts());
  }
});
```

### 2. マニフェストファイル
```json
{
  "name": "FLEEKS - 美容師のための学習プラットフォーム",
  "short_name": "FLEEKS",
  "description": "美容師のためのオンライン教育・コミュニティプラットフォーム",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#7c3aed",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/home.png",
      "sizes": "1080x1920",
      "type": "image/png"
    },
    {
      "src": "/screenshots/education.png",
      "sizes": "1080x1920",
      "type": "image/png"
    }
  ],
  "categories": ["education", "business"],
  "shortcuts": [
    {
      "name": "教育コンテンツ",
      "short_name": "学習",
      "description": "教育記事を読む",
      "url": "/education",
      "icons": [{ "src": "/icons/education.png", "sizes": "96x96" }]
    },
    {
      "name": "フォーラム",
      "short_name": "Q&A",
      "description": "質問・回答する",
      "url": "/forum",
      "icons": [{ "src": "/icons/forum.png", "sizes": "96x96" }]
    }
  ]
}
```

### 3. プッシュ通知実装

#### 通知の許可取得
```javascript
// components/PushNotificationManager.tsx
import { useEffect } from 'react';

export function PushNotificationManager() {
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          subscribeUserToPush();
        }
      });
    }
  }, []);

  const subscribeUserToPush = async () => {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY)
    });

    // サーバーに購読情報を送信
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
  };

  return null;
}
```

#### 通知送信（サーバー側）
```javascript
// api/notifications/send.ts
import webpush from 'web-push';

export async function sendPushNotification(userId: string, notification: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}) {
  // ユーザーの購読情報を取得
  const subscription = await getSubscription(userId);
  
  if (subscription) {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: notification.title,
        body: notification.body,
        icon: notification.icon || '/icons/icon-192x192.png',
        badge: notification.badge || '/icons/badge-72x72.png',
        data: notification.data,
        actions: [
          {
            action: 'view',
            title: '表示'
          },
          {
            action: 'dismiss',
            title: '閉じる'
          }
        ]
      })
    );
  }
}
```

### 4. オフライン対応

#### 記事のオフライン保存
```javascript
// hooks/useOfflineArticles.ts
export function useOfflineArticles() {
  const saveArticleOffline = async (articleId: string, content: string) => {
    const cache = await caches.open('fleeks-articles-v1');
    const response = new Response(JSON.stringify({
      id: articleId,
      content: content,
      savedAt: new Date().toISOString()
    }));
    await cache.put(`/offline/articles/${articleId}`, response);
  };

  const getOfflineArticles = async () => {
    const cache = await caches.open('fleeks-articles-v1');
    const keys = await cache.keys();
    const articles = [];
    
    for (const request of keys) {
      if (request.url.includes('/offline/articles/')) {
        const response = await cache.match(request);
        const data = await response.json();
        articles.push(data);
      }
    }
    
    return articles;
  };

  return { saveArticleOffline, getOfflineArticles };
}
```

### 5. インストール促進UI

```javascript
// components/InstallPrompt.tsx
import { useState, useEffect } from 'react';
import { Button, Snackbar } from '@mui/material';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // iOS Safari対応
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && !isInStandaloneMode) {
      setShowInstallPrompt(true);
    }
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('PWA installed');
      }
      setDeferredPrompt(null);
    }
    setShowInstallPrompt(false);
  };

  return (
    <Snackbar
      open={showInstallPrompt}
      message="FLEEKSをホーム画面に追加して、アプリのように使用できます"
      action={
        <Button color="secondary" size="small" onClick={handleInstall}>
          インストール
        </Button>
      }
    />
  );
}
```

### 6. パフォーマンス最適化

#### アプリシェル戦略
```javascript
// pages/_app.tsx
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Service Worker登録
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js');
    }

    // アプリシェルのプリキャッシュ
    if ('caches' in window) {
      caches.open('fleeks-shell-v1').then(cache => {
        cache.addAll([
          '/shell/header',
          '/shell/navigation',
          '/shell/footer'
        ]);
      });
    }
  }, []);

  return <Component {...pageProps} />;
}
```

## Next.js 14での実装

### 1. next.config.js の設定
```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.fleeks\.jp\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'fleeks-api-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 // 24時間
        }
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fleeks-image-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30 // 30日
        }
      }
    }
  ]
});

module.exports = withPWA({
  // 既存のNext.js設定
});
```

### 2. メタデータの設定
```javascript
// app/layout.tsx
export const metadata = {
  title: 'FLEEKS',
  description: '美容師のための学習プラットフォーム',
  manifest: '/manifest.json',
  themeColor: '#7c3aed',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FLEEKS'
  }
};
```

## 実装スケジュール

### Phase 1（1週間）
- Service Worker基本実装
- マニフェストファイル作成
- アイコン・スプラッシュ画面デザイン

### Phase 2（1週間）
- オフライン対応（記事キャッシュ）
- インストール促進UI
- 基本的なPWA機能テスト

### Phase 3（1週間）
- プッシュ通知実装
- バックグラウンド同期
- パフォーマンス最適化

### Phase 4（1週間）
- iOS対応の最適化
- A/Bテスト実施
- 本番デプロイ

## 成功指標
- インストール率: 訪問者の20%以上
- エンゲージメント向上: セッション時間30%増
- リテンション改善: 30日後のアクティブ率50%以上
- パフォーマンス: Lighthouse PWAスコア90点以上

## 注意事項
- iOS Safariの制限事項への対応
- オフラインストレージの容量管理
- バッテリー消費への配慮
- プライバシーポリシーの更新