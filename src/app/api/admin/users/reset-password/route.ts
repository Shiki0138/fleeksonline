import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const supabase = createServerComponentClient({ cookies })
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = session.user
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (!isAdminEmail) {
      const { data: profile } = await supabaseAdmin
        .from('fleeks_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Get email from request body
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use the correct redirect URL based on environment
    const redirectUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://app.fleeks.jp'
    
    // Send password reset email using admin client
    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${redirectUrl}/auth/reset-password`,
    })

    if (resetError) {
      console.error('Password reset error:', resetError)
      return NextResponse.json({ 
        error: resetError.message || 'パスワードリセットメールの送信に失敗しました' 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'パスワードリセットメールを送信しました' 
    })

  } catch (error) {
    console.error('Password reset API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}