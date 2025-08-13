import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen, Lock, Crown, ChevronRight, Calendar, User, Tag } from 'lucide-react'
import ArticleFooterCTA from '@/components/ArticleFooterCTA'
import fs from 'fs/promises'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'

// 記事タイトルのリスト
const ALL_ARTICLES = [
  // 初心者編（1-20）
  { number: 1, title: "プロとしての電話応対術：売上を左右する最初の接点", category: "beginner" },
  { number: 2, title: "第一印象を決める入店時の挨拶術", category: "beginner" },
  { number: 3, title: "お客様の名前を覚える記憶術とその効果", category: "beginner" },
  { number: 4, title: "プロの聞き方：お客様の本音を引き出す質問テクニック", category: "beginner" },
  { number: 5, title: "クレーム対応の極意：ピンチをチャンスに変える方法", category: "beginner" },
  { number: 6, title: "カウンセリング力向上！お客様の本音を引き出す会話術", category: "beginner" },
  { number: 7, title: "待ち時間を快適に：お客様を飽きさせない工夫", category: "beginner" },
  { number: 8, title: "商品販売の心理学：押し売りせずに売る技術", category: "beginner" },
  { number: 9, title: "リピート率を上げる会計時の一言", category: "beginner" },
  { number: 10, title: "接客マナーの基本：リピーターを生む接客術", category: "beginner" },
  { number: 11, title: "SNSでの顧客対応：好感度を上げる返信術", category: "beginner" },
  { number: 12, title: "予約管理の極意：ダブルブッキングを防ぐ方法", category: "beginner" },
  { number: 13, title: "売上を上げる追加メニューの提案方法", category: "beginner" },
  { number: 14, title: "顧客カルテの作り方：情報管理で差をつける", category: "beginner" },
  { number: 15, title: "プロの時間管理：効率的な施術スケジュール", category: "beginner" },
  { number: 16, title: "紹介客を増やす仕組み作り", category: "beginner" },
  { number: 17, title: "季節ごとのキャンペーン企画術", category: "beginner" },
  { number: 18, title: "客単価を上げるメニュー構成の考え方", category: "beginner" },
  { number: 19, title: "新人美容師が陥りやすい接客の失敗とその対策", category: "beginner" },
  { number: 20, title: "アシスタントから指名客を獲得する方法", category: "beginner" },
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
  { number: 61, title: "美容師の健康管理：腰痛・手荒れ対策", category: "general" },
  { number: 62, title: "美容師のための栄養学：体調管理と食事", category: "general" },
  { number: 63, title: "サロンワークと私生活のワークライフバランス", category: "general" },
  { number: 64, title: "美容師のための心理学：顧客心理を理解する", category: "general" },
  { number: 65, title: "組織心理学を活用したチームビルディング", category: "general" },
  { number: 66, title: "美容師のための投資と資産運用入門", category: "general" },
  { number: 67, title: "独立への道：フリーランス美容師という選択", category: "general" },
  { number: 68, title: "美容師のためのプレゼンテーション技術", category: "general" },
  { number: 69, title: "セミナー講師になるための話し方とコンテンツ作り", category: "general" },
  { number: 70, title: "美容業界のSDGs：サステナブルな美容室経営", category: "general" },
  { number: 71, title: "美容師のための副業ガイド：収入源の多様化", category: "general" },
  { number: 72, title: "50歳からの美容師人生：セカンドキャリアの選択肢", category: "general" },
  { number: 73, title: "美容業界の未来予測：これからの10年で変わること", category: "general" },
  { number: 74, title: "グローバル展開：海外で美容師として働く方法", category: "general" },
  { number: 75, title: "美容師のための英会話：外国人客への対応", category: "general" },
  { number: 76, title: "美容室のための危機管理：災害・感染症対策", category: "general" },
  { number: 77, title: "美容師のキャリアプラン：10年後の自分を描く", category: "general" },
  { number: 78, title: "美容室の事業承継：後継者育成と経営移譲", category: "general" },
  { number: 79, title: "美容師のためのメンタルヘルス：ストレス管理法", category: "general" },
  { number: 80, title: "美容業界でのイノベーション：新しい価値の創造", category: "general" }
]

// アクセスレベルを記事番号から判定
function getAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
  const index = (articleNumber - 1) % 20
  if (index < 5) return 'free'
  if (index < 15) return 'partial'
  return 'premium'
}

