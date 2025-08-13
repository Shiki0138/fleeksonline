// 教育コンテンツの記事データ
// 本番環境でファイルシステムアクセスの問題を回避するため、静的データとして定義

export const EDUCATION_ARTICLES = [
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
  { number: 41, title: "美容室のDX入門：デジタル化で変わる未来", category: "dx" },
  { number: 42, title: "オンライン予約システムの導入と活用法", category: "dx" },
  { number: 43, title: "顧客データ分析：AIを使った需要予測", category: "dx" },
  { number: 44, title: "美容室のためのSEO対策完全ガイド", category: "dx" },
  { number: 45, title: "Instagram運用の極意：フォロワー1万人への道", category: "dx" },
  { number: 46, title: "LINE公式アカウント活用術：顧客とつながる新しい方法", category: "dx" },
  { number: 47, title: "美容室のYouTubeチャンネル運営戦略", category: "dx" },
  { number: 48, title: "電子カルテシステムの導入メリットと選び方", category: "dx" },
  { number: 49, title: "VR/ARを活用した新しいカウンセリング手法", category: "dx" },
  { number: 50, title: "キャッシュレス決済導入のメリットと注意点", category: "dx" },
  { number: 51, title: "美容室のための動画マーケティング戦略", category: "dx" },
  { number: 52, title: "クラウドPOSシステムで業務効率化", category: "dx" },
  { number: 53, title: "美容室アプリ開発：顧客エンゲージメントを高める", category: "dx" },
  { number: 54, title: "AIを活用したヘアスタイル提案システム", category: "dx" },
  { number: 55, title: "オンラインサロンの立ち上げと運営方法", category: "dx" },
  { number: 56, title: "美容室のサブスクリプションモデル導入ガイド", category: "dx" },
  { number: 57, title: "デジタルサイネージを使った店内プロモーション", category: "dx" },
  { number: 58, title: "ビッグデータ活用：トレンド分析と需要予測", category: "dx" },
  { number: 59, title: "美容室のセキュリティ対策：顧客情報を守る", category: "dx" },
  { number: 60, title: "メタバース時代の美容室経営を考える", category: "dx" },
  
  // 総合編（61-80）
  { number: 61, title: "美容師のキャリアプラン：10年後の自分を描く", category: "general" },
  { number: 62, title: "海外で活躍する美容師になるための準備", category: "general" },
  { number: 63, title: "美容師の健康管理：長く働き続けるために", category: "general" },
  { number: 64, title: "フリーランス美容師として成功する方法", category: "general" },
  { number: 65, title: "美容師のための副業・複業ガイド", category: "general" },
  { number: 66, title: "コンテスト入賞を目指すための練習法", category: "general" },
  { number: 67, title: "美容師のプレゼンテーション能力向上術", category: "general" },
  { number: 68, title: "業界トレンドを読む：5年後の美容業界", category: "general" },
  { number: 69, title: "美容師のためのメンタルヘルスケア", category: "general" },
  { number: 70, title: "クリエイティビティを高める方法", category: "general" },
  { number: 71, title: "美容師の英会話：外国人客への対応", category: "general" },
  { number: 72, title: "SDGsと美容室：持続可能な経営を目指して", category: "general" },
  { number: 73, title: "美容師のための写真撮影テクニック", category: "general" },
  { number: 74, title: "ヘアショーの企画・運営ノウハウ", category: "general" },
  { number: 75, title: "美容師の独立タイミングと準備", category: "general" },
  { number: 76, title: "50代からの美容師キャリア戦略", category: "general" },
  { number: 77, title: "美容室M&A：事業承継の選択肢", category: "general" },
  { number: 78, title: "美容師のパーソナルブランディング", category: "general" },
  { number: 79, title: "美容業界の社会貢献活動", category: "general" },
  { number: 80, title: "美容師人生の集大成：技術の伝承", category: "general" }
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