const http = require('http');
const path = require('path');

console.log('🚀 Starting simple test server...');
console.log('📁 Current directory:', process.cwd());
console.log('🔧 Node version:', process.version);

// 環境変数を確認
require('dotenv').config({ path: '.env.local' });

console.log('🌍 Environment Variables Check:');
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('  SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');

const server = http.createServer((req, res) => {
  console.log(`📡 Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Fleeks Test Server</title>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          max-width: 800px; 
          margin: 50px auto; 
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .card { 
          background: rgba(255,255,255,0.1); 
          padding: 20px; 
          border-radius: 10px; 
          margin: 20px 0;
          backdrop-filter: blur(10px);
        }
      </style>
    </head>
    <body>
      <h1>🎉 Fleeks AI Beauty Platform - テストサーバー</h1>
      
      <div class="card">
        <h2>🔧 サーバー情報</h2>
        <p><strong>Status:</strong> ✅ Running</p>
        <p><strong>Port:</strong> 3003</p>
        <p><strong>Time:</strong> ${new Date().toLocaleString('ja-JP')}</p>
        <p><strong>Node Version:</strong> ${process.version}</p>
      </div>

      <div class="card">
        <h2>🌍 環境変数</h2>
        <p><strong>Supabase URL:</strong> ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定'}</p>
        <p><strong>Supabase Key:</strong> ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定'}</p>
        <p><strong>OpenAI Key:</strong> ${process.env.OPENAI_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</p>
        <p><strong>YouTube Key:</strong> ${process.env.YOUTUBE_API_KEY ? '✅ 設定済み' : '❌ 未設定'}</p>
      </div>

      <div class="card">
        <h2>📱 次のステップ</h2>
        <p>このページが見えていれば、サーバーは正常に動作しています。</p>
        <p>Next.jsアプリケーションに戻る準備ができました。</p>
      </div>
    </body>
    </html>
  `);
});

const PORT = 3003;
server.listen(PORT, 'localhost', () => {
  console.log(`✅ Test server running at http://localhost:${PORT}`);
  console.log('📱 Open your browser and visit: http://localhost:3003');
  console.log('⏹️  Press Ctrl+C to stop the server');
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});