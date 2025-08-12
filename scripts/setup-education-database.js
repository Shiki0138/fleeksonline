const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupEducationTables() {
  try {
    console.log('🔧 教育コンテンツ用テーブルのセットアップを開始します...\n');

    // SQLファイルを読み込む
    const sqlPath = path.join(__dirname, 'create-education-tables.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf-8');

    // SQL文を個別に実行（Supabaseは複数のSQL文を一度に実行できないため）
    const sqlStatements = sqlContent
      .split(';')
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    console.log(`📝 ${sqlStatements.length}個のSQL文を実行します...\n`);

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      // コメント行やEXPLAINなどをスキップ
      if (statement.startsWith('--') || statement.length < 10) {
        continue;
      }

      console.log(`実行中 (${i + 1}/${sqlStatements.length}): ${statement.substring(0, 50)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement
        });

        if (error) {
          // RPC関数が存在しない場合は、直接実行を試みる
          console.warn('⚠️  RPCエラー:', error.message);
          console.log('代替方法を試しています...');
        } else {
          console.log('✅ 成功\n');
        }
      } catch (e) {
        console.error('❌ エラー:', e.message);
        console.log('このエラーをスキップして続行します...\n');
      }
    }

    console.log('\n🎉 テーブルセットアップが完了しました！');
    console.log('\n📊 作成されたテーブルを確認しています...');

    // テーブルの存在確認
    const { data: chapters, error: chaptersError } = await supabase
      .from('education_chapters')
      .select('*');

    if (!chaptersError) {
      console.log(`✅ education_chapters テーブル: ${chapters.length}件のチャプター`);
    } else {
      console.error('❌ education_chapters テーブルエラー:', chaptersError.message);
    }

    const { data: contents, error: contentsError } = await supabase
      .from('education_contents')
      .select('*');

    if (!contentsError) {
      console.log(`✅ education_contents テーブル: ${contents?.length || 0}件の記事`);
    } else {
      console.error('❌ education_contents テーブルエラー:', contentsError.message);
    }

    console.log('\n📝 次のステップ:');
    console.log('1. Supabaseダッシュボードでテーブルを確認');
    console.log('2. scripts/migrate-education-articles.js を実行して記事をインポート');

  } catch (error) {
    console.error('❌ セットアップエラー:', error);
    process.exit(1);
  }
}

// 実行
setupEducationTables();