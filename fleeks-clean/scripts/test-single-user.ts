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

async function testSingleUser() {
  const testEmail = 'test.user.fleeks@example.com'
  
  try {
    console.log(`Testing user registration for: ${testEmail}`)
    
    // Create user with email as password
    console.log('Creating auth user...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testEmail,
      email_confirm: true,
      user_metadata: {
        full_name: testEmail.split('@')[0],
        initial_password: true
      }
    })

    if (authError) {
      console.error('Auth error:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('No user data returned')
      return
    }

    console.log('Auth user created successfully:', authData.user.id)

    // Create entry in beauty_users table
    console.log('Creating beauty_users entry...')
    const { error: beautyUserError } = await supabase
      .from('beauty_users')
      .insert({
        id: authData.user.id,
        email: testEmail,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (beautyUserError) {
      console.error('beauty_users error:', beautyUserError.message)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('beauty_users entry created successfully')

    // Create profile with premium membership
    console.log('Creating fleeks profile...')
    const { error: profileError } = await supabase
      .from('fleeks_profiles')
      .insert({
        id: authData.user.id,
        username: testEmail.split('@')[0],
        full_name: testEmail.split('@')[0],
        membership_type: 'premium',
        membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        role: 'user'
      })

    if (profileError) {
      console.error('Profile error:', profileError.message)
      await supabase.from('beauty_users').delete().eq('id', authData.user.id)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('✅ Test user created successfully!')
    console.log('- Auth user ID:', authData.user.id)
    console.log('- Email:', testEmail)
    console.log('- Membership: premium')
    
    // Verify the complete setup
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
      
    if (profile) {
      console.log('✅ Profile verification successful:', profile)
    } else {
      console.log('❌ Profile verification failed')
    }

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

testSingleUser().catch(console.error)