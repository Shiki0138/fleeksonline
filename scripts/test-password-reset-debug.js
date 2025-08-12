const { createClient } = require('@supabase/supabase-js');

// 本番環境の設定
const supabaseUrl = 'https://tjrcepjnxdpgcppslnyj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRqcmNlcGpueGRwZ2NwcHNsbnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTg4NDE1NjAsImV4cCI6MjAxNDQxNzU2MH0.temporary_key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPasswordReset() {
  console.log('=== パスワードリセットデバッグ ===\n');

  // URLフラグメント形式をシミュレート
  const mockUrl = 'https://app.fleeks.jp/auth/update-password#access_token=418449&refresh_token=&type=recovery';
  console.log('テストURL:', mockUrl);

  // URLを解析
  const url = new URL(mockUrl);
  const hashParams = new URLSearchParams(url.hash.substring(1));
  
  console.log('\n--- URLパラメータ解析 ---');
  console.log('Hash:', url.hash);
  console.log('access_token:', hashParams.get('access_token'));
  console.log('refresh_token:', hashParams.get('refresh_token'));
  console.log('type:', hashParams.get('type'));

  // トークンでセッション設定を試行
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token') || '';

  if (accessToken) {
    console.log('\n--- セッション設定を試行 ---');
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });

      if (error) {
        console.error('エラー:', error.message);
        console.error('エラー詳細:', error);
      } else {
        console.log('セッション設定成功:', data);
      }
    } catch (err) {
      console.error('例外エラー:', err);
    }
  }

  // 現在のセッションを確認
  console.log('\n--- 現在のセッション確認 ---');
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('セッション取得エラー:', sessionError);
  } else {
    console.log('現在のセッション:', session ? 'あり' : 'なし');
    if (session) {
      console.log('ユーザー:', session.user?.email);
    }
  }
}

debugPasswordReset();