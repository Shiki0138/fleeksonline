# YouTube API セットアップガイド

動画の実際の時間を自動取得するためのYouTube Data API v3の設定方法です。

## 🔑 API Key取得手順

### 1. Google Cloud Console にアクセス
https://console.cloud.google.com

### 2. プロジェクトの作成/選択
- 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 3. YouTube Data API v3 を有効化
1. 左メニュー「APIとサービス」→「ライブラリ」
2. 「YouTube Data API v3」を検索
3. 「有効にする」をクリック

### 4. API Key を作成
1. 左メニュー「APIとサービス」→「認証情報」
2. 「認証情報を作成」→「APIキー」
3. 作成されたAPIキーをコピー

### 5. API Key を設定
`.env.local` ファイルに以下を追加：

```bash
YOUTUBE_API_KEY=your_actual_api_key_here
```

## 🚀 動画時間更新の実行

### API Key設定後に実行
```bash
npx tsx scripts/update-video-durations.ts
```

### 実行結果例
```
🎬 YouTube APIを使用して動画時間を更新中...
📹 6本の動画を処理します

🔄 処理中: Vol.29～美容師売上UPセミナー
   YouTube ID: abc123
   現在の時間: 300秒
✅ abc123: PT15M33S → 933秒 (15:33)
✅ 更新完了: 300秒 → 933秒

🎯 更新結果:
✅ 成功: 6本
❌ 失敗: 0本
⏭️ スキップ: 0本
📊 合計: 6本
```

## 📋 注意事項

- **API制限**: 1日10,000リクエストまで（通常は十分）
- **レート制限**: スクリプトは200ms間隔で実行（1秒5リクエスト）
- **無料枠**: 個人利用なら無料で使用可能

## 🔧 トラブルシューティング

### エラー: "API Key not found"
- Google Cloud ConsoleでAPIキーが作成されているか確認
- `.env.local`にYOUTUBE_API_KEYが正しく設定されているか確認

### エラー: "YouTube Data API v3 has not been used"
- Google Cloud ConsoleでYouTube Data API v3が有効化されているか確認

### エラー: "Video not found"
- YouTube IDが正しいか確認
- 動画が公開されているか確認

## 📈 自動化オプション

定期的に動画時間を更新したい場合：

1. **cron job** (Linux/Mac)
2. **GitHub Actions** (自動実行)
3. **管理画面からの手動実行**

設定が完了したら、ダッシュボードの動画カードに実際の動画時間が表示されます。