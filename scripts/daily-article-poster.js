// 教育記事の自動投稿システム

const fs = require('fs');
const path = require('path');
const ArticleLinkManager = require('./article-link-manager');

class DailyArticlePoster {
  constructor() {
    this.articlesPath = path.join(__dirname, '../data/education-articles');
    this.progressPath = path.join(__dirname, '../data/posting-progress.json');
    this.linkManager = new ArticleLinkManager();
    this.progress = this.loadProgress();
  }

  // 進捗状況を読み込み
  loadProgress() {
    try {
      if (fs.existsSync(this.progressPath)) {
        return JSON.parse(fs.readFileSync(this.progressPath, 'utf8'));
      }
    } catch (error) {
      console.error('進捗ファイルの読み込みエラー:', error);
    }
    return {
      currentDay: 1,
      postedArticles: [],
      lastPostDate: null,
      totalPosted: 0
    };
  }

  // 進捗を保存
  saveProgress() {
    try {
      fs.writeFileSync(this.progressPath, JSON.stringify(this.progress, null, 2));
      console.log('進捗を保存しました');
    } catch (error) {
      console.error('進捗の保存エラー:', error);
    }
  }

  // 記事スケジュールを生成
  generateSchedule() {
    const schedule = [];
    const chapters = [
      { name: '初心者編', category: 'beginner', articles: 20 },
      { name: '経営編', category: 'management', articles: 20 },
      { name: 'DX編', category: 'dx', articles: 20 },
      { name: '総合編', category: 'general', articles: 20 }
    ];

    let day = 1;
    chapters.forEach(chapter => {
      for (let i = 0; i < chapter.articles; i += 2) {
        schedule.push({
          day,
          chapter: chapter.name,
          category: chapter.category,
          articles: [
            { index: i + 1, time: '10:00' },
            { index: i + 2, time: '15:00' }
          ]
        });
        day++;
      }
    });

    return schedule;
  }

  // 今日投稿すべき記事を取得
  getTodaysArticles() {
    const schedule = this.generateSchedule();
    const todaySchedule = schedule.find(s => s.day === this.progress.currentDay);
    
    if (!todaySchedule) {
      console.log('全ての記事の投稿が完了しました！');
      return null;
    }

    return todaySchedule;
  }

  // 記事を投稿
  async postArticle(articleData, schedule) {
    const articleId = `article_${String(this.progress.totalPosted + 1).padStart(3, '0')}`;
    
    console.log(`\n=== 記事投稿 ===`);
    console.log(`ID: ${articleId}`);
    console.log(`タイトル: ${articleData.title}`);
    console.log(`カテゴリー: ${schedule.category}`);
    console.log(`投稿時刻: ${new Date().toLocaleString('ja-JP')}`);

    // 記事をリンクマネージャーに登録
    this.linkManager.registerArticle(articleId, {
      title: articleData.title,
      category: schedule.category,
      keywords: articleData.keywords || []
    });

    // 関連記事を提案して内部リンクを追加
    if (this.progress.totalPosted > 0) {
      const suggestions = this.linkManager.suggestRelatedArticles(articleId, 3);
      console.log('\n関連記事の提案:');
      suggestions.forEach(suggestion => {
        console.log(`  - ${suggestion.title} (スコア: ${suggestion.score})`);
        // 自動的に上位2件にリンク
        if (suggestions.indexOf(suggestion) < 2) {
          this.linkManager.addInternalLink(articleId, suggestion.id);
        }
      });

      // 既存記事を更新（新規記事へのリンクを追加）
      this.linkManager.updateExistingArticles(articleId, 3);
    }

    // 記事データを保存
    const articlePath = path.join(this.articlesPath, `${articleId}.json`);
    const fullArticleData = {
      ...articleData,
      id: articleId,
      category: schedule.category,
      postedAt: new Date().toISOString(),
      internalLinks: this.linkManager.linkMap.articles[articleId].outgoingLinks
    };

    fs.writeFileSync(articlePath, JSON.stringify(fullArticleData, null, 2));

    // 進捗を更新
    this.progress.postedArticles.push(articleId);
    this.progress.totalPosted++;
    
    return articleId;
  }

