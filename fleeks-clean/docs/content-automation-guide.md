# 美容教育コンテンツ自動投稿ガイド

## 概要
毎日2記事ずつ、40日間で80記事を自動投稿するシステムです。

## セットアップ手順

### 1. 必要な環境変数を設定

`.env.local`に以下を追加：
```env
# Supabase管理者キー（ダッシュボードから取得）
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

⚠️ **重要**: サービスロールキーは管理者権限を持つため、絶対に公開しないでください。

### 2. セットアップスクリプトを実行

```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
chmod +x scripts/setup-content-automation.sh
./scripts/setup-content-automation.sh
```

### 3. 動作確認（テスト投稿）

```bash
# 2記事をテスト投稿
node scripts/content-scheduler.js post
```

### 4. 自動投稿の開始

#### 方法1: 通常実行
```bash
node scripts/content-scheduler.js schedule
```

#### 方法2: バックグラウンド実行
```bash
nohup node scripts/content-scheduler.js schedule > content-scheduler.log 2>&1 &
```

#### 方法3: PM2で永続化（推奨）
```bash
# PM2をインストール
npm install -g pm2

# スケジューラーを起動
pm2 start scripts/content-scheduler.js --name content-scheduler -- schedule

# 自動起動設定
pm2 save
pm2 startup
```

## コマンド一覧

### 手動投稿
```bash
node scripts/content-scheduler.js post
```
今すぐ2記事を投稿します。

### 自動投稿開始
```bash
node scripts/content-scheduler.js schedule
```
毎日午前10時に2記事ずつ自動投稿します。

### 進捗確認
```bash
node scripts/content-scheduler.js status
```
現在の投稿進捗を表示します。

### PM2でのモニタリング
```bash
# プロセス状態確認
pm2 status

# ログ確認
pm2 logs content-scheduler

# 停止
pm2 stop content-scheduler

# 再起動
pm2 restart content-scheduler
```

## 投稿スケジュール

- **投稿時刻**: 毎日午前10時
- **投稿数**: 1日2記事
- **期間**: 40日間
- **総記事数**: 80記事

### カテゴリー配分
- 新人向け（beginner）: 20記事
- 経営（management）: 20記事
- DX・AI（dx）: 20記事
- 一般（general）: 20記事

### 有料/無料配分
- 無料記事: 64記事（80%）
- 有料記事: 16記事（20%）

## トラブルシューティング

### 投稿が失敗する場合
1. 環境変数を確認
   ```bash
   echo $SUPABASE_SERVICE_ROLE_KEY
   ```

2. Supabase接続を確認
   ```bash
   node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
   ```

3. ログを確認
   ```bash
   tail -f content-scheduler.log
   ```

### 進捗をリセットしたい場合
```bash
rm scripts/posting-progress.json
```

### 特定の記事から再開したい場合
`scripts/posting-progress.json`を編集：
```json
{
  "lastPostedIndex": 10,  // この値を変更
  "startDate": "2024-01-13T00:00:00.000Z"
}
```

## カスタマイズ

### 投稿時刻を変更
`scripts/content-scheduler.js`の以下の部分を編集：
```javascript
// 毎日午前10時に実行
cron.schedule('0 10 * * *', async () => {
  await dailyPost()
})
```

Cron形式:
- `0 8 * * *`: 毎日午前8時
- `0 14 * * *`: 毎日午後2時
- `0 10,15 * * *`: 毎日午前10時と午後3時

### 1日の投稿数を変更
```javascript
// 投稿する記事を2つ選択
const articlesToPost = contentPlan.articles.slice(nextIndex, nextIndex + 2)
```
この`2`を変更します。

## セキュリティ注意事項

1. **サービスロールキー**は絶対に公開しない
2. **本番環境**では専用のサーバーで実行
3. **ログファイル**に機密情報が含まれないか確認
4. **定期的なバックアップ**を実施

## モニタリング

### 投稿状況の確認
```bash
# Supabaseダッシュボードで確認
# または以下のSQLを実行
SELECT 
  category,
  is_premium,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM blog_posts
GROUP BY category, is_premium
ORDER BY category, is_premium;
```

### 日次レポート
```bash
# 今日投稿された記事
SELECT title, category, is_premium, created_at
FROM blog_posts
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

## 完了後の作業

40日後、全80記事の投稿が完了したら：

1. スケジューラーを停止
   ```bash
   pm2 stop content-scheduler
   pm2 delete content-scheduler
   ```

2. 投稿状況を最終確認
   ```bash
   node scripts/content-scheduler.js status
   ```

3. 次のフェーズの計画
   - ユーザーの反応を分析
   - 人気記事の続編を作成
   - 新しいカテゴリーの追加