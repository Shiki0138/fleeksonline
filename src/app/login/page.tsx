'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Target, AlertCircle, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  // Check for recovery token and redirect to password update page
  useEffect(() => {
    // Check URL parameters first
    const token = searchParams.get('token')
    const type = searchParams.get('type')
    const redirect = searchParams.get('redirect')
    
    // Also check hash fragments (Supabase format)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const hashAccessToken = hashParams.get('access_token')
    const hashRefreshToken = hashParams.get('refresh_token')
    const hashType = hashParams.get('type')
    
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
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    console.log('Login attempt started for:', email)

    // Set a timeout for the login process
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('Login timeout - request took too long')
        setError('ログイン処理がタイムアウトしました。ネットワーク接続を確認してください。')
        setLoading(false)
      }
    }, 15000) // 15 seconds timeout

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

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
          console.log('[Login] Using window.location.href = "/admin"')
          window.location.href = '/admin'
          return
        }

        // For other users, redirect to dashboard without profile check
        console.log('[Login] Regular user detected, redirecting to /dashboard')
        setSuccess('ログインしています...')
        setLoading(false)
        // Use window.location for hard redirect to ensure session is set
        console.log('[Login] Using window.location.href = "/dashboard"')
        window.location.href = '/dashboard'
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      setLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob hidden md:block"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 bg-slate-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>
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
            FLEEKS にログイン
          </h1>
          <p className="text-gray-300 mt-2">
            アカウントにアクセスしてください
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
              <h2 className="text-xl font-semibold mb-2">ログイン成功</h2>
              <p className="text-gray-300 mb-6">{success}</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <span className="text-sm text-red-300">{error}</span>
                </motion.div>
              )}

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  メールアドレス
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    placeholder="your@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  パスワード
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    placeholder="••••••••"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    ログイン中...
                  </span>
                ) : (
                  'ログイン'
                )}
              </motion.button>

              {/* Links */}
              <div className="text-center space-y-2">
                <Link 
                  href="/auth/reset-password" 
                  className="text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  パスワードを忘れましたか？
                </Link>
                <p className="text-sm text-gray-400">
                  アカウントをお持ちでないですか？{' '}
                  <Link 
                    href="/auth/signup" 
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    新規登録
                  </Link>
                </p>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}