// チャプター情報を取得
function getChapterInfo(articleNumber: number) {
  if (articleNumber <= 20) return { number: 1, name: '初心者編', icon: '🌱' }
  if (articleNumber <= 40) return { number: 2, name: '経営編', icon: '💼' }
  if (articleNumber <= 60) return { number: 3, name: 'DX編', icon: '🚀' }
  return { number: 4, name: '総合編', icon: '🎯' }
}

// Unsplash画像を記事番号に基づいて取得
function getArticleImage(articleNumber: number) {
  // 美容関連のキーワードを記事のカテゴリーに応じて選択
  const keywords = [
    'beauty salon', 'hairdresser', 'hair styling', 'beauty treatment',
    'hair color', 'hair cutting', 'beauty professional', 'salon interior'
  ]
  const keyword = keywords[articleNumber % keywords.length]
  
  // 記事番号をシードとして使用し、同じ記事には常に同じ画像を表示
  return `https://source.unsplash.com/800x400/?${keyword}&sig=${articleNumber}`
}

export default async function EducationContentPage({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  // slugから記事番号を抽出
  const articleNumber = parseInt(params.slug, 10)
  const chapter = getChapterInfo(articleNumber)
  const accessLevel = getAccessLevel(articleNumber)
  
  // 記事データをファイルから読み込み
  let article = null
  let isUnpublished = false
  
  try {
    const articlePath = path.join(process.cwd(), 'data', 'education-articles', `article_${params.slug}.json`)
    const articleData = await fs.readFile(articlePath, 'utf-8')
    const jsonData = JSON.parse(articleData)
    
    article = {
      id: jsonData.id,
      title: jsonData.title,
      content: jsonData.content,
      category: jsonData.category,
      keywords: jsonData.keywords,
      readingTime: 7,
      publishedAt: jsonData.postedAt || jsonData.generatedAt,
    }
  } catch (error) {
    console.error('Error loading article:', error)
    // 記事が存在しない場合は、準備中ページを表示
    isUnpublished = true
  }
  
  // ユーザーのプラン確認
  let isPremiumUser = false
  if (user) {
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    isPremiumUser = profile?.role === 'paid' || profile?.role === 'admin'
  }
  
  // アクセス権限の確認
  const hasFullAccess = accessLevel === 'free' || isPremiumUser
  const hasPartialAccess = user && accessLevel === 'partial'
  const canRead = hasFullAccess || hasPartialAccess

  // プレビューコンテンツを生成（有料記事の場合）
  const getPreviewContent = (content: string) => {
    const lines = content.split('\n')
    const previewLines = lines.slice(0, Math.min(30, Math.floor(lines.length * 0.3)))
    return previewLines.join('\n')
  }

  // 次の記事を取得
  const nextArticleNumber = articleNumber + 1
  const hasNextArticle = nextArticleNumber <= 80

  // 未公開記事の場合は準備中ページを表示
  if (isUnpublished || !article) {
    // 公開予定日を計算（記事番号に基づいて2日ごとに公開）
    const publishDate = new Date()
    publishDate.setDate(publishDate.getDate() + Math.floor((articleNumber - 1) / 2) * 2)
    const formattedDate = publishDate.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })

    // ALL_ARTICLESから記事タイトルを取得
    const articleInfo = ALL_ARTICLES.find(a => a.number === articleNumber)
    const articleTitle = articleInfo?.title || `記事${articleNumber}`

    return (
      <div className="min-h-screen bg-gray-50">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              教育コンテンツ一覧に戻る
            </Link>
          </div>
        </div>

        {/* 準備中メッセージ */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="mb-8">
                <Calendar className="w-24 h-24 text-purple-300 mx-auto" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                準備中
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                「{articleTitle}」は<br />
                <span className="font-semibold text-purple-600">{formattedDate}</span> 公開予定です
              </p>
              <p className="text-gray-500 mb-8">
                新しい記事は順次公開されます。<br />
                お楽しみにお待ちください。
              </p>
              <div className="space-y-4">
                <Link
                  href="/education"
                  className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                  公開中の記事を見る
                </Link>
                {!isPremiumUser && (
                  <div className="mt-6">
                    <Link
                      href="/membership/upgrade"
                      className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
                    >
                      <Crown className="w-5 h-5" />
                      プレミアムプランで全記事を即座に閲覧
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/education"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            教育コンテンツ一覧に戻る
          </Link>
          
          {/* パンくずリスト */}
          <div className="flex items-center gap-2 text-sm text-purple-200 mb-6">
            <Link href="/education" className="hover:text-white transition">
              教育コンテンツ
            </Link>
            <span>/</span>
            <span className="flex items-center gap-1">
              <span className="text-lg">{chapter.icon}</span>
              {chapter.name}
            </span>
            <span>/</span>
            <span>記事{articleNumber}</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* 記事ヘッダー */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            {/* アイキャッチ画像 */}
            <div className="relative h-64 md:h-96 bg-gray-200">
              <Image
                src={getArticleImage(articleNumber)}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* アクセスレベルバッジ */}
              <div className="absolute top-4 right-4">
                {accessLevel === 'free' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-full">
                    <BookOpen className="w-4 h-4" />
                    無料公開
                  </span>
                )}
                {accessLevel === 'partial' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-full">
                    <Crown className="w-4 h-4" />
                    一部有料
                  </span>
                )}
                {accessLevel === 'premium' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full">
                    <Lock className="w-4 h-4" />
                    プレミアム限定
                  </span>
                )}
              </div>
            </div>

            {/* 記事情報 */}
            <div className="p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.readingTime}分で読了
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  FLEEKS編集部
                </span>
              </div>

              {/* キーワードタグ */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 記事本文 */}
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 md:p-12 lg:px-16 lg:py-14">
            {canRead ? (
              <>
                <div className="article-content">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => {
                        const text = String(children)
                        // "見出し1："のようなプレフィックスを除去
                        const cleanText = text.replace(/^見出し\d+[：:]\s*/, '')
                        return <h2>{cleanText}</h2>
                      },
                      h3: ({ children }) => {
                        const text = String(children)
                        const cleanText = text.replace(/^見出し\d+[：:]\s*/, '')
                        return <h3>{cleanText}</h3>
                      }
                    }}
                  >
                    {hasPartialAccess && !hasFullAccess ? getPreviewContent(article.content) : article.content}
                  </ReactMarkdown>
                </div>
                
                {hasPartialAccess && !hasFullAccess && (
                  <div className="mt-12 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h3 className="text-xl font-bold text-purple-900 mb-3">
                      続きを読むにはプレミアムプランへ
                    </h3>
                    <p className="text-purple-700 mb-6">
                      この記事の全文と、他の有料記事すべてが読み放題になります。
                    </p>
                    <Link
                      href="/membership/upgrade"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg"
                    >
                      <Crown className="w-5 h-5" />
                      プレミアムプランで続きを読む
                    </Link>
                  </div>
                )}

                {/* 次の記事へのリンク */}
                {canRead && hasNextArticle && (
                  <div className="mt-16 p-6 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-3">次の記事</p>
                    <Link
                      href={`/education/${String(nextArticleNumber).padStart(3, '0')}`}
                      className="flex items-center justify-between group hover:bg-white rounded-lg p-4 transition"
                    >
                      <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        記事{nextArticleNumber}を読む
                      </span>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Lock className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  {!user ? 'ログインが必要です' : 'プレミアム限定コンテンツ'}
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  {!user 
                    ? 'この記事を読むにはログインが必要です。' 
                    : 'この記事はプレミアムプラン会員限定です。'
                  }
                </p>
                {!user ? (
                  <Link
                    href={`/login?redirect=/education/${params.slug}`}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
                  >
                    ログインして読む
                  </Link>
                ) : (
                  <Link
                    href="/membership/upgrade"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
                  >
                    <Crown className="w-6 h-6" />
                    プレミアムプランで読む
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          {canRead && !isPremiumUser && (
            <div className="mt-12">
              <ArticleFooterCTA 
                isLoggedIn={!!user} 
                isPremiumUser={isPremiumUser} 
              />
            </div>
          )}

          {/* ナビゲーション */}
          <div className="mt-16 flex items-center justify-between">
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              教育コンテンツ一覧
            </Link>
            
            {!isPremiumUser && (
              <Link
                href="/membership/upgrade"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                全記事を読む
                <Crown className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}

// 動的なメタデータ
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}) {
  try {
    const articlePath = path.join(process.cwd(), 'data', 'education-articles', `article_${params.slug}.json`)
    const articleData = await fs.readFile(articlePath, 'utf-8')
    const article = JSON.parse(articleData)
    
    return {
      title: `${article.title} | FLEEKS教育コンテンツ`,
      description: article.leadText || article.title.substring(0, 160),
    }
  } catch {
    return {
      title: 'コンテンツが見つかりません | FLEEKS',
      description: '指定された教育コンテンツは見つかりませんでした。',
    }
  }
}