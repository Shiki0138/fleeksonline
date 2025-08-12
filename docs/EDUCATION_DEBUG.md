# 教育コンテンツデバッグガイド

## 問題
教育コンテンツページで記事が表示されない

## 確認済み事項

### ✅ データベース
- Supabaseテーブルは正常に作成済み
- 記事データ（1件）は存在する
- 直接クエリでデータ取得可能

### ✅ API設計
- `/api/education/articles`エンドポイント実装済み
- データフォーマットは正しい

## 可能な原因

### 1. 本番環境（Vercel）の問題
- 環境変数が正しく設定されていない可能性
- ビルドエラーが発生している可能性

### 2. クライアント側の問題
- EducationContentListコンポーネントのエラー処理
- APIエンドポイントの呼び出しエラー

## デバッグ手順

### 1. ブラウザのコンソールを確認
1. https://app.fleeks.jp/education にアクセス
2. F12でデベロッパーツールを開く
3. Consoleタブでエラーを確認
4. Networkタブで`/api/education/articles`のレスポンスを確認

### 2. 本番APIを直接確認
```bash
curl https://app.fleeks.jp/api/education/articles
```

### 3. ヘルスチェックを確認
```bash
curl https://app.fleeks.jp/api/health
```

## 修正方法

### 環境変数の確認（Vercel）
必要な環境変数：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### RLSポリシーの確認
```sql
-- 現在のポリシーを確認
SELECT * FROM pg_policies WHERE tablename = 'education_contents';
```