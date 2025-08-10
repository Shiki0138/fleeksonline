const { createClient } = require('@supabase/supabase-js')
const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// コンテンツデータ
const contentPlan = require('./content-plan.json')

// 投稿履歴を記録
const progressFile = path.join(__dirname, 'education-posting-progress.json')

// 章のマッピング
const chapterMapping = {
  'beginner': 1, // 第1章
  'management': 2, // 第2章
  'dx': 3, // 第3章
  'general': 4 // 第4章
}

// 画像URLのリスト（カテゴリー別）
const imageUrls = {
  beginner: [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800',
    'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800',
    'https://images.unsplash.com/photo-1559599101-f09722b4d4e8?w=800'
  ],
  management: [
    'https://images.unsplash.com/photo-1556745757-8d76bdb6984b?w=800',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800'
  ],
  dx: [
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800',
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800'
  ],
  general: [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    'https://images.unsplash.com/photo-1633681926022-84c23e6b2edd?w=800',
    'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=800'
  ]
}

// 進捗を読み込む
function loadProgress() {
  if (fs.existsSync(progressFile)) {
    return JSON.parse(fs.readFileSync(progressFile, 'utf8'))
  }
  return { lastPostedIndex: -1, startDate: new Date().toISOString() }
}

// 進捗を保存
function saveProgress(progress) {
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2))
}

// 章IDを取得
async function getChapterId(chapterNumber) {
  const { data, error } = await supabase
    .from('education_chapters')
    .select('id')
    .eq('chapter_number', chapterNumber)
    .single()

  if (error || !data) {
    console.error('章の取得エラー:', error)
    return null
  }

  return data.id
}

// ランダムな画像を選択
function getRandomImage(category, index = 0) {
  const images = imageUrls[category] || imageUrls.general
  return images[index % images.length]
}

// コンテンツに画像を挿入
function insertImagesIntoContent(content, category) {
  // タイトル直下に画像を挿入
  const titleImage = getRandomImage(category, 0)
  let modifiedContent = `<img src="${titleImage}" alt="メイン画像" class="w-full h-auto rounded-lg mb-6" />

${content}`
  
  // h2タグの直下に画像を挿入
  let h2Count = 0
  modifiedContent = modifiedContent.replace(/<h2>/g, (match) => {
    h2Count++
    const h2Image = getRandomImage(category, h2Count)
    return `<h2>`
  })
  
  // h2の閉じタグの後に画像を挿入
  h2Count = 0
  modifiedContent = modifiedContent.replace(/<\/h2>/g, (match) => {
    h2Count++
    const h2Image = getRandomImage(category, h2Count)
    return `</h2>
<img src="${h2Image}" alt="セクション画像${h2Count}" class="w-full h-auto rounded-lg my-4" />`
  })
  
  return modifiedContent
}

// 教育コンテンツとして投稿
async function postEducationContent(article) {
  try {
    // 章IDを取得
    const chapterNumber = chapterMapping[article.category] || 4
    const chapterId = await getChapterId(chapterNumber)
    
    if (!chapterId) {
      console.error('章が見つかりません:', chapterNumber)
      return false
    }

    // アイキャッチ画像を選択
    const featuredImage = getRandomImage(article.category, 0)
    
    // コンテンツ内に画像を挿入
    const contentWithImages = insertImagesIntoContent(article.content, article.category)
    const previewContentWithImages = article.preview_content ? 
      insertImagesIntoContent(article.preview_content, article.category) : null

    const { data, error } = await supabase
      .from('education_contents')
      .insert({
        title: article.title,
        slug: article.slug,
        content: contentWithImages,
        preview_content: previewContentWithImages,
        excerpt: article.excerpt,
        chapter_id: chapterId,
        is_premium: article.is_premium,
        category: article.category,
        reading_time: article.reading_time || 5,
        featured_image: featuredImage,
        status: 'published',
        published_at: new Date().toISOString()
      })

    if (error) {
      console.error('投稿エラー:', error)
      return false
    }

    console.log(`✅ 教育コンテンツ投稿成功: ${article.title} (章${chapterNumber})`)
    return true
  } catch (err) {
    console.error('予期せぬエラー:', err)
    return false
  }
}

// Vercelデプロイをトリガー
async function triggerDeploy() {
  try {
    const deployHook = process.env.VERCEL_DEPLOY_HOOK
    if (deployHook) {
      const response = await fetch(deployHook, { method: 'POST' })
      if (response.ok) {
        console.log('📦 Vercelデプロイをトリガーしました')
      } else {
        console.error('デプロイトリガー失敗:', response.status)
      }
    } else {
      console.log('ℹ️  VERCEL_DEPLOY_HOOKが設定されていません')
    }
  } catch (error) {
    console.error('デプロイトリガーエラー:', error)
  }
}

// 日次投稿タスク
async function dailyPost() {
  console.log(`\n📅 ${new Date().toLocaleDateString('ja-JP')} の教育コンテンツ投稿を開始`)
  
  const progress = loadProgress()
  const nextIndex = progress.lastPostedIndex + 1
  
  // 投稿する記事を2つ選択
  const articlesToPost = contentPlan.articles.slice(nextIndex, nextIndex + 2)
  
  if (articlesToPost.length === 0) {
    console.log('🎉 全ての教育コンテンツの投稿が完了しました！')
    return
  }
  
  let hasNewPosts = false
  
  // 各記事を投稿
  for (const article of articlesToPost) {
    const success = await postEducationContent(article)
    if (success) {
      progress.lastPostedIndex++
      hasNewPosts = true
    }
    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 進捗を保存
  saveProgress(progress)
  
  console.log(`📊 進捗: ${progress.lastPostedIndex + 1}/${contentPlan.articles.length} コンテンツ`)
  
  // 新しい記事が投稿された場合、デプロイをトリガー
  if (hasNewPosts) {
    console.log('⏳ 30秒後にデプロイをトリガーします...')
    setTimeout(() => {
      triggerDeploy()
    }, 30000) // 30秒待機
  }
}

// 手動実行用
async function manualPost() {
  await dailyPost()
}

// スケジュール実行用（毎日午前10時）
function startScheduler() {
  console.log('📅 教育コンテンツスケジューラーを開始しました')
  console.log('⏰ 毎日午前10時に2コンテンツを自動投稿します')
  
  // 毎日午前10時に実行
  cron.schedule('0 10 * * *', async () => {
    await dailyPost()
  })
  
  // 初回実行
  dailyPost()
}

// コマンドライン引数で制御
const command = process.argv[2]

if (command === 'post') {
  manualPost()
} else if (command === 'schedule') {
  startScheduler()
} else if (command === 'status') {
  const progress = loadProgress()
  console.log('📊 教育コンテンツ投稿進捗状況:')
  console.log(`- 投稿済み: ${progress.lastPostedIndex + 1} コンテンツ`)
  console.log(`- 残り: ${contentPlan.articles.length - progress.lastPostedIndex - 1} コンテンツ`)
  console.log(`- 開始日: ${new Date(progress.startDate).toLocaleDateString('ja-JP')}`)
  console.log(`- 完了予定: 約${Math.ceil((contentPlan.articles.length - progress.lastPostedIndex - 1) / 2)}日後`)
} else {
  console.log(`
使い方:
  node content-scheduler-education.js post     # 今すぐ2コンテンツを投稿
  node content-scheduler-education.js schedule # 自動スケジューラーを開始
  node content-scheduler-education.js status   # 進捗状況を確認
  `)
}