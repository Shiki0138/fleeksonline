'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'

export default function TestVideosPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [error, setError] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    checkEverything()
  }, [])

  const checkEverything = async () => {
    try {
      // 1. Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
      setUser(currentUser)
      
      if (userError) {
        setError(`User error: ${userError.message}`)
        return
      }

      if (!currentUser) {
        setError('No user logged in')
        return
      }

      // 2. Get profile
      const { data: profileData, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      setProfile(profileData)
      
      // 3. Try different video queries
      const queries = [
        // Query 1: Simple select all
        {
          name: 'Simple select all',
          query: supabase.from('fleeks_videos').select('*')
        },
        // Query 2: With ordering
        {
          name: 'With ordering',
          query: supabase.from('fleeks_videos').select('*').order('published_at', { ascending: false })
        },
        // Query 3: Count only
        {
          name: 'Count only',
          query: supabase.from('fleeks_videos').select('*', { count: 'exact', head: true })
        },
        // Query 4: Just IDs
        {
          name: 'Just IDs',
          query: supabase.from('fleeks_videos').select('id, title')
        }
      ]

      const results: any = {}
      
      for (const { name, query } of queries) {
        const result = await query
        results[name] = {
          data: result.data,
          error: result.error,
          count: result.count
        }
      }

      setDebugInfo(results)

      // Set videos from the successful query
      const successfulQuery = results['With ordering']
      if (successfulQuery && !successfulQuery.error && successfulQuery.data) {
        setVideos(successfulQuery.data)
      }

    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  const updateUserRole = async () => {
    if (!user) return

    try {
      // Update the profile role
      const { data, error } = await supabase
        .from('fleeks_profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        alert(`Error updating role: ${error.message}`)
      } else {
        alert('Role updated to admin!')
        setProfile(data)
      }
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">Video Debug Page</h1>
      
      {/* User Info */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">User Info</h2>
        {user ? (
          <div>
            <p>Email: {user.email}</p>
            <p>ID: {user.id}</p>
            <p>Created: {new Date(user.created_at).toLocaleString()}</p>
          </div>
        ) : (
          <p>No user logged in</p>
        )}
      </div>

      {/* Profile Info */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Profile Info</h2>
        {profile ? (
          <div>
            <p>Username: {profile.username || 'Not set'}</p>
            <p>Full Name: {profile.full_name || 'Not set'}</p>
            <p>Role: <span className={profile.role === 'admin' ? 'text-red-400' : 'text-blue-400'}>{profile.role}</span></p>
            <p>Membership: {profile.membership_type}</p>
            {user?.email === 'greenroom51@gmail.com' && profile.role !== 'admin' && (
              <button
                onClick={updateUserRole}
                className="mt-2 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
              >
                Fix: Update Role to Admin
              </button>
            )}
          </div>
        ) : (
          <p>No profile found</p>
        )}
      </div>

      {/* Query Debug Info */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Query Debug Info</h2>
        {Object.entries(debugInfo).map(([queryName, result]: [string, any]) => (
          <div key={queryName} className="mb-4 p-2 bg-gray-700 rounded">
            <h3 className="font-bold text-yellow-400">{queryName}</h3>
            {result.error ? (
              <p className="text-red-400">Error: {result.error.message}</p>
            ) : (
              <div>
                <p className="text-green-400">Success!</p>
                <p>Count: {result.count !== undefined ? result.count : result.data?.length || 0}</p>
                {result.data && result.data.length > 0 && (
                  <p>First item: {JSON.stringify(result.data[0], null, 2).substring(0, 200)}...</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Videos */}
      <div className="bg-gray-800 p-4 rounded mb-4">
        <h2 className="text-xl font-bold mb-2">Videos Found: {videos.length}</h2>
        {videos.length > 0 ? (
          <div className="space-y-2">
            {videos.map((video) => (
              <div key={video.id} className="p-2 bg-gray-700 rounded">
                <p className="font-semibold">{video.title}</p>
                <p className="text-sm text-gray-400">
                  ID: {video.id} | 
                  Premium: {video.is_premium ? 'Yes' : 'No'} |
                  Published: {video.published_at ? new Date(video.published_at).toLocaleDateString() : 'Not published'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-yellow-400">No videos found - Check the debug info above</p>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900 p-4 rounded">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      )}

      {/* Manual refresh button */}
      <button
        onClick={checkEverything}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
      >
        Refresh All Data
      </button>
    </div>
  )
}