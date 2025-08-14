const fs = require('fs').promises;
const path = require('path');

async function cleanArticleContent() {
  const articlesDir = path.join(__dirname, '..', 'data', 'education-articles');
  
  // 不要な文字を含む記事ファイルのリスト
  const filesToClean = [
    'article_007.json', 'article_008.json', 'article_009.json', 'article_010.json',
    'article_011.json', 'article_012.json', 'article_013.json', 'article_014.json',
    'article_015.json', 'article_016.json', 'article_017.json', 'article_018.json',
    'article_020.json', 'article_022.json', 'article_023.json', 'article_025.json',
    'article_026.json', 'article_027.json', 'article_028.json', 'article_029.json',
    'article_030.json', 'article_031.json', 'article_032.json', 'article_033.json',
    'article_034.json', 'article_035.json', 'article_037.json', 'article_038.json',
    'article_039.json', 'article_040.json', 'article_042.json', 'article_043.json',
    'article_044.json', 'article_045.json', 'article_047.json', 'article_048.json',
    'article_049.json', 'article_050.json', 'article_051.json', 'article_052.json',
    'article_053.json', 'article_054.json', 'article_055.json', 'article_057.json',
    'article_058.json', 'article_059.json', 'article_060.json', 'article_062.json',
    'article_063.json', 'article_064.json', 'article_065.json', 'article_066.json',
    'article_067.json', 'article_068.json', 'article_069.json', 'article_070.json',
    'article_071.json', 'article_072.json', 'article_073.json', 'article_075.json',
    'article_076.json', 'article_077.json', 'article_078.json', 'article_079.json',
    'article_080.json'
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const filename of filesToClean) {
    try {
      const filePath = path.join(articlesDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      const articleData = JSON.parse(content);
      
      // contentフィールドをクリーンアップ
      if (articleData.content) {
        // 不要なラベルを削除
        articleData.content = articleData.content
          .replace(/\*\*リード文:\*\*/g, '') // コロンも含む
          .replace(/\*\*リード文：\*\*/g, '') // 全角コロン
          .replace(/\*\*見出し[0-9]：/g, '**') // 全角コロン
          .replace(/\*\*見出し[0-9]:/g, '**') // 半角コロン
          .replace(/\*\* 見出し[0-9]：/g, '**') // スペース付き
          .replace(/\*\*まとめ：\*\*/g, '**まとめ**')
          .replace(/\*\*まとめ:\*\*/g, '**まとめ**')
          .replace(/\n\n\n/g, '\n\n') // 連続する改行を減らす
          .trim();
      }
      
      // ファイルを保存
      await fs.writeFile(filePath, JSON.stringify(articleData, null, 2), 'utf-8');
      console.log(`✅ Cleaned: ${filename}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${filename}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n完了: 成功 ${successCount}件, エラー ${errorCount}件`);
}

// 実行
cleanArticleContent().catch(console.error);