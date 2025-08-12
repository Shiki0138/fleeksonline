// OpenAI APIを使用した教育記事生成システム（事実ベース）

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

class ArticleGeneratorOpenAI {
  constructor(apiKey) {
    this.openai = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY
    });
    this.promptsPath = path.join(__dirname, '../docs/prompts');
  }

  // 事実確認を含むプロンプトを生成
  generateFactBasedPrompt(topic, category) {
    const today = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `
あなたは美容業界で20年以上の経験を持つプロフェッショナルであり、同時に世界的に有名なコピーライター兼デジタルマーケティングの専門家です。

本日は${today}です。

【重要な指示】
1. すべての情報は実在する研究、統計、公開されている事実に基づいてください
2. 架空の店舗名、架空の統計、存在しない研究は使用しないでください
3. 実際の心理学研究、美容業界の公開統計、政府機関のデータを引用してください
4. 具体的な数値を使う場合は、出典を明確にするか、一般的な傾向として述べてください

【記事テーマ】
${topic}

【カテゴリー】
${category}

【ターゲット読者】
- 美容師、エステティシャン、ネイリストなどの美容業界従事者
- 解決したい課題：実践的なスキルアップと売上向上

【執筆要件】
1. 文字数：1,500文字以上2,000文字以内（厳守）
2. リード文：読者の常識を覆す衝撃的な事実から始める（150-200文字）
3. 構成：
   - タイトル（30文字程度、「！」で終わる）
   - リード文（150-200文字）
   - ## 見出し1（疑問形または断定形）+ 本文（400-500文字）
   - ## 見出し2（具体的な方法や理論）+ 本文（400-500文字）  
   - ## 見出し3（実践的なアドバイス）+ 本文（400-500文字）
   - ## まとめ：（タイトル含む）+ 本文（200-300文字）

【使用可能な情報源の例】
- 心理学の古典的研究（メラビアンの法則、ハロー効果、初頭効果など）
- 一般的な統計傾向（「多くの調査で」「一般的に」などの表現を使用）
- 業界の一般的な知識（美容師の基本的な接客マナーなど）
- 科学的に証明された一般原則（笑顔の効果、アイコンタクトの重要性など）

【禁止事項】
- 架空の店舗や人物の具体例
- 存在しない具体的な統計（「87%の美容師が」などの根拠のない数値）
- 誇張した効果の保証
- 1,500文字未満の記事

【文体】
- 「です・ます」調で統一
- 読者に語りかけるような親しみやすい文体
- 専門用語は必要最小限に留め、使う場合は説明を加える

記事を作成してください。マークダウン形式で出力してください。`;
  }

  // OpenAI APIで記事を生成
  async generateArticle(topic, category) {
    try {
      const prompt = this.generateFactBasedPrompt(topic, category);
      
      console.log('OpenAI APIで記事を生成中...');
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "あなたは美容業界の専門家で、SEOに強い記事を書くプロのライターです。事実に基づいた情報のみを使用し、読者の興味を引く記事を作成します。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000
      });
      
      const generatedText = completion.choices[0].message.content;
      
      // 生成された記事を解析
      const article = this.parseGeneratedArticle(generatedText, topic, category);
      
      // 文字数チェック
      const charCount = article.content.length;
      if (charCount < 1500) {
        throw new Error(`記事が短すぎます（${charCount}文字）。1,500文字以上必要です。`);
      }
      
      console.log(`✅ 記事生成完了: ${article.title} (${charCount}文字)`);
      
      return article;
      
    } catch (error) {
      console.error('記事生成エラー:', error);
      throw error;
    }
  }

  // 生成されたテキストから記事要素を抽出
  parseGeneratedArticle(text, topic, category) {
    // タイトルを抽出
    const titleMatch = text.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : topic;
    
    // リード文を抽出
    const sections = text.split(/\n##\s+/);
    const introSection = sections[0];
    const leadMatch = introSection.match(/\n\n(.+?)(?=\n\n|$)/s);
    const leadText = leadMatch ? leadMatch[1].replace(/\n/g, '') : '';
    
    // 本文全体（マークダウンのまま保持）
    const content = text;
    
    // キーワードを抽出
    const keywords = this.extractKeywords(text, category);
    
    return {
      title,
      leadText,
      content,
      keywords,
      category,
      generatedAt: new Date().toISOString()
    };
  }

  // キーワードを抽出
  extractKeywords(text, category) {
    const categoryKeywords = {
      beginner: ['美容師', '接客', '基本', 'スキル', 'コミュニケーション'],
      management: ['経営', '売上', '集客', 'リピート', 'マネジメント'],
      dx: ['デジタル', 'SNS', 'AI', '効率化', 'テクノロジー'],
      general: ['美容業界', 'トレンド', 'キャリア', 'スキルアップ', '成功']
    };
    
    const baseKeywords = categoryKeywords[category] || [];
    const foundKeywords = baseKeywords.filter(keyword => 
      text.includes(keyword)
    );
    
    // テキストから追加のキーワードを抽出
    const additionalKeywords = [];
    if (text.includes('心理')) additionalKeywords.push('心理学');
    if (text.includes('カウンセリング')) additionalKeywords.push('カウンセリング');
    if (text.includes('Instagram') || text.includes('インスタ')) additionalKeywords.push('Instagram');
    
    return [...new Set([...foundKeywords, ...additionalKeywords])].slice(0, 5);
  }

  // 記事を保存
  saveArticle(article, outputPath) {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `article_${article.category}_${timestamp}.json`;
    const filepath = path.join(outputPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(article, null, 2));
    console.log(`記事を保存しました: ${filepath}`);
    
    // マークダウンファイルも保存
    const mdFilename = `article_${article.category}_${timestamp}.md`;
    const mdFilepath = path.join(outputPath, mdFilename);
    fs.writeFileSync(mdFilepath, article.content);
    console.log(`マークダウンを保存しました: ${mdFilepath}`);
    
    return filepath;
  }

  // バッチ生成
  async generateBatch(topics, category, delay = 3000) {
    const articles = [];
    
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      try {
        console.log(`\n[${i + 1}/${topics.length}] 生成中: ${topic}`);
        const article = await this.generateArticle(topic, category);
        articles.push(article);
        
        // API制限を考慮して待機
        if (i < topics.length - 1) {
          console.log(`次の記事まで${delay / 1000}秒待機...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
      } catch (error) {
        console.error(`エラー (${topic}):`, error.message);
      }
    }
    
    return articles;
  }
}

// 記事トピックの例
const sampleTopics = {
  beginner: [
    '美容師のための効果的な挨拶とその心理学的効果',
    'アイコンタクトの重要性と実践的なテクニック',
    '初回カウンセリングで信頼を得る5つのポイント',
    'プロの美容師が実践する聴き方の技術',
    '失敗しない！新人美容師のための接客マナー'
  ],
  management: [
    '美容室の売上を向上させる価格設定の考え方',
    'リピート率90%を実現する顧客管理の方法',
    'スタッフのモチベーションを高める効果的な方法',
    '美容室経営における数字の見方と活用法',
    '小規模サロンが大手に勝つための差別化戦略'
  ],
  dx: [
    'ChatGPTを活用した美容師のための業務効率化',
    'Instagramで集客を成功させる投稿戦略',
    '美容室のためのLINE公式アカウント活用法',
    'デジタルツールで実現する予約管理の最適化',
    'AIを活用したパーソナライズドサービスの提供'
  ],
  general: [
    '美容師としてのキャリアプランの立て方',
    '美容業界のトレンドを読み解く方法',
    'ワークライフバランスを保つ美容師の働き方',
    '美容師のためのストレス管理とメンタルケア',
    '独立開業を成功させるための準備と心構え'
  ]
};

// 使用例
if (require.main === module) {
  // APIキーが設定されているか確認
  if (!process.env.OPENAI_API_KEY) {
    console.error('エラー: OPENAI_API_KEYが設定されていません');
    console.log('以下のコマンドでAPIキーを設定してください:');
    console.log('export OPENAI_API_KEY="your-api-key-here"');
    process.exit(1);
  }
  
  const generator = new ArticleGeneratorOpenAI();
  
  // コマンドライン引数を解析
  const args = process.argv.slice(2);
  const command = args[0] || 'single';
  
  switch (command) {
    case 'single':
      // 単一記事の生成
      const topic = args[1] || sampleTopics.beginner[0];
      const category = args[2] || 'beginner';
      
      generator.generateArticle(topic, category)
        .then(article => {
          console.log('\n=== 生成された記事 ===');
          console.log(`タイトル: ${article.title}`);
          console.log(`文字数: ${article.content.length}文字`);
          console.log(`キーワード: ${article.keywords.join(', ')}`);
          
          const outputPath = path.join(__dirname, '../data/generated-articles');
          generator.saveArticle(article, outputPath);
        })
        .catch(error => {
          console.error('エラー:', error);
        });
      break;
      
    case 'batch':
      // バッチ生成
      const batchCategory = args[1] || 'beginner';
      const topics = sampleTopics[batchCategory] || sampleTopics.beginner;
      
      console.log(`${batchCategory}カテゴリーの記事を${topics.length}本生成します`);
      
      generator.generateBatch(topics.slice(0, 2), batchCategory) // まず2記事でテスト
        .then(articles => {
          console.log(`\n✅ ${articles.length}本の記事を生成しました`);
          
          const outputPath = path.join(__dirname, '../data/generated-articles');
          articles.forEach(article => {
            generator.saveArticle(article, outputPath);
          });
        })
        .catch(error => {
          console.error('エラー:', error);
        });
      break;
      
    default:
      console.log('使用方法:');
      console.log('  node article-generator-openai.js single [topic] [category]  - 単一記事を生成');
      console.log('  node article-generator-openai.js batch [category]           - カテゴリーの記事をバッチ生成');
      console.log('\nカテゴリー: beginner, management, dx, general');
  }
}

module.exports = ArticleGeneratorOpenAI;