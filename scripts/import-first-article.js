const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importFirstArticle() {
  try {
    console.log('📚 最初の記事をインポートします...\n');

    // 記事ファイルを読み込む
    const articlePath = path.join(__dirname, '../data/education-articles/article_001.json');
    const articleData = JSON.parse(await fs.readFile(articlePath, 'utf-8'));
    
    // チャプター1のIDを取得
    const { data: chapter, error: chapterError } = await supabase
      .from('education_chapters')
      .select('id')
      .eq('chapter_number', 1)
      .single();

    if (chapterError) {
      throw new Error(`チャプター取得エラー: ${chapterError.message}`);
    }

    // 記事データを準備
    const educationContent = {
      chapter_id: chapter.id,
      article_number: 1,
      title: articleData.title,
      slug: '001',
      content: articleData.content,
      preview_content: articleData.preview || articleData.content.substring(0, 500) + '...',
      excerpt: articleData.summary || articleData.content.substring(0, 200),
      is_premium: false,
      access_level: 'free',
      reading_time: 7,
      status: 'published',
      publish_date: new Date().toISOString(),
      seo_title: articleData.seoTitle || articleData.title,
      seo_description: articleData.seoDescription || articleData.summary,
      internal_links: articleData.internalLinks || []
    };

    // 記事をインサート
    const { data, error } = await supabase
      .from('education_contents')
      .insert(educationContent)
      .select();

    if (error) {
      throw new Error(`記事インポートエラー: ${error.message}`);
    }

    console.log('✅ 記事をインポートしました:');
    console.log(`   タイトル: ${articleData.title}`);
    console.log(`   記事番号: 1`);
    console.log(`   アクセスレベル: free`);
    console.log(`   ステータス: published\n`);

    // 確認
    const { count } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 データベース内の記事数: ${count}/80`);
    
    console.log('\n🎉 インポート完了！');
    console.log('📱 ローカルで確認: http://localhost:3000/education');

  } catch (error) {
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

// 実行
importFirstArticle();