'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Shield } from 'lucide-react'

export default function EmergencyAdminLogin() {
  const [password, setPassword] = useState('')
  const [emergencyCode, setEmergencyCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/emergency-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'greenroom51@gmail.com',
          password,
          emergencyCode,
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="flex items-center justify-center mb-6">
          <Shield className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          緊急管理者ログイン
        </h1>
        
        <p className="text-gray-400 text-center text-sm mb-6">
          レート制限エラー時の管理者専用バックドア
        </p>

        {error && (
          <div className="bg-red-900/50 text-red-200 p-3 rounded-lg mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleEmergencyLogin} className="space-y-4">
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              管理者メールアドレス
            </label>
            <input
              type="email"
              value="greenroom51@gmail.com"
              disabled
              className="w-full px-4 py-2 bg-gray-700 text-gray-400 rounded-lg border border-gray-600"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              緊急コード
            </label>
            <input
              type="text"
              value={emergencyCode}
              onChange={(e) => setEmergencyCode(e.target.value)}
              placeholder="環境変数に設定されたコード"
              required
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-red-500 focus:outline-none"
            />
            <p className="text-gray-500 text-xs mt-1">
              .env.local の EMERGENCY_LOGIN_CODE
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold transition ${
              loading
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {loading ? '処理中...' : '緊急ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            通常のログインが復旧したら
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