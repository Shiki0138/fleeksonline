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

async function checkTableStructure() {
  try {
    console.log('=== Checking fleeks_profiles table structure ===')
    
    // Check if fleeks_profiles table exists and its structure
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'fleeks_profiles' })
      .single()
    
    if (error) {
      console.log('RPC failed, trying direct query...')
      
      // Alternative approach: try to select from the table
      const { data: testData, error: testError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error('fleeks_profiles table error:', testError.message)
        
        // Check if the table exists at all
        console.log('\n=== Checking available tables ===')
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .like('table_name', '%profile%')
        
        if (tablesError) {
          console.error('Error checking tables:', tablesError.message)
        } else {
          console.log('Available tables with "profile" in name:', tables)
        }
      } else {
        console.log('fleeks_profiles table exists and is accessible')
        console.log('Sample data structure:', testData?.[0] || 'No data')
      }
    } else {
      console.log('Table columns:', columns)
    }
    
    // Also check beauty_users table
    console.log('\n=== Checking beauty_users table ===')
    const { data: beautyData, error: beautyError } = await supabase
      .from('beauty_users')
      .select('id, email')
      .limit(1)
    
    if (beautyError) {
      console.error('beauty_users table error:', beautyError.message)
    } else {
      console.log('beauty_users table exists, sample:', beautyData?.[0] || 'No data')
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkTableStructure().catch(console.error)