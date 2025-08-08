# 動画再生の修正手順

## 問題
- 406エラー: Supabaseへのリクエストが失敗
- 動画一覧は表示されるが、クリックしても再生されない

## 原因
1. **環境変数の不一致**: 本番環境で間違ったSupabase URLが使用されている
2. **APIキーの設定ミス**: Supabaseのanon keyが正しく設定されていない

## 修正手順

### 1. Vercelで環境変数を更新

Vercelダッシュボードで以下の環境変数を更新してください：

```
NEXT_PUBLIC_SUPABASE_URL=https://kbvaekypkszvzrwlbkug.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0
```

### 2. Supabaseで動画データを確認

Supabaseダッシュボードで以下を確認：

1. `fleeks_videos`テーブルに動画データが存在するか
2. 各動画の`youtube_id`フィールドに正しいYouTube IDが設定されているか
   - 例: `dQw4w9WgXcQ` (YouTube URLの`v=`パラメータの値)

### 3. サンプル動画データの追加（必要な場合）

```sql
-- サンプル動画データ
INSERT INTO fleeks_videos (
  title,
  youtube_id,
  description,
  duration,
  is_premium,
  category,
  published_at
) VALUES 
(
  'Instagram集客の基本戦略',
  'dQw4w9WgXcQ', -- 実際のYouTube IDに変更
  'Instagramを使った効果的な集客方法について解説します。',
  600, -- 10分
  false,
  'Instagram集客',
  NOW()
),
(
  '顧客心理を理解する接客術',
  'jNQXAC9IVRw', -- 実際のYouTube IDに変更
  '顧客の心理を理解し、リピート率を上げる接客方法を学びます。',
  900, -- 15分
  true,
  '接客スキル',
  NOW()
);
```

### 4. デプロイ後の確認

1. ブラウザのコンソールでエラーを確認
2. 動画をクリックして`/videos/[id]`ページに遷移することを確認
3. YouTube動画が表示されることを確認

## トラブルシューティング

### コンソールエラーの意味
- **Error 2**: 無効なYouTube ID
- **Error 5**: HTML5プレーヤーエラー
- **Error 100**: 動画が見つからない
- **Error 101/150**: 埋め込み不可の動画

### 追加のデバッグ情報
コンソールに以下のログが出力されます：
- `Video fetch result:` - 動画データの取得結果
- `YouTube Player Error:` - YouTube Player APIのエラー