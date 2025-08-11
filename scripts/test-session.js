const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://kbvaekypkszvzrwlbkug.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSession() {
  console.log('=== セッション管理テスト ===\n');

  // 1. ログイン
  console.log('1. ログイン試行...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'greenroom51@gmail.com',
    password: 'Admin123456!'
  });

  if (loginError) {
    console.error('❌ ログインエラー:', loginError.message);
    return;
  }

  console.log('✅ ログイン成功');
  console.log('- User ID:', loginData.user.id);
  console.log('- Email:', loginData.user.email);
  console.log('- Session:', loginData.session ? 'あり' : 'なし');
  console.log('- Access Token:', loginData.session?.access_token ? '取得済み' : 'なし');

  // 2. セッション確認
  console.log('\n2. セッション確認...');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ セッション取得エラー:', sessionError.message);
  } else if (session) {
    console.log('✅ セッション有効');
    console.log('- Expires At:', new Date(session.expires_at * 1000).toLocaleString('ja-JP'));
    console.log('- User Email:', session.user.email);
  } else {
    console.log('⚠️ セッションが見つかりません');
  }

  // 3. ユーザー情報確認
  console.log('\n3. 現在のユーザー情報...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('❌ ユーザー取得エラー:', userError.message);
  } else if (user) {
    console.log('✅ ユーザー情報取得成功');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Created At:', user.created_at);
  } else {
    console.log('⚠️ ユーザーが見つかりません');
  }

  // 4. プロファイル確認
  console.log('\n4. プロファイル確認...');
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ プロファイル取得エラー:', profileError.message);
    } else if (profile) {
      console.log('✅ プロファイル取得成功');
      console.log('- Role:', profile.role);
      console.log('- Membership:', profile.membership_type);
      console.log('- Username:', profile.username);
    }
  }

  // 5. ログアウト
  console.log('\n5. ログアウト...');
  const { error: signOutError } = await supabase.auth.signOut();
  
  if (signOutError) {
    console.error('❌ ログアウトエラー:', signOutError.message);
  } else {
    console.log('✅ ログアウト成功');
  }

  console.log('\n=== テスト完了 ===');
}

testSession().catch(console.error);