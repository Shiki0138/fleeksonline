const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Fleeks AI Beauty Platform...');
console.log('📁 Working directory:', process.cwd());
console.log('🔧 Node version:', process.version);

// 環境変数の確認
console.log('🌍 Environment check:');
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗');
console.log('  SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗');

// Next.js開発サーバーを起動
const nextDev = spawn('npx', ['next', 'dev', '--port', '3003'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3003' }
});

nextDev.on('error', (err) => {
  console.error('❌ Server start error:', err);
});

nextDev.on('close', (code) => {
  console.log(`🔴 Server stopped with code: ${code}`);
});

// サーバー停止処理
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  nextDev.kill();
  process.exit(0);
});

console.log('🎯 Server should be starting...');
console.log('📱 Once ready, access: http://localhost:3003');