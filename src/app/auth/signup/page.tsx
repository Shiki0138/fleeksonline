'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, Target, AlertCircle, CheckCircle, User } from 'lucide-react'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: email.split('@')[0]
          }
        }
      })

      if (signUpError) {
        // Translate common Supabase errors to Japanese
        console.error('Signup error details:', signUpError)
        let errorMsg = signUpError.message
        
        if (signUpError.message.includes('Password should be at least 6 characters')) {
          errorMsg = 'パスワードは6文字以上で入力してください'
        } else if (signUpError.message.includes('User already registered') || 
                   signUpError.message.includes('already exists')) {
          errorMsg = 'このメールアドレスは既に登録されています。ログインするか、パスワードをリセットしてください。'
        } else if (signUpError.message.includes('Invalid email')) {
          errorMsg = '有効なメールアドレスを入力してください'
        } else if (signUpError.message.includes('Email signups are disabled')) {
          errorMsg = '現在、新規登録を受け付けていません。管理者にお問い合わせください。'
        } else if (signUpError.message.includes('Database error')) {
          errorMsg = 'データベースエラーが発生しました。時間をおいて再度お試しください。'
        }
        
        setError(errorMsg)
        return
      }

      if (data.user) {
        // Check if email confirmation is required
        const needsEmailConfirmation = data.user.email && !data.user.confirmed_at
        
        if (needsEmailConfirmation) {
          // User needs to confirm email first
          setSuccess(true)
          setError('')
          // Show email confirmation message
          return
        }
        
        // Create profile in fleeks_profiles table
        const { error: profileError } = await supabase
          .from('fleeks_profiles')
          .insert([
            {
              id: data.user.id,
              email: email,
              display_name: fullName,
              role: 'user',
              membership_type: 'free',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't show error to user as signup was successful
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('アカウント作成中にエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 text-white flex items-center justify-center px-4">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10"></div>
        <div className="absolute top-0 -left-4 w-72 h-72 md:w-96 md:h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob hidden md:block"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 md:w-96 md:h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-2000 hidden md:block"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 md:w-96 md:h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-2xl md:blur-3xl opacity-20 animate-blob animation-delay-4000 hidden md:block"></div>
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
            <Target className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            FLEEKS に参加
          </h1>
          <p className="text-gray-300 mt-2">
            新しいアカウントを作成してください
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
              <h2 className="text-xl font-semibold mb-2">アカウント作成成功</h2>
              <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mt-4">
                <p className="text-blue-300 mb-2">
                  確認メールを送信しました！
                </p>
                <p className="text-sm text-gray-300">
                  {email} 宛に確認メールを送信しました。
                  メール内のリンクをクリックしてアカウントを有効化してください。
                </p>
              </div>
              <div className="mt-6 space-y-3">
                <Link
                  href="/login"
                  className="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg font-medium transition"
                >
                  ログインページへ
                </Link>
                <p className="text-xs text-gray-400">
                  メールが届かない場合は、迷惑メールフォルダをご確認ください
                </p>
              </div>
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
                  <AlertCircle className="w-5 h-5 text-red-400" />
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
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                    placeholder="山田 太郎"
                    required
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
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                    placeholder="your@email.com"
                    required
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
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-12 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 transition"
                    placeholder="6文字以上"
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

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl hover:shadow-purple-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    作成中...
                  </span>
                ) : (
                  'アカウントを作成'
                )}
              </motion.button>

              {/* Links */}
              <div className="text-center">
                <p className="text-sm text-gray-400">
                  既にアカウントをお持ちですか？{' '}
                  <Link 
                    href="/login" 
                    className="text-purple-400 hover:text-purple-300 transition"
                  >
                    ログイン
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