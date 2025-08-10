import './globals.css'
import type { Metadata } from 'next'
import ServiceWorkerProvider from '@/components/ServiceWorkerProvider'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'FLEEKS Platform',
  description: '美容業界プロフェッショナル向け学習プラットフォーム',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FLEEKS'
  },
  icons: {
    icon: [
      { url: '/icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml' },
      { url: '/icon-96x96.svg', sizes: '96x96', type: 'image/svg+xml' },
      { url: '/icon-128x128.svg', sizes: '128x128', type: 'image/svg+xml' },
      { url: '/icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml' },
      { url: '/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' },
      { url: '/icon-384x384.svg', sizes: '384x384', type: 'image/svg+xml' },
      { url: '/icon-512x512.svg', sizes: '512x512', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/icon-192x192.svg', sizes: '192x192', type: 'image/svg+xml' }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        <ServiceWorkerProvider>
          {children}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </ServiceWorkerProvider>
      </body>
    </html>
  )
}
