const fetch = require('node-fetch');

async function testLoginFlow() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('=== Fleeks ログインフローテスト ===');
  console.log('テスト開始時刻:', new Date().toLocaleString('ja-JP'));
  console.log('');
  
  // テストケース1: 正常なログイン
  console.log('--- テスト1: 正常なログイン ---');
  try {
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@fleeks.jp',
        password: 'Test123456!'
      })
    });
    
    console.log('ステータスコード:', loginResponse.status);
    console.log('ヘッダー:', Object.fromEntries(loginResponse.headers));
    
    const responseData = await loginResponse.text();
    console.log('レスポンス:', responseData);
    
    if (loginResponse.ok) {
      console.log('✅ ログイン成功');
    } else {
      console.log('❌ ログイン失敗');
    }
  } catch (error) {
    console.error('エラー:', error);
  }
  
  console.log('');
  
  // テストケース2: 無効な認証情報
  console.log('--- テスト2: 無効な認証情報 ---');
  try {
    const invalidLoginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log('ステータスコード:', invalidLoginResponse.status);
    const invalidResponseData = await invalidLoginResponse.text();
    console.log('レスポンス:', invalidResponseData);
    
    if (invalidLoginResponse.status === 401 || invalidLoginResponse.status === 400) {
      console.log('✅ 期待通りエラーが返される');
    } else {
      console.log('❌ 予期しないレスポンス');
    }
  } catch (error) {
    console.error('エラー:', error);
  }
  
  console.log('');
  
  // テストケース3: ログインページのアクセス確認
  console.log('--- テスト3: ログインページアクセス ---');
  try {
    const pageResponse = await fetch(`${baseUrl}/login`);
    console.log('ステータスコード:', pageResponse.status);
    console.log('Content-Type:', pageResponse.headers.get('content-type'));
    
    if (pageResponse.ok) {
      console.log('✅ ログインページにアクセス可能');
      const pageContent = await pageResponse.text();
      if (pageContent.includes('ログイン') || pageContent.includes('login')) {
        console.log('✅ ログインフォームが含まれている');
      }
    } else {
      console.log('❌ ログインページにアクセスできません');
    }
  } catch (error) {
    console.error('エラー:', error);
  }
  
  console.log('\n=== テスト完了 ===');
}

// 実行
testLoginFlow().catch(console.error);