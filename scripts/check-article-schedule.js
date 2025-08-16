const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// TypeScriptモジュールの読み込み
const { getPublishDate, formatArticle, EDUCATION_ARTICLES } = require('../src/lib/education-articles.ts');

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkArticleSchedule() {
  try {
    console.log('=== 教育記事の公開スケジュール確認 ===');
    console.log('基準日: 2024年8月12日から2日ごとに公開');
    console.log('今日: 2025年8月16日\n');

    // データベースから記事情報を取得
    const { data: dbArticles, error } = await supabase
      .from('education_contents')
      .select('id, article_number, title, publish_date, status')
      .order('article_number')
      .limit(20); // 最初の20記事をチェック

    if (error) {
      console.error('❌ データベースエラー:', error.message);
      return;
    }

    console.log('=== データベースの記事情報（最初の20記事） ===');
    const today = new Date('2025-08-16');
    
    dbArticles.forEach(article => {
      const publishDate = new Date(article.publish_date);
      const daysDiff = Math.ceil((today - publishDate) / (1000 * 60 * 60 * 24));
      const shouldBePublished = publishDate <= today;
      
      console.log(`記事${article.article_number}: ${shouldBePublished ? '✅公開済み' : '⏰未公開'} - ${publishDate.toLocaleDateString('ja-JP')} (${daysDiff > 0 ? daysDiff + '日前' : Math.abs(daysDiff) + '日後'})`);
      console.log(`  DB状態: ${article.status}, 判定: ${shouldBePublished ? '公開' : '未公開'}`);
    });

    // 静的データとの比較
    console.log('\n=== 静的データとの比較（最初の10記事） ===');
    EDUCATION_ARTICLES.slice(0, 10).forEach(article => {
      const formatted = formatArticle(article);
      const publishDate = new Date(formatted.publishDate);
      const daysDiff = Math.ceil((today - publishDate) / (1000 * 60 * 60 * 24));
      
      console.log(`記事${article.number}: ${formatted.isPublished ? '✅公開済み' : '⏰未公開'} - ${publishDate.toLocaleDateString('ja-JP')} (${daysDiff > 0 ? daysDiff + '日前' : Math.abs(daysDiff) + '日後'})`);
    });

    // 全記事の統計
    const { count: totalPublished } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    const { count: totalScheduled } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact' })
      .eq('status', 'scheduled');

    console.log('\n=== 全記事の統計（データベース） ===');
    console.log(`公開済み: ${totalPublished}記事`);
    console.log(`未公開: ${totalScheduled}記事`);
    console.log(`合計: ${totalPublished + totalScheduled}記事`);

    // 本日公開予定の記事をチェック
    const todayStr = '2025-08-16';
    const { data: todayArticles, error: todayError } = await supabase
      .from('education_contents')
      .select('article_number, title, publish_date, status')
      .gte('publish_date', todayStr + 'T00:00:00')
      .lt('publish_date', todayStr + 'T23:59:59')
      .order('article_number');

    if (!todayError && todayArticles) {
      console.log(`\n本日(8/16)公開予定: ${todayArticles.length}記事`);
      todayArticles.forEach(a => {
        console.log(`- 記事${a.article_number}: ${a.title} (${a.status})`);
      });
    }

    // 今後公開予定の記事（次の10記事）
    const { data: futureArticles, error: futureError } = await supabase
      .from('education_contents')
      .select('article_number, title, publish_date, status')
      .gt('publish_date', todayStr + 'T23:59:59')
      .order('publish_date')
      .limit(10);

    if (!futureError && futureArticles && futureArticles.length > 0) {
      console.log('\n=== 今後公開予定の記事（次の10記事） ===');
      futureArticles.forEach(a => {
        const publishDate = new Date(a.publish_date);
        console.log(`記事${a.article_number}: ${publishDate.toLocaleDateString('ja-JP')} - ${a.title.substring(0, 40)}...`);
      });
    }

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkArticleSchedule();