const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTables() {
  console.log('🔍 教育コンテンツテーブルの状態を確認します...\n');

  try {
    // education_chaptersテーブルの確認
    console.log('📊 education_chapters テーブル:');
    const { data: chapters, error: chaptersError } = await supabase
      .from('education_chapters')
      .select('*')
      .order('chapter_number');

    if (chaptersError) {
      console.error('❌ エラー:', chaptersError.message);
    } else {
      console.log(`✅ ${chapters.length}件のチャプター`);
      chapters.forEach(ch => {
        console.log(`  - ${ch.icon} ${ch.title} (${ch.category})`);
      });
    }

    console.log('\n📊 education_contents テーブル:');
    const { data: contents, error: contentsError, count } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact' })
      .limit(5)
      .order('article_number');

    if (contentsError) {
      console.error('❌ エラー:', contentsError.message);
    } else {
      console.log(`✅ ${count || 0}件の記事`);
      if (contents && contents.length > 0) {
        console.log('  最初の5件:');
        contents.forEach(content => {
          console.log(`  - 記事${content.article_number}: ${content.title}`);
        });
      }
    }

    // テーブル構造の確認
    console.log('\n📋 テーブル構造の確認:');
    const { data: columns, error: columnsError } = await supabase
      .from('education_contents')
      .select()
      .limit(0);

    if (!columnsError && columns) {
      console.log('✅ education_contents テーブルが正常に作成されています');
    } else {
      console.error('❌ テーブル構造の確認に失敗しました');
    }

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// 実行
checkTables();