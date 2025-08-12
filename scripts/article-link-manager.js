// 教育記事の内部リンク管理システム

const fs = require('fs');
const path = require('path');

class ArticleLinkManager {
  constructor() {
    this.articlesPath = path.join(__dirname, '../data/articles');
    this.linkMapPath = path.join(__dirname, '../data/article-link-map.json');
    this.linkMap = this.loadLinkMap();
  }

  // リンクマップを読み込み
  loadLinkMap() {
    try {
      if (fs.existsSync(this.linkMapPath)) {
        return JSON.parse(fs.readFileSync(this.linkMapPath, 'utf8'));
      }
    } catch (error) {
      console.error('リンクマップの読み込みエラー:', error);
    }
    return {
      articles: {},
      categories: {
        beginner: [],
        management: [],
        dx: [],
        general: []
      }
    };
  }

  // リンクマップを保存
  saveLinkMap() {
    try {
      fs.writeFileSync(this.linkMapPath, JSON.stringify(this.linkMap, null, 2));
      console.log('リンクマップを保存しました');
    } catch (error) {
      console.error('リンクマップの保存エラー:', error);
    }
  }

  // 新規記事を登録
  registerArticle(articleId, data) {
    this.linkMap.articles[articleId] = {
      id: articleId,
      title: data.title,
      category: data.category,
      keywords: data.keywords || [],
      outgoingLinks: [],
      incomingLinks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // カテゴリー別リストに追加
    if (this.linkMap.categories[data.category]) {
      this.linkMap.categories[data.category].push(articleId);
    }

    this.saveLinkMap();
    console.log(`記事 ${articleId} を登録しました`);
  }

  // 関連記事を提案
  suggestRelatedArticles(articleId, limit = 5) {
    const article = this.linkMap.articles[articleId];
    if (!article) {
      console.error(`記事 ${articleId} が見つかりません`);
      return [];
    }

    const scores = {};
    
    // 全記事をスコアリング
    Object.keys(this.linkMap.articles).forEach(id => {
      if (id === articleId) return;
      
      const candidate = this.linkMap.articles[id];
      let score = 0;

      // 同じカテゴリー: +3点
      if (candidate.category === article.category) {
        score += 3;
      }

      // キーワードの一致: 各+2点
      article.keywords.forEach(keyword => {
        if (candidate.keywords.includes(keyword)) {
          score += 2;
        }
      });

      // 既にリンクしている場合: -5点
      if (article.outgoingLinks.includes(id)) {
        score -= 5;
      }

      // 相互リンクを避ける: -3点
      if (candidate.outgoingLinks.includes(articleId)) {
        score -= 3;
      }

      if (score > 0) {
        scores[id] = score;
      }
    });

    // スコア順にソートして上位を返す
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({
        id,
        title: this.linkMap.articles[id].title,
        category: this.linkMap.articles[id].category,
        score
      }));
  }

  // 内部リンクを追加
  addInternalLink(fromId, toId) {
    const fromArticle = this.linkMap.articles[fromId];
    const toArticle = this.linkMap.articles[toId];

    if (!fromArticle || !toArticle) {
      console.error('記事が見つかりません');
      return false;
    }

    // 重複チェック
    if (fromArticle.outgoingLinks.includes(toId)) {
      console.log('既にリンクが存在します');
      return false;
    }

    // リンクを追加
    fromArticle.outgoingLinks.push(toId);
    toArticle.incomingLinks.push(fromId);
    
    // 更新日時を記録
    fromArticle.updatedAt = new Date().toISOString();
    toArticle.updatedAt = new Date().toISOString();

    this.saveLinkMap();
    console.log(`リンクを追加: ${fromId} → ${toId}`);
    return true;
  }

  // 既存記事に新規記事へのリンクを追加
  updateExistingArticles(newArticleId, maxUpdates = 5) {
    const newArticle = this.linkMap.articles[newArticleId];
    if (!newArticle) {
      console.error(`記事 ${newArticleId} が見つかりません`);
      return;
    }

    const updates = [];
    
    // 関連性の高い既存記事を探す
    Object.keys(this.linkMap.articles).forEach(id => {
      if (id === newArticleId) return;
      
      const article = this.linkMap.articles[id];
      let relevanceScore = 0;

      // 同じカテゴリー
      if (article.category === newArticle.category) {
        relevanceScore += 3;
      }

      // キーワードマッチ
      newArticle.keywords.forEach(keyword => {
        if (article.keywords.includes(keyword)) {
          relevanceScore += 2;
        }
      });

      // 出力リンクが少ない記事を優先
      if (article.outgoingLinks.length < 3) {
        relevanceScore += 1;
      }

      if (relevanceScore > 0) {
        updates.push({ id, score: relevanceScore });
      }
    });

    // スコア順にソートして上位を更新
    updates
      .sort((a, b) => b.score - a.score)
      .slice(0, maxUpdates)
      .forEach(({ id }) => {
        this.addInternalLink(id, newArticleId);
        console.log(`既存記事 ${id} に新規記事 ${newArticleId} へのリンクを追加`);
      });
  }

