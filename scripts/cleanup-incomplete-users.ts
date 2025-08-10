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

async function cleanupIncompleteUsers() {
  try {
    console.log('Finding users with auth but no fleeks_profiles...')
    
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Failed to get auth users:', authError.message)
      return
    }
    
    console.log(`Found ${authUsers.users.length} auth users`)
    
    // Get all fleeks_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('fleeks_profiles')
      .select('id')
    
    if (profilesError) {
      console.error('Failed to get fleeks_profiles:', profilesError.message)
      return
    }
    
    console.log(`Found ${profiles?.length || 0} fleeks profiles`)
    
    // Find auth users without fleeks_profiles
    const profileIds = new Set(profiles?.map(p => p.id) || [])
    const usersWithoutProfiles = authUsers.users.filter(user => !profileIds.has(user.id))
    
    console.log(`Found ${usersWithoutProfiles.length} users without fleeks_profiles`)
    
    if (usersWithoutProfiles.length === 0) {
      console.log('No cleanup needed!')
      return
    }
    
    console.log('Users to be deleted:')
    usersWithoutProfiles.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id})`)
    })
    
    // Delete these incomplete users
    let deleted = 0
    let errors = 0
    
    for (const user of usersWithoutProfiles) {
      try {
        console.log(`Deleting user: ${user.email}`)
        
        // Delete from beauty_users first (if exists)
        await supabase.from('beauty_users').delete().eq('id', user.id)
        
        // Delete from auth
        const { error } = await supabase.auth.admin.deleteUser(user.id)
        
        if (error) {
          console.error(`Failed to delete ${user.email}:`, error.message)
          errors++
        } else {
          console.log(`Successfully deleted: ${user.email}`)
          deleted++
        }
      } catch (error) {
        console.error(`Unexpected error deleting ${user.email}:`, error)
        errors++
      }
    }
    
    console.log(`\n=== CLEANUP SUMMARY ===`)
    console.log(`Users deleted: ${deleted}`)
    console.log(`Errors: ${errors}`)
    
  } catch (error) {
    console.error('Unexpected error during cleanup:', error)
  }
}

cleanupIncompleteUsers().catch(console.error)