'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(registration => {
            console.log('SW registered: ', registration)

            // 更新があった場合の処理
            registration.addEventListener('updatefound', () => {
              const installingWorker = registration.installing
              if (installingWorker) {
                installingWorker.addEventListener('statechange', () => {
                  if (installingWorker.state === 'installed') {
                    if (navigator.serviceWorker.controller) {
                      // 新しいバージョンが利用可能
                      console.log('New content is available; please refresh.')
                    } else {
                      // 初回インストール完了
                      console.log('Content is cached for offline use.')
                    }
                  }
                })
              }
            })
          })
          .catch(error => {
            console.log('SW registration failed: ', error)
          })
      })
    }
  }, [])

  return null
}