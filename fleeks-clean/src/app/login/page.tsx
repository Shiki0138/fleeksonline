'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { supabaseDirectClient, checkSupabaseConnection } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed'>('checking')
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    // 接続チェックとデバッグ情報収集
    const checkConnection = async () => {
      const debug: string[] = []
      
      // 環境変数のチェック
      debug.push(`Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '設定済み' : '未設定'}`)
      debug.push(`Supabase Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}`)
      
      // 直接クライアントのチェック
      debug.push(`Direct Client: ${supabaseDirectClient ? '作成済み' : '作成失敗'}`)
      
      // 接続テスト
      const isConnected = await checkSupabaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'failed')
      debug.push(`接続状態: ${isConnected ? '接続済み' : '接続失敗'}`)
      
      setDebugInfo(debug)
    }
    
    checkConnection()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      console.log('ログイン試行開始:', { email })
      
      // まずauth-helpersクライアントで試行
      let result = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Auth-helpersクライアント応答:', result)

      // もし失敗したら直接クライアントで試行
      if (result.error && supabaseDirectClient) {
        console.log('直接クライアントで再試行...')
        result = await supabaseDirectClient.auth.signInWithPassword({
          email,
          password,
        })
        console.log('直接クライアント応答:', result)
      }

      const { data, error } = result

      if (error) {
        console.error('Supabaseエラー:', error)
        
        // エラーメッセージの詳細化
        if (error.message.includes('Invalid login credentials')) {
          setError('メールアドレスまたはパスワードが正しくありません')
        } else if (error.message.includes('Email not confirmed')) {
          setError('メールアドレスの確認が完了していません')
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          setError('Supabaseへの接続に失敗しました。ネットワーク接続と環境変数を確認してください。')
        } else if (error.message.includes('JWT')) {
          setError('認証トークンのエラーです。環境変数が正しく設定されているか確認してください。')
        } else {
          setError(`ログインエラー: ${error.message}`)
        }
        return
      }

      if (data?.user) {
        console.log('ログイン成功:', data.user)
        
        // セッションを確実に保存
        const { data: sessionData } = await supabase.auth.getSession()
        console.log('セッション確認:', sessionData)
        
        // ダッシュボードへリダイレクト
        router.push('/dashboard')
      } else {
        setError('ログインに失敗しました。もう一度お試しください。')
      }
    } catch (err: any) {
      console.error('予期しないエラー:', err)
      setError(`エラーが発生しました: ${err.message || '不明なエラー'}`)
    } finally {
      setLoading(false)
    }
  }

  // テスト用のクイックログイン
  const handleTestLogin = () => {
    setEmail('greenroom51@gmail.com')
    setPassword('')
    setError('テストメールアドレスを設定しました。パスワードを入力してください。')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            FLEEKS Platform
          </h1>
          <p className="text-gray-600">
            美容プロフェッショナル向け学習プラットフォーム
          </p>
          
          {/* 接続状態インジケーター */}
          <div className="mt-4">
            {connectionStatus === 'checking' && (
              <span className="text-sm text-gray-500">Supabase接続確認中...</span>
            )}
            {connectionStatus === 'connected' && (
              <span className="text-sm text-green-600">✓ Supabase接続済み</span>
            )}
            {connectionStatus === 'failed' && (
              <span className="text-sm text-red-600">✗ Supabase接続失敗</span>
            )}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="example@email.com"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading || connectionStatus === 'failed'}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
        
        {/* デバッグ情報 */}
        <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs">
          <p className="font-semibold mb-2">デバッグ情報:</p>
          {debugInfo.map((info, index) => (
            <p key={index} className="text-gray-600">{info}</p>
          ))}
          <button
            type="button"
            onClick={handleTestLogin}
            className="mt-2 text-blue-600 hover:text-blue-800 underline text-sm"
          >
            テスト用メールアドレスを設定
          </button>
          <div className="mt-2 text-gray-500">
            <p>開発者コンソール（F12）でより詳細なログを確認できます。</p>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← ホームに戻る
          </a>
        </div>
      </div>
    </div>
  )
}