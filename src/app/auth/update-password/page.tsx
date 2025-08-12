'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Lock, Eye, EyeOff, Target, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function UpdatePasswordPage() {
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
      console.log('[UpdatePassword] Starting auth code handling...')
      
      try {
        // 1. URLからcodeパラメータを取得（?code=xxx形式）
        const code = searchParams.get('code')
        
        // ハッシュフラグメントからも取得を試みる（#access_token=xxx形式）
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const hashAccessToken = hashParams.get('access_token')
        const hashType = hashParams.get('type')
        
        console.log('[UpdatePassword] Auth params:', {
          code: !!code,
          hashAccessToken: !!hashAccessToken,
          hashType,
          fullURL: window.location.href
        })
        
        // codeがある場合は、exchangeCodeForSessionを使用
        if (code) {
          console.log('[UpdatePassword] Exchanging code for session...')
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          
          if (error) {
            console.error('[UpdatePassword] Code exchange error:', error)
            if (error.message.includes('expired') || error.message.includes('invalid')) {
              setError(
                <div className="space-y-3">
                  <p>リンクの有効期限が切れています。</p>
                  <p className="text-sm">新しいパスワードリセットメールを送信してください：</p>
                  <a 
                    href="/auth/reset-guide" 
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    パスワードリセットを再度リクエスト
                  </a>
                </div>
              )
            } else {
              setError(`エラー: ${error.message}`)
            }
            setIsCheckingAuth(false)
            return
          }
          
          if (data.session) {
            console.log('[UpdatePassword] Session established successfully')
            setIsValidSession(true)
            setIsCheckingAuth(false)
            // URLからcodeパラメータを削除（セキュリティのため）
            window.history.replaceState({}, document.title, '/auth/update-password')
            return
          }
        }
        
        // ハッシュフラグメント形式の場合（Supabaseのデフォルト形式）
        if (hashAccessToken && hashType === 'recovery') {
          console.log('[UpdatePassword] Processing hash fragment format...')
          // ハッシュフラグメントをクエリパラメータに変換してリダイレクト
          window.location.href = `/auth/update-password?access_token=${hashAccessToken}&type=recovery`
          return
        }
        
        // access_tokenがクエリパラメータにある場合（古い形式）
        const accessToken = searchParams.get('access_token')
        const type = searchParams.get('type')
        
        if (accessToken && type === 'recovery') {
          console.log('[UpdatePassword] Processing access_token format...')
          try {
            // アクセストークンでセッションを設定
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: ''
            })
            
            if (!error && data.session) {
              console.log('[UpdatePassword] Session set from access_token')
              setIsValidSession(true)
              setIsCheckingAuth(false)
              // URLからトークンを削除
              window.history.replaceState({}, document.title, '/auth/update-password')
              return
            }
          } catch (err) {
            console.error('[UpdatePassword] Error setting session from access_token:', err)
          }
        }
        
        // 既存のセッションを確認
        const { data: { session } } = await supabase.auth.getSession()
        console.log('[UpdatePassword] Current session:', !!session, session?.user?.email)
        
        if (session) {
          setIsValidSession(true)
          setIsCheckingAuth(false)
          return
        }
        
        // セッションが見つからない場合
        setError(
          <div className="space-y-3">
            <p>有効なセッションが見つかりません。</p>
            <p className="text-sm">以下のいずれかの方法でパスワードをリセットしてください：</p>
            <div className="space-y-2">
              <a 
                href="/auth/reset-guide" 
                className="block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium text-center"
              >
                パスワードリセットを再度リクエスト
              </a>
              <a 
                href="/auth/emergency-reset" 
                className="block bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium text-center"
              >
                緊急用パスワードリセット（確認コード方式）
              </a>
            </div>
          </div>
        )
        setIsCheckingAuth(false)
        
      } catch (error) {
        console.error('[UpdatePassword] Unexpected error:', error)
        setError('予期しないエラーが発生しました。')
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
        console.error('[UpdatePassword] No session when trying to update password')
        setError('セッションが無効です。パスワードリセットをもう一度お試しください。')
        setIsLoading(false)
        return
      }
      
      console.log('[UpdatePassword] Updating password for user:', session.user.email)
      
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('[UpdatePassword] Password update error:', error)
        if (error.message === 'Auth session missing!') {
          setError(
            <div className="space-y-3">
              <p>認証セッションが無効です。</p>
              <a 
                href="/auth/reset-guide" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                パスワードリセットを再度リクエスト
              </a>
            </div>
          )
        } else if (error.message.includes('expired')) {
          setError('リンクの有効期限が切れています。パスワードリセットをもう一度お試しください。')
        } else {
          setError(`エラー: ${error.message}`)
        }
        return
      }

      setSuccess(true)
      
      // サインアウトしてログインページへ
      await supabase.auth.signOut()
      
      setTimeout(() => {
        router.push('/login?message=password_updated')
      }, 2000)
    } catch (err) {
      console.error('[UpdatePassword] Unexpected error during password update:', err)
      setError('パスワードの更新中にエラーが発生しました。')
    } finally {
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