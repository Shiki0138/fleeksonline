import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for debugging
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
)

export async function GET() {
  try {
    // Check for greenroom51@gmail.com user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError && process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: authError.message,
        note: 'Service key might be invalid'
      }, { status: 500 })
    }

    // Find the specific user
    let user = null
    if (authData?.users) {
      user = authData.users.find(u => u.email === 'greenroom51@gmail.com')
    }

    // Get profile data
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user?.id || '')
      .single()

    // Get video count
    const { data: videos, count: videoCount, error: videoError } = await supabaseAdmin
      .from('fleeks_videos')
      .select('*', { count: 'exact' })

    // Get RLS policies for videos
    const { data: policies, error: policyError } = await supabaseAdmin
      .rpc('get_policies', { table_name: 'fleeks_videos' })
      .catch(() => ({ data: null, error: 'RLS info not available' }))

    return NextResponse.json({
      user: user ? {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        role: user.role,
        app_metadata: user.app_metadata,
        user_metadata: user.user_metadata
      } : 'User not found',
      profile: profile || profileError?.message || 'No profile found',
      videos: {
        count: videoCount,
        sample: videos?.slice(0, 3).map(v => ({
          id: v.id,
          title: v.title,
          published_at: v.published_at,
          is_premium: v.is_premium
        })),
        error: videoError?.message
      },
      rlsPolicies: policies || policyError,
      debugInfo: {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug check failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}