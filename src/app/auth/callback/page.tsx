'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    // Supabaseが自動的にハッシュフラグメントを処理
    // 処理が完了したら適切なページにリダイレクト
    const timer = setTimeout(() => {
      // URLにerrorパラメータがあるかチェック
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get('error')
      
      if (error) {
        router.push(`/login?error=${error}`)
      } else {
        // ハッシュにtypeがあるかチェック
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const type = hashParams.get('type')
        
        if (type === 'recovery') {
          router.push('/auth/update-password')
        } else {
          router.push('/dashboard')
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>認証処理中...</p>
      </div>
    </div>
  )
}