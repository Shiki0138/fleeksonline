'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/Providers'
import { getAuthErrorMessage } from '@/lib/auth-helpers'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    confirmPassword: ''
  })
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const error = searchParams.get('error')
  const next = searchParams.get('next') || '/dashboard'

  useEffect(() => {
    // Show error message if present
    if (error) {
      toast.error(getAuthErrorMessage(error))
    }
    
    // Redirect if already authenticated
    if (user) {
      router.push(next)
    }
  }, [error, user, router, next])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isSignUp) {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          toast.error('パスワードが一致しません')
          setLoading(false)
          return
        }

        // Sign up new user
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`
          }
        })

        if (error) {
          toast.error(getAuthErrorMessage(error.message))
        } else if (data.user) {
          toast.success('確認メールを送信しました。メールをご確認ください。')
          setIsSignUp(false)
        }
      } else {
        // Sign in existing user
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })

        if (error) {
          toast.error(getAuthErrorMessage(error.message))
        } else if (data.session) {
          toast.success('ログインしました')
          router.push(next)
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error('認証エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        toast.error('Google認証エラー: ' + error.message)
      }
    } catch (error) {
      console.error('Google auth error:', error)
      toast.error('Google認証に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4"
            >
              <span className="text-white text-2xl font-bold">F</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Fleeks Beauty Platform
            </h1>
            <p className="text-gray-600">
              {isSignUp ? 'アカウントを作成して始めましょう' : 'アカウントにログイン'}
            </p>
          </div>

          {/* Google認証ボタン */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleLogin}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-gray-700 font-medium">Googleでログイン</span>
          </motion.button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">または</span>
            </div>
          </div>

          {/* ログインフォーム */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  お名前
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="田中 花子"
                  required
                />
              </motion.div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="example@beauty.jp"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="••••••••"
                required
              />
            </div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  パスワード確認
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="••••••••"
                  required
                />
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isSignUp ? '作成中...' : 'ログイン中...'}</span>
                </div>
              ) : (
                isSignUp ? 'アカウントを作成' : 'ログイン'
              )}
            </motion.button>
          </form>

          {/* フッター */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              {isSignUp ? 'すでにアカウントをお持ちですか？ログイン' : 'アカウントをお持ちでない方はこちら'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              ← ホームに戻る
            </a>
          </div>
        </div>

        {/* セキュリティ情報 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <h3 className="font-semibold text-blue-800 mb-2">🔐 セキュリティ</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• SSL/TLS暗号化通信で保護されています</li>
            <li>• パスワードは安全にハッシュ化されます</li>
            <li>• 2段階認証に対応しています</li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  )
}