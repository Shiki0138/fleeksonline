const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('環境変数が設定されていません');
  process.exit(1);
}

// Service roleキーを使用してクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('=== テストユーザー作成 ===');
  
  const testEmail = 'test@fleeks.jp';
  const testPassword = 'Test123456!';
  
  try {
    // 既存のユーザーを確認
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existingUser = users.find(u => u.email === testEmail);
    
    if (existingUser) {
      console.log('ユーザーは既に存在します:', testEmail);
      
      // パスワードを更新
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      );
      
      if (updateError) {
        console.error('パスワード更新エラー:', updateError);
      } else {
        console.log('✅ パスワードを更新しました');
      }
    } else {
      // 新規ユーザーを作成
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      });
      
      if (createError) {
        console.error('ユーザー作成エラー:', createError);
        return;
      }
      
      console.log('✅ 新規ユーザーを作成しました');
      console.log('ID:', newUser.user.id);
      
      // プロフィールを作成
      const { error: profileError } = await supabase
        .from('fleeks_profiles')
        .insert({
          id: newUser.user.id,
          email: testEmail,
          display_name: 'テストユーザー',
          role: 'user',
          status: 'active',
          membership_type: 'premium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (profileError) {
        console.error('プロフィール作成エラー:', profileError);
      } else {
        console.log('✅ プロフィールを作成しました');
      }
    }
    
    console.log('\n=== ログイン情報 ===');
    console.log('メール:', testEmail);
    console.log('パスワード:', testPassword);
    
    // ログインテスト
    console.log('\n=== ログインテスト ===');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ ログインエラー:', loginError.message);
    } else if (loginData?.user) {
      console.log('✅ ログイン成功！');
      console.log('ユーザーID:', loginData.user.id);
      await supabase.auth.signOut();
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
createTestUser().catch(console.error);