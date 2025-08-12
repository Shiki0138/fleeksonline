const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const ArticleGeneratorGemini = require('./article-generator-gemini');

// Supabaseクライアントの初期化
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 記事トピックのリスト（80記事分）
const articleTopics = [
  // 第1章：初心者編（記事1-20）
  { number: 1, title: "美容師のための効果的な挨拶とその心理学的効果", category: "beginner" },
  { number: 2, title: "失敗しない！新人美容師のためのシャンプー技術完全ガイド", category: "beginner" },
  { number: 3, title: "カラーリングの基礎知識：色彩理論から薬剤選定まで", category: "beginner" },
  { number: 4, title: "パーマの基礎技術：ロッド選定からウェーブデザインまで", category: "beginner" },
  { number: 5, title: "ブロードライの極意：艶とボリュームを生み出すテクニック", category: "beginner" },
  { number: 6, title: "カウンセリング力向上！お客様の本音を引き出す会話術", category: "beginner" },
  { number: 7, title: "ヘアケア知識の基礎：髪質診断からトリートメント選定まで", category: "beginner" },
  { number: 8, title: "スタイリング剤の選び方と効果的な使用方法", category: "beginner" },
  { number: 9, title: "美容師のための解剖学：頭皮と髪の構造を理解する", category: "beginner" },
  { number: 10, title: "接客マナーの基本：リピーターを生む接客術", category: "beginner" },
  { number: 11, title: "ハサミの選び方とメンテナンス方法", category: "beginner" },
  { number: 12, title: "カット理論の基礎：ベーシックカットから応用まで", category: "beginner" },
  { number: 13, title: "薬剤知識：安全な施術のための化学基礎", category: "beginner" },
  { number: 14, title: "美容師のための皮膚科学：アレルギーとパッチテスト", category: "beginner" },
  { number: 15, title: "シザーワークの基本動作と練習方法", category: "beginner" },
  { number: 16, title: "顔型診断と似合わせ理論の基礎", category: "beginner" },
  { number: 17, title: "美容師のための栄養学：髪と健康の関係", category: "beginner" },
  { number: 18, title: "カラーチャートの読み方と色の配合理論", category: "beginner" },
  { number: 19, title: "新人美容師が陥りやすい失敗とその対策", category: "beginner" },
  { number: 20, title: "アシスタントから抜け出すための実践的スキルアップ法", category: "beginner" },

  // 第2章：経営編（記事21-40）
  { number: 21, title: "美容室開業の完全ガイド：資金計画から物件選びまで", category: "management" },
  { number: 22, title: "集客力を3倍にするSNSマーケティング戦略", category: "management" },
  { number: 23, title: "リピート率90%を実現する顧客管理術", category: "management" },
  { number: 24, title: "美容室の売上を伸ばす価格戦略と料金設定の極意", category: "management" },
  { number: 25, title: "スタッフマネジメント：離職率を下げるチーム作り", category: "management" },
  { number: 26, title: "美容室の財務管理：利益を最大化する経営分析", category: "management" },
  { number: 27, title: "口コミを増やすための顧客満足度向上戦略", category: "management" },
  { number: 28, title: "美容室のブランディング：差別化戦略の立て方", category: "management" },
  { number: 29, title: "効果的な新規顧客獲得：広告とプロモーション戦略", category: "management" },
  { number: 30, title: "美容室の在庫管理と仕入れコスト削減術", category: "management" },
  { number: 31, title: "スタッフ教育システムの構築：技術と接客の向上", category: "management" },
  { number: 32, title: "美容室の法務知識：契約書から労務管理まで", category: "management" },
  { number: 33, title: "顧客単価を上げるアップセル・クロスセル戦略", category: "management" },
  { number: 34, title: "美容室の衛生管理と安全対策の徹底ガイド", category: "management" },
  { number: 35, title: "フランチャイズvs独立開業：メリット・デメリット比較", category: "management" },
  { number: 36, title: "美容室の事業計画書の作り方：融資獲得のポイント", category: "management" },
  { number: 37, title: "顧客データ分析で売上アップ：CRM活用術", category: "management" },
  { number: 38, title: "美容室の採用戦略：優秀な人材を獲得する方法", category: "management" },
  { number: 39, title: "多店舗展開の成功法則：2店舗目を出すタイミング", category: "management" },
  { number: 40, title: "美容室経営者のための節税対策と資産形成", category: "management" },

  // 第3章：DX・テクノロジー編（記事41-60）
  { number: 41, title: "美容室DXの第一歩：予約システムのデジタル化", category: "dx" },
  { number: 42, title: "AIを活用した顧客分析と売上予測", category: "dx" },
  { number: 43, title: "美容室向けPOSシステムの選び方と活用法", category: "dx" },
  { number: 44, title: "オンラインカウンセリングの導入と運用方法", category: "dx" },
  { number: 45, title: "VR/ARを使った最新ヘアシミュレーション", category: "dx" },
  { number: 46, title: "キャッシュレス決済導入で顧客満足度アップ", category: "dx" },
  { number: 47, title: "美容室のための効果的なLINE公式アカウント活用術", category: "dx" },
  { number: 48, title: "顧客管理アプリで実現する究極のパーソナライズ", category: "dx" },
  { number: 49, title: "美容室のためのインスタグラムビジネス活用完全ガイド", category: "dx" },
  { number: 50, title: "電子カルテ導入で施術履歴を完全デジタル化", category: "dx" },
  { number: 51, title: "美容室のためのGoogle ビジネスプロフィール最適化", category: "dx" },
  { number: 52, title: "オンライン物販で新たな収益源を作る方法", category: "dx" },
  { number: 53, title: "美容室のサブスクリプションモデル導入ガイド", category: "dx" },
  { number: 54, title: "デジタルサイネージで店内プロモーション革新", category: "dx" },
  { number: 55, title: "美容室のためのYouTubeチャンネル運営術", category: "dx" },
  { number: 56, title: "クラウド会計ソフトで経理業務を効率化", category: "dx" },
  { number: 57, title: "美容室のセキュリティ対策：顧客情報を守る方法", category: "dx" },
  { number: 58, title: "オンライン教育プラットフォームでスタッフ研修", category: "dx" },
  { number: 59, title: "美容室向けIoTデバイスの活用事例", category: "dx" },
  { number: 60, title: "データドリブン経営で美容室を成長させる方法", category: "dx" },

  // 第4章：総合スキルアップ編（記事61-80）
  { number: 61, title: "トレンドを先取り！2024年注目のヘアスタイル", category: "general" },
  { number: 62, title: "海外研修で学ぶ最新カット技術", category: "general" },
  { number: 63, title: "コンテスト入賞を目指すための練習方法", category: "general" },
  { number: 64, title: "美容師のためのフォトグラフィー技術", category: "general" },
  { number: 65, title: "ヘアメイクアーティストへの道：メイク技術習得法", category: "general" },
  { number: 66, title: "美容師のための英会話：外国人客への対応", category: "general" },
  { number: 67, title: "トップスタイリストになるためのキャリア戦略", category: "general" },
  { number: 68, title: "美容師の健康管理：腰痛・手荒れ対策", category: "general" },
  { number: 69, title: "クリエイティビティを高める発想法とインスピレーション", category: "general" },
  { number: 70, title: "美容師のための心理学：顧客心理を理解する", category: "general" },
  { number: 71, title: "サロンワークと私生活のワークライフバランス", category: "general" },
  { number: 72, title: "美容師のための投資と資産運用入門", category: "general" },
  { number: 73, title: "独立への道：フリーランス美容師という選択", category: "general" },
  { number: 74, title: "美容師のためのプレゼンテーション技術", category: "general" },
  { number: 75, title: "美容業界のSDGs：サステナブルな美容室経営", category: "general" },
  { number: 76, title: "美容師のための栄養学：体調管理と食事", category: "general" },
  { number: 77, title: "セミナー講師になるための話し方とコンテンツ作り", category: "general" },
  { number: 78, title: "美容師のための副業ガイド：収入源の多様化", category: "general" },
  { number: 79, title: "50歳からの美容師人生：セカンドキャリアの選択肢", category: "general" },
  { number: 80, title: "美容師として成功するための習慣と考え方", category: "general" }
];

