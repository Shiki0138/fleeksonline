#!/usr/bin/env node

/**
 * Test script for Fleeks authentication setup
 * 
 * Usage: node scripts/test-auth.js
 * 
 * This script verifies:
 * 1. Supabase environment variables are set
 * 2. Connection to Supabase can be established
 * 3. Auth configuration is correct
 */

require('dotenv').config({ path: '.env.local' })

async function testAuth() {
  console.log('🔍 Testing Fleeks Authentication Setup...\n')

  // Check environment variables
  console.log('1. Checking environment variables:')
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET'
  ]

  let envVarsOk = true
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar} is set`)
    } else {
      console.log(`   ❌ ${envVar} is missing`)
      envVarsOk = false
    }
  }

  if (!envVarsOk) {
    console.log('\n❌ Some environment variables are missing. Please check your .env.local file.')
    process.exit(1)
  }

  // Test Supabase connection
  console.log('\n2. Testing Supabase connection:')
  try {
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // Test auth endpoint
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.log(`   ❌ Auth test failed: ${error.message}`)
    } else {
      console.log('   ✅ Successfully connected to Supabase')
      console.log(`   ✅ Session status: ${session ? 'Active session found' : 'No active session'}`)
    }

    // Test database connection
    const { count, error: dbError } = await supabase
      .from('beauty_users')
      .select('*', { count: 'exact', head: true })

    if (dbError) {
      console.log(`   ❌ Database test failed: ${dbError.message}`)
      console.log('      Make sure to run the database migrations.')
    } else {
      console.log(`   ✅ Database connection successful`)
      console.log(`   ✅ beauty_users table exists (${count || 0} users)`)
    }

  } catch (error) {
    console.log(`   ❌ Connection test failed: ${error.message}`)
  }

  // Check OAuth providers
  console.log('\n3. OAuth Configuration:')
  console.log('   ℹ️  Make sure Google OAuth is configured in your Supabase dashboard:')
  console.log('      - Go to Authentication > Providers')
  console.log('      - Enable Google provider')
  console.log('      - Add OAuth credentials from Google Cloud Console')
  console.log(`      - Set redirect URL to: ${process.env.NEXTAUTH_URL}/auth/callback`)

  console.log('\n✅ Authentication setup check complete!')
  console.log('\nNext steps:')
  console.log('1. Run database migrations: npm run supabase:migrate')
  console.log('2. Start the development server: npm run dev')
  console.log('3. Test authentication at: http://localhost:3000/login')
}

testAuth().catch(console.error)