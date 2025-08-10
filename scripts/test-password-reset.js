const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kbvaekypkszvzrwlbkug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPasswordReset() {
  console.log('🔄 パスワードリセット機能のテスト開始...\n');

  try {
    // 1. 管理者メールアドレスでパスワードリセット送信
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      'greenroom51@gmail.com',
      {
        redirectTo: 'https://app.fleeks.jp/auth/update-password'
      }
    );

    if (error) {
      console.error('❌ パスワードリセットエラー:', error.message);
      return false;
    }

    console.log('✅ パスワードリセットメール送信成功');
    console.log('📧 メールが送信されました: greenroom51@gmail.com');
    console.log('🔗 リダイレクト先: https://app.fleeks.jp/auth/update-password');
    console.log('\n📝 次の手順:');
    console.log('1. メールボックスを確認してください');
    console.log('2. メール内のリンクをクリック');
    console.log('3. 新しいパスワードを設定');
    console.log('4. 管理者としてログインテスト\n');

    return true;

  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
    return false;
  }
}

async function checkAuthSettings() {
  console.log('🔍 Supabase認証設定の確認...\n');
  
  try {
    // 現在のユーザー情報を取得してSupabase接続をテスト
    const { data: { session } } = await supabase.auth.getSession();
    console.log('✅ Supabase接続正常');
    
    if (session) {
      console.log('👤 現在のユーザー:', session.user.email);
    } else {
      console.log('👤 現在のユーザー: なし（未ログイン）');
    }

  } catch (err) {
    console.error('❌ Supabase接続エラー:', err);
  }
}

// メイン実行
(async () => {
  await checkAuthSettings();
  const success = await testPasswordReset();
  
  if (success) {
    console.log('🎉 テスト完了！メールボックスを確認してください。');
  } else {
    console.log('⚠️  テスト失敗。設定を確認してください。');
  }
})();