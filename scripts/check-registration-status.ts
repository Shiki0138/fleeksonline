import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkRegistrationStatus() {
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    if (authError) {
      console.error('Failed to get auth users:', authError.message)
      return
    }

    // Get all fleeks_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('fleeks_profiles')
      .select('id, username, full_name, membership_type, role, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Failed to get fleeks_profiles:', profilesError.message)
      return
    }

    // Get all beauty_users
    const { data: beautyUsers, error: beautyError } = await supabase
      .from('beauty_users')
      .select('id, email')

    if (beautyError) {
      console.error('Failed to get beauty_users:', beautyError.message)
      return
    }

    console.log('=== REGISTRATION STATUS SUMMARY ===')
    console.log(`Total Auth Users: ${authUsers.users.length}`)
    console.log(`Total Beauty Users: ${beautyUsers?.length || 0}`)
    console.log(`Total Fleeks Profiles: ${profiles?.length || 0}`)

    // Check for users with premium membership
    const premiumUsers = profiles?.filter(p => p.membership_type === 'premium') || []
    console.log(`Premium Members: ${premiumUsers.length}`)

    // Show recent registrations
    console.log('\n=== RECENT REGISTRATIONS (Last 10) ===')
    const recentProfiles = profiles?.slice(0, 10) || []
    recentProfiles.forEach((profile, index) => {
      const beautyUser = beautyUsers?.find(bu => bu.id === profile.id)
      console.log(`${index + 1}. ${beautyUser?.email || 'N/A'} - ${profile.membership_type} (${profile.created_at?.substring(0, 16)})`)
    })

    // Check for incomplete registrations
    const authUserIds = new Set(authUsers.users.map(u => u.id))
    const profileIds = new Set(profiles?.map(p => p.id) || [])
    const beautyUserIds = new Set(beautyUsers?.map(u => u.id) || [])

    const usersWithoutProfiles = authUsers.users.filter(u => !profileIds.has(u.id))
    const usersWithoutBeautyUsers = authUsers.users.filter(u => !beautyUserIds.has(u.id))

    if (usersWithoutProfiles.length > 0) {
      console.log('\n⚠️  INCOMPLETE: Auth users without fleeks_profiles:')
      usersWithoutProfiles.forEach(user => {
        console.log(`- ${user.email} (${user.id})`)
      })
    }

    if (usersWithoutBeautyUsers.length > 0) {
      console.log('\n⚠️  INCOMPLETE: Auth users without beauty_users:')
      usersWithoutBeautyUsers.forEach(user => {
        console.log(`- ${user.email} (${user.id})`)
      })
    }

    if (usersWithoutProfiles.length === 0 && usersWithoutBeautyUsers.length === 0) {
      console.log('\n✅ ALL USERS HAVE COMPLETE REGISTRATION!')
    }

    console.log('\n=== EMAIL VERIFICATION STATUS ===')
    const verifiedUsers = authUsers.users.filter(u => u.email_confirmed_at)
    const unverifiedUsers = authUsers.users.filter(u => !u.email_confirmed_at)
    console.log(`Verified: ${verifiedUsers.length}`)
    console.log(`Unverified: ${unverifiedUsers.length}`)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkRegistrationStatus().catch(console.error)