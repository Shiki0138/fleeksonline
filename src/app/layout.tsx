import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Toaster } from 'react-hot-toast'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import SupabaseProvider from './supabase-provider'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import InstallPrompt from '@/components/InstallPrompt'

export const metadata: Metadata = {
  title: 'FLEEKS Platform',
  description: '美容業界プロフェッショナル向け学習プラットフォーム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FLEEKS'
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }
    ],
    apple: [
      { url: '/favicon.ico' }
    ]
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent'
  }
}

export const viewport: Viewport = {
  themeColor: '#7c3aed',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  return (
    <html lang="ja">
      <body>
        <SupabaseProvider session={session}>
          {children}
          <ServiceWorkerRegister />
          <InstallPrompt />
        </SupabaseProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}