'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Target, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) {
        console.error('Password reset error:', error)
        if (error.message.includes('User not found')) {
          setError('このメールアドレスは登録されていません')
        } else if (error.message.includes('Rate limit')) {
          setError('リクエストが多すぎます。しばらくお待ちください。')
        } else {
          setError('パスワードリセットメールの送信に失敗しました')
        }
      } else {
        setSuccess(true)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Target className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            パスワードリセット
          </h1>
          <p className="text-gray-300 mt-2">
            登録したメールアドレスを入力してください
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">メール送信完了</h2>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mt-4 text-left">
                <p className="text-blue-300 mb-2">
                  パスワードリセットメールを送信しました
                </p>
                <p className="text-sm text-gray-300 mb-3">
                  {email} 宛にメールを送信しました。メール内のリンクをクリックして新しいパスワードを設定してください。
                </p>
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded p-3 mt-3">
                  <p className="text-sm text-yellow-300">
                    <strong>注意:</strong> メールのリンクが動作しない場合、URLの「#」を「?」に手動で変更してください。
                  </p>
                  <p className="text-xs text-yellow-200 mt-1">
                    例: /auth/update-password#access_token=xxx → /auth/update-password?access_token=xxx
                  </p>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition"
                >
                  ログインページへ戻る
                </Link>
                <p className="text-xs text-gray-400">
                  メールが届かない場合は、迷惑メールフォルダをご確認ください
                </p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  メールアドレス
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition pl-10"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    送信中...
                  </span>
                ) : (
                  'リセットメールを送信'
                )}
              </motion.button>

              <div className="text-center space-y-3">
                <Link 
                  href="/login" 
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ログインページに戻る
                </Link>
                
                <div className="text-sm text-gray-400">
                  アカウントをお持ちでない方は{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    新規登録
                  </Link>
                </div>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}