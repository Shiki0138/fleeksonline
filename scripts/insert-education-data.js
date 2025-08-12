// 教育コンテンツデータをSupabaseに挿入するスクリプト
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // サービスキーを使用（RLSをバイパス）
)

async function insertEducationData() {
  try {
    // データディレクトリのパス
    const dataDir = path.join(__dirname, '..', 'data', 'education-articles')
    
    // すべての記事ファイルを読み込み
    const files = await fs.readdir(dataDir)
    const articleFiles = files.filter(f => f.endsWith('.json')).sort()
    
    console.log(`Found ${articleFiles.length} article files`)
    
    // 各記事を処理
    for (const file of articleFiles) {
      const filePath = path.join(dataDir, file)
      const content = await fs.readFile(filePath, 'utf-8')
      const article = JSON.parse(content)
      
      // 記事番号を抽出
      const articleNumber = parseInt(article.id.replace('article_', ''))
      
      // チャプターを決定（記事番号に基づいて）
      let chapterId
      if (articleNumber <= 20) {
        chapterId = 1 // 初心者編
      } else if (articleNumber <= 40) {
        chapterId = 2 // 経営編
      } else if (articleNumber <= 60) {
        chapterId = 3 // DX編
      } else {
        chapterId = 4 // 総合編
      }
      
      // チャプターIDを取得
      const { data: chapters } = await supabase
        .from('education_chapters')
        .select('id')
        .eq('chapter_number', chapterId)
        .single()
      
      if (!chapters) {
        console.error(`Chapter ${chapterId} not found`)
        continue
      }
      
      // アクセスレベルを決定
      let accessLevel
      const articleInChapter = ((articleNumber - 1) % 20) + 1
      if (articleInChapter <= 5) {
        accessLevel = 'free'
      } else if (articleInChapter <= 15) {
        accessLevel = 'partial'
      } else {
        accessLevel = 'premium'
      }
      
      // 記事データを準備
      const educationContent = {
        chapter_id: chapters.id,
        article_number: articleNumber,
        title: article.title,
        slug: `article-${String(articleNumber).padStart(3, '0')}`,
        content: article.content,
        preview_content: article.content.substring(0, 500) + '...',
        excerpt: article.leadText || article.content.substring(0, 200) + '...',
        is_premium: accessLevel === 'premium',
        access_level: accessLevel,
        reading_time: 7,
        status: 'published',
        publish_date: article.postedAt || new Date().toISOString(),
        seo_title: article.title,
        seo_description: article.leadText || article.content.substring(0, 160),
        internal_links: article.internalLinks || []
      }
      
      // データベースに挿入
      const { data, error } = await supabase
        .from('education_contents')
        .upsert(educationContent, {
          onConflict: 'article_number'
        })
      
      if (error) {
        console.error(`Error inserting article ${articleNumber}:`, error)
      } else {
        console.log(`Successfully inserted/updated article ${articleNumber}: ${article.title}`)
      }
    }
    
    console.log('Finished processing all articles')
    
    // 挿入結果を確認
    const { data: totalCount } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true })
    
    console.log(`Total articles in database: ${totalCount}`)
    
  } catch (error) {
    console.error('Error in main process:', error)
  }
}

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_KEY')
  process.exit(1)
}

// スクリプトを実行
insertEducationData()