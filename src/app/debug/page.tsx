'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function DebugPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`])
  }

  useEffect(() => {
    checkAll()
  }, [])

  const checkAll = async () => {
    addLog('Starting debug checks...')
    
    // 1. 環境変数チェック
    addLog(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
    addLog(`SUPABASE_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...`)
    
    // 2. ユーザー認証チェック
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) {
        addLog(`Auth error: ${JSON.stringify(userError)}`)
      } else {
        addLog(`User: ${user?.email || 'Not logged in'}`)
        setUser(user)
      }
    } catch (e) {
      addLog(`Auth exception: ${e}`)
    }

    // 3. プロファイル取得テスト
    if (user) {
      try {
        const { data, error } = await supabase
          .from('fleeks_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (error) {
          addLog(`Profile error: ${JSON.stringify(error)}`)
        } else {
          addLog(`Profile found: ${JSON.stringify(data)}`)
          setProfile(data)
        }
      } catch (e) {
        addLog(`Profile exception: ${e}`)
      }
    }

    // 4. 動画一覧取得テスト
    try {
      const { data, error } = await supabase
        .from('fleeks_videos')
        .select('*')
        .limit(5)
      
      if (error) {
        addLog(`Videos error: ${JSON.stringify(error)}`)
      } else {
        addLog(`Videos found: ${data?.length || 0}`)
        setVideos(data || [])
      }
    } catch (e) {
      addLog(`Videos exception: ${e}`)
    }

    // 5. RLSポリシーチェック
    try {
      const { data, error } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .limit(1)
      
      if (error) {
        addLog(`RLS check error: ${JSON.stringify(error)}`)
      } else {
        addLog(`RLS check success: Can read profiles`)
      }
    } catch (e) {
      addLog(`RLS exception: ${e}`)
    }
  }

  const testSingleVideoFetch = async (videoId: string) => {
    addLog(`Testing video fetch for ID: ${videoId}`)
    try {
      const { data, error } = await supabase
        .from('fleeks_videos')
        .select('*')
        .eq('id', videoId)
        .single()
      
      if (error) {
        addLog(`Single video error: ${JSON.stringify(error)}`)
      } else {
        addLog(`Single video success: ${JSON.stringify(data)}`)
      }
    } catch (e) {
      addLog(`Single video exception: ${e}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Supabase Debug Page</h1>
      
      <div className="space-y-6">
        {/* ユーザー情報 */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-2">User Info</h2>
          <pre className="text-sm">{JSON.stringify(user, null, 2)}</pre>
        </div>

        {/* プロファイル情報 */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-2">Profile Info</h2>
          <pre className="text-sm">{JSON.stringify(profile, null, 2)}</pre>
        </div>

        {/* 動画一覧 */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-2">Videos ({videos.length})</h2>
          {videos.map(video => (
            <div key={video.id} className="mb-2 p-2 bg-gray-700 rounded">
              <p>ID: {video.id}</p>
              <p>Title: {video.title}</p>
              <p>YouTube ID: {video.youtube_id}</p>
              <button
                onClick={() => testSingleVideoFetch(video.id)}
                className="mt-2 bg-blue-500 px-3 py-1 rounded text-sm"
              >
                Test Fetch This Video
              </button>
            </div>
          ))}
        </div>

        {/* ログ */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-xl mb-2">Debug Logs</h2>
          <div className="space-y-1 text-xs font-mono">
            {logs.map((log, i) => (
              <div key={i} className="text-gray-300">{log}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}