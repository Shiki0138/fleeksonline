'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lock, Crown, Calendar, CheckCircle, Clock, BookOpen, ChevronRight, Star } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

interface Article {
  id: string
  title: string
  category: 'beginner' | 'management' | 'dx' | 'general'
  accessLevel: 'free' | 'partial' | 'premium'
  publishDate: string
  isPublished: boolean
  readTime?: number
}

const CHAPTERS = {
  beginner: { 
    name: '初心者編', 
    icon: '🌱', 
    color: 'emerald',
    description: '美容師としての基本的な技術と接客を学ぶ'
  },
  management: { 
    name: '経営編', 
    icon: '💼', 
    color: 'blue',
    description: '美容室の開業・経営・マーケティングを学ぶ'
  },
  dx: { 
    name: 'DX編', 
    icon: '🚀', 
    color: 'purple',
    description: 'デジタル化とテクノロジー活用を学ぶ'
  },
  general: { 
    name: '総合編', 
    icon: '🎯', 
    color: 'orange',
    description: 'キャリアアップとスキル向上を学ぶ'
  }
}

// 正しい80記事のタイトル（当初の仕様通り）
const ALL_ARTICLES = [
  // 初心者編（1-20）
  { number: 1, title: "美容師のための効果的な挨拶とその心理学的効果", category: "beginner" },
  { number: 2, title: "失敗しない！新人美容師のためのシャンプー技術完全ガイド", category: "beginner" },
  { number: 3, title: "カラーリングの基礎知識：色彩理論から薬剤選定まで", category: "beginner" },
  { number: 4, title: "パーマの基礎技術：ロッド選定からウェーブデザインまで", category: "beginner" },
  { number: 5, title: "ブロードライの極意：艶とボリュームを生み出すテクニック", category: "beginner" },
  { number: 6, title: "カウンセリング力向上！お客様の本音を引き出す会話術", category: "beginner" },
  { number: 7, title: "ヘアケア知識の基礎：髪質診断からトリートメント選定まで", category: "beginner" },
  { number: 8, title: "スタイリング剤の選び方と効果的な使用方法", category: "beginner" },
  { number: 9, title: "美容師のための解剖学：頭皮と髪の構造を理解する", category: "beginner" },
  { number: 10, title: "接客マナーの基本：リピーターを生む接客術", category: "beginner" },
  { number: 11, title: "ハサミの選び方とメンテナンス方法", category: "beginner" },
  { number: 12, title: "カット理論の基礎：ベーシックカットから応用まで", category: "beginner" },
  { number: 13, title: "薬剤知識：安全な施術のための化学基礎", category: "beginner" },
  { number: 14, title: "美容師のための皮膚科学：アレルギーとパッチテスト", category: "beginner" },
  { number: 15, title: "シザーワークの基本動作と練習方法", category: "beginner" },
  { number: 16, title: "顔型診断と似合わせ理論の基礎", category: "beginner" },
  { number: 17, title: "美容師のための栄養学：髪と健康の関係", category: "beginner" },
  { number: 18, title: "カラーチャートの読み方と色の配合理論", category: "beginner" },
  { number: 19, title: "新人美容師が陥りやすい失敗とその対策", category: "beginner" },
  { number: 20, title: "アシスタントから抜け出すための実践的スキルアップ法", category: "beginner" },
  // 経営編（21-40）
  { number: 21, title: "美容室開業の完全ガイド：資金計画から物件選びまで", category: "management" },
  { number: 22, title: "集客力を3倍にするSNSマーケティング戦略", category: "management" },
  { number: 23, title: "リピート率90%を実現する顧客管理術", category: "management" },
  { number: 24, title: "美容室の売上を伸ばす価格戦略と料金設定の極意", category: "management" },
  { number: 25, title: "スタッフマネジメント：離職率を下げるチーム作り", category: "management" },
  { number: 26, title: "美容室の財務管理：利益を最大化する経営分析", category: "management" },
  { number: 27, title: "口コミを増やすための顧客満足度向上戦略", category: "management" },
  { number: 28, title: "美容室のブランディング：差別化戦略の立て方", category: "management" },
  { number: 29, title: "効果的な新規顧客獲得：広告とプロモーション戦略", category: "management" },
  { number: 30, title: "美容室の在庫管理と仕入れコスト削減術", category: "management" },
  { number: 31, title: "スタッフ教育システムの構築：技術と接客の向上", category: "management" },
  { number: 32, title: "美容室の法務知識：契約書から労務管理まで", category: "management" },
  { number: 33, title: "顧客単価を上げるアップセル・クロスセル戦略", category: "management" },
  { number: 34, title: "美容室の衛生管理と安全対策の徹底ガイド", category: "management" },
  { number: 35, title: "フランチャイズvs独立開業：メリット・デメリット比較", category: "management" },
  { number: 36, title: "美容室の事業計画書の作り方：融資獲得のポイント", category: "management" },
  { number: 37, title: "顧客データ分析で売上アップ：CRM活用術", category: "management" },
  { number: 38, title: "美容室の採用戦略：優秀な人材を獲得する方法", category: "management" },
  { number: 39, title: "多店舗展開の成功法則：2店舗目を出すタイミング", category: "management" },
  { number: 40, title: "美容室経営者のための節税対策と資産形成", category: "management" },
  // DX編（41-60）
  { number: 41, title: "美容室DXの第一歩：予約システムのデジタル化", category: "dx" },
  { number: 42, title: "AIを活用した顧客分析と売上予測", category: "dx" },
  { number: 43, title: "美容室向けPOSシステムの選び方と活用法", category: "dx" },
  { number: 44, title: "オンラインカウンセリングの導入と運用方法", category: "dx" },
  { number: 45, title: "VR/ARを使った最新ヘアシミュレーション", category: "dx" },
  { number: 46, title: "キャッシュレス決済導入で顧客満足度アップ", category: "dx" },
  { number: 47, title: "美容室のための効果的なLINE公式アカウント活用術", category: "dx" },
  { number: 48, title: "顧客管理アプリで実現する究極のパーソナライズ", category: "dx" },
  { number: 49, title: "美容室のためのインスタグラムビジネス活用完全ガイド", category: "dx" },
  { number: 50, title: "電子カルテ導入で施術履歴を完全デジタル化", category: "dx" },
  { number: 51, title: "美容室のためのGoogle ビジネスプロフィール最適化", category: "dx" },
  { number: 52, title: "オンライン物販で新たな収益源を作る方法", category: "dx" },
  { number: 53, title: "美容室のサブスクリプションモデル導入ガイド", category: "dx" },
  { number: 54, title: "デジタルサイネージで店内プロモーション革新", category: "dx" },
  { number: 55, title: "美容室のためのYouTubeチャンネル運営術", category: "dx" },
  { number: 56, title: "クラウド会計ソフトで経理業務を効率化", category: "dx" },
  { number: 57, title: "美容室のセキュリティ対策：顧客情報を守る方法", category: "dx" },
  { number: 58, title: "オンライン教育プラットフォームでスタッフ研修", category: "dx" },
  { number: 59, title: "美容室向けIoTデバイスの活用事例", category: "dx" },
  { number: 60, title: "データドリブン経営で美容室を成長させる方法", category: "dx" },
  // 総合編（61-80）
  { number: 61, title: "トレンドを先取り！2024年注目のヘアスタイル", category: "general" },
  { number: 62, title: "海外研修で学ぶ最新カット技術", category: "general" },
  { number: 63, title: "コンテスト入賞を目指すための練習方法", category: "general" },
  { number: 64, title: "美容師のためのフォトグラフィー技術", category: "general" },
  { number: 65, title: "ヘアメイクアーティストへの道：メイク技術習得法", category: "general" },
  { number: 66, title: "美容師のための英会話：外国人客への対応", category: "general" },
  { number: 67, title: "トップスタイリストになるためのキャリア戦略", category: "general" },
  { number: 68, title: "美容師の健康管理：腰痛・手荒れ対策", category: "general" },
  { number: 69, title: "クリエイティビティを高める発想法とインスピレーション", category: "general" },
  { number: 70, title: "美容師のための心理学：顧客心理を理解する", category: "general" },
  { number: 71, title: "サロンワークと私生活のワークライフバランス", category: "general" },
  { number: 72, title: "美容師のための投資と資産運用入門", category: "general" },
  { number: 73, title: "独立への道：フリーランス美容師という選択", category: "general" },
  { number: 74, title: "美容師のためのプレゼンテーション技術", category: "general" },
  { number: 75, title: "美容業界のSDGs：サステナブルな美容室経営", category: "general" },
  { number: 76, title: "美容師のための栄養学：体調管理と食事", category: "general" },
  { number: 77, title: "セミナー講師になるための話し方とコンテンツ作り", category: "general" },
  { number: 78, title: "美容師のための副業ガイド：収入源の多様化", category: "general" },
  { number: 79, title: "50歳からの美容師人生：セカンドキャリアの選択肢", category: "general" },
  { number: 80, title: "美容業界の未来予測：これからの10年で変わること", category: "general" }
]

