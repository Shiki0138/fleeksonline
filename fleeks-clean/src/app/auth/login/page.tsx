export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          FLEEKS ログイン
        </h1>
        <p className="text-center text-gray-600 mb-4">
          ログイン機能は準備中です
        </p>
        <a 
          href="/" 
          className="block text-center text-purple-600 hover:text-purple-700"
        >
          ← ホームに戻る
        </a>
      </div>
    </div>
  )
}