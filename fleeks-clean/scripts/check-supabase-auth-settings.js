#!/usr/bin/env node

/**
 * Supabase認証設定確認スクリプト
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAuthSettings() {
  console.log('🔍 Supabase認証設定チェック\n');

  try {
    // プロジェクト情報の表示
    console.log('📋 プロジェクト情報:');
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`プロジェクトID: ${supabaseUrl.split('//')[1].split('.')[0]}\n`);

    // 現在のユーザー一覧取得（管理者権限で）
    console.log('👥 現在のユーザー一覧:');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ ユーザー取得エラー:', usersError.message);
    } else {
      users.users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (ID: ${user.id})`);
        console.log(`   作成日: ${user.created_at}`);
        console.log(`   最終ログイン: ${user.last_sign_in_at || 'Never'}`);
        console.log(`   確認済み: ${user.email_confirmed_at ? 'Yes' : 'No'}\n`);
      });
    }

    // パスワードリセットテスト（実際の送信はしない）
    console.log('🔐 認証機能テスト（ドライラン）:');
    console.log('テスト対象: greenroom51@gmail.com');
    
    // 管理者ユーザーの詳細確認
    const adminUser = users.users?.find(u => u.email === 'greenroom51@gmail.com');
    if (adminUser) {
      console.log('✅ 管理者ユーザー存在確認: OK');
      console.log(`   ユーザーID: ${adminUser.id}`);
      console.log(`   作成日: ${adminUser.created_at}`);
    } else {
      console.log('❌ 管理者ユーザーが見つかりません');
    }

    // 推奨設定の表示
    console.log('\n⚙️ 推奨Supabase設定:');
    console.log('='.repeat(50));
    console.log('1. Site URL:');
    console.log('   https://app.fleeks.jp');
    console.log('\n2. Redirect URLs:');
    console.log('   https://app.fleeks.jp/auth/callback');
    console.log('   https://app.fleeks.jp/auth/update-password');
    console.log('   https://app.fleeks.jp/dashboard');
    console.log('   https://app.fleeks.jp/admin');
    console.log('\n3. Email Templates - Reset Password:');
    console.log('   Redirect URL: https://app.fleeks.jp/auth/callback');
    console.log('\n4. Security Settings:');
    console.log('   Enable email confirmations: Yes');
    console.log('   Enable email change confirmations: Yes');
    console.log('   Secure email change: Yes\n');

    // URLテスト
    console.log('🌐 URLアクセシビリティテスト:');
    const testUrls = [
      'https://app.fleeks.jp',
      'https://app.fleeks.jp/auth/callback',
      'https://app.fleeks.jp/auth/update-password',
      'https://app.fleeks.jp/dashboard',
      'https://app.fleeks.jp/admin'
    ];

    for (const url of testUrls) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        const status = response.status;
        const statusText = status < 400 ? '✅' : '❌';
        console.log(`${statusText} ${url} (${status})`);
      } catch (err) {
        console.log(`❌ ${url} (Connection Error)`);
      }
    }

    console.log('\n📝 次のステップ:');
    console.log('1. https://app.supabase.com にアクセス');
    console.log('2. プロジェクト選択 → Authentication → Settings');
    console.log('3. URL Configuration を上記推奨設定に変更');
    console.log('4. Email Templates を確認・更新');
    console.log('5. 設定保存後、パスワードリセットを再テスト\n');

  } catch (err) {
    console.error('❌ エラー:', err.message);
  }
}

checkAuthSettings();