export default function EducationContentListNew() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const { user, membershipType } = useAuth()

  useEffect(() => {
    loadArticles()
  }, [])

  const loadArticles = async () => {
    try {
      const response = await fetch('/api/education/articles')
      if (!response.ok) {
        throw new Error('Failed to fetch articles')
      }
      const data = await response.json()
      
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles)
      }
    } catch (error) {
      console.error('Error loading articles:', error)
    } finally {
      setLoading(false)
    }
  }

  // 現在公開されている記事と今後公開予定の記事を分ける
  const publishedArticles = articles.filter(a => a.isPublished)
  const upcomingArticles = ALL_ARTICLES.filter(
    a => !publishedArticles.find(p => p.id === `article_${String(a.number).padStart(3, '0')}`)
  )

  const getAccessLevelBadge = (accessLevel: string) => {
    switch (accessLevel) {
      case 'free':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
            <CheckCircle className="w-3 h-3" />
            無料
          </span>
        )
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
            <Crown className="w-3 h-3" />
            一部有料
          </span>
        )
      case 'premium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
            <Lock className="w-3 h-3" />
            有料限定
          </span>
        )
    }
  }

  const canAccessArticle = (accessLevel: string) => {
    if (!user) return accessLevel === 'free'
    if (membershipType === 'vip' || membershipType === 'premium') return true
    return accessLevel === 'free' || accessLevel === 'partial'
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            美容師のための教育コンテンツ
          </h1>
          <p className="text-xl text-purple-100 max-w-3xl">
            初心者から経営者まで、80記事の体系的な学習プログラムで
            プロフェッショナルへの道をサポート
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 進捗表示 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">公開状況</h3>
            <div className="text-sm text-gray-600">
              {publishedArticles.length} / {ALL_ARTICLES.length} 記事公開中
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
              style={{
                width: `${(publishedArticles.length / ALL_ARTICLES.length) * 100}%`
              }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            新しい記事を順次公開中！毎週2記事ずつ追加されます
          </p>
        </div>

        {/* チャプターフィルター */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setSelectedChapter('all')}
            className={`px-6 py-3 rounded-full font-medium transition ${
              selectedChapter === 'all'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
            }`}
          >
            すべて
          </button>
          {Object.entries(CHAPTERS).map(([key, chapter]) => (
            <button
              key={key}
              onClick={() => setSelectedChapter(key)}
              className={`px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${
                selectedChapter === key
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 shadow'
              }`}
            >
              <span className="text-xl">{chapter.icon}</span>
              {chapter.name}
            </button>
          ))}
        </div>

        {/* チャプター説明 */}
        {selectedChapter !== 'all' && (
          <div className="bg-purple-50 rounded-lg p-4 mb-8">
            <p className="text-purple-800">
              {CHAPTERS[selectedChapter as keyof typeof CHAPTERS].description}
            </p>
          </div>
        )}

        {/* 公開済み記事 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            公開中の記事
          </h2>
          
          <div className="grid gap-4">
            {publishedArticles
              .filter(article => selectedChapter === 'all' || article.category === selectedChapter)
              .map((article, index) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {canAccessArticle(article.accessLevel) ? (
                          <Link
                            href={`/education/${article.id.replace('article_', '')}`}
                            className="text-lg font-semibold text-gray-900 hover:text-purple-600 transition"
                          >
                            {article.title}
                          </Link>
                        ) : (
                          <span className="text-lg font-semibold text-gray-500">
                            {article.title}
                          </span>
                        )}
                        {getAccessLevelBadge(article.accessLevel)}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-4 h-4" />
                          {article.readTime || 7}分で読了
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-lg">
                            {CHAPTERS[article.category].icon}
                          </span>
                          {CHAPTERS[article.category].name}
                        </span>
                      </div>
                    </div>
                    
                    {canAccessArticle(article.accessLevel) ? (
                      <Link
                        href={`/education/${article.id.replace('article_', '')}`}
                        className="flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        読む
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button
                        className="flex items-center gap-1 text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <Lock className="w-4 h-4" />
                        {!user ? 'ログインが必要' : 'プレミアム限定'}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
          </div>
        </div>

        {/* 今後公開予定の記事 */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            今後公開予定の記事
          </h2>
          
          <div className="grid gap-3">
            {upcomingArticles
              .filter(article => selectedChapter === 'all' || article.category === selectedChapter)
              .slice(0, 10)
              .map((article, index) => (
                <motion.div
                  key={article.number}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-gray-50 rounded-lg border border-gray-100 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm">
                        記事{article.number}
                      </span>
                      <span className="text-gray-600">
                        {article.title}
                      </span>
                      <span className="text-xl">
                        {CHAPTERS[article.category as keyof typeof CHAPTERS].icon}
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      近日公開
                    </span>
                  </div>
                </motion.div>
              ))}
          </div>
          
          {upcomingArticles.length > 10 && (
            <p className="text-center text-gray-500 mt-4">
              他{upcomingArticles.length - 10}記事も順次公開予定
            </p>
          )}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center"
        >
          <Star className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">
            すべての記事を今すぐ読みたい方へ
          </h3>
          <p className="mb-6 opacity-90 max-w-2xl mx-auto">
            プレミアムプランなら、公開予定の記事も含めて全80記事が即座に閲覧可能！
            さらに、新着記事も優先的にアクセスできます。
          </p>
          <Link
            href="/membership/upgrade"
            className="inline-flex items-center gap-2 bg-white text-purple-600 px-8 py-4 rounded-full font-bold hover:bg-gray-100 transition shadow-lg"
          >
            <Crown className="w-5 h-5" />
            プレミアムプランで全記事を読む
          </Link>
        </motion.div>
      </div>
    </div>
  )
}