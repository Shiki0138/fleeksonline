'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function TestResetPage() {
  const [logs, setLogs] = useState<string[]>([])
  const supabase = createClientComponentClient()

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const testRecovery = async () => {
      addLog('🚀 ページ読み込み開始')
      addLog(`URL: ${window.location.href}`)
      
      // URLの解析
      const url = new URL(window.location.href)
      addLog(`パス: ${url.pathname}`)
      addLog(`クエリ: ${url.search}`)
      addLog(`ハッシュ: ${url.hash}`)
      
      // ハッシュパラメータの解析
      if (url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1))
        addLog('--- ハッシュパラメータ ---')
        for (const [key, value] of hashParams) {
          addLog(`${key}: ${value ? value.substring(0, 20) + '...' : '(空)'} `)
        }
      }
      
      // 現在のセッション確認
      addLog('--- セッション確認 ---')
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          addLog(`❌ セッション取得エラー: ${error.message}`)
        } else if (session) {
          addLog(`✅ セッションあり: ${session.user.email}`)
        } else {
          addLog('❌ セッションなし')
        }
      } catch (err) {
        addLog(`❌ 予期しないエラー: ${err}`)
      }
      
      // onAuthStateChangeリスナー
      addLog('--- 認証状態の監視開始 ---')
      const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
        addLog(`🔔 認証イベント: ${event}`)
        if (session) {
          addLog(`✅ セッション確立: ${session.user.email}`)
        }
      })
      
      // 手動でのセッション更新試行
      if (url.hash && url.hash.includes('access_token')) {
        addLog('--- 手動セッション更新を試行 ---')
        
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const { data: { session: delayedSession } } = await supabase.auth.getSession()
        if (delayedSession) {
          addLog('✅ 遅延後のセッション確認: 成功')
        } else {
          addLog('❌ 遅延後のセッション確認: 失敗')
          
          // refreshSessionを試行
          addLog('--- refreshSession試行 ---')
          const { data: { session: refreshed }, error: refreshError } = await supabase.auth.refreshSession()
          if (refreshed) {
            addLog('✅ refreshSession: 成功')
          } else {
            addLog(`❌ refreshSession: 失敗 - ${refreshError?.message}`)
          }
        }
      }
      
      // クリーンアップ
      return () => {
        authListener?.subscription.unsubscribe()
      }
    }
    
    testRecovery()
  }, [])

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">パスワードリセット デバッグページ</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-2">テスト手順：</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>パスワードリセットメールを送信</li>
            <li>メール内のリンクをクリック</li>
            <li>このページにリダイレクトされるように設定</li>
            <li>下記のログを確認</li>
          </ol>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">ログ：</h2>
          <div className="font-mono text-sm space-y-1">
            {logs.length === 0 ? (
              <p className="text-gray-400">ログを収集中...</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`
                  ${log.includes('✅') ? 'text-green-400' : ''}
                  ${log.includes('❌') ? 'text-red-400' : ''}
                  ${log.includes('🔔') ? 'text-yellow-400' : ''}
                  ${log.includes('🚀') ? 'text-blue-400' : ''}
                  ${log.includes('---') ? 'text-gray-500 font-bold mt-2' : ''}
                `}>
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            ページをリロード
          </button>
          
          <div className="text-sm text-gray-400">
            <p>Supabaseダッシュボードで設定：</p>
            <code className="bg-gray-700 px-2 py-1 rounded">
              {"{{ .SiteURL }}/auth/test-reset#access_token={{ .Token }}&type=recovery"}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}