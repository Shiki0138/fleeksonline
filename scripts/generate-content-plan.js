// 美容教育コンテンツ80記事の生成スクリプト
const fs = require('fs')
const path = require('path')

// カテゴリー別の記事配分
const contentDistribution = {
  beginner: 20,    // 新人向け：25%
  management: 20,  // 経営：25%
  dx: 20,          // DX・AI：25%
  general: 20      // 一般：25%
}

// 有料記事の割合（20%）
const premiumRatio = 0.2

// 記事テンプレート
const articleTemplates = {
  beginner: [
    { title: "挨拶の科学 - 0.2秒で決まる印象操作術", slug: "greeting-science", reading_time: 8 },
    { title: "声のトーンが与える心理的影響", slug: "voice-tone-psychology", reading_time: 6 },
    { title: "アイコンタクトの黄金比率", slug: "eye-contact-golden-ratio", reading_time: 7 },
    { title: "笑顔の種類と使い分け方", slug: "smile-types-usage", reading_time: 5 },
    { title: "クロスかけの美学 - 相手を尊重する動作心理", slug: "cross-beauty", reading_time: 6 },
    { title: "第一声で掴む予約獲得術", slug: "first-voice-booking", reading_time: 10 },
    { title: "初回来店客の不安を解消する7つの技術", slug: "first-visit-anxiety", reading_time: 12 },
    { title: "沈黙を味方にする会話術", slug: "silence-conversation", reading_time: 8 },
    { title: "施術ミスが起きた時の初動対応", slug: "mistake-first-response", reading_time: 15 },
    { title: "プロのビジネスマナー完全ガイド", slug: "professional-manners", reading_time: 20 },
  ],
  management: [
    { title: "年収1000万円美容師の共通習慣", slug: "million-yen-habits", reading_time: 15 },
    { title: "指名率80%を超える人の思考法", slug: "high-nomination-mindset", reading_time: 12 },
    { title: "個人事業主vs法人 - 年収別最適解", slug: "individual-vs-corporation", reading_time: 18 },
    { title: "開業資金の現実的な調達方法", slug: "startup-funding", reading_time: 20 },
    { title: "売上と利益の違いを理解する", slug: "sales-vs-profit", reading_time: 10 },
    { title: "美容室の適正な利益率とは", slug: "proper-profit-margin", reading_time: 15 },
    { title: "黒字倒産を防ぐ資金繰り表", slug: "prevent-bankruptcy", reading_time: 25 },
    { title: "銀行が融資したくなる事業計画書", slug: "bank-loan-plan", reading_time: 30 },
    { title: "スタッフミーティングの効果的な進め方", slug: "effective-meetings", reading_time: 12 },
    { title: "離職率を10%以下にする環境づくり", slug: "reduce-turnover", reading_time: 18 },
  ],
  dx: [
    { title: "ChatGPTでカウンセリング力向上", slug: "chatgpt-counseling", reading_time: 10 },
    { title: "AI画像生成でヘアスタイル提案", slug: "ai-hairstyle-proposal", reading_time: 12 },
    { title: "Instagram運用の自動化戦略", slug: "instagram-automation", reading_time: 15 },
    { title: "LINE公式で顧客管理革命", slug: "line-customer-management", reading_time: 18 },
    { title: "顧客データから見える購買パターン", slug: "customer-data-patterns", reading_time: 20 },
    { title: "電子カルテで情報共有", slug: "digital-medical-records", reading_time: 8 },
    { title: "VR/ARを使った新体験", slug: "vr-ar-experience", reading_time: 15 },
    { title: "サブスクリプションモデルの可能性", slug: "subscription-model", reading_time: 25 },
    { title: "オンラインカウンセリングの導入方法", slug: "online-counseling", reading_time: 12 },
    { title: "生成AIによって変わるビジネスモデル", slug: "ai-business-model", reading_time: 30 },
  ],
  general: [
    { title: "生涯顧客を作る長期視点", slug: "lifetime-customer", reading_time: 15 },
    { title: "SNSで人気になる美容師の特徴", slug: "sns-popular-stylist", reading_time: 10 },
    { title: "腰痛・肩こりを防ぐ正しい姿勢", slug: "prevent-back-pain", reading_time: 8 },
    { title: "メンタルヘルスの保ち方", slug: "mental-health", reading_time: 12 },
    { title: "5年後、10年後のキャリアプラン作成法", slug: "career-planning", reading_time: 20 },
    { title: "顧客カルテの戦略的活用法", slug: "customer-record-strategy", reading_time: 15 },
    { title: "記念日マーケティングの実践", slug: "anniversary-marketing", reading_time: 10 },
    { title: "地域貢献で愛される美容室づくり", slug: "community-contribution", reading_time: 12 },
    { title: "福祉美容・訪問美容の始め方", slug: "welfare-beauty", reading_time: 18 },
    { title: "次世代育成への関わり方", slug: "next-generation", reading_time: 15 },
  ]
}

