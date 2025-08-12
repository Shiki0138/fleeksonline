// Gemini APIを使用した完全自動投稿システム

const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const ArticleLinkManager = require('./article-link-manager');
const ArticleGeneratorGemini = require('./article-generator-gemini');

class AutoPostingWithGemini {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.articlesPath = path.join(this.dataPath, 'education-articles');
    this.progressPath = path.join(this.dataPath, 'auto-posting-progress.json');
    this.configPath = path.join(this.dataPath, 'posting-config.json');
    this.topicsPath = path.join(__dirname, '../data/article-topics.json');
    
    this.linkManager = new ArticleLinkManager();
    this.articleGenerator = new ArticleGeneratorGemini(process.env.GEMINI_API_KEY);
    
    // ディレクトリを作成
    this.ensureDirectories();
    
    // 設定と進捗を読み込み
    this.config = this.loadConfig();
    this.progress = this.loadProgress();
    this.topics = this.loadTopics();
  }

  ensureDirectories() {
    [this.dataPath, this.articlesPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  loadConfig() {
    const defaultConfig = {
      enabled: false,
      startDate: null,
      postTimes: ['10:00', '15:00'],
      totalDays: 40,
      articlesPerDay: 2,
      totalArticles: 80,
      retryAttempts: 3,
      retryDelay: 300000, // 5分
      apiDelay: 5000 // API呼び出し間隔
    };

    try {
      if (fs.existsSync(this.configPath)) {
        return { ...defaultConfig, ...JSON.parse(fs.readFileSync(this.configPath, 'utf8')) };
      }
    } catch (error) {
      console.error('設定ファイルの読み込みエラー:', error);
    }
    
    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  loadProgress() {
    const defaultProgress = {
      currentDay: 0,
      currentChapter: 1,
      articlesPosted: 0,
      postedArticleIds: [],
      lastPostTime: null,
      errors: [],
      completed: false,
      chapterProgress: {
        beginner: 0,
        management: 0,
        dx: 0,
        general: 0
      }
    };

    try {
      if (fs.existsSync(this.progressPath)) {
        return { ...defaultProgress, ...JSON.parse(fs.readFileSync(this.progressPath, 'utf8')) };
      }
    } catch (error) {
      console.error('進捗ファイルの読み込みエラー:', error);
    }
    
    return defaultProgress;
  }

  loadTopics() {
    // 記事トピックのデータ
    const defaultTopics = {
      beginner: [
        '美容師のための効果的な挨拶とその心理学的効果',
        'アイコンタクトの重要性と実践的なテクニック',
        '初回カウンセリングで信頼を得る5つのポイント',
        'プロの美容師が実践する聴き方の技術',
        '失敗しない！新人美容師のための接客マナー',
        'お客様の心を掴む会話術の基本',
        '美容師のための正しい姿勢と立ち振る舞い',
        'クレーム対応の基本と心構え',
        'リピーターを増やす接客の極意',
        '売れる美容師になるための第一歩',
        'シャンプー時の会話で差をつける方法',
        'カット中の沈黙を活かすテクニック',
        'お客様のタイプ別対応法',
        '美容師のためのボディランゲージ入門',
        'プロフェッショナルな印象を与える身だしなみ',
        '効果的な商品提案の基本テクニック',
        'お客様の要望を正確に理解する方法',
        '施術中の気配りポイント完全ガイド',
        'アシスタントから指名を獲得する秘訣',
        '美容師1年目で身につけるべき10のスキル'
      ],
      management: [
        '美容室の売上を向上させる価格設定の考え方',
        'リピート率90%を実現する顧客管理の方法',
        'スタッフのモチベーションを高める効果的な方法',
        '美容室経営における数字の見方と活用法',
        '小規模サロンが大手に勝つための差別化戦略',
        '効果的な在庫管理で利益を最大化する方法',
        'スタッフ教育システムの構築方法',
        '美容室の集客を成功させる基本戦略',
        'キャンセル率を下げる予約管理のコツ',
        '客単価を上げる menu設計の考え方',
        '美容室の固定費を削減する5つの方法',
        'スタッフの離職を防ぐ環境づくり',
        '繁忙期と閑散期の売上平準化戦略',
        '美容室のブランディング基礎知識',
        '効果的なスタッフミーティングの進め方',
        '美容室の財務管理入門',
        '新規出店を成功させるポイント',
        'フランチャイズ vs 独立経営の選び方',
        '美容室M&Aの基礎知識',
        '経営者のためのリーダーシップ論'
      ],
      dx: [
        'ChatGPTを活用した美容師のための業務効率化',
        'Instagramで集客を成功させる投稿戦略',
        '美容室のためのLINE公式アカウント活用法',
        'デジタルツールで実現する予約管理の最適化',
        'AIを活用したパーソナライズドサービスの提供',
        'Google マイビジネスで地域集客を強化する方法',
        'YouTube活用で美容室の認知度を上げる',
        'TikTokで若年層にアプローチする方法',
        '電子カルテ導入のメリットと選び方',
        'POSレジシステムで経営を見える化',
        'オンラインカウンセリングの始め方',
        '美容室のためのSEO対策入門',
        'メールマーケティングの基本と実践',
        'QRコード決済導入のポイント',
        'VRを活用した新しい美容体験の提供',
        '顧客データ分析で売上アップ',
        '美容室のDX推進ロードマップ',
        'セキュリティ対策の基本',
        'クラウドサービス活用術',
        'デジタルサイネージの効果的な使い方'
      ],
      general: [
        '美容師としてのキャリアプランの立て方',
        '美容業界のトレンドを読み解く方法',
        'ワークライフバランスを保つ美容師の働き方',
        '美容師のためのストレス管理とメンタルケア',
        '独立開業を成功させるための準備と心構え',
        '美容師の健康管理完全ガイド',
        'コンテスト入賞を目指すための練習法',
        '海外で活躍する美容師になるには',
        '美容師のための資産形成入門',
        'フリーランス美容師という選択肢',
        '美容師の副業・複業の始め方',
        '美容業界の未来予測と対策',
        '環境に優しい美容室経営',
        '地域貢献する美容室の在り方',
        '美容師のための法律知識',
        '美容師保険の選び方',
        'セミナー講師として活躍する方法',
        '美容師のSNSブランディング',
        '定年のない美容師人生の設計',
        '美容師の社会的役割と使命'
      ]
    };

    try {
      if (fs.existsSync(this.topicsPath)) {
        return JSON.parse(fs.readFileSync(this.topicsPath, 'utf8'));
      }
    } catch (error) {
      console.error('トピックファイルの読み込みエラー:', error);
    }

    // デフォルトトピックを保存
    fs.writeFileSync(this.topicsPath, JSON.stringify(defaultTopics, null, 2));
    return defaultTopics;
  }

  saveConfig(config = this.config) {
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
  }

  saveProgress() {
    fs.writeFileSync(this.progressPath, JSON.stringify(this.progress, null, 2));
  }

  // 自動投稿を開始
  async start() {
    if (this.config.enabled) {
      console.log('自動投稿システムは既に有効です');
      return;
    }

    console.log('\n=== Gemini API 自動投稿システムを開始します ===');
    console.log(`開始日時: ${new Date().toLocaleString('ja-JP')}`);
    console.log(`投稿時間: ${this.config.postTimes.join(', ')}`);
    console.log(`総投稿数: ${this.config.totalArticles}記事（${this.config.totalDays}日間）`);
    console.log(`現在の進捗: ${this.progress.articlesPosted}/${this.config.totalArticles}記事`);

    // 最初の記事をすぐに投稿
    if (this.progress.articlesPosted === 0) {
      console.log('\n初回投稿を実行します...');
      await this.executePosting(0);
    }

    this.config.enabled = true;
    this.config.startDate = new Date().toISOString();
    this.saveConfig();

    this.setupScheduler();
  }

  // スケジューラーをセットアップ
  setupScheduler() {
    // 既存のcronジョブをクリア
    cron.getTasks().forEach(task => task.stop());

    if (!this.config.enabled) return;

    // 各投稿時間にcronジョブを設定
    this.config.postTimes.forEach((time, index) => {
      const [hour, minute] = time.split(':');
      const cronExpression = `${minute} ${hour} * * *`;
      
      cron.schedule(cronExpression, async () => {
        if (this.config.enabled && !this.progress.completed) {
          await this.executePosting(index);
        }
      });
      
      console.log(`Cronジョブを設定: ${time} (${cronExpression})`);
    });

    console.log('\n自動投稿システムが稼働中です。Ctrl+Cで停止してください。');
  }

  // 次のトピックを取得
  getNextTopic() {
    const chapters = ['beginner', 'management', 'dx', 'general'];
    const chapterIndex = Math.floor(this.progress.articlesPosted / 20);
    const currentChapter = chapters[chapterIndex];
    
    if (!currentChapter || !this.topics[currentChapter]) {
      return null;
    }

    const chapterProgress = this.progress.chapterProgress[currentChapter] || 0;
    const topic = this.topics[currentChapter][chapterProgress];
    
    return { topic, chapter: currentChapter };
  }

  // 投稿を実行
  async executePosting(postIndex) {
    console.log(`\n=== 自動投稿実行: ${new Date().toLocaleString('ja-JP')} ===`);
    
    try {
      // 次のトピックを取得
      const topicData = this.getNextTopic();
      if (!topicData) {
        console.log('すべてのトピックが完了しました');
        this.progress.completed = true;
        this.saveProgress();
        return;
      }

      const { topic, chapter } = topicData;
      const currentDay = Math.floor(this.progress.articlesPosted / this.config.articlesPerDay) + 1;
      
      console.log(`Day ${currentDay} - ${chapter}編`);
      console.log(`トピック: ${topic}`);
      console.log(`進捗: ${this.progress.articlesPosted + 1}/${this.config.totalArticles}記事`);

      // 記事を生成
      console.log('\nGemini APIで記事を生成中...');
      const article = await this.articleGenerator.generateArticle(topic, chapter);
      
      // 記事を投稿
      const articleId = await this.postArticle(article);
      
      // 進捗を更新
      this.progress.articlesPosted++;
      this.progress.currentDay = currentDay;
      this.progress.chapterProgress[chapter] = (this.progress.chapterProgress[chapter] || 0) + 1;
      this.progress.lastPostTime = new Date().toISOString();
      this.progress.postedArticleIds.push(articleId);
      
      // 完了チェック
      if (this.progress.articlesPosted >= this.config.totalArticles) {
        this.progress.completed = true;
        console.log('\n🎉 全ての記事の投稿が完了しました！');
        this.generateFinalReport();
        this.stop();
      }
      
      this.saveProgress();
      
      // 次の投稿まで状態を表示
      if (!this.progress.completed) {
        const nextPostTime = this.getNextPostTime();
        console.log(`\n次回投稿予定: ${nextPostTime}`);
      }
      
    } catch (error) {
      console.error('投稿エラー:', error);
      this.progress.errors.push({
        time: new Date().toISOString(),
        error: error.message
      });
      this.saveProgress();
    }
  }

  // 記事を投稿（データベースに保存）
  async postArticle(article) {
    const articleId = `article_${String(this.progress.articlesPosted + 1).padStart(3, '0')}`;
    
    // アクセスレベルを決定
    const accessLevel = this.determineAccessLevel(this.progress.articlesPosted + 1);
    
    // リンクマネージャーに登録
    this.linkManager.registerArticle(articleId, {
      title: article.title,
      category: article.category,
      keywords: article.keywords
    });

    // 関連記事の内部リンク設定
    if (this.progress.articlesPosted > 0) {
      const suggestions = this.linkManager.suggestRelatedArticles(articleId, 3);
      suggestions.slice(0, 2).forEach(suggestion => {
        this.linkManager.addInternalLink(articleId, suggestion.id);
      });
      
      // 既存記事も更新
      this.linkManager.updateExistingArticles(articleId, 3);
    }

    // 記事データを保存（アクセスレベル付き）
    const articlePath = path.join(this.articlesPath, `${articleId}.json`);
    const fullArticleData = {
      ...article,
      id: articleId,
      accessLevel: accessLevel,
      postedAt: new Date().toISOString(),
      internalLinks: this.linkManager.linkMap.articles[articleId]?.outgoingLinks || []
    };

    fs.writeFileSync(articlePath, JSON.stringify(fullArticleData, null, 2));
    
    // マークダウンも保存
    const mdPath = path.join(this.articlesPath, `${articleId}.md`);
    fs.writeFileSync(mdPath, article.content);
    
    console.log(`✅ 記事を投稿しました: ${article.title}`);
    console.log(`   アクセスレベル: ${accessLevel}`);
    console.log(`   保存先: ${articlePath}`);
    
    return articleId;
  }

  // アクセスレベルを決定
  determineAccessLevel(articleNumber) {
    // 各章20記事ずつの配分
    const chapterNumber = Math.ceil(articleNumber / 20);
    const positionInChapter = ((articleNumber - 1) % 20) + 1;
    
    // 各章の最初の5記事は無料
    if (positionInChapter <= 5) {
      return 'free';
    }
    // 6-15記事目は部分公開
    else if (positionInChapter <= 15) {
      return 'partial';
    }
    // 16-20記事目は完全有料
    else {
      return 'premium';
    }
  }

  // 次の投稿時刻を取得
  getNextPostTime() {
    if (!this.config.enabled || this.progress.completed) return null;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 今日の残りの投稿時刻を確認
    for (const time of this.config.postTimes) {
      const [hour, minute] = time.split(':').map(Number);
      const postTime = new Date(today);
      postTime.setHours(hour, minute, 0, 0);
      
      if (postTime > now) {
        return postTime.toLocaleString('ja-JP');
      }
    }
    
    // 明日の最初の投稿時刻
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hour, minute] = this.config.postTimes[0].split(':').map(Number);
    tomorrow.setHours(hour, minute, 0, 0);
    
    return tomorrow.toLocaleString('ja-JP');
  }

  // 最終レポートを生成
  generateFinalReport() {
    const report = {
      総投稿数: this.progress.articlesPosted,
      投稿期間: `${this.config.startDate} 〜 ${new Date().toISOString()}`,
      エラー数: this.progress.errors.length,
      章別投稿数: this.progress.chapterProgress,
      内部リンク統計: this.linkManager.checkLinkHealth()
    };

    const reportPath = path.join(this.dataPath, 'final-report-gemini.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n=== 最終レポート ===');
    console.log(JSON.stringify(report, null, 2));
    
    // 内部リンクレポートも生成
    this.linkManager.generateLinkReport();
  }

  // 停止
  stop() {
    this.config.enabled = false;
    this.saveConfig();
    console.log('\n自動投稿システムを停止しました');
  }

  // ステータス確認
  getStatus() {
    const chapters = ['初心者編', '経営編', 'DX編', '総合編'];
    const currentChapterIndex = Math.floor(this.progress.articlesPosted / 20);
    const currentChapter = chapters[currentChapterIndex] || '完了';
    
    return {
      有効: this.config.enabled,
      進捗: {
        投稿済み: this.progress.articlesPosted,
        総記事数: this.config.totalArticles,
        進捗率: `${((this.progress.articlesPosted / this.config.totalArticles) * 100).toFixed(1)}%`,
        現在の章: currentChapter,
        現在の日: this.progress.currentDay
      },
      次回投稿: this.getNextPostTime(),
      エラー数: this.progress.errors.length,
      最終投稿: this.progress.lastPostTime
    };
  }
}

// エクスポート
module.exports = AutoPostingWithGemini;

// 直接実行時の処理
if (require.main === module) {
  // APIキーチェック
  if (!process.env.GEMINI_API_KEY) {
    console.error('エラー: GEMINI_API_KEYが設定されていません');
    console.log('export GEMINI_API_KEY="your-api-key" を実行してください');
    process.exit(1);
  }
  
  const system = new AutoPostingWithGemini();
  const command = process.argv[2];
  
  switch (command) {
    case 'start':
      system.start().then(() => {
        // プロセスを維持
        process.on('SIGINT', () => {
          console.log('\n停止中...');
          system.stop();
          process.exit(0);
        });
      });
      break;
      
    case 'stop':
      system.stop();
      break;
      
    case 'status':
      console.log(JSON.stringify(system.getStatus(), null, 2));
      break;
      
    case 'test':
      // テスト投稿（1記事のみ）
      system.executePosting(0);
      break;
      
    default:
      console.log('使用方法:');
      console.log('  node auto-posting-with-gemini.js start  - 自動投稿を開始');
      console.log('  node auto-posting-with-gemini.js stop   - 自動投稿を停止');
      console.log('  node auto-posting-with-gemini.js status - ステータス確認');
      console.log('  node auto-posting-with-gemini.js test   - テスト投稿（1記事）');
  }
}