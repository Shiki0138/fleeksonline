import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { postId, progress } = await request.json()

    // Update or insert reading progress
    const { error } = await supabase
      .from('reading_progress')
      .upsert({
        user_id: user.id,
        post_id: postId,
        progress_percentage: progress,
        last_read_at: new Date().toISOString()
      })

    if (error) {
      console.error('Error saving reading progress:', error)
      return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reading progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (postId) {
      // Get progress for specific post
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .single()

      if (error && error.code !== 'PGRST116') {
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
      }

      return NextResponse.json({ progress: data || null })
    } else {
      // Get all reading progress
      const { data, error } = await supabase
        .from('reading_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('last_read_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 })
      }

      return NextResponse.json({ progress: data || [] })
    }
  } catch (error) {
    console.error('Reading progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}