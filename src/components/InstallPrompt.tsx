'use client'

import { useState, useEffect } from 'react'
import { X, Download, Share } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallPrompt, setShowInstallPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // インストール促進イベントをキャッチ
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // iOS Safari対応
    const checkIOS = () => {
      const userAgent = window.navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      
      if (isIOSDevice && !isInStandaloneMode) {
        setIsIOS(true)
        setShowInstallPrompt(true)
      }
    }

    checkIOS()

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!isIOS && deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('PWA installed')
        // インストール成功をトラッキング
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'pwa_install', {
            event_category: 'engagement',
            event_label: 'success'
          })
        }
      }
      
      setDeferredPrompt(null)
    }
    setShowInstallPrompt(false)
  }

  const handleDismiss = () => {
    setShowInstallPrompt(false)
    // 24時間後に再表示
    const dismissTime = new Date().getTime()
    localStorage.setItem('pwa-prompt-dismissed', dismissTime.toString())
  }

  // 以前に却下された場合はチェック
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedTime) {
      const now = new Date().getTime()
      const dayInMs = 24 * 60 * 60 * 1000
      if (now - parseInt(dismissedTime) < dayInMs) {
        setShowInstallPrompt(false)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {showInstallPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white rounded-lg shadow-2xl p-6 z-50"
        >
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                {isIOS ? <Share className="w-6 h-6 text-purple-600" /> : <Download className="w-6 h-6 text-purple-600" />}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {isIOS ? 'ホーム画面に追加' : 'アプリをインストール'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {isIOS
                  ? 'サファリのシェアボタンから「ホーム画面に追加」を選択してください'
                  : 'FLEEKSをホーム画面に追加して、アプリのように使用できます'
                }
              </p>

              {!isIOS && (
                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition"
                  >
                    インストール
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                  >
                    後で
                  </button>
                </div>
              )}

              {isIOS && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-xs text-gray-500">
                    1. Safari下部の共有ボタン 
                    <Share className="w-3 h-3 inline mx-1" />
                    をタップ
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    2. 「ホーム画面に追加」を選択
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    3. 「追加」をタップ
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}