  // 内部リンクの健全性チェック
  checkLinkHealth() {
    const report = {
      totalArticles: Object.keys(this.linkMap.articles).length,
      orphanArticles: [],
      overLinkedArticles: [],
      brokenLinks: [],
      averageOutgoingLinks: 0,
      averageIncomingLinks: 0
    };

    let totalOutgoing = 0;
    let totalIncoming = 0;

    Object.entries(this.linkMap.articles).forEach(([id, article]) => {
      // 孤立記事（被リンク0）
      if (article.incomingLinks.length === 0) {
        report.orphanArticles.push(id);
      }

      // 過剰リンク記事（出力リンク5以上）
      if (article.outgoingLinks.length >= 5) {
        report.overLinkedArticles.push(id);
      }

      // リンク切れチェック
      article.outgoingLinks.forEach(linkId => {
        if (!this.linkMap.articles[linkId]) {
          report.brokenLinks.push({ from: id, to: linkId });
        }
      });

      totalOutgoing += article.outgoingLinks.length;
      totalIncoming += article.incomingLinks.length;
    });

    report.averageOutgoingLinks = (totalOutgoing / report.totalArticles).toFixed(2);
    report.averageIncomingLinks = (totalIncoming / report.totalArticles).toFixed(2);

    return report;
  }

  // レポート生成
  generateLinkReport() {
    const health = this.checkLinkHealth();
    
    console.log('\n=== 内部リンク健全性レポート ===');
    console.log(`総記事数: ${health.totalArticles}`);
    console.log(`平均出力リンク数: ${health.averageOutgoingLinks}`);
    console.log(`平均被リンク数: ${health.averageIncomingLinks}`);
    console.log(`\n孤立記事: ${health.orphanArticles.length}件`);
    health.orphanArticles.forEach(id => {
      console.log(`  - ${id}: ${this.linkMap.articles[id].title}`);
    });
    console.log(`\n過剰リンク記事: ${health.overLinkedArticles.length}件`);
    health.overLinkedArticles.forEach(id => {
      const article = this.linkMap.articles[id];
      console.log(`  - ${id}: ${article.title} (${article.outgoingLinks.length}リンク)`);
    });
    console.log(`\nリンク切れ: ${health.brokenLinks.length}件`);
    health.brokenLinks.forEach(({ from, to }) => {
      console.log(`  - ${from} → ${to}`);
    });
  }

  // カテゴリー間のリンク分析
  analyzeCrossLinks() {
    const crossLinks = {
      'beginner-management': 0,
      'beginner-dx': 0,
      'beginner-general': 0,
      'management-dx': 0,
      'management-general': 0,
      'dx-general': 0
    };

    Object.values(this.linkMap.articles).forEach(article => {
      article.outgoingLinks.forEach(toId => {
        const toArticle = this.linkMap.articles[toId];
        if (toArticle && article.category !== toArticle.category) {
          const key = [article.category, toArticle.category].sort().join('-');
          if (crossLinks[key] !== undefined) {
            crossLinks[key]++;
          }
        }
      });
    });

    console.log('\n=== カテゴリー間リンク分析 ===');
    Object.entries(crossLinks).forEach(([key, count]) => {
      console.log(`${key}: ${count}リンク`);
    });
  }
}

// 使用例
const manager = new ArticleLinkManager();

// 新規記事を登録
manager.registerArticle('article_001', {
  title: '挨拶の科学で売上30%アップ',
  category: 'beginner',
  keywords: ['挨拶', '接客', '売上向上']
});

// 関連記事を提案
const suggestions = manager.suggestRelatedArticles('article_001');
console.log('\n関連記事の提案:', suggestions);

// 内部リンクを追加
manager.addInternalLink('article_001', 'article_002');

// レポート生成
manager.generateLinkReport();

module.exports = ArticleLinkManager;