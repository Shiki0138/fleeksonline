#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function resetAdminPassword() {
  console.log('🔐 管理者パスワードリセット開始\n')

  const adminEmail = 'greenroom51@gmail.com'
  const newPassword = 'FleeksAdmin2025!'

  try {
    // 1. 管理者ユーザーを検索
    console.log('🔍 管理者ユーザー検索中...')
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ ユーザー一覧取得エラー:', listError)
      return
    }

    const adminUser = users.users.find(user => user.email === adminEmail)
    if (!adminUser) {
      console.error(`❌ ${adminEmail} が見つかりません`)
      return
    }

    console.log(`✅ 管理者ユーザー見つかりました: ${adminUser.id}`)

    // 2. パスワードリセット
    console.log('\n🔄 パスワード更新中...')
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      {
        password: newPassword
      }
    )

    if (updateError) {
      console.error('❌ パスワード更新エラー:', updateError)
      return
    }

    console.log('✅ パスワード更新完了')

    // 3. fleeks_profilesに管理者エントリ作成
    console.log('\n👤 管理者プロファイル作成中...')
    
    // まず既存エントリを確認
    const { data: existingProfile, error: checkError } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('id', adminUser.id)
      .single()

    if (existingProfile) {
      console.log('✅ 既存の管理者プロファイルを確認しました')
      console.log(`   Role: ${existingProfile.role}`)
    } else {
      // プロファイル作成
      const { error: profileError } = await supabaseAdmin
        .from('fleeks_profiles')
        .insert({
          id: adminUser.id,
          username: 'admin',
          full_name: 'Administrator',
          role: 'admin',
          membership_type: 'enterprise',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        console.error('❌ プロファイル作成エラー:', profileError)
        console.log('⚠️  ログイン時にプロファイル関連エラーが発生する可能性があります')
      } else {
        console.log('✅ 管理者プロファイル作成完了')
      }
    }

    // 4. 新しいパスワードでログインテスト
    console.log('\n🧪 新しいパスワードでログインテスト...')
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: adminEmail,
      password: newPassword
    })

    if (loginError) {
      console.error('❌ ログインテストエラー:', loginError.message)
    } else {
      console.log('🎉 ログインテスト成功!')
      console.log(`   ユーザーID: ${loginData.user.id}`)
      console.log(`   Email: ${loginData.user.email}`)
      console.log(`   最終サインイン: ${loginData.user.last_sign_in_at}`)

      // プロファイル確認
      const { data: profile, error: profileCheckError } = await supabaseClient
        .from('fleeks_profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      if (profileCheckError) {
        console.log(`⚠️  プロファイル取得エラー: ${profileCheckError.message}`)
        console.log('   ログインページで管理者判定に失敗する可能性があります')
      } else {
        console.log('✅ 管理者プロファイル確認成功')
        console.log(`   Role: ${profile.role}`)
        console.log(`   Username: ${profile.username}`)
      }

      // ログアウト
      await supabaseClient.auth.signOut()
      console.log('🚪 ログアウト完了')
    }

    // 5. 結果サマリー
    console.log('\n' + '='.repeat(60))
    console.log('🎯 パスワードリセット結果')
    console.log('='.repeat(60))
    console.log(`Email: ${adminEmail}`)
    console.log(`新しいパスワード: ${newPassword}`)
    console.log('✅ パスワード更新完了')
    console.log('✅ ログインテスト成功')
    
    if (existingProfile?.role === 'admin') {
      console.log('✅ 管理者権限確認済み')
      console.log('\n🌐 Web UIでのログイン:')
      console.log('1. http://localhost:3002/login にアクセス')
      console.log(`2. Email: ${adminEmail}`)
      console.log(`3. Password: ${newPassword}`)
      console.log('4. ログイン後、/adminページにリダイレクトされる予定')
    } else {
      console.log('⚠️  管理者プロファイルに問題があります')
      console.log('   ログインページでプロファイル取得エラーが発生する可能性')
    }

  } catch (error) {
    console.error('❌ パスワードリセット処理エラー:', error)
  }
}

resetAdminPassword()