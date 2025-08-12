const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function monitorProgress() {
  console.log('📊 教育記事生成の進捗モニタリング\n');
  
  try {
    // 記事数を取得
    const { count, error } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('エラー:', error.message);
      return;
    }
    
    // 進捗表示
    const total = 80;
    const percentage = Math.round((count / total) * 100);
    const completed = '█'.repeat(Math.floor(percentage / 2));
    const remaining = '░'.repeat(50 - Math.floor(percentage / 2));
    
    console.log(`進捗: [${completed}${remaining}] ${percentage}%`);
    console.log(`完了: ${count}/${total} 記事`);
    console.log(`残り: ${total - count} 記事`);
    
    // 推定時間（1記事5秒として計算）
    const remainingTime = (total - count) * 5;
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    console.log(`推定残り時間: ${minutes}分${seconds}秒`);
    
    // 最新の記事を表示
    const { data: latestArticles } = await supabase
      .from('education_contents')
      .select('article_number, title, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (latestArticles && latestArticles.length > 0) {
      console.log('\n📝 最新の記事:');
      latestArticles.forEach(article => {
        const time = new Date(article.created_at).toLocaleTimeString('ja-JP');
        console.log(`  - 記事${article.article_number}: ${article.title} (${time})`);
      });
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

// 実行
monitorProgress();