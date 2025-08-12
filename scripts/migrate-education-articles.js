const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 記事のアクセスレベルを決定する関数
function determineAccessLevel(articleNumber) {
  const positionInChapter = ((articleNumber - 1) % 20) + 1;
  if (positionInChapter <= 5) return 'free';
  else if (positionInChapter <= 15) return 'partial';
  else return 'premium';
}

// チャプターIDを取得する関数
function getChapterNumber(articleNumber) {
  return Math.ceil(articleNumber / 20);
}

// 記事のスラッグを生成
function generateSlug(articleNumber) {
  return String(articleNumber).padStart(3, '0');
}

async function migrateArticles() {
  try {
    console.log('📚 教育記事のデータベース移行を開始します...\n');

    // チャプター情報を取得
    const { data: chapters, error: chaptersError } = await supabase
      .from('education_chapters')
      .select('*')
      .order('chapter_number');

    if (chaptersError) {
      throw new Error(`チャプター取得エラー: ${chaptersError.message}`);
    }

    console.log(`✅ ${chapters.length}個のチャプターを取得しました\n`);

    // 既存の記事ファイルを確認
    const articlesDir = path.join(__dirname, '../data/education-articles');
    let existingArticles = [];
    
    try {
      const files = await fs.readdir(articlesDir);
      existingArticles = files.filter(f => f.endsWith('.json'));
      console.log(`📁 ${existingArticles.length}個の既存記事ファイルを検出\n`);
    } catch (e) {
      console.log('📁 記事ディレクトリが存在しません。新規作成します。\n');
      await fs.mkdir(articlesDir, { recursive: true });
    }

    // 既存の記事をインポート
    if (existingArticles.length > 0) {
      for (const file of existingArticles) {
        try {
          const filePath = path.join(articlesDir, file);
          const articleData = JSON.parse(await fs.readFile(filePath, 'utf-8'));
          
          const articleNumber = parseInt(file.match(/\d+/)[0]);
          const chapterNumber = getChapterNumber(articleNumber);
          const chapter = chapters.find(c => c.chapter_number === chapterNumber);
          
          if (!chapter) {
            console.error(`❌ チャプター${chapterNumber}が見つかりません`);
            continue;
          }

          const publishDate = new Date();
          publishDate.setDate(publishDate.getDate() + Math.floor((articleNumber - 1) / 2));

          const educationContent = {
            chapter_id: chapter.id,
            article_number: articleNumber,
            title: articleData.title,
            slug: generateSlug(articleNumber),
            content: articleData.content,
            preview_content: articleData.preview || articleData.content.substring(0, 500) + '...',
            excerpt: articleData.summary || articleData.content.substring(0, 200),
            is_premium: articleData.accessLevel !== 'free',
            access_level: articleData.accessLevel || determineAccessLevel(articleNumber),
            reading_time: articleData.readingTime || 7,
            status: publishDate <= new Date() ? 'published' : 'scheduled',
            publish_date: publishDate.toISOString(),
            seo_title: articleData.seoTitle || articleData.title,
            seo_description: articleData.seoDescription || articleData.summary,
            internal_links: articleData.internalLinks || []
          };

          const { data, error } = await supabase
            .from('education_contents')
            .upsert(educationContent, { onConflict: 'article_number' });

          if (error) {
            console.error(`❌ 記事${articleNumber}のインポートエラー:`, error.message);
          } else {
            console.log(`✅ 記事${articleNumber}「${articleData.title}」をインポートしました`);
          }
        } catch (e) {
          console.error(`❌ ファイル${file}の処理エラー:`, e.message);
        }
      }
    }

    // データベースの記事数を確認
    const { count, error: countError } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📊 データベース内の記事数: ${count}/80`);
      
      if (count < 80) {
        console.log(`\n⚠️  まだ${80 - count}記事が不足しています。`);
        console.log('💡 ヒント: scripts/generate-all-education-articles.js を実行して残りの記事を生成してください。');
      } else {
        console.log('\n🎉 すべての記事がデータベースに登録されています！');
      }
    }

  } catch (error) {
    console.error('❌ 移行エラー:', error);
    process.exit(1);
  }
}

// 実行
migrateArticles();