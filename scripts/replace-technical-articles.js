const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 技術指導系の記事を特定
const technicalArticles = [
  { number: 2, oldTitle: "失敗しない！新人美容師のためのシャンプー技術完全ガイド" },
  { number: 3, oldTitle: "カラーリングの基礎知識：色彩理論から薬剤選定まで" },
  { number: 4, oldTitle: "パーマの基礎技術：ロッド選定からウェーブデザインまで" },
  { number: 5, oldTitle: "ブロードライの極意：艶とボリュームを生み出すテクニック" },
  { number: 11, oldTitle: "ハサミの選び方とメンテナンス方法" },
  { number: 12, oldTitle: "カット理論の基礎：ベーシックカットから応用まで" },
  { number: 13, oldTitle: "薬剤知識：安全な施術のための化学基礎" },
  { number: 15, oldTitle: "シザーワークの基本動作と練習方法" },
  { number: 18, oldTitle: "カラーチャートの読み方と色の配合理論" }
];

// ビジネス・心理学系の新しいタイトル
const replacementArticles = [
  { 
    number: 2, 
    title: "シャンプー中の会話術：リラクゼーションと信頼構築の心理学",
    content: "シャンプータイムは、お客様が最もリラックスし、心を開きやすい貴重な時間です。この15分間の使い方次第で、顧客満足度とリピート率が大きく変わります..."
  },
  { 
    number: 3, 
    title: "カラーリング提案の心理学：色彩がもたらす印象変化と顧客満足度",
    content: "髪色の変化は、お客様の自己イメージと社会的印象を大きく左右します。色彩心理学を理解することで、より満足度の高い提案が可能になります..."
  },
  { 
    number: 4, 
    title: "パーマメニューの価値提案：時短ニーズと付加価値の訴求方法",
    content: "現代の忙しい女性にとって、朝のスタイリング時間短縮は大きな価値です。パーマの真の価値を伝える提案方法を解説します..."
  },
  { 
    number: 5, 
    title: "ドライヤータイムの接客術：会話と沈黙のバランスを極める",
    content: "ドライヤーの音で会話が困難な時間帯の接客は、美容師の腕の見せ所です。非言語コミュニケーションを活用した満足度向上の方法を紹介します..."
  },
  { 
    number: 11, 
    title: "プロ用品への投資効果：顧客が感じる価値と料金設定の関係",
    content: "高品質な道具への投資は、顧客満足度と価格設定に直結します。投資効果を最大化する考え方と、顧客への価値の伝え方を解説します..."
  },
  { 
    number: 12, 
    title: "カット時間の価値最大化：施術中の付加価値サービスの提供方法",
    content: "カット中の時間は、単なる施術時間ではなく、顧客体験を高める機会です。会話、アドバイス、リラクゼーションを組み合わせた価値提供の方法を紹介します..."
  },
  { 
    number: 13, 
    title: "安全性アピールによる差別化戦略：信頼獲得とプレミアム化",
    content: "安全性への配慮は、高価格帯サロンの重要な差別化要素です。安全対策を顧客価値に変換する方法と、信頼構築のアプローチを解説します..."
  },
  { 
    number: 15, 
    title: "施術の見せ方マーケティング：SNS時代の視覚的訴求方法",
    content: "施術プロセスの美しさは、SNSマーケティングの重要な要素です。撮影映えする施術の演出方法と、集客につなげる活用術を紹介します..."
  },
  { 
    number: 18, 
    title: "色彩提案による客単価アップ：ハイライトとグラデーションの価値訴求",
    content: "複雑な色彩技術は高単価メニューの柱です。技術の価値を分かりやすく伝え、納得して選んでもらうための提案方法を解説します..."
  }
];

async function replaceTechnicalArticles() {
  console.log('🔄 技術指導系記事をビジネス系に置き換えます...\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const replacement of replacementArticles) {
    try {
      // 既存の記事を確認
      const { data: existing } = await supabase
        .from('education_contents')
        .select('*')
        .eq('article_number', replacement.number)
        .single();
      
      if (!existing) {
        console.log(`❌ 記事${replacement.number}が見つかりません`);
        errorCount++;
        continue;
      }
      
      // 記事を更新
      const { error } = await supabase
        .from('education_contents')
        .update({
          title: replacement.title,
          content: replacement.content,
          excerpt: replacement.content.substring(0, 150) + '...',
          seo_title: replacement.title,
          seo_description: replacement.content.substring(0, 150)
        })
        .eq('article_number', replacement.number);
      
      if (error) {
        console.error(`❌ 記事${replacement.number}の更新エラー:`, error.message);
        errorCount++;
      } else {
        console.log(`✅ 記事${replacement.number}: ${replacement.title}`);
        successCount++;
      }
      
    } catch (error) {
      console.error(`❌ エラー:`, error.message);
      errorCount++;
    }
  }
  
  console.log(`\n📊 完了: ${successCount}記事を更新、${errorCount}件のエラー`);
  
  // 更新後の確認
  const { data: updatedArticles } = await supabase
    .from('education_contents')
    .select('article_number, title')
    .in('article_number', replacementArticles.map(a => a.number))
    .order('article_number');
  
  console.log('\n📝 更新後のタイトル:');
  updatedArticles?.forEach(article => {
    console.log(`  ${article.article_number}. ${article.title}`);
  });
}

replaceTechnicalArticles();