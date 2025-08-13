'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle } from 'lucide-react'

export default function DevLoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleDevLogin = async () => {
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/bypass-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'greenroom51@gmail.com',
          bypassCode: 'DEV-BYPASS-2024',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました')
      }

      // 成功時は管理画面へリダイレクト
      window.location.href = '/admin'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  // 開発環境のみ表示
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">このページは開発環境でのみ利用可能です</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <AlertTriangle className="w-12 h-12 text-yellow-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          開発環境専用ログイン
        </h1>
        
        <p className="text-gray-400 text-center text-sm mb-6">
          Supabaseレート制限回避用の一時的なログイン
        </p>

        <div className="bg-yellow-900/50 text-yellow-200 p-3 rounded-lg mb-6">
          <p className="text-sm">
            ⚠️ このログイン方法は開発環境でのみ動作します。
            本番環境では使用できません。
          </p>
        </div>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <button
          onClick={handleDevLogin}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            loading
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          {loading ? '処理中...' : '開発環境でログイン'}
        </button>

        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-500 text-sm">
            レート制限が解除されたら
          </p>
          <a
            href="/login"
            className="text-blue-400 hover:text-blue-300 text-sm underline"
          >
            通常のログインページへ
          </a>
        </div>
      </div>
    </div>
  )
}