// 記事のアクセスレベルを決定する関数
function determineAccessLevel(articleNumber) {
  const positionInChapter = ((articleNumber - 1) % 20) + 1;
  if (positionInChapter <= 5) return 'free';
  else if (positionInChapter <= 15) return 'partial';
  else return 'premium';
}

// チャプターIDを取得する関数
function getChapterNumber(articleNumber) {
  return Math.ceil(articleNumber / 20);
}

// 記事のスラッグを生成
function generateSlug(articleNumber) {
  return String(articleNumber).padStart(3, '0');
}

async function generateAndPostArticles() {
  try {
    console.log('🚀 教育記事の生成と投稿を開始します...\n');

    // Gemini APIキーの確認
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEYが設定されていません');
    }

    const generator = new ArticleGeneratorGemini(process.env.GEMINI_API_KEY);

    // チャプター情報を取得
    const { data: chapters, error: chaptersError } = await supabase
      .from('education_chapters')
      .select('*')
      .order('chapter_number');

    if (chaptersError) {
      throw new Error(`チャプター取得エラー: ${chaptersError.message}`);
    }

    console.log(`✅ ${chapters.length}個のチャプターを取得しました\n`);

    // 既存の記事数を確認
    const { count: existingCount } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 既存の記事数: ${existingCount}/80\n`);

    // 記事を生成して投稿
    for (const topic of articleTopics) {
      // 既に存在する記事はスキップ
      const { data: existing } = await supabase
        .from('education_contents')
        .select('id')
        .eq('article_number', topic.number)
        .single();

      if (existing) {
        console.log(`⏭️  記事${topic.number}は既に存在します`);
        continue;
      }

      console.log(`\n📝 記事${topic.number}を生成中: ${topic.title}`);

      try {
        // 記事を生成
        const articleContent = await generator.generateArticle(
          topic.title,
          topic.number
        );

        // チャプターIDを取得
        const chapterNumber = getChapterNumber(topic.number);
        const chapter = chapters.find(c => c.chapter_number === chapterNumber);
        
        if (!chapter) {
          console.error(`❌ チャプター${chapterNumber}が見つかりません`);
          continue;
        }

        // 公開日を設定（順次公開するように日付を調整）
        const publishDate = new Date();
        publishDate.setDate(publishDate.getDate() + Math.floor((topic.number - 1) / 2));

        // データベースに保存
        const educationContent = {
          chapter_id: chapter.id,
          article_number: topic.number,
          title: articleContent.title,
          slug: generateSlug(topic.number),
          content: articleContent.content,
          preview_content: articleContent.preview || articleContent.content.substring(0, 500) + '...',
          excerpt: articleContent.summary || articleContent.content.substring(0, 200),
          is_premium: determineAccessLevel(topic.number) === 'premium',
          access_level: determineAccessLevel(topic.number),
          reading_time: articleContent.readingTime || 7,
          status: publishDate <= new Date() ? 'published' : 'scheduled',
          publish_date: publishDate.toISOString(),
          seo_title: articleContent.seoTitle || articleContent.title,
          seo_description: articleContent.seoDescription || articleContent.summary,
          internal_links: articleContent.internalLinks || []
        };

        const { error } = await supabase
          .from('education_contents')
          .insert(educationContent);

        if (error) {
          console.error(`❌ 記事${topic.number}の投稿エラー:`, error.message);
        } else {
          console.log(`✅ 記事${topic.number}を投稿しました`);
          
          // ローカルファイルも保存
          const articlesDir = path.join(__dirname, '../data/education-articles');
          await fs.mkdir(articlesDir, { recursive: true });
          
          const fileName = `article_${String(topic.number).padStart(3, '0')}.json`;
          await fs.writeFile(
            path.join(articlesDir, fileName),
            JSON.stringify(articleContent, null, 2)
          );
        }

        // API制限を避けるため待機
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        console.error(`❌ 記事${topic.number}の生成エラー:`, error.message);
      }
    }

    // 最終的な記事数を確認
    const { count: finalCount } = await supabase
      .from('education_contents')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 処理完了！`);
    console.log(`📊 データベース内の記事数: ${finalCount}/80`);
    
    if (finalCount >= 80) {
      console.log('\n✨ すべての記事が投稿されました！');
    } else {
      console.log(`\n⚠️  まだ${80 - finalCount}記事が不足しています。`);
    }

  } catch (error) {
    console.error('❌ エラー:', error);
    process.exit(1);
  }
}

// 実行
generateAndPostArticles();