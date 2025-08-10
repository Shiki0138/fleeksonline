import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkAdminProfile() {
  console.log('🔍 管理者プロファイル確認中...')
  
  try {
    // Get user by email
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth users取得エラー:', authError.message)
      return
    }
    
    const adminUser = authUsers.users.find(u => u.email === 'greenroom51@gmail.com')
    
    if (!adminUser) {
      console.log('❌ greenroom51@gmail.com のユーザーが見つかりません')
      return
    }
    
    console.log('✅ 認証ユーザー見つかりました:')
    console.log('- ID:', adminUser.id)
    console.log('- Email:', adminUser.email)
    console.log('- Created:', adminUser.created_at)
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single()
    
    if (profileError) {
      console.log('❌ プロファイルが見つかりません:', profileError.message)
      
      // Create admin profile
      console.log('📝 管理者プロファイルを作成中...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('fleeks_profiles')
        .insert({
          id: adminUser.id,
          full_name: 'Administrator',
          username: 'admin',
          membership_type: 'premium',
          membership_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 10 years
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ プロファイル作成エラー:', createError.message)
        
        // Check if we need to create beauty_users entry first
        console.log('📝 beauty_users エントリを作成中...')
        const { error: beautyUserError } = await supabase
          .from('beauty_users')
          .insert({
            id: adminUser.id,
            email: adminUser.email,
            full_name: 'Administrator',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (beautyUserError && !beautyUserError.message.includes('already exists')) {
          console.error('❌ beauty_users作成エラー:', beautyUserError.message)
        } else {
          console.log('✅ beauty_users エントリ作成成功')
          
          // Try profile creation again
          const { data: retryProfile, error: retryError } = await supabase
            .from('fleeks_profiles')
            .insert({
              id: adminUser.id,
              full_name: 'Administrator',
              username: 'admin',
              membership_type: 'premium',
              membership_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()
          
          if (retryError) {
            console.error('❌ 再試行プロファイル作成エラー:', retryError.message)
          } else {
            console.log('✅ 管理者プロファイル作成成功!')
            console.log('- Role:', retryProfile.role)
            console.log('- Membership:', retryProfile.membership_type)
          }
        }
      } else {
        console.log('✅ 管理者プロファイル作成成功!')
        console.log('- Role:', newProfile.role)
        console.log('- Membership:', newProfile.membership_type)
      }
    } else {
      console.log('✅ プロファイル見つかりました:')
      console.log('- Full Name:', profile.full_name)
      console.log('- Username:', profile.username)
      console.log('- Role:', profile.role)
      console.log('- Membership:', profile.membership_type)
      
      if (profile.role !== 'admin') {
        console.log('📝 プロファイルをadminに更新中...')
        
        const { error: updateError } = await supabase
          .from('fleeks_profiles')
          .update({
            role: 'admin',
            membership_type: 'premium',
            membership_expires_at: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', adminUser.id)
        
        if (updateError) {
          console.error('❌ プロファイル更新エラー:', updateError.message)
        } else {
          console.log('✅ 管理者権限を設定しました!')
        }
      }
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkAdminProfile()