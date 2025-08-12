const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // ANONキーでテスト
);

async function testSupabaseAccess() {
  console.log('🔍 Supabaseへの直接アクセスをテストします...\n');

  try {
    // education_contentsを取得
    const { data: contents, error } = await supabase
      .from('education_contents')
      .select(`
        id,
        article_number,
        title,
        slug,
        access_level,
        publish_date,
        reading_time,
        status,
        education_chapters (
          category
        )
      `)
      .order('article_number', { ascending: true });

    if (error) {
      console.error('❌ エラー:', error);
      console.log('\n💡 ヒント: RLSポリシーを確認してください');
      return;
    }

    console.log(`✅ ${contents?.length || 0}件の記事を取得しました\n`);
    
    if (contents && contents.length > 0) {
      contents.forEach(content => {
        console.log(`記事${content.article_number}: ${content.title}`);
        console.log(`  - カテゴリ: ${content.education_chapters?.category}`);
        console.log(`  - アクセスレベル: ${content.access_level}`);
        console.log(`  - ステータス: ${content.status}`);
        console.log(`  - 公開日: ${new Date(content.publish_date).toLocaleDateString('ja-JP')}\n`);
      });
    }

    // APIフォーマットに変換してテスト
    const articles = contents?.map(content => {
      const publishDate = new Date(content.publish_date);
      const now = new Date();
      const isPublished = content.status === 'published' && publishDate <= now;

      return {
        id: `article_${String(content.article_number).padStart(3, '0')}`,
        title: content.title,
        category: content.education_chapters?.category || 'general',
        accessLevel: content.access_level,
        publishDate: content.publish_date,
        isPublished,
        readTime: content.reading_time
      };
    }) || [];

    console.log('\n📊 APIフォーマットでの出力:');
    console.log(JSON.stringify({ articles }, null, 2));

  } catch (error) {
    console.error('❌ 予期しないエラー:', error);
  }
}

// 実行
testSupabaseAccess();