#!/usr/bin/env node

/**
 * パスワードリセットのデバッグスクリプト
 * Supabaseの設定と動作を確認
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 パスワードリセット デバッグツール\n');

// 設定の確認
console.log('📋 環境変数の確認:');
console.log(`- SUPABASE_URL: ${supabaseUrl ? '✅ 設定済み' : '❌ 未設定'}`);
console.log(`- ANON_KEY: ${supabaseAnonKey ? '✅ 設定済み' : '❌ 未設定'}`);
console.log(`- SERVICE_KEY: ${supabaseServiceKey ? '✅ 設定済み' : '❌ 未設定'}`);
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 必要な環境変数が設定されていません');
  process.exit(1);
}

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  const testEmail = process.argv[2];
  
  if (!testEmail) {
    console.log('使用方法: node test-password-reset-debug.js <email>');
    process.exit(1);
  }

  console.log(`📧 テストメール: ${testEmail}\n`);

  try {
    // 1. パスワードリセットメールの送信
    console.log('1️⃣ パスワードリセットメールを送信...');
    const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'https://app.fleeks.jp/auth/update-password',
    });

    if (error) {
      console.error('❌ エラー:', error.message);
      return;
    }

    console.log('✅ メール送信成功');
    console.log('📬 メールを確認してください');
    console.log('');

    // 2. メールテンプレートの確認事項
    console.log('📝 Supabaseダッシュボードで確認すること:');
    console.log('');
    console.log('1. Authentication → Email Templates → Reset Password');
    console.log('   現在のテンプレート:');
    console.log('   {{ .SiteURL }}/auth/update-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery');
    console.log('');
    console.log('2. Authentication → URL Configuration');
    console.log('   - Site URL: https://app.fleeks.jp');
    console.log('   - Redirect URLs に /auth/update-password が含まれている');
    console.log('');
    console.log('3. Authentication → Settings');
    console.log('   - Token Expiry: 3600秒（1時間）以上');
    console.log('');

    // 3. トークンの形式
    console.log('🔑 トークンの形式について:');
    console.log('- 新形式: #access_token=xxx&refresh_token=xxx&type=recovery');
    console.log('- 旧形式: ?token=xxx&type=recovery');
    console.log('- 両方の形式に対応済み');
    console.log('');

    // 4. 一般的な問題
    console.log('⚠️  よくある問題:');
    console.log('1. refresh_tokenが空 → access_tokenのみで処理');
    console.log('2. リンクの有効期限切れ → 1時間以内にクリック');
    console.log('3. セッションが確立されない → 複数の方法で試行');
    console.log('');

    // 5. 代替方法
    console.log('🔄 代替方法:');
    console.log('OTP方式のパスワードリセット: /auth/reset-password-otp');
    console.log('');

  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
  }
}

// サービスキーがある場合の追加チェック
async function checkWithServiceKey() {
  if (!supabaseServiceKey) {
    console.log('ℹ️  サービスキーが設定されていないため、詳細チェックはスキップします');
    return;
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
  
  console.log('🔐 管理者権限での追加チェック...');
  
  try {
    // ユーザーの確認
    const testEmail = process.argv[2];
    if (testEmail) {
      const { data: users, error } = await adminSupabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000
      });
      
      if (!error && users) {
        const user = users.users.find(u => u.email === testEmail);
        if (user) {
          console.log('✅ ユーザー確認:', {
            id: user.id,
            email: user.email,
            created: new Date(user.created_at).toLocaleString('ja-JP'),
            confirmed: user.email_confirmed_at ? '✅' : '❌'
          });
        } else {
          console.log('❌ ユーザーが見つかりません');
        }
      }
    }
  } catch (err) {
    console.error('管理者チェックエラー:', err);
  }
}

// 実行
testPasswordReset().then(() => {
  checkWithServiceKey();
});