// コンテンツ生成関数
function generateContent(template, category, isPremium) {
  const baseContent = `
<h2>はじめに</h2>
<p>この記事では、${template.title}について詳しく解説します。美容業界で成功するための重要な知識をお伝えします。</p>

<h2>なぜこれが重要なのか</h2>
<p>現代の美容業界において、この知識は必要不可欠です。多くの成功している美容師が実践している内容を、わかりやすくまとめました。</p>
`

  const premiumContent = `
<h2>具体的な実践方法</h2>
<p>ここからは、実際の現場で使える具体的なテクニックを紹介します。</p>

<h3>ステップ1：準備</h3>
<p>まず最初に行うべきことは...</p>

<h3>ステップ2：実践</h3>
<p>次に、実際の場面では...</p>

<h3>ステップ3：改善</h3>
<p>結果を振り返り、次のように改善していきます...</p>

<h2>成功事例</h2>
<p>実際にこの方法を実践した美容室の事例を紹介します。</p>

<h2>よくある失敗と対策</h2>
<p>多くの人が陥りがちな失敗パターンと、その対策方法を解説します。</p>

<h2>まとめとアクションプラン</h2>
<p>今日から実践できる具体的なアクションプランをご提案します。</p>
`

  const excerpt = `${template.title}について、プロの視点から解説します。`
  
  return {
    title: template.title,
    slug: template.slug,
    excerpt: excerpt,
    content: isPremium ? baseContent + premiumContent : baseContent + premiumContent,
    preview_content: isPremium ? baseContent : null,
    is_premium: isPremium,
    category: category,
    reading_time: template.reading_time
  }
}

// 全記事を生成
function generateAllArticles() {
  const articles = []
  
  // カテゴリーごとに記事を生成
  Object.entries(contentDistribution).forEach(([category, count]) => {
    const templates = articleTemplates[category]
    const premiumCount = Math.floor(count * premiumRatio)
    
    // テンプレートを拡張して必要数を確保
    const expandedTemplates = []
    for (let i = 0; i < count; i++) {
      const template = templates[i % templates.length]
      const suffix = i >= templates.length ? `-${Math.floor(i / templates.length) + 1}` : ''
      expandedTemplates.push({
        ...template,
        title: template.title + (suffix ? ` パート${suffix.substring(1)}` : ''),
        slug: template.slug + suffix
      })
    }
    
    // 記事を生成（最初の数記事を有料に）
    expandedTemplates.forEach((template, index) => {
      const isPremium = index < premiumCount
      articles.push(generateContent(template, category, isPremium))
    })
  })
  
  // ランダムに並び替え（カテゴリーが偏らないように）
  articles.sort(() => Math.random() - 0.5)
  
  return articles
}

// メイン処理
function main() {
  const articles = generateAllArticles()
  
  const contentPlan = {
    total: articles.length,
    premiumCount: articles.filter(a => a.is_premium).length,
    freeCount: articles.filter(a => !a.is_premium).length,
    articles: articles
  }
  
  // JSONファイルに保存
  const outputPath = path.join(__dirname, 'content-plan.json')
  fs.writeFileSync(outputPath, JSON.stringify(contentPlan, null, 2))
  
  console.log('✅ コンテンツプランを生成しました')
  console.log(`📊 統計:`)
  console.log(`- 総記事数: ${contentPlan.total}`)
  console.log(`- 無料記事: ${contentPlan.freeCount} (${Math.round(contentPlan.freeCount / contentPlan.total * 100)}%)`)
  console.log(`- 有料記事: ${contentPlan.premiumCount} (${Math.round(contentPlan.premiumCount / contentPlan.total * 100)}%)`)
  console.log(`- カテゴリー別:`)
  Object.entries(contentDistribution).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count}記事`)
  })
  console.log(`\n💾 保存先: ${outputPath}`)
}

main()