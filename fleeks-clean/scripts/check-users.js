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

async function checkUsers() {
  console.log('=== Supabaseユーザー情報確認 ===');
  console.log('Supabase URL:', supabaseUrl);
  console.log('');

  try {
    // auth.usersテーブルから全ユーザーを取得（service roleキーが必要）
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('ユーザー一覧取得エラー:', usersError);
      return;
    }

    console.log(`登録ユーザー数: ${users.length}`);
    console.log('');

    // 各ユーザーの詳細情報を表示
    for (const user of users) {
      console.log(`--- ユーザー: ${user.email} ---`);
      console.log('ID:', user.id);
      console.log('作成日:', new Date(user.created_at).toLocaleString('ja-JP'));
      console.log('最終ログイン:', user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('ja-JP') : 'なし');
      console.log('メール確認済み:', user.email_confirmed_at ? '✅' : '❌');
      
      // プロフィール情報を取得
      const { data: profile, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        console.log('プロフィール:');
        console.log('  - 表示名:', profile.display_name);
        console.log('  - ロール:', profile.role);
        console.log('  - ステータス:', profile.status);
        console.log('  - メンバーシップ:', profile.membership_type);
      } else if (profileError) {
        console.log('プロフィール: なし');
      }
      
      console.log('');
    }

    // fleeks_profilesテーブルの全レコードも確認
    console.log('=== fleeks_profilesテーブル確認 ===');
    const { data: profiles, error: profilesError } = await supabase
      .from('fleeks_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('プロフィール一覧取得エラー:', profilesError);
    } else {
      console.log(`プロフィール数: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`- ${profile.email} (${profile.display_name}) - ロール: ${profile.role}, ステータス: ${profile.status}`);
      });
    }

  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
checkUsers().catch(console.error);