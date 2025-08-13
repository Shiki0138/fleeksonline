const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showBeginnerArticles() {
  try {
    // 初心者編の記事を取得（記事番号1-20）
    const { data: articles, error } = await supabase
      .from('education_contents')
      .select('article_number, title, access_level, status, publish_date')
      .gte('article_number', 1)
      .lte('article_number', 20)
      .order('article_number');
    
    if (error) {
      console.error('エラー:', error);
      return;
    }
    
    console.log('\n🌱 教育コンテンツ - 初心者編（全' + articles.length + '記事）\n');
    console.log('=' .repeat(100));
    
    articles.forEach(article => {
      const accessBadge = article.access_level === 'free' ? '🆓 無料' : 
                         article.access_level === 'partial' ? '👑 一部有料' : '🔒 プレミアム';
      const statusBadge = article.status === 'published' ? '✅ 公開中' : '⏰ 予定';
      
      console.log(`\n記事${String(article.article_number).padStart(2, '0')}: ${article.title}`);
      console.log(`  アクセス: ${accessBadge} | 状態: ${statusBadge}`);
    });
    
    console.log('\n' + '=' .repeat(100));
    
    // アクセスレベル別の集計
    const free = articles.filter(a => a.access_level === 'free').length;
    const partial = articles.filter(a => a.access_level === 'partial').length;
    const premium = articles.filter(a => a.access_level === 'premium').length;
    const published = articles.filter(a => a.status === 'published').length;
    
    console.log('\n📊 集計情報:');
    console.log(`  総記事数: ${articles.length}記事`);
    console.log(`  公開済み: ${published}記事`);
    console.log('\n  アクセスレベル別:');
    console.log(`    無料: ${free}記事 (記事1-5)`);
    console.log(`    一部有料: ${partial}記事 (記事6-15)`);
    console.log(`    プレミアム: ${premium}記事 (記事16-20)`);
    
    // 記事生成の進捗も確認
    const { count: totalCount } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📈 全体の進捗: ${totalCount}/80記事 (${Math.round(totalCount/80*100)}%完了)`);
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

showBeginnerArticles();