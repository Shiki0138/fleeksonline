'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export default function ServiceWorkerRegister() {
  const pathname = usePathname()
  
  useEffect(() => {
    // ログインページや認証関連のページではService Workerを無効化
    const isAuthPage = pathname.includes('/login') || pathname.includes('/auth')
    
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && !isAuthPage) {
      // ページロード後に登録（パフォーマンス向上）
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('SW registered: ', registration)

            // 自動更新を無効化（手動制御）
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      // 新しいバージョンが利用可能だが、自動リロードはしない
                      console.log('New content is available; please refresh manually.')
                      // ユーザーに通知せず、次回のページロード時に更新
                    } else {
                      // 初回インストール完了
                      console.log('Content is cached for offline use.')
                    }
                  }
                })
              }
            })
            
            // 更新チェックの頻度を制限（1時間に1回）
            const lastUpdateCheck = localStorage.getItem('sw-last-update-check')
            const now = Date.now()
            const ONE_HOUR = 60 * 60 * 1000
            
            if (!lastUpdateCheck || now - parseInt(lastUpdateCheck) > ONE_HOUR) {
              registration.update()
              localStorage.setItem('sw-last-update-check', now.toString())
            }
          })
          .catch(error => {
            console.log('SW registration failed: ', error)
          })
      })
    }
    
    // 認証ページではService Workerをアンインストール
    if (isAuthPage && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister()
        })
      })
    }
  }, [pathname])

  return null
}