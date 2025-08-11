#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function resetUserPassword() {
  console.log('🔧 一般ユーザーのパスワードリセット中...\n')

  // 最初のプレミアムユーザーを選択
  const userEmail = 'test.user.fleeks@example.com'
  const userId = '3ec93895-8ef1-49f7-b65d-e4b1b39d79d9'
  const newPassword = 'Test123456!'

  try {
    // 1. パスワードをリセット
    console.log(`📧 ユーザー: ${userEmail}`)
    console.log('🔑 パスワードリセット中...')
    
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { 
        password: newPassword,
        email_confirm: true
      }
    )

    if (resetError) {
      console.error('❌ パスワードリセットエラー:', resetError.message)
      return
    }

    console.log('✅ パスワードリセット完了')

    // 2. プロファイル情報確認
    console.log('\n📊 プロファイル確認中...')
    const { data: profile } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) {
      console.log('✅ プロファイル情報:')
      console.log('  - Username:', profile.username)
      console.log('  - Role:', profile.role)
      console.log('  - Membership:', profile.membership_type)
      console.log('  - Status:', profile.status || 'active')
    }

    console.log('\n🎉 リセット完了!')
    console.log('📧 ログイン情報:')
    console.log('  - Email:', userEmail)
    console.log('  - Password:', newPassword)

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

resetUserPassword()