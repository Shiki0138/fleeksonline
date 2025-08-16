const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateArticleStatus() {
  try {
    console.log('📅 記事のステータスを更新します...\n');
    
    const now = new Date();
    
    // 公開日が過ぎているがまだscheduledのままの記事を取得
    const { data: scheduledArticles, error } = await supabase
      .from('education_contents')
      .select('id, article_number, title, publish_date')
      .eq('status', 'scheduled')
      .lte('publish_date', now.toISOString())
      .order('article_number');
    
    if (error) {
      throw new Error(`記事取得エラー: ${error.message}`);
    }
    
    if (!scheduledArticles || scheduledArticles.length === 0) {
      console.log('✅ 更新が必要な記事はありません');
      return;
    }
    
    console.log(`📊 ${scheduledArticles.length}件の記事を公開します\n`);
    
    let updatedCount = 0;
    
    for (const article of scheduledArticles) {
      // statusをpublishedに更新
      const { error: updateError } = await supabase
        .from('education_contents')
        .update({ status: 'published' })
        .eq('id', article.id);
      
      if (updateError) {
        console.error(`❌ 記事${article.article_number}の更新エラー:`, updateError.message);
      } else {
        updatedCount++;
        console.log(`✅ 記事${article.article_number}: ${article.title} を公開しました`);
      }
    }
    
    console.log(`\n🎉 ${updatedCount}件の記事を公開しました`);
    
    // 現在の公開済み記事数を確認
    const { count } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact' })
      .eq('status', 'published');
    
    console.log(`\n📚 現在公開中の記事: ${count}件`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// 実行
updateArticleStatus();