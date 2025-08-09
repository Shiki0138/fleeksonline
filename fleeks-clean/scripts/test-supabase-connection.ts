import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

console.log('Testing Supabase connection...')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

// Parse the JWT to check the role
try {
  const payload = JSON.parse(Buffer.from(supabaseServiceKey.split('.')[1], 'base64').toString())
  console.log('\nService Key Details:')
  console.log('- Role:', payload.role)
  console.log('- Ref:', payload.ref)
  console.log('- Issued:', new Date(payload.iat * 1000).toISOString())
  
  if (payload.role !== 'service_role') {
    console.error('\n⚠️  WARNING: The provided key is not a service role key!')
    console.error('Current role:', payload.role)
    console.error('Expected role: service_role')
    console.error('\nPlease get the correct Service Role key from:')
    console.error('Supabase Dashboard → Settings → API → Service role key')
  }
} catch (error) {
  console.error('Error parsing service key:', error)
}

// Test connection
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    // Try to list users (requires service role)
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    if (error) {
      console.error('\n❌ Connection test failed:', error.message)
      if (error.message.includes('not authorized')) {
        console.error('\nThis error indicates the key does not have service role permissions.')
        console.error('Please ensure you are using the Service Role key, not the Anon key.')
      }
    } else {
      console.log('\n✅ Connection successful!')
      console.log('Total users in database:', data.users.length)
      console.log('\nYou can now run: npm run bulk-register')
    }
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

testConnection()