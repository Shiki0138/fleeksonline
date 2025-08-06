'use client'

import { useState } from 'react'

export default function AdminVideosPage() {
  const [videoData, setVideoData] = useState({
    title: '',
    description: '',
    youtube_id: '',
    category: 'ヘアスタイル',
    tags: '',
    is_premium: true,
    preview_seconds: 300
  })

  const [loading, setLoading] = useState(false)

  const categories = [
    'ヘアスタイル',
    'カラーリング', 
    'パーマ',
    'ヘアケア',
    'スタイリング',
    'サロン経営',
    '接客マナー',
    'SNS活用'
  ]

  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // YouTube IDを抽出
      const youtubeId = extractYouTubeId(videoData.youtube_id);
      
      // デモ用のサクセスメッセージ
      alert(`YouTube動画が追加されました！\n\nタイトル: ${videoData.title}\nYouTube ID: ${youtubeId}\nカテゴリ: ${videoData.category}`);
      
      // フォームをリセット
      setVideoData({
        title: '',
        description: '',
        youtube_id: '',
        category: 'ヘアスタイル',
        tags: '',
        is_premium: true,
        preview_seconds: 300
      });
    } catch (error) {
      alert('エラーが発生しました: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">⚙️ 動画管理</h1>
          <p className="text-gray-600 mb-8">YouTube動画をプラットフォームに追加</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                動画タイトル *
              </label>
              <input
                type="text"
                value={videoData.title}
                onChange={(e) => setVideoData({...videoData, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: 基本的なヘアカット技術"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL または ID *
              </label>
              <input
                type="text"
                value={videoData.youtube_id}
                onChange={(e) => setVideoData({...videoData, youtube_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: https://www.youtube.com/watch?v=VIDEO_ID または VIDEO_ID"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                説明
              </label>
              <textarea
                value={videoData.description}
                onChange={(e) => setVideoData({...videoData, description: e.target.value})}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="動画の内容を説明してください..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  カテゴリ *
                </label>
                <select
                  value={videoData.category}
                  onChange={(e) => setVideoData({...videoData, category: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  プレビュー時間（秒）
                </label>
                <input
                  type="number"
                  value={videoData.preview_seconds}
                  onChange={(e) => setVideoData({...videoData, preview_seconds: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="30"
                  max="600"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                タグ（カンマ区切り）
              </label>
              <input
                type="text"
                value={videoData.tags}
                onChange={(e) => setVideoData({...videoData, tags: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="例: ヘアカット, 初心者, 技術"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_premium"
                checked={videoData.is_premium}
                onChange={(e) => setVideoData({...videoData, is_premium: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_premium" className="text-sm font-medium text-gray-700">
                プレミアムコンテンツにする
              </label>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? '追加中...' : '動画を追加'}
              </button>
              <a
                href="/"
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-center"
              >
                ホームへ戻る
              </a>
            </div>
          </form>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📝 注意事項</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 現在はデモ版です。実際のデータベースには保存されません。</li>
            <li>• YouTube URLまたは動画IDを入力してください。</li>
            <li>• プレミアムコンテンツは有料会員のみが視聴できます。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}