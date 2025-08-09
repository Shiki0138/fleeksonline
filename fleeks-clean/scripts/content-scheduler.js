const { createClient } = require('@supabase/supabase-js')
const cron = require('node-cron')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Supabase設定
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // サービスキーが必要

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
const progressFile = path.join(__dirname, 'posting-progress.json')

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

// 記事を投稿
async function postArticle(article) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert({
        title: article.title,
        slug: article.slug,
        content: article.content,
        preview_content: article.preview_content || null,
        excerpt: article.excerpt,
        is_premium: article.is_premium,
        category: article.category,
        reading_time: article.reading_time || 5,
        status: 'published',
        published_at: new Date().toISOString()
      })

    if (error) {
      console.error('投稿エラー:', error)
      return false
    }

    console.log(`✅ 投稿成功: ${article.title}`)
    return true
  } catch (err) {
    console.error('予期せぬエラー:', err)
    return false
  }
}

// 日次投稿タスク
async function dailyPost() {
  console.log(`\n📅 ${new Date().toLocaleDateString('ja-JP')} の投稿を開始`)
  
  const progress = loadProgress()
  const nextIndex = progress.lastPostedIndex + 1
  
  // 投稿する記事を2つ選択
  const articlesToPost = contentPlan.articles.slice(nextIndex, nextIndex + 2)
  
  if (articlesToPost.length === 0) {
    console.log('🎉 全ての記事の投稿が完了しました！')
    return
  }
  
  // 各記事を投稿
  for (const article of articlesToPost) {
    const success = await postArticle(article)
    if (success) {
      progress.lastPostedIndex++
    }
    // API制限を考慮して少し待機
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  // 進捗を保存
  saveProgress(progress)
  
  console.log(`📊 進捗: ${progress.lastPostedIndex + 1}/${contentPlan.articles.length} 記事`)
}

// 手動実行用
async function manualPost() {
  await dailyPost()
}

// スケジュール実行用（毎日午前10時）
function startScheduler() {
  console.log('📅 コンテンツスケジューラーを開始しました')
  console.log('⏰ 毎日午前10時に2記事を自動投稿します')
  
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
  // 手動で今すぐ投稿
  manualPost()
} else if (command === 'schedule') {
  // スケジューラーを開始
  startScheduler()
} else if (command === 'status') {
  // 現在の進捗を表示
  const progress = loadProgress()
  console.log('📊 投稿進捗状況:')
  console.log(`- 投稿済み: ${progress.lastPostedIndex + 1} 記事`)
  console.log(`- 残り: ${contentPlan.articles.length - progress.lastPostedIndex - 1} 記事`)
  console.log(`- 開始日: ${new Date(progress.startDate).toLocaleDateString('ja-JP')}`)
  console.log(`- 完了予定: 約${Math.ceil((contentPlan.articles.length - progress.lastPostedIndex - 1) / 2)}日後`)
} else {
  console.log(`
使い方:
  node content-scheduler.js post     # 今すぐ2記事を投稿
  node content-scheduler.js schedule # 自動スケジューラーを開始
  node content-scheduler.js status   # 進捗状況を確認
  `)
}