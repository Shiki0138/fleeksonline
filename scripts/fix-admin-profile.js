#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fixAdminProfile() {
  console.log('🔧 管理者プロファイル修正中...\n')

  // 管理者のIDを取得
  const adminId = 'bbd1197d-9e3a-4c98-949f-e07c342e6670'
  const adminEmail = 'greenroom51@gmail.com'

  try {
    // 1. まず既存のプロファイルを確認
    console.log('📋 既存プロファイル確認中...')
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('id', adminId)
      .single()

    if (existingProfile) {
      console.log('✅ プロファイルが既に存在します')
      console.log('  - Role:', existingProfile.role)
      console.log('  - Membership:', existingProfile.membership_type)
      
      // roleをadminに更新
      if (existingProfile.role !== 'admin') {
        console.log('\n🔄 ロールをadminに更新中...')
        const { error: updateError } = await supabaseAdmin
          .from('fleeks_profiles')
          .update({ 
            role: 'admin',
            membership_type: 'vip',
            updated_at: new Date().toISOString()
          })
          .eq('id', adminId)

        if (updateError) {
          console.error('❌ 更新エラー:', updateError.message)
        } else {
          console.log('✅ ロール更新完了')
        }
      }
    } else {
      // 2. プロファイルが存在しない場合は作成
      console.log('📝 新規プロファイル作成中...')
      const { error: insertError } = await supabaseAdmin
        .from('fleeks_profiles')
        .insert({
          id: adminId,
          username: 'admin',
          full_name: 'Administrator',
          role: 'admin',
          membership_type: 'vip',
          display_name: 'Administrator',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('❌ 作成エラー:', insertError.message)
      } else {
        console.log('✅ プロファイル作成完了')
      }
    }

    // 3. パスワードをリセット
    console.log('\n🔑 パスワードリセット中...')
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.updateUserById(
      adminId,
      { password: 'Admin123456!' }
    )

    if (resetError) {
      console.error('❌ パスワードリセットエラー:', resetError.message)
    } else {
      console.log('✅ パスワードリセット完了')
    }

    // 4. 最終確認
    console.log('\n📊 最終確認...')
    const { data: finalProfile } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('id', adminId)
      .single()

    if (finalProfile) {
      console.log('✅ プロファイル状態:')
      console.log('  - ID:', finalProfile.id)
      console.log('  - Username:', finalProfile.username)
      console.log('  - Role:', finalProfile.role)
      console.log('  - Membership:', finalProfile.membership_type)
      console.log('  - Status:', finalProfile.status)
    }

    console.log('\n🎉 修正完了!')
    console.log('📧 ログイン情報:')
    console.log('  - Email:', adminEmail)
    console.log('  - Password: Admin123456!')
    console.log('\n⚠️  セキュリティのため、ログイン後すぐにパスワードを変更してください。')

  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

fixAdminProfile()