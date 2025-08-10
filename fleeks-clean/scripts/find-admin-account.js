#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function findAdminAccount() {
  console.log('🔍 管理者アカウント検索中...\n')

  // 1. beauty_usersテーブルでgreenroom51@gmail.comを検索
  console.log('📧 beauty_usersでgreenroom51@gmail.com検索:')
  try {
    const { data: beautyUsers, error } = await supabaseAdmin
      .from('beauty_users')
      .select('*')
      .ilike('email', '%greenroom51%')

    if (error) {
      console.error('❌ エラー:', error)
    } else {
      console.log(`✅ 検索結果: ${beautyUsers.length}件`)
      beautyUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. Email: ${user.email}`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Name: ${user.full_name}`)
        console.log(`     Status: ${user.subscription_status}`)
        console.log(`     Created: ${user.created_at}`)
        console.log(`     Last Login: ${user.last_login_at}`)
        console.log('')
      })
    }
  } catch (err) {
    console.error('❌ 例外:', err)
  }

  // 2. beauty_usersで全管理者を検索（roleがある場合）
  console.log('👑 beauty_usersで管理者役割検索:')
  try {
    const { data: allUsers, error } = await supabaseAdmin
      .from('beauty_users')
      .select('*')
      .limit(10)

    if (error) {
      console.error('❌ エラー:', error)
    } else {
      console.log(`📊 全ユーザー数（最大10件）: ${allUsers.length}`)
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
      })
    }
  } catch (err) {
    console.error('❌ 例外:', err)
  }

  // 3. fleeks_profilesで全データ確認
  console.log('\n🏗️  fleeks_profiles 全データ:')
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .limit(10)

    if (error) {
      console.error('❌ エラー:', error)
    } else {
      console.log(`📊 プロファイル数: ${profiles.length}`)
      profiles.forEach((profile, index) => {
        console.log(`  ${index + 1}. ID: ${profile.id}`)
        console.log(`     Username: ${profile.username}`)
        console.log(`     Name: ${profile.full_name}`)
        console.log(`     Role: ${profile.role}`)
        console.log(`     Membership: ${profile.membership_type}`)
        console.log('')
      })
    }
  } catch (err) {
    console.error('❌ 例外:', err)
  }

  // 4. auth.usersテーブルで認証ユーザー確認
  console.log('\n🔐 認証ユーザー確認:')
  try {
    const { data: authResponse, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      console.error('❌ 認証ユーザー取得エラー:', error)
    } else {
      console.log(`👤 認証ユーザー数: ${authResponse.users.length}`)
      authResponse.users.forEach((user, index) => {
        console.log(`  ${index + 1}. Email: ${user.email}`)
        console.log(`     ID: ${user.id}`)
        console.log(`     Created: ${user.created_at}`)
        console.log(`     Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`     Last Sign In: ${user.last_sign_in_at || 'Never'}`)
        console.log('')
      })
    }
  } catch (err) {
    console.error('❌ 認証ユーザー例外:', err)
  }
}

findAdminAccount()