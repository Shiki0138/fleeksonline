import { redirect } from 'next/navigation'
import { getCurrentUser, hasActiveSubscription, formatDateJapanese, subscriptionStatusLabels } from '@/lib/auth-helpers'
import { Tables } from '@/lib/supabase'
import Link from 'next/link'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  const hasSubscription = await hasActiveSubscription()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <h1 className="text-xl font-bold text-gray-800">FLEEKS Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link
                href="/profile"
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                プロフィール
              </Link>
              <Link
                href="/api/auth/signout"
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                ログアウト
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            ようこそ、{user.full_name || user.email}さん！
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* User Info Card */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-3">アカウント情報</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">メール:</span>
                  <span className="ml-2 text-gray-700">{user.email}</span>
                </div>
                <div>
                  <span className="text-gray-500">登録日:</span>
                  <span className="ml-2 text-gray-700">{formatDateJapanese(user.created_at)}</span>
                </div>
                <div>
                  <span className="text-gray-500">最終ログイン:</span>
                  <span className="ml-2 text-gray-700">
                    {user.last_login_at ? formatDateJapanese(user.last_login_at) : '初回ログイン'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Status Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-3">サブスクリプション</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">ステータス:</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.subscription_status === 'paid' ? 'bg-green-100 text-green-800' :
                    user.subscription_status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {subscriptionStatusLabels[user.subscription_status]}
                  </span>
                </div>
                {user.subscription_expires_at && (
                  <div className="text-sm">
                    <span className="text-gray-500">有効期限:</span>
                    <span className="ml-2 text-gray-700">
                      {formatDateJapanese(user.subscription_expires_at)}
                    </span>
                  </div>
                )}
                {!hasSubscription && (
                  <Link
                    href="/pricing"
                    className="mt-3 w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 rounded-lg text-sm hover:from-purple-700 hover:to-pink-700 transition-colors inline-block"
                  >
                    プレミアムプランを見る
                  </Link>
                )}
              </div>
            </div>

            {/* Trust Score Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-3">信頼スコア</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {user.trust_score}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${user.trust_score}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  コミュニティでの活動で上昇します
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/videos"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
              <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">動画を見る</h3>
            <p className="text-sm text-gray-500">最新の美容技術を学ぶ</p>
          </Link>

          <Link
            href="/community"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-pink-200 transition-colors">
              <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">コミュニティ</h3>
            <p className="text-sm text-gray-500">仲間と交流する</p>
          </Link>

          <Link
            href="/ai-assistant"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">AIアシスタント</h3>
            <p className="text-sm text-gray-500">質問に答えます</p>
          </Link>

          <Link
            href="/profile"
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-800 mb-1">プロフィール</h3>
            <p className="text-sm text-gray-500">設定を管理する</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">最近のアクティビティ</h2>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">「最新ヘアカラー技術」を視聴しました</p>
                <p className="text-xs text-gray-500">2時間前</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">コミュニティに投稿しました</p>
                <p className="text-xs text-gray-500">昨日</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">プロフィールを更新しました</p>
                <p className="text-xs text-gray-500">3日前</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}