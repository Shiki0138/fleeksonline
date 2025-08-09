# Vercel Deploy Hook 取得手順

## Deploy Hookとは
GitHubプッシュなしで、APIコールでデプロイをトリガーできる仕組みです。
記事が自動投稿された後、自動的にサイトを更新するために使用します。

## 取得手順

### 1. Vercelダッシュボードにログイン
https://vercel.com/dashboard

### 2. プロジェクトを選択
「fleeksonline」または「fleeks-clean」プロジェクトをクリック

### 3. Settingsタブに移動
上部のタブから「Settings」を選択

### 4. Git設定に移動
左側メニューから「Git」を選択

### 5. Deploy Hooksセクションを探す
ページをスクロールして「Deploy Hooks」セクションを見つける

### 6. 新しいDeploy Hookを作成
1. 「Create Hook」ボタンをクリック
2. 以下を入力：
   - Hook Name: `content-update`
   - Branch: `main`
3. 「Create Hook」をクリック

### 7. URLをコピー
生成されたURL（例：`https://api.vercel.com/v1/integrations/deploy/prj_xxxxx/xxxxx`）をコピー

## 設定方法

### .env.localに追加
```bash
echo "VERCEL_DEPLOY_HOOK=コピーしたURL" >> .env.local
```

### 動作確認
```bash
# 手動でデプロイフックをテスト
curl -X POST コピーしたURL
```

成功すると、Vercelダッシュボードでデプロイが開始されます。

## セキュリティ注意事項

- Deploy Hook URLは秘密情報として扱う
- GitHubに公開しない
- 必要に応じて定期的に再生成する

## トラブルシューティング

### デプロイが開始されない場合
1. URLが正しくコピーされているか確認
2. ブランチ設定が`main`になっているか確認
3. プロジェクトが正しいか確認

### 認証エラーが出る場合
1. Deploy Hookを再生成
2. 新しいURLで再試行

## 自動化の流れ

1. 毎日午前10時：記事2本を自動投稿
2. 投稿成功後30秒待機
3. Deploy Hook APIを呼び出し
4. Vercelが自動的にビルド・デプロイ
5. 最新の記事がサイトに反映

これにより、記事投稿からサイト更新まで完全に自動化されます。