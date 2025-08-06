'use client'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            FLEEKS Platform
          </h1>
          <p className="text-gray-600">
            美容プロフェッショナル向け学習プラットフォーム
          </p>
        </div>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="example@email.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード
            </label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg"
              placeholder="••••••••"
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-medium"
          >
            ログイン
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/" className="text-gray-500 hover:text-gray-700 text-sm">
            ← ホームに戻る
          </a>
        </div>
      </div>
    </div>
  )
}