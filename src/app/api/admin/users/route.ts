import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

// Create regular client for session validation
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify the user session
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 })
    }

    // Check admin permissions
    const isAdminEmail = user.email === 'greenroom51@gmail.com'
    
    if (!isAdminEmail) {
      // Also check role in profiles table
      const { data: profile } = await supabaseAdmin
        .from('fleeks_profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
      }
    }

    // Fetch all users using admin client with pagination
    let allAuthUsers: any[] = []
    let page = 1
    let hasMore = true
    
    while (hasMore) {
      const { data: { users: pageUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: 1000 // Maximum allowed by Supabase
      })
      
      if (authError) {
        throw new Error(`Auth users fetch failed: ${authError.message}`)
      }
      
      if (pageUsers && pageUsers.length > 0) {
        allAuthUsers.push(...pageUsers)
        hasMore = pageUsers.length === 1000 // Continue if we got a full page
        page++
      } else {
        hasMore = false
      }
    }
    
    const authUsers = allAuthUsers

    // Fetch all profiles with pagination
    let allProfiles: any[] = []
    let profileOffset = 0
    const profileBatchSize = 1000
    let profileHasMore = true
    
    while (profileHasMore) {
      const { data: profileBatch, error: profileError } = await supabaseAdmin
        .from('fleeks_profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .range(profileOffset, profileOffset + profileBatchSize - 1)

      if (profileError) {
        throw new Error(`Profiles fetch failed: ${profileError.message}`)
      }
      
      if (profileBatch && profileBatch.length > 0) {
        allProfiles.push(...profileBatch)
        profileHasMore = profileBatch.length === profileBatchSize
        profileOffset += profileBatchSize
      } else {
        profileHasMore = false
      }
    }
    
    const profiles = allProfiles

    // Combine data exactly like the original admin page
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])
    const formattedUsers = authUsers?.map(user => {
      const profile = profileMap.get(user.id)
      return {
        id: user.id,
        email: user.email || 'Unknown',
        username: profile?.username || null,
        full_name: profile?.full_name || null,
        membership_type: profile?.membership_type || 'free',
        membership_expires_at: profile?.membership_expires_at || null,
        role: profile?.role || 'user',
        status: profile?.status || 'active',
        created_at: user.created_at,
        updated_at: profile?.updated_at || user.updated_at
      }
    }).filter(user => user.email !== 'Unknown') || []

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      authTotal: authUsers?.length || 0,
      profileTotal: profiles?.length || 0
    })

  } catch (error) {
    console.error('Admin users API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, data } = body

    // Validate admin access (same as GET)
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    switch (action) {
      case 'updateMembership':
        // First check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('fleeks_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!existingProfile) {
          // Create profile if it doesn't exist
          const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (authUser) {
            const { error: createError } = await supabaseAdmin
              .from('fleeks_profiles')
              .insert({
                id: userId,
                username: authUser.email?.split('@')[0] || 'user',
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                membership_type: data.membershipType,
                membership_expires_at: data.membershipType === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                role: 'user',
                created_at: authUser.created_at,
                updated_at: new Date().toISOString()
              })
            
            if (createError) throw createError
          } else {
            throw new Error('User not found in auth system')
          }
        } else {
          // Update existing profile without requiring session refresh
          const updateData: any = { 
            membership_type: data.membershipType,
            updated_at: new Date().toISOString()
          }
          
          // Only set membership_expires_at for non-free plans
          if (data.membershipType !== 'free') {
            updateData.membership_expires_at = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          } else {
            updateData.membership_expires_at = null
          }
          
          const { error: membershipError } = await supabaseAdmin
            .from('fleeks_profiles')
            .update(updateData)
            .eq('id', userId)

          if (membershipError) throw membershipError
        }
        
        return NextResponse.json({ 
          success: true,
          requiresRefresh: false // Don't require session refresh
        })

      case 'updateRole':
        // First check if profile exists
        const { data: existingRoleProfile } = await supabaseAdmin
          .from('fleeks_profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        if (!existingRoleProfile) {
          // Create profile if it doesn't exist
          const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(userId)
          if (authUser) {
            const { error: createError } = await supabaseAdmin
              .from('fleeks_profiles')
              .insert({
                id: userId,
                username: authUser.email?.split('@')[0] || 'user',
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
                membership_type: 'free',
                role: data.role,
                created_at: authUser.created_at,
                updated_at: new Date().toISOString()
              })
            
            if (createError) throw createError
          } else {
            throw new Error('User not found in auth system')
          }
        } else {
          // Update existing profile
          const { error: roleError } = await supabaseAdmin
            .from('fleeks_profiles')
            .update({ 
              role: data.role,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)

          if (roleError) throw roleError
        }
        
        return NextResponse.json({ success: true, message: 'Role updated successfully' })

      case 'updatePassword':
        const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: data.password }
        )

        if (passwordError) throw passwordError
        return NextResponse.json({ success: true })

      case 'updateStatus':
        // Update user status
        const { error: statusError } = await supabaseAdmin
          .from('fleeks_profiles')
          .update({ 
            status: data.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (statusError) throw statusError
        return NextResponse.json({ success: true })

      case 'createUser':
        // Create new user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
          user_metadata: {
            full_name: data.full_name || data.email.split('@')[0],
            username: data.username || data.email.split('@')[0]
          }
        })

        if (createError) throw createError

        if (newUser.user) {
          // Create profile for the new user
          const { error: profileError } = await supabaseAdmin
            .from('fleeks_profiles')
            .insert({
              id: newUser.user.id,
              email: data.email,
              username: data.username || data.email.split('@')[0],
              full_name: data.full_name || data.email.split('@')[0],
              membership_type: data.membership_type || 'free',
              membership_expires_at: data.membership_type === 'free' 
                ? null 
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              role: data.role || 'user',
              status: 'active',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (profileError) throw profileError
        }

        return NextResponse.json({ success: true, user: newUser.user })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Admin users POST error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}