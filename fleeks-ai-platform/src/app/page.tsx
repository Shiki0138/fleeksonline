export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🌟 Fleeks AI Beauty Platform
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            美容サロンのプロを目指すあなたのための学習プラットフォーム
          </p>
          <div className="text-lg text-green-600 font-semibold">
            ✅ サーバーが正常に起動しました！
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              🎯 主な機能
            </h2>
            <ul className="text-left space-y-2 text-gray-700">
              <li>• AI駆動の個別学習プラン</li>
              <li>• YouTube動画コンテンツ</li>
              <li>• コミュニティ機能</li>
              <li>• プログレッシブWebアプリ</li>
            </ul>
          </div>

          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-3">
              🔧 システム状態
            </h2>
            <ul className="text-left space-y-2 text-gray-700">
              <li>• Next.js 14: ✅ 動作中</li>
              <li>• Supabase: ✅ 接続準備完了</li>
              <li>• Tailwind CSS: ✅ 適用済み</li>
              <li>• TypeScript: ✅ 有効</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              🎉 <strong>おめでとうございます！</strong>
              Fleeks AI Beauty Platformが正常に起動しました。
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="/login" 
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium shadow-lg"
            >
              🚀 今すぐ始める
            </a>
            <a 
              href="/test" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🧪 テストページへ
            </a>
            <a 
              href="/admin/videos" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              ⚙️ 管理画面へ
            </a>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>🕒 {new Date().toLocaleString('ja-JP')}</p>
          <p>📍 localhost:3003</p>
        </div>
      </div>
    </div>
  );
}