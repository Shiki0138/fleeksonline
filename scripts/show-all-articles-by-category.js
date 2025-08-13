const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function showAllArticles() {
  try {
    // 全記事を取得
    const { data: articles, error } = await supabase
      .from('education_contents')
      .select('article_number, title, access_level, status')
      .order('article_number');
    
    if (error) {
      console.error('エラー:', error);
      return;
    }
    
    console.log('\n📚 教育コンテンツ全記事リスト（' + articles.length + '記事）\n');
    
    // カテゴリー別に分類
    const categories = {
      beginner: { name: '🌱 初心者編', articles: [] },
      management: { name: '💼 経営編', articles: [] },
      dx: { name: '🚀 DX・テクノロジー編', articles: [] },
      general: { name: '🎯 総合スキルアップ編', articles: [] }
    };
    
    articles.forEach(article => {
      let category;
      if (article.article_number <= 20) category = 'beginner';
      else if (article.article_number <= 40) category = 'management';
      else if (article.article_number <= 60) category = 'dx';
      else category = 'general';
      
      categories[category].articles.push(article);
    });
    
    // カテゴリー別に表示
    Object.entries(categories).forEach(([key, category]) => {
      console.log('\n' + category.name + ' (' + category.articles.length + '記事)');
      console.log('=' .repeat(80));
      
      category.articles.forEach(article => {
        const accessBadge = article.access_level === 'free' ? '🆓' : 
                           article.access_level === 'partial' ? '👑' : '🔒';
        console.log(`${String(article.article_number).padStart(3, ' ')}. ${accessBadge} ${article.title}`);
      });
    });
    
    // ビジネス系記事の例を表示
    console.log('\n\n📊 ビジネス系記事の例');
    console.log('=' .repeat(80));
    
    const businessArticles = articles.filter(a => 
      a.title.includes('売上') || 
      a.title.includes('経営') || 
      a.title.includes('集客') || 
      a.title.includes('顧客') ||
      a.title.includes('マーケティング') ||
      a.title.includes('ブランディング') ||
      a.title.includes('価格') ||
      a.title.includes('利益')
    );
    
    businessArticles.forEach(article => {
      console.log(`${String(article.article_number).padStart(3, ' ')}. ${article.title}`);
    });
    
    console.log('\n合計: ' + businessArticles.length + '記事がビジネス関連');
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

showAllArticles();