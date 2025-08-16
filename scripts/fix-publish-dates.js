const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPublishDates() {
  try {
    console.log('📅 記事の公開日を修正します...\n');
    
    // 全記事を取得
    const { data: articles, error } = await supabase
      .from('education_contents')
      .select('id, article_number, publish_date, status')
      .order('article_number');
    
    if (error) {
      throw new Error(`記事取得エラー: ${error.message}`);
    }
    
    console.log(`📊 ${articles.length}件の記事を確認しました\n`);
    
    const now = new Date();
    let updatedCount = 0;
    
    for (const article of articles) {
      // 公開日を正しく設定（2日ごとに1記事）
      const daysToAdd = (article.article_number - 1) * 2;
      const newPublishDate = new Date('2024-08-12');  // 公開開始日
      newPublishDate.setDate(newPublishDate.getDate() + daysToAdd);
      
      // statusも適切に更新
      const newStatus = newPublishDate <= now ? 'published' : 'scheduled';
      
      // 更新
      const { error: updateError } = await supabase
        .from('education_contents')
        .update({
          publish_date: newPublishDate.toISOString(),
          status: newStatus
        })
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`❌ 記事${article.article_number}の更新エラー:`, updateError.message);
      } else {
        updatedCount++;
        console.log(`✅ 記事${article.article_number}: ${newStatus} (${newPublishDate.toLocaleDateString('ja-JP')})`);
      }
    }
    
    console.log(`\n🎉 ${updatedCount}件の記事を更新しました`);
    
    // 公開済み記事の確認
    const { data: publishedArticles, count } = await supabase
      .from('education_contents')
      .select('article_number, title', { count: 'exact' })
      .eq('status', 'published')
      .order('article_number')
      .limit(10);
    
    console.log(`\n📚 現在公開中の記事: ${count}件`);
    if (publishedArticles && publishedArticles.length > 0) {
      publishedArticles.forEach(article => {
        console.log(`  - 記事${article.article_number}: ${article.title}`);
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// 実行
fixPublishDates();