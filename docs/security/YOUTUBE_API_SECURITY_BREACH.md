# 🚨 YouTube APIキー緊急セキュリティ通知

## ⚠️ 重要：APIキーが公開されました

**公開されたAPIキー**: `AIzaSyBTGkMwnlPH_OO_wF4G3i-T0GJayMAR_a8`

このAPIキーはClaude会話ログに記録され、潜在的にセキュリティリスクとなります。

## 🚨 緊急対応手順（必須）

### 1. 即座に既存APIキーを削除
```
1. Google Cloud Console にアクセス: https://console.cloud.google.com/
2. 「APIとサービス」→「認証情報」
3. 該当のAPIキー「AIzaSyBTGkMwnlPH_OO_wF4G3i-T0GJayMAR_a8」を見つける
4. 「削除」をクリックして即座に無効化
```

### 2. 新しいAPIキーを生成
```
1. 「認証情報を作成」→「APIキー」
2. 新しいキーが生成される
3. キーを制限設定:
   - HTTPリファラー: http://localhost:*, https://your-domain.com/*
   - API制限: YouTube Data API v3のみ
```

### 3. 環境変数を更新
```bash
# .env ファイルを更新
YOUTUBE_API_KEY="新しく生成されたAPIキー"
```

## 💰 潜在的影響

### 悪用される可能性
- ✅ **限定的リスク**: YouTube Data API v3は読み取り専用
- ⚠️ **使用量**: 1日10,000リクエストの無料枠が消費される可能性
- ⚠️ **課金**: 制限超過時の追加料金発生の可能性

### 実際の被害予測
- 🔒 **動画削除・変更**: 不可能（読み取り専用API）
- 🔒 **アカウント乗っ取り**: 不可能（OAuth不要のAPI）
- ⚠️ **使用量消費**: 可能（最大$0.05/1000リクエスト）

## ✅ 緊急対応完了後の確認

### 1. APIキーテスト
```bash
# 新しいキーで動作確認
curl "https://www.googleapis.com/youtube/v3/videos?part=snippet&id=dQw4w9WgXcQ&key=新しいAPIキー"
```

### 2. アプリケーション動作確認
```bash
# 管理者でログイン
# YouTube URL入力テスト
# 動画情報自動取得の確認
```

### 3. セキュリティ監視
```bash
# Google Cloud Console で使用量監視
# 異常なアクセスパターンの確認
# 請求アラートの設定
```

## 🛡️ 今後のセキュリティ対策

### 1. APIキー管理ベストプラクティス
```
✅ 環境変数でのみ管理
✅ .gitignore での厳格な除外
✅ 定期的なキーローテーション
✅ 使用量監視とアラート設定
❌ チャットやメールでのキー共有禁止
❌ ソースコードへの直接埋め込み禁止
```

### 2. 監視体制
```
✅ Google Cloud Console での使用量監視
✅ 請求アラートの設定（$5以上で通知）
✅ API使用パターンの定期確認
```

---

**行動要求**: このAPIキーを確認次第、直ちにGoogle Cloud Consoleでの削除と新しいキー生成を実行してください。