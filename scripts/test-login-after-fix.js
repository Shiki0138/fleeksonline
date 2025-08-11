const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://kbvaekypkszvzrwlbkug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0';

// Supabaseクライアントの作成
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// テストアカウント
const testAccounts = [
  { email: 'greenroom51@gmail.com', password: 'Admin123456!', expectedRole: 'admin' },
  { email: 'test.user.fleeks@example.com', password: 'Test123456!', expectedRole: 'user' }
];

async function testLogin(email, password, expectedRole) {
  console.log(`\n=== テスト: ${email} ===`);
  
  try {
    // ログイン試行
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('❌ ログインエラー:', error.message);
      return false;
    }

    if (data?.user) {
      console.log('✅ ログイン成功');
      console.log('ユーザーID:', data.user.id);
      console.log('メール:', data.user.email);
      
      // プロフィール情報の取得
      const { data: profile, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('❌ プロフィール取得エラー:', profileError.message);
      } else if (profile) {
        console.log('プロフィール情報:');
        console.log('- 名前:', profile.full_name || profile.username);
        console.log('- ロール:', profile.role);
        console.log('- メンバーシップ:', profile.membership_type);
        console.log('- ステータス:', profile.status || 'active');
        
        if (profile.role !== expectedRole) {
          console.warn(`⚠️  期待されるロール: ${expectedRole}, 実際のロール: ${profile.role}`);
        }
      }

      // セッション情報
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('セッション有効期限:', new Date(session.expires_at * 1000).toLocaleString('ja-JP'));
      }

      // ログアウト
      await supabase.auth.signOut();
      console.log('ログアウト完了');
      
      return true;
    }
  } catch (err) {
    console.error('❌ 予期しないエラー:', err);
    return false;
  }
}

async function runTests() {
  console.log('=== ログイン機能テスト（修正後）===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('テスト開始時刻:', new Date().toLocaleString('ja-JP'));
  
  let successCount = 0;
  
  // 各テストアカウントでログインテスト
  for (const account of testAccounts) {
    const success = await testLogin(account.email, account.password, account.expectedRole);
    if (success) successCount++;
    // レート制限回避のため少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n=== テスト結果 ===');
  console.log(`成功: ${successCount}/${testAccounts.length}`);
  
  if (successCount === testAccounts.length) {
    console.log('🎉 すべてのテストが成功しました！');
    console.log('\n✅ ログイン機能は正常に動作しています。');
  } else {
    console.log('⚠️ 一部のテストが失敗しました。');
  }
}

// テスト実行
runTests().catch(console.error);