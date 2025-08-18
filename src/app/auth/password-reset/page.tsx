'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Target, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function PasswordResetContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | React.ReactNode | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  useEffect(() => {
    const handleAuthCode = async () => {
      console.log('[PasswordReset] Starting auth code handling...')
      
      try {
        // Multiple ways to get auth info
        const code = searchParams.get('code')
        const accessToken = searchParams.get('access_token') 
        const type = searchParams.get('type')
        
        console.log('[PasswordReset] Auth params:', { code: !!code, accessToken: !!accessToken, type })
        
        // Try exchanging code first
        if (code) {
          console.log('[PasswordReset] Exchanging code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('[PasswordReset] Code exchange error:', error)
            setError(`認証エラー: ${error.message}。新しいリセットメールをリクエストしてください。`)
            setIsCheckingAuth(false)
            return
          }
          
          if (data.session) {
            console.log('[PasswordReset] Session established from code')
            setIsValidSession(true)
            setIsCheckingAuth(false)
            return
          }
        }
        
        // Try access token method
        if (accessToken && type === 'recovery') {
          console.log('[PasswordReset] Processing access_token...')
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: searchParams.get('refresh_token') || ''
            })
            
            if (!error && data.session) {
              console.log('[PasswordReset] Session set from access_token')
              setIsValidSession(true)
              setIsCheckingAuth(false)
              return
            }
          } catch (err) {
            console.error('[PasswordReset] Error with access_token:', err)
          }
        }
        
        // Check existing session
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[PasswordReset] Current session:', !!session)
        
        if (session) {
          setIsValidSession(true)
          setIsCheckingAuth(false)
          return
        }
        
        // No valid session found
        setError(
          <div className="space-y-3">
            <p>有効な認証セッションが見つかりません。</p>
            <p className="text-sm">新しいパスワードリセットメールをリクエストしてください：</p>
            <a 
              href="/auth/reset-password" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
            >
              パスワードリセットを再リクエスト
            </a>
          </div>
        )
        setIsCheckingAuth(false)
        
      } catch (error) {
        console.error('[PasswordReset] Unexpected error:', error)
        setError('認証処理でエラーが発生しました。')
        setIsCheckingAuth(false)
      }
    }
    
    handleAuthCode()
  }, [searchParams, supabase])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください')
      setIsLoading(false)
      return
    }

    try {
      // セッションを再確認
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証セッションが無効です。新しいリセットメールをリクエストしてください。')
        setIsLoading(false)
        return
      }
      
      console.log('[PasswordReset] Updating password for user:', session.user.email)
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('[PasswordReset] Password update error:', error)
        setError(`パスワード更新エラー: ${error.message}`)
        setIsLoading(false)
        return
      }

      setSuccess(true)
      
      // Sign out and redirect to login
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login?message=password_updated')
      }, 2000)
    } catch (err) {
      console.error('[PasswordReset] Unexpected error during password update:', err)
      setError('パスワードの更新中にエラーが発生しました。')
      setIsLoading(false)
    }
  }

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
            新しいパスワードを設定
          </h1>
          <p className="text-gray-300 mt-2">
            {success ? 'パスワードを更新しました' : isCheckingAuth ? '認証情報を確認中...' : isValidSession ? '新しいパスワードを入力してください' : ''}
          </p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          {isCheckingAuth ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-8"
            >
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-gray-300">認証情報を確認中...</p>
            </motion.div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">パスワードを更新しました</h2>
              <p className="text-gray-300 mb-6">
                ログインページにリダイレクトしています...
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-lg p-3"
                >
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-red-300">{error}</div>
                  </div>
                </motion.div>
              )}

              {isValidSession ? (
                <>
                  {/* New Password Field */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      新しいパスワード
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
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      パスワードを確認
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                      >
                        {showConfirmPassword ? (
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
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        更新中...
                      </span>
                    ) : (
                      'パスワードを更新'
                    )}
                  </motion.button>
                </>
              ) : null}

              {/* Links */}
              <div className="text-center space-y-2 mt-4">
                <a
                  href="/login"
                  className="text-blue-400 hover:text-blue-300 transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  ログインページに戻る
                </a>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function PasswordResetPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <PasswordResetContent />
    </Suspense>
  )
}