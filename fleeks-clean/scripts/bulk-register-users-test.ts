import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from both .env.local and .env files
dotenv.config({ path: resolve(__dirname, '../.env.local') })
dotenv.config({ path: resolve(__dirname, '../.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  console.error('Current values:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test with first 10 emails
const emails = [
  'epic.3jb@gmail.com',
  'yoshizawanaoko0@gmail.com',
  'ono@shes-salon.jp',
  'endlink.yuki@gmail.com',
  'dsk.group0817@gmail.com',
  'yoshi.soa.0402@gmail.com',
  'mt.west.moshers.nsc@gmail.com',
  'kura.hair2022@gmail.com',
  'yuta.s600119@icloud.com',
  'k.t.m.crew.kyan.oo@gmail.com'
]

async function bulkRegisterUsersTest() {
  console.log(`Starting test bulk registration for ${emails.length} users...`)
  
  const results = {
    success: [] as string[],
    failed: [] as { email: string; error: string }[],
    existing: [] as string[]
  }

  for (const email of emails) {
    try {
      console.log(`\n[${results.success.length + results.failed.length + results.existing.length + 1}/${emails.length}] Processing: ${email}`)
      
      // Check if user already exists
      const { data: existingUser, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error(`Failed to list users:`, listError.message)
        results.failed.push({ email, error: `User check failed: ${listError.message}` })
        continue
      }
      
      const userExists = existingUser?.users.some(u => u.email === email)
      
      if (userExists) {
        console.log(`User already exists: ${email}`)
        results.existing.push(email)
        continue
      }
      
      // Create user with email as password
      console.log(`Creating auth user...`)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: email, // Using email as initial password
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: email.split('@')[0], // Use email prefix as default name
          initial_password: true // Flag to indicate password needs to be changed
        }
      })

      if (authError) {
        console.error(`Failed to create auth user for ${email}:`, authError.message)
        results.failed.push({ email, error: authError.message })
        continue
      }

      if (!authData.user) {
        results.failed.push({ email, error: 'No user data returned' })
        continue
      }

      // First, create entry in beauty_users table (which fleeks_profiles references)
      console.log(`Creating beauty_users entry for user ID: ${authData.user.id}`)
      const { error: beautyUserError } = await supabase
        .from('beauty_users')
        .insert({
          id: authData.user.id,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (beautyUserError) {
        console.error(`Failed to create beauty_users entry for ${email}:`, beautyUserError.message)
        // Try to delete the auth user if beauty_users creation failed
        await supabase.auth.admin.deleteUser(authData.user.id)
        results.failed.push({ email, error: `beauty_users creation failed: ${beautyUserError.message}` })
        continue
      }

      // Create profile with premium membership
      console.log(`Creating fleeks profile for user ID: ${authData.user.id}`)
      const { error: profileError } = await supabase
        .from('fleeks_profiles')
        .insert({
          id: authData.user.id,
          username: email.split('@')[0],
          full_name: email.split('@')[0],
          membership_type: 'premium',
          membership_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          role: 'user'
        })

      if (profileError) {
        console.error(`Failed to create profile for ${email}:`, profileError.message)
        // Try to delete both beauty_users and auth user if profile creation failed
        await supabase.from('beauty_users').delete().eq('id', authData.user.id)
        await supabase.auth.admin.deleteUser(authData.user.id)
        results.failed.push({ email, error: `Profile creation failed: ${profileError.message}` })
        continue
      }

      console.log(`✅ Successfully registered: ${email}`)
      results.success.push(email)
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error) {
      console.error(`Unexpected error for ${email}:`, error)
      results.failed.push({ email, error: String(error) })
    }
  }

  // Print summary
  console.log('\n========== TEST REGISTRATION SUMMARY ==========')
  console.log(`Total emails: ${emails.length}`)
  console.log(`Successfully registered: ${results.success.length}`)
  console.log(`Already existing: ${results.existing.length}`)
  console.log(`Failed: ${results.failed.length}`)
  
  if (results.failed.length > 0) {
    console.log('\nFailed registrations:')
    results.failed.forEach(({ email, error }) => {
      console.log(`- ${email}: ${error}`)
    })
  }
  
  if (results.success.length > 0) {
    console.log('\nSuccessful registrations:')
    results.success.forEach(email => {
      console.log(`✅ ${email}`)
    })
  }
}

// Run the script
bulkRegisterUsersTest().catch(console.error)