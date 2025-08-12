'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import toast from 'react-hot-toast'

export default function SimpleResetPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // シンプルにパスワードリセットメールを送信
      const { error } = await supabase.auth.resetPasswordForEmail(email)

      if (error) throw error

      setEmailSent(true)
      toast.success('パスワードリセットメールを送信しました')
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-green-500">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              メールを送信しました
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {email} 宛にパスワードリセットメールを送信しました。
            </p>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>メールの内容:</strong>
              </p>
              <ul className="text-sm text-blue-700 mt-2 list-disc list-inside">
                <li>パスワードリセット用のリンクが含まれています</li>
                <li>リンクをクリックして新しいパスワードを設定してください</li>
                <li>6桁のコードは送信されません</li>
              </ul>
              <p className="text-sm text-blue-800 mt-3">
                <strong>注意:</strong> メールが届かない場合は、迷惑メールフォルダをご確認ください。
              </p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            <button
              onClick={() => {
                setEmailSent(false)
                setEmail('')
              }}
              className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              別のメールアドレスで試す
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">または</span>
              </div>
            </div>
            <a
              href="/auth/admin-reset"
              className="block w-full text-center py-2 px-4 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              管理者に問い合わせる（リンクが機能しない場合）
            </a>
            <a
              href="/auth/login"
              className="block w-full text-center py-2 px-4 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              ログインページに戻る
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            パスワードをリセット
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            登録したメールアドレスを入力してください
          </p>
          <p className="mt-1 text-center text-xs text-gray-500">
            ※ リセット用のリンクをメールで送信します（6桁のコードは送信されません）
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メールアドレス
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? '送信中...' : 'リセットメールを送信'}
            </button>
          </div>

          <div className="text-center">
            <a
              href="/auth/login"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              ログインページに戻る
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}