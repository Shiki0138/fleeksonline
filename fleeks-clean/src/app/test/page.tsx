'use client'

export default function TestPage() {
  // クライアントサイドでの環境変数チェック
  const supabaseUrl = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_URL : 'サーバーサイド';
  const supabaseKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : 'サーバーサイド';
  const appName = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_APP_NAME : 'サーバーサイド';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">🧪 テストページ</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">🌍 環境変数チェック</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              Supabase URL: <span className="text-green-600 font-mono">
                {supabaseUrl ? '✅ 設定済み' : '❌ 未設定'}
              </span>
            </p>
            <p className="text-gray-600">
              Supabase Key: <span className="text-green-600 font-mono">
                {supabaseKey ? '✅ 設定済み' : '❌ 未設定'}
              </span>
            </p>
            <p className="text-gray-600">
              App Name: <span className="text-green-600 font-mono">
                {appName || '未設定'}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibent mb-4">⚡ システム状態</h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              Next.js: <span className="text-green-600 font-mono">✅ 14.0.4</span>
            </p>
            <p className="text-gray-600">
              現在時刻: <span className="text-blue-600 font-mono">{new Date().toLocaleString('ja-JP')}</span>
            </p>
            <p className="text-gray-600">
              URL: <span className="text-blue-600 font-mono">{typeof window !== 'undefined' ? window.location.href : 'localhost:3003/test'}</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">ナビゲーション</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:text-blue-800 underline">
              → ホームページへ
            </a>
            <a href="/admin/videos" className="block text-blue-600 hover:text-blue-800 underline">
              → 管理画面（動画追加）へ
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}