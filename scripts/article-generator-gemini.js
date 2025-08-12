// Gemini APIを使用した教育記事生成システム

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

class ArticleGeneratorGemini {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY);
    // Gemini 1.5 Flashモデルを使用（高速で低コスト）
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    this.promptsPath = path.join(__dirname, '../docs/prompts');
  }

  // 記事生成プロンプトを読み込み
  loadPromptTemplate() {
    const templatePath = path.join(this.promptsPath, 'ARTICLE_CREATION_PROMPT.md');
    return fs.readFileSync(templatePath, 'utf8');
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
4. 具体的な数値を使う場合は、出典を明確にしてください

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
   - タイトル（30文字程度）
   - リード文（150-200文字）
   - 見出し1 + 本文（400-500文字）
   - 見出し2 + 本文（400-500文字）
   - 見出し3 + 本文（400-500文字）
   - まとめ（200-300文字）

【使用可能な情報源】
- 心理学の古典的研究（メラビアンの法則、ハロー効果など）
- 政府機関の統計（厚生労働省、経済産業省など）
- 業界団体の調査（ホットペッパービューティーアカデミーなど）
- 学術研究（大学の公開論文など）

【禁止事項】
- 架空の店舗や人物の事例
- 存在しない統計や研究
- 誇張した数値
- 1,500文字未満の記事

記事を作成してください。`;
  }

  // Gemini APIで記事を生成
  async generateArticle(topic, category) {
    try {
      const prompt = this.generateFactBasedPrompt(topic, category);
      
      console.log('Gemini APIで記事を生成中...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // 生成された記事を解析
      const article = this.parseGeneratedArticle(text, topic, category);
      
      // 文字数チェック
      const charCount = article.content.length;
      if (charCount < 1500) {
        throw new Error(`記事が短すぎます（${charCount}文字）。1,500文字以上必要です。`);
      }
      
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
    
    // リード文を抽出（最初の段落）
    const leadMatch = text.match(/---\n\n(.+?)\n\n##/s);
    const leadText = leadMatch ? leadMatch[1] : '';
    
    // 本文全体
    const content = text;
    
    // キーワードを抽出
    const keywords = this.extractKeywords(text);
    
    return {
      title,
      leadText,
      content,
      keywords,
      category,
      generatedAt: new Date().toISOString()
    };
  }

  // キーワードを抽出（簡易版）
  extractKeywords(text) {
    const commonKeywords = [
      '美容師', '美容室', 'サロン', '接客', 'カウンセリング',
      '技術', 'スキルアップ', '売上', '顧客満足度', 'リピート率'
    ];
    
    const foundKeywords = commonKeywords.filter(keyword => 
      text.includes(keyword)
    );
    
    return foundKeywords.slice(0, 5);
  }

  // バッチ生成（複数記事を一度に生成）
  async generateBatch(topics, category) {
    const articles = [];
    
    for (const topic of topics) {
      try {
        console.log(`\n生成中: ${topic}`);
        const article = await this.generateArticle(topic, category);
        articles.push(article);
        
        // API制限を考慮して待機
        await this.wait(2000);
        
      } catch (error) {
        console.error(`エラー (${topic}):`, error.message);
      }
    }
    
    return articles;
  }

  // 待機処理
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 記事を保存
  saveArticle(article, outputPath) {
    const filename = `article_${Date.now()}.json`;
    const filepath = path.join(outputPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(article, null, 2));
    console.log(`記事を保存しました: ${filepath}`);
    
    return filepath;
  }
}

// 使用例
if (require.main === module) {
  const generator = new ArticleGeneratorGemini();
  
  // テスト生成
  const testTopic = '美容師のための効果的な挨拶とその心理学的効果';
  const testCategory = 'beginner';
  
  generator.generateArticle(testTopic, testCategory)
    .then(article => {
      console.log('\n=== 生成された記事 ===');
      console.log(`タイトル: ${article.title}`);
      console.log(`文字数: ${article.content.length}文字`);
      console.log(`キーワード: ${article.keywords.join(', ')}`);
      console.log('\n--- 内容プレビュー ---');
      console.log(article.content.substring(0, 500) + '...');
      
      // 記事を保存
      const outputPath = path.join(__dirname, '../data/generated-articles');
      if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
      }
      generator.saveArticle(article, outputPath);
    })
    .catch(error => {
      console.error('エラー:', error);
    });
}

module.exports = ArticleGeneratorGemini;