#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fetch = require('node-fetch')

// Environment setup
const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0'

// Create Supabase clients
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function runTests() {
  const results = []

  console.log('🚀 Fleeks ログインテスト開始\n')

  // Test 1: Supabase接続確認
  try {
    const { data, error } = await supabaseAdmin.from('fleeks_profiles').select('count').single()
    results.push({
      test: 'Supabase接続テスト',
      success: !error,
      message: error ? `接続エラー: ${error.message}` : 'Supabase接続成功',
      error
    })
  } catch (err) {
    results.push({
      test: 'Supabase接続テスト',
      success: false,
      message: `接続例外: ${err}`,
      error: err
    })
  }

  // Test 2: 既存の管理者アカウント確認
  try {
    console.log('📊 既存管理者アカウント確認中...')
    const { data: adminUsers, error } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('id, email, role, status')
      .eq('role', 'admin')

    results.push({
      test: '管理者アカウント確認',
      success: !error,
      message: error ? `エラー: ${error.message}` : `管理者アカウント数: ${adminUsers?.length || 0}`,
      data: adminUsers
    })

    if (adminUsers && adminUsers.length > 0) {
      console.log('👑 管理者アカウント:')
      adminUsers.forEach(user => {
        console.log(`  - ID: ${user.id}`)
        console.log(`  - Email: ${user.email}`)
        console.log(`  - Status: ${user.status}`)
      })
    }
  } catch (err) {
    results.push({
      test: '管理者アカウント確認',
      success: false,
      message: `例外: ${err}`,
      error: err
    })
  }

  // Test 3: greenroom51@gmail.com確認
  try {
    console.log('\n🔍 greenroom51@gmail.com アカウント確認中...')
    const { data: profile, error } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .eq('email', 'greenroom51@gmail.com')
      .single()

    results.push({
      test: 'greenroom51@gmail.com確認',
      success: !error && profile !== null,
      message: error ? `エラー: ${error.message}` : `アカウント存在: ${profile?.email}, 役割: ${profile?.role}`,
      data: profile
    })
  } catch (err) {
    results.push({
      test: 'greenroom51@gmail.com確認',
      success: false,
      message: `例外: ${err}`,
      error: err
    })
  }

  // Test 4: テストアカウント作成
  const testEmail = 'test-admin@fleeks-test.com'
  const testPassword = 'TestPassword123!'

  try {
    console.log('\n🔧 テストアカウント作成中...')
    
    // まず既存のテストアカウントを削除
    await supabaseAdmin
      .from('fleeks_profiles')
      .delete()
      .eq('email', testEmail)

    // 新しいテストユーザー作成
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    })

    if (authError) {
      results.push({
        test: 'テストアカウント作成',
        success: false,
        message: `認証ユーザー作成エラー: ${authError.message}`,
        error: authError
      })
    } else {
      // プロファイル作成
      const { error: profileError } = await supabaseAdmin
        .from('fleeks_profiles')
        .insert({
          id: authUser.user.id,
          email: testEmail,
          role: 'admin',
          status: 'active',
          full_name: 'Test Admin User',
          subscription_tier: 'premium',
          created_at: new Date().toISOString()
        })

      results.push({
        test: 'テストアカウント作成',
        success: !profileError,
        message: profileError ? `プロファイル作成エラー: ${profileError.message}` : 'テストアカウント作成成功',
        data: { userId: authUser.user.id, email: testEmail },
        error: profileError
      })
    }
  } catch (err) {
    results.push({
      test: 'テストアカウント作成',
      success: false,
      message: `例外: ${err}`,
      error: err
    })
  }

  // Test 5: テストアカウントログイン試行
  try {
    console.log('\n🔐 テストアカウントログイン試行中...')
    
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (loginError) {
      results.push({
        test: 'テストアカウントログイン',
        success: false,
        message: `ログインエラー: ${loginError.message}`,
        error: loginError
      })
    } else {
      // ログイン成功後、プロファイル取得テスト
      const { data: profileData, error: profileError } = await supabaseClient
        .from('fleeks_profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      results.push({
        test: 'テストアカウントログイン',
        success: !profileError && profileData !== null,
        message: profileError 
          ? `プロファイル取得エラー: ${profileError.message}` 
          : `ログイン成功: ${profileData.email}, 役割: ${profileData.role}`,
        data: { user: loginData.user, profile: profileData },
        error: profileError
      })

      // ログアウト
      await supabaseClient.auth.signOut()
    }
  } catch (err) {
    results.push({
      test: 'テストアカウントログイン',
      success: false,
      message: `例外: ${err}`,
      error: err
    })
  }

  // Test 6: ローカルサーバー接続テスト
  try {
    console.log('\n🌐 ローカルサーバー接続テスト中...')
    
    const response = await fetch('http://localhost:3002/')

    results.push({
      test: 'ローカルサーバー接続',
      success: response.ok,
      message: `HTTPステータス: ${response.status}`,
      data: {
        status: response.status,
        statusText: response.statusText
      }
    })
  } catch (err) {
    results.push({
      test: 'ローカルサーバー接続',
      success: false,
      message: `接続エラー: ${err.message}`,
      error: err
    })
  }

  return results
}

async function main() {
  try {
    const results = await runTests()

    console.log('\n' + '='.repeat(60))
    console.log('📊 テスト結果サマリー')
    console.log('='.repeat(60))

    let passedTests = 0
    let totalTests = results.length

    results.forEach((result, index) => {
      const status = result.success ? '✅ PASS' : '❌ FAIL'
      console.log(`\n${index + 1}. ${result.test}: ${status}`)
      console.log(`   ${result.message}`)
      
      if (result.data) {
        console.log(`   データ:`, JSON.stringify(result.data, null, 2).substring(0, 200))
      }
      
      if (result.error) {
        console.log(`   エラー詳細:`, JSON.stringify(result.error, null, 2).substring(0, 300))
      }

      if (result.success) passedTests++
    })

    console.log(`\n📊 結果: ${passedTests}/${totalTests} テスト成功`)
    
    if (passedTests === totalTests) {
      console.log('🎉 すべてのテストが成功しました！')
    } else {
      console.log('⚠️  一部のテストが失敗しました。上記のエラー詳細を確認してください。')
    }

  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error)
  }
}

if (require.main === module) {
  main()
}

module.exports = { runTests }