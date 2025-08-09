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

async function createAdminUser() {
  console.log('👑 管理者アカウント作成中...')
  
  try {
    const adminEmail = 'greenroom51@gmail.com'
    const adminPassword = 'Admin123456!' // Strong default password
    
    // Create auth user
    console.log('📝 認証ユーザー作成中...')
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: 'Administrator',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('❌ 認証ユーザー作成エラー:', authError.message)
      return
    }

    if (!authData.user) {
      console.error('❌ ユーザーデータが返されませんでした')
      return
    }

    console.log('✅ 認証ユーザー作成成功:', authData.user.id)

    // Create beauty_users entry (if required by foreign key constraint)
    console.log('📝 beauty_users エントリ作成中...')
    const { error: beautyUserError } = await supabase
      .from('beauty_users')
      .insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'Administrator',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (beautyUserError && !beautyUserError.message.includes('already exists')) {
      console.log('⚠️ beauty_users作成:', beautyUserError.message)
    } else {
      console.log('✅ beauty_users エントリ作成成功')
    }

    // Create admin profile
    console.log('📝 管理者プロファイル作成中...')
    const { data: profileData, error: profileError } = await supabase
      .from('fleeks_profiles')
      .insert({
        id: authData.user.id,
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

    if (profileError) {
      console.error('❌ プロファイル作成エラー:', profileError.message)
      // Try to delete the auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('🎉 管理者アカウント作成完了!')
    console.log('📧 メールアドレス:', adminEmail)
    console.log('🔑 パスワード:', adminPassword)
    console.log('👑 ロール: admin')
    console.log('💎 メンバーシップ: premium')
    console.log('')
    console.log('⚠️ セキュリティのため、初回ログイン後にパスワードを変更してください!')
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

createAdminUser()