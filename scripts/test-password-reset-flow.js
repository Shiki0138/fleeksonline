#!/usr/bin/env node

/**
 * パスワードリセットフローのテストスクリプト
 * URLの解析とリダイレクトの流れを確認
 */

// テストURL例
const testUrl = 'https://app.fleeks.jp/login?redirect=%2Fauth%2Fupdate-password#access_token=621446&refresh_token=&type=recovery';

console.log('🔍 パスワードリセットURLの解析\n');
console.log('完全URL:', testUrl);
console.log('');

// URLを解析
const url = new URL(testUrl);

console.log('📍 URLコンポーネント:');
console.log('- ホスト:', url.host);
console.log('- パス:', url.pathname);
console.log('- クエリ:', url.search);
console.log('- ハッシュ:', url.hash);
console.log('');

console.log('📋 クエリパラメータ:');
const searchParams = new URLSearchParams(url.search);
for (const [key, value] of searchParams) {
  console.log(`  - ${key}: ${value}`);
}
console.log('');

console.log('🔑 ハッシュフラグメント:');
const hashParams = new URLSearchParams(url.hash.substring(1));
for (const [key, value] of hashParams) {
  console.log(`  - ${key}: ${value || '(空)'}`);
}
console.log('');

console.log('✅ 期待される動作:');
console.log('1. /login ページがロードされる');
console.log('2. useEffect でハッシュフラグメントが検出される');
console.log('3. access_token と type=recovery が確認される');
console.log('4. /auth/update-password#access_token=... にリダイレクト');
console.log('');

console.log('🛠️ 修正ポイント:');
console.log('1. middleware.ts: publicPaths に /auth/update-password を追加 ✅');
console.log('2. login/page.tsx: ハッシュフラグメントの処理を追加 ✅');
console.log('3. Supabaseメールテンプレート: 正しいURLフォーマット ✅');
console.log('');

console.log('📝 Supabaseダッシュボードで確認すること:');
console.log('1. Authentication → URL Configuration');
console.log('   - Site URL: https://app.fleeks.jp');
console.log('   - Redirect URLs に含める:');
console.log('     • https://app.fleeks.jp/auth/update-password');
console.log('     • https://app.fleeks.jp/dashboard');
console.log('     • https://app.fleeks.jp/login');
console.log('');
console.log('2. Authentication → Email Templates → Reset Password');
console.log('   - リンクのフォーマット:');
console.log('     {{ .SiteURL }}/auth/update-password#access_token={{ .Token }}&refresh_token={{ .RefreshToken }}&type=recovery');