  // 日次投稿処理
  async executeDailyPosting() {
    console.log(`\n========== Day ${this.progress.currentDay} 投稿開始 ==========`);
    
    const todaySchedule = this.getTodaysArticles();
    if (!todaySchedule) return;

    console.log(`章: ${todaySchedule.chapter}`);
    console.log(`予定: ${todaySchedule.articles.length}記事`);

    // 仮の記事データ（実際は記事生成システムから取得）
    const mockArticles = [
      {
        title: `${todaySchedule.chapter} - 記事${todaySchedule.articles[0].index}`,
        content: 'ここに1500文字以上の本文が入ります...',
        keywords: ['美容', todaySchedule.category, 'スキルアップ']
      },
      {
        title: `${todaySchedule.chapter} - 記事${todaySchedule.articles[1].index}`,
        content: 'ここに1500文字以上の本文が入ります...',
        keywords: ['美容', todaySchedule.category, '売上向上']
      }
    ];

    // 各記事を投稿
    for (let i = 0; i < mockArticles.length; i++) {
      const articleId = await this.postArticle(mockArticles[i], todaySchedule);
      console.log(`\n記事 ${articleId} の投稿が完了しました`);
      
      // 次の投稿まで待機（実際の運用では不要）
      if (i < mockArticles.length - 1) {
        console.log('次の投稿まで待機中...');
      }
    }

    // 日次レポート
    this.generateDailyReport();

    // 進捗を更新
    this.progress.currentDay++;
    this.progress.lastPostDate = new Date().toISOString();
    this.saveProgress();

    console.log(`\n========== Day ${this.progress.currentDay - 1} 投稿完了 ==========`);
  }

  // 日次レポート生成
  generateDailyReport() {
    console.log('\n=== 本日の投稿レポート ===');
    console.log(`投稿日: Day ${this.progress.currentDay}`);
    console.log(`総投稿数: ${this.progress.totalPosted}記事`);
    console.log(`進捗率: ${((this.progress.totalPosted / 80) * 100).toFixed(1)}%`);
    
    // 内部リンクの健全性チェック
    this.linkManager.generateLinkReport();
    
    // カテゴリー間リンク分析
    this.linkManager.analyzeCrossLinks();
  }

  // 手動で特定の日の投稿を実行
  async postSpecificDay(day) {
    this.progress.currentDay = day;
    await this.executeDailyPosting();
  }

  // 投稿状況の確認
  checkStatus() {
    console.log('\n=== 投稿状況 ===');
    console.log(`現在の日: Day ${this.progress.currentDay}`);
    console.log(`投稿済み記事数: ${this.progress.totalPosted}`);
    console.log(`残り記事数: ${80 - this.progress.totalPosted}`);
    console.log(`完了予定日: Day 40`);
    console.log(`最終投稿日時: ${this.progress.lastPostDate || 'なし'}`);
    
    // 章ごとの進捗
    const chapters = ['beginner', 'management', 'dx', 'general'];
    chapters.forEach(chapter => {
      const posted = this.linkManager.linkMap.categories[chapter].length;
      console.log(`  ${chapter}: ${posted}/20記事 (${(posted / 20 * 100).toFixed(0)}%)`);
    });
  }
}

// 実行
const poster = new DailyArticlePoster();

// コマンドライン引数で動作を分岐
const command = process.argv[2];

switch (command) {
  case 'post':
    // 今日の記事を投稿
    poster.executeDailyPosting();
    break;
  
  case 'status':
    // 投稿状況を確認
    poster.checkStatus();
    break;
  
  case 'day':
    // 特定の日の投稿を実行
    const day = parseInt(process.argv[3]);
    if (day >= 1 && day <= 40) {
      poster.postSpecificDay(day);
    } else {
      console.error('日数は1-40の範囲で指定してください');
    }
    break;
  
  default:
    console.log('使用方法:');
    console.log('  node daily-article-poster.js post    - 今日の記事を投稿');
    console.log('  node daily-article-poster.js status  - 投稿状況を確認');
    console.log('  node daily-article-poster.js day <n> - 特定の日の投稿を実行');
}

module.exports = DailyArticlePoster;