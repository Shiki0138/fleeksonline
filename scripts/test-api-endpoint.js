const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('🔍 教育コンテンツAPIをテストします...\n');
    
    // ローカルAPIをテスト
    const response = await fetch('http://localhost:3000/api/education/articles');
    const data = await response.json();
    
    console.log('📡 APIレスポンス:');
    console.log('ステータス:', response.status);
    console.log('データ:', JSON.stringify(data, null, 2));
    
    if (data.articles && data.articles.length > 0) {
      console.log(`\n✅ ${data.articles.length}件の記事を取得しました`);
      data.articles.forEach(article => {
        console.log(`- ${article.id}: ${article.title}`);
      });
    } else {
      console.log('\n⚠️  記事が返されませんでした');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

testAPI();