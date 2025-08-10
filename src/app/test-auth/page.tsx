'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAuth = async () => {
    setLoading(true)
    setResult(null)

    try {
      // 1. ユーザーの存在確認
      console.log('Testing authentication for mail@invest-master.net')
      
      // 2. beauty_usersテーブルを直接確認（管理者権限が必要）
      const { data: users, error: usersError } = await supabase
        .from('beauty_users')
        .select('id, email, created_at')
        .eq('email', 'mail@invest-master.net')
      
      console.log('beauty_users query result:', { users, usersError })

      // 3. プロファイルの確認
      const { data: profiles, error: profilesError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .ilike('full_name', '%投資%')
      
      console.log('fleeks_profiles query result:', { profiles, profilesError })

      // 4. 認証を試行
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'mail@invest-master.net',
        password: 'Skyosai51'
      })

      console.log('Auth result:', { authData, authError })

      setResult({
        users,
        usersError,
        profiles,
        profilesError,
        authData,
        authError: authError?.message || null,
        authErrorDetails: authError
      })

    } catch (err) {
      console.error('Test error:', err)
      setResult({ error: err })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <button
        onClick={testAuth}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test Authentication'}
      </button>

      {result && (
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Results:</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 bg-yellow-900/20 border border-yellow-500/50 p-4 rounded">
        <h3 className="font-bold text-yellow-400 mb-2">Debug Info:</h3>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Email: mail@invest-master.net</li>
          <li>Password: Skyosai51</li>
          <li>If user doesn't exist, create it in Supabase Dashboard first</li>
          <li>Check browser console for detailed logs</li>
        </ul>
      </div>
    </div>
  )
}