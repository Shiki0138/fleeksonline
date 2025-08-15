'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Loader2, Target } from 'lucide-react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function ConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // URLパラメータを取得
        const token_hash = searchParams.get('token_hash')
        const type = searchParams.get('type')
        
        // ハッシュフラグメントからもトークンを取得してみる
        let accessToken = searchParams.get('access_token')
        let refreshToken = searchParams.get('refresh_token')
        
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          accessToken = accessToken || hashParams.get('access_token')
          refreshToken = refreshToken || hashParams.get('refresh_token')
        }
        
        console.log('[Confirm] Processing confirmation:', { 
          token_hash: !!token_hash, 
          type, 
          accessToken: !!accessToken,
          refreshToken: !!refreshToken
        })

        // アクセストークンがある場合はセッションを設定
        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          if (sessionError) {
            console.error('[Confirm] Session setting error:', sessionError)
            setStatus('error')
            setMessage('セッションの設定に失敗しました')
            return
          }
          
          setStatus('success')
          setMessage('メールアドレスが確認されました！ログインページへ移動します...')
          setTimeout(() => {
            router.push('/login')
          }, 3000)
          return
        }

        if (!token_hash || !type) {
          setStatus('error')
          setMessage('無効な確認リンクです')
          return
        }

        // タイプに応じて処理
        let result
        
        switch (type) {
          case 'signup':
          case 'email':
            // メールアドレス確認
            result = await supabase.auth.verifyOtp({
              token_hash,
              type: 'signup'
            })
            
            if (result.error) {
              console.error('[Confirm] Email verification error:', result.error)
              setStatus('error')
              setMessage('メールアドレスの確認に失敗しました。リンクの有効期限が切れている可能性があります。')
            } else {
              console.log('[Confirm] Email verified successfully')
              setStatus('success')
              setMessage('メールアドレスが確認されました！ログインページへ移動します...')
              setTimeout(() => {
                router.push('/login')
              }, 3000)
            }
            break
            
          case 'invite':
            // 招待の確認
            result = await supabase.auth.verifyOtp({
              token_hash,
              type: 'invite'
            })
            
            if (result.error) {
              setStatus('error')
              setMessage('招待リンクの確認に失敗しました')
            } else {
              setStatus('success')
              setMessage('招待が確認されました！')
              setTimeout(() => {
                router.push('/auth/signup')
              }, 2000)
            }
            break
            
          case 'magiclink':
            // マジックリンクログイン
            result = await supabase.auth.verifyOtp({
              token_hash,
              type: 'magiclink'
            })
            
            if (result.error) {
              setStatus('error')
              setMessage('ログインリンクの確認に失敗しました')
            } else {
              setStatus('success')
              setMessage('ログインしています...')
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            }
            break
            
          case 'email_change':
            // メールアドレス変更
            result = await supabase.auth.verifyOtp({
              token_hash,
              type: 'email_change'
            })
            
            if (result.error) {
              setStatus('error')
              setMessage('メールアドレスの変更確認に失敗しました')
            } else {
              setStatus('success')
              setMessage('メールアドレスが変更されました！')
              setTimeout(() => {
                router.push('/dashboard')
              }, 2000)
            }
            break
            
          default:
            setStatus('error')
            setMessage('不明な確認タイプです')
        }
        
      } catch (error) {
        console.error('[Confirm] Unexpected error:', error)
        setStatus('error')
        setMessage('予期しないエラーが発生しました')
      }
    }

    confirmEmail()
  }, [searchParams, router, supabase])

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
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Target className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            確認処理
          </h1>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-spin" />
                <h2 className="text-xl font-semibold mb-2">確認中...</h2>
                <p className="text-gray-300">
                  リンクを確認しています。少々お待ちください。
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">確認完了</h2>
                <p className="text-gray-300">{message}</p>
              </>
            )}

            {status === 'error' && (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">エラー</h2>
                <p className="text-gray-300 mb-6">{message}</p>
                <div className="space-y-3">
                  <a
                    href="/auth/signup"
                    className="block w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition text-center"
                  >
                    新規登録
                  </a>
                  <a
                    href="/login"
                    className="block w-full border border-white/20 hover:bg-white/10 px-4 py-2 rounded-lg font-medium transition text-center"
                  >
                    ログイン
                  </a>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}