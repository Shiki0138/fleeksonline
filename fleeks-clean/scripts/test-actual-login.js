#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0'

const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testActualLogin() {
  console.log('🔐 実際のログインテストを実行します\n')

  const accounts = [
    {
      email: 'greenroom51@gmail.com',
      password: 'Admin123!',
      description: 'メイン管理者アカウント（推測パスワード1）'
    },
    {
      email: 'greenroom51@gmail.com',
      password: 'admin123',
      description: 'メイン管理者アカウント（推測パスワード2）'
    },
    {
      email: 'greenroom51@gmail.com',
      password: 'password123',
      description: 'メイン管理者アカウント（推測パスワード3）'
    },
    {
      email: 'test-admin@fleeks-test.com',
      password: 'TestPassword123!',
      description: 'テスト管理者アカウント'
    }
  ]

  for (const account of accounts) {
    console.log(`\n🔍 ${account.description}`)
    console.log(`   Email: ${account.email}`)
    
    try {
      // ログイン試行
      const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
        email: account.email,
        password: account.password
      })

      if (loginError) {
        console.log(`❌ ログイン失敗: ${loginError.message}`)
        console.log(`   エラーコード: ${loginError.status || 'N/A'}`)
        continue
      }

      console.log(`✅ ログイン成功!`)
      console.log(`   ユーザーID: ${loginData.user.id}`)
      console.log(`   Email確認済み: ${loginData.user.email_confirmed_at ? 'Yes' : 'No'}`)

      // 1. fleeks_profiles テーブル確認
      console.log(`\n   📋 fleeks_profiles確認:`)
      const { data: fleeksProfile, error: fleeksError } = await supabaseClient
        .from('fleeks_profiles')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      if (fleeksError) {
        console.log(`   ❌ fleeks_profiles エラー: ${fleeksError.message}`)
        if (fleeksError.code === 'PGRST116') {
          console.log(`   ⚠️  プロファイルが見つかりません（管理者権限なし）`)
        }
      } else {
        console.log(`   ✅ fleeks_profiles 見つかりました:`)
        console.log(`      Role: ${fleeksProfile.role}`)
        console.log(`      Username: ${fleeksProfile.username}`)
        console.log(`      Membership: ${fleeksProfile.membership_type}`)
      }

      // 2. beauty_users テーブル確認
      console.log(`\n   👤 beauty_users確認:`)
      const { data: beautyProfile, error: beautyError } = await supabaseClient
        .from('beauty_users')
        .select('*')
        .eq('id', loginData.user.id)
        .single()

      if (beautyError) {
        console.log(`   ❌ beauty_users エラー: ${beautyError.message}`)
      } else {
        console.log(`   ✅ beauty_users 見つかりました:`)
        console.log(`      Email: ${beautyProfile.email}`)
        console.log(`      Name: ${beautyProfile.full_name}`)
        console.log(`      Status: ${beautyProfile.subscription_status}`)
      }

      // ログアウト
      await supabaseClient.auth.signOut()
      console.log(`   🚪 ログアウト完了`)

      // 最初の成功でテスト終了
      if (loginData) {
        console.log(`\n🎉 テスト完了: ${account.email} でログイン成功`)
        break
      }

    } catch (err) {
      console.log(`❌ 例外発生: ${err.message}`)
    }
  }

  // 現在のログインページの問題点を説明
  console.log(`\n` + '='.repeat(60))
  console.log('🚨 ログインシステムの問題点')
  console.log('='.repeat(60))
  console.log('1. ログインページが fleeks_profiles テーブルを参照している')
  console.log('2. fleeks_profiles には email カラムがない')
  console.log('3. 実際のユーザーデータは beauty_users テーブルにある')
  console.log('4. greenroom51@gmail.com は beauty_users にあるが fleeks_profiles にない')
  console.log('5. 結果: ログイン成功後にプロファイル取得でエラー')
  
  console.log(`\n💡 解決策:`)
  console.log('A. beauty_users テーブルを使用するようログインページを修正')
  console.log('B. または greenroom51@gmail.com を fleeks_profiles に追加')
  console.log('C. テーブル統合を検討')
}

testActualLogin()