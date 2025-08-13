// 教育コンテンツの記事データ
// 本番環境でファイルシステムアクセスの問題を回避するため、静的データとして定義

export const EDUCATION_ARTICLES = [
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
  { number: 31, title: "スタッフ教育システムの構築：技術向上とモチベーション管理", category: "management" },
  { number: 32, title: "美容室の労務管理：法令遵守と働きやすい環境作り", category: "management" },
  { number: 33, title: "競合分析と市場ポジショニング戦略", category: "management" },
  { number: 34, title: "美容室のIT化：業務効率を上げるシステム導入", category: "management" },
  { number: 35, title: "クレーム対応の極意：ピンチをチャンスに変える方法", category: "management" },
  { number: 36, title: "美容室の事業計画書作成ガイド", category: "management" },
  { number: 37, title: "フランチャイズvs独立開業：メリット・デメリット徹底比較", category: "management" },
  { number: 38, title: "美容室の節税対策と資金調達の方法", category: "management" },
  { number: 39, title: "多店舗展開の戦略：2店舗目を成功させる秘訣", category: "management" },
  { number: 40, title: "美容室経営者のためのリーダーシップ論", category: "management" },
  
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

// アクセスレベルを判定する関数
export function getAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
  const index = (articleNumber - 1) % 20
  if (index < 5) return 'free'
  if (index < 15) return 'partial'
  return 'premium'
}

// 記事データを整形する関数
export function formatArticle(article: typeof EDUCATION_ARTICLES[0]) {
  const today = new Date()
  const publishDate = new Date(today)
  publishDate.setDate(today.getDate() - 30) // 30日前に公開済みとする
  
  return {
    id: `article_${String(article.number).padStart(3, '0')}`,
    title: article.title,
    category: article.category,
    accessLevel: getAccessLevel(article.number),
    publishDate: publishDate.toISOString(),
    isPublished: true,
    readTime: 7
  }
}