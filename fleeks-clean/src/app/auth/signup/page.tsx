'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Target, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { checkSupabaseConnection } from '@/lib/supabase-browser'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const supabase = createClientComponentClient()

  useEffect(() => {
    // Supabase接続確認
    const checkConnection = async () => {
      const isConnected = await checkSupabaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'failed')
      if (!isConnected) {
        setError('Supabaseへの接続に失敗しました。しばらくしてからもう一度お試しください。')
      }
    }
    checkConnection()
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // 接続確認
    if (connectionStatus === 'failed') {
      setError('データベースへの接続に問題があります。しばらくしてからもう一度お試しください。')
      setIsLoading(false)
      return
    }

    // パスワード確認
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
      console.log('新規登録試行:', { email, fullName })
      
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      })

      console.log('Supabase応答:', { data, error: signUpError })

      if (signUpError) {
        console.error('SignUp error:', signUpError)
        
        // エラーメッセージの詳細化
        if (signUpError.message.includes('already registered') || 
            signUpError.message.includes('User already registered') ||
            signUpError.message.includes('already exists')) {
          setError('このメールアドレスは既に登録されています。ログインしてください。')
          setTimeout(() => {
            router.push('/auth/login')
          }, 3000)
        } else if (signUpError.message.includes('rate limit')) {
          setError('一時的に登録を制限しています。しばらくしてからもう一度お試しください。')
        } else if (signUpError.message.includes('Invalid email')) {
          setError('有効なメールアドレスを入力してください。')
        } else if (signUpError.message.includes('fetch')) {
          setError('ネットワークエラーが発生しました。接続を確認してください。')
        } else {
          setError(`登録エラー: ${signUpError.message}`)
        }
        return
      }

      // ユーザーが作成された場合の処理
      if (data?.user) {
        console.log('ユーザー作成成功:', data.user)
        
        // FLEEKSプロファイルを作成
        try {
          const { error: profileError } = await supabase
            .from('fleeks_profiles')
            .insert({
              id: data.user.id,
              username: email.split('@')[0],
              full_name: fullName || email.split('@')[0],
              membership_type: 'free',
              role: 'user',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // プロファイル作成に失敗してもユーザー作成は成功しているので続行
          }
        } catch (profileErr) {
          console.error('Profile creation exception:', profileErr)
        }

        setSuccess(true)
        // 3秒後にログインページへリダイレクト
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      } else if (data === null && !signUpError) {
        // Supabaseが既存ユーザーの場合にnullを返すケース
        setError('このメールアドレスは既に登録されています。ログインしてください。')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    } catch (err: any) {
      console.error('予期しないエラー:', err)
      setError(`登録に失敗しました: ${err.message || '不明なエラー'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-slate-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
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
            FLEEKSへようこそ
          </h1>
          <p className="text-gray-300 mt-2">アカウントを作成</p>
          
          {/* 接続状態インジケーター */}
          <div className="mt-2">
            {connectionStatus === 'checking' && (
              <span className="text-sm text-gray-400">接続確認中...</span>
            )}
            {connectionStatus === 'connected' && (
              <span className="text-sm text-green-400">✓ 接続済み</span>
            )}
            {connectionStatus === 'failed' && (
              <span className="text-sm text-red-400">✗ 接続エラー</span>
            )}
          </div>
        </div>

        {/* Signup Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">登録が完了しました！</h2>
              <p className="text-gray-300">確認メールをお送りしました。メールをご確認ください。</p>
              <p className="text-sm text-gray-400 mt-4">ログインページへリダイレクトします...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-6">
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

              {/* Full Name Field */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  お名前
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    placeholder="山田 太郎"
                    required
                    disabled={isLoading || connectionStatus === 'failed'}
                  />
                </div>
              </div>

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
                    disabled={isLoading || connectionStatus === 'failed'}
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
                    placeholder="6文字以上"
                    required
                    disabled={isLoading || connectionStatus === 'failed'}
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
                  パスワード（確認）
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition"
                    placeholder="パスワードを再入力"
                    required
                    disabled={isLoading || connectionStatus === 'failed'}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  disabled={isLoading || connectionStatus === 'failed'}
                  className="w-4 h-4 mt-1 bg-white/10 border-white/20 rounded text-blue-500 focus:ring-blue-400"
                />
                <label className="ml-2 text-sm text-gray-300">
                  <a href="/terms" className="text-blue-400 hover:text-blue-300">利用規約</a>および
                  <a href="/privacy" className="text-blue-400 hover:text-blue-300">プライバシーポリシー</a>
                  に同意します
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading || connectionStatus === 'failed'}
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
                    登録中...
                  </span>
                ) : (
                  'アカウントを作成'
                )}
              </motion.button>
            </form>
          )}

          {/* Login Link */}
          {!success && (
            <>
              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-gray-400">または</span>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-gray-300">
                  既にアカウントをお持ちの方は{' '}
                  <a href="/auth/login" className="text-blue-400 hover:text-blue-300 font-semibold transition">
                    ログイン
                  </a>
                </p>
              </div>
            </>
          )}

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-2 bg-black/20 rounded text-xs text-gray-400">
              <p>開発者コンソール（F12）でより詳細なログを確認できます</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}