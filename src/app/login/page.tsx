'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Target, AlertCircle, CheckCircle } from 'lucide-react'
import { signInWithRateLimit, checkExistingSession } from '@/lib/auth-helpers'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)
  const [unconfirmedEmail, setUnconfirmedEmail] = useState('')
  const [resendingEmail, setResendingEmail] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // 最小限の初期化チェック - middlewareがリダイレクト処理済み
  useEffect(() => {
    // 短時間で初期ローディングを終了
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Check for recovery token and redirect to password update page
  useEffect(() => {
    
    try {
      // Check URL parameters first
      const token = searchParams.get('token')
      const type = searchParams.get('type')
      const redirect = searchParams.get('redirect')
      
      // Also check hash fragments (Supabase format) - モバイル対応の改善
      let hashParams: URLSearchParams | null = null
      if (typeof window !== 'undefined' && window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.substring(1))
      }
      
      const hashAccessToken = hashParams?.get('access_token')
      const hashRefreshToken = hashParams?.get('refresh_token')
      const hashType = hashParams?.get('type')
      
      console.log('Recovery check - URL params:', { token, type, redirect })
      console.log('Recovery check - Hash params:', { 
        access_token: hashAccessToken, 
        refresh_token: hashRefreshToken, 
        type: hashType 
      })
      
      // If we have hash parameters with recovery type, redirect with the hash
      if (hashAccessToken && hashType === 'recovery') {
        console.log('Hash recovery tokens detected, redirecting to update password page')
        // Preserve the entire hash fragment for the update-password page
        window.location.href = `/auth/update-password${window.location.hash}`
        return
      }
      
      // If we have a redirect parameter and hash, combine them
      if (redirect === '/auth/update-password' && window.location.hash) {
        console.log('Redirect with hash detected, forwarding to update password page')
        window.location.href = `/auth/update-password${window.location.hash}`
        return
      }
      
      // Legacy URL parameter support
      if (token && type === 'recovery') {
        console.log('URL recovery token detected, redirecting to update password page')
        window.location.href = `/auth/update-password?token=${token}&type=recovery`
      }
    } catch (error) {
      console.error('Recovery token check error:', error)
    }
  }, [searchParams])

  const resendConfirmationEmail = async () => {
    if (!unconfirmedEmail) return
    
    setResendingEmail(true)
    setError('')
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail
      })
      
      if (error) {
        setError('確認メールの再送信に失敗しました: ' + error.message)
      } else {
        setSuccess('確認メールを再送信しました。メールをご確認ください。')
        setUnconfirmedEmail('')
      }
    } catch (err) {
      setError('エラーが発生しました')
    } finally {
      setResendingEmail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 既にログイン処理中の場合は何もしない
    if (loading) {
      console.log('Already processing login, ignoring duplicate submission')
      return
    }
    
    setError('')
    setSuccess('')
    setLoading(true)

    console.log('Login attempt started for:', email)

    // Set a timeout for the login process - shorter for mobile
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Login timeout - request took too long')
        setError('ログイン処理に時間がかかっています。もう一度お試しください。')
        setLoading(false)
      }
    }, 10000) // 10 seconds timeout - balanced between retries and UX

    try {
      const { data, error } = await signInWithRateLimit(email, password)

      clearTimeout(timeoutId)
      console.log('Auth response:', { data, error })

      if (error) {
        console.error('Auth error:', error)
        // Translate common Supabase errors to Japanese
        let errorMsg = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMsg = 'メールアドレスまたはパスワードが正しくありません'
        } else if (error.message.includes('Email not confirmed')) {
          errorMsg = 'メールアドレスが確認されていません。確認メールをご確認ください。'
          // Store email for resend functionality
          setUnconfirmedEmail(email)
        } else if (error.message.includes('Too many requests')) {
          errorMsg = 'ログイン試行回数が上限に達しました。しばらくお待ちください。'
        } else if (error.message.includes('Failed to fetch')) {
          errorMsg = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
        }
        setError(errorMsg)
        setLoading(false)
        return
      }

      if (data?.user) {
        console.log('Login successful, user:', data.user.email)
        
        // Skip profile check for admin email to speed up login
        const isAdminEmail = data.user.email === 'greenroom51@gmail.com'
        
        if (isAdminEmail) {
          console.log('[Login] Admin user detected, redirecting to /admin')
          setSuccess('管理者としてログインしています...')
          setLoading(false)
          // Use window.location for hard redirect to ensure session is set
          console.log('[Login] Using router.push for smoother transition')
          router.push('/admin')
          return
        }

        // For other users, redirect to requested page or dashboard
        const redirectUrl = searchParams.get('redirect') || '/dashboard'
        console.log('[Login] Regular user detected, redirecting to:', redirectUrl)
        setSuccess('ログインしています...')
        setLoading(false)
        // Use window.location for hard redirect to ensure session is set
        console.log('[Login] Using router.push for smoother transition')
        router.push(redirectUrl)
      } else {
        console.error('No user data returned')
        setError('ログインに失敗しました')
        setLoading(false)
      }
    } catch (err) {
      clearTimeout(timeoutId)
      console.error('Login error:', err)
      
      // Check if it's a network error
      if (err instanceof Error && err.message.includes('fetch')) {
        setError('ネットワークエラーが発生しました。インターネット接続を確認してください。')
      } else {
        setError('ログイン中にエラーが発生しました')
      }
      setLoading(false)
    }
  }


  // 初期ローディング中のみスケルトンを表示
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Logo skeleton */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
            </div>
            <div className="h-8 bg-white/20 rounded w-48 mx-auto mb-2 animate-pulse"></div>
            <div className="h-4 bg-white/20 rounded w-64 mx-auto animate-pulse"></div>
          </div>
          
          {/* Form skeleton */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
            <div className="space-y-6">
              <div>
                <div className="h-4 bg-white/20 rounded w-24 mb-2 animate-pulse"></div>
                <div className="h-12 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div>
                <div className="h-4 bg-white/20 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-12 bg-white/20 rounded animate-pulse"></div>
              </div>
              <div className="h-12 bg-white/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
      {/* Animated Background - モバイルでは無効化 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob hidden md:block"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 bg-slate-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative z-10 max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Target className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            FLEEKS にログイン
          </h1>
          <p className="text-gray-300 mt-2">
            アカウントにアクセスしてください
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">{success}</p>
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mx-auto"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-200">{error}</p>
                  </div>
                  {unconfirmedEmail && (
                    <button
                      type="button"
                      onClick={resendConfirmationEmail}
                      disabled={resendingEmail}
                      className="mt-3 w-full text-sm bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-medium transition disabled:opacity-50"
                    >
                      {resendingEmail ? '送信中...' : '確認メールを再送信'}
                    </button>
                  )}
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

              <div>
                <label className="block text-sm font-medium mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 transition pl-10 pr-10"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <Link href="/auth/reset-password" className="text-blue-400 hover:text-blue-300 transition">
                  パスワードを忘れた方
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-lg font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    ログイン中...
                  </span>
                ) : (
                  'ログイン'
                )}
              </button>
            </form>
          )}

          <div className="mt-6 space-y-3 text-center">
            <p className="text-gray-300">
              <Link href="/auth/forgot-password" className="text-blue-400 hover:text-blue-300 transition">
                パスワードをお忘れの方
              </Link>
            </p>
            <p className="text-gray-300">
              アカウントをお持ちでない方は{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 transition">
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}