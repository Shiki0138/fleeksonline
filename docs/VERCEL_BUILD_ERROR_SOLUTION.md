# Vercelビルドエラー解決策

## 問題
前回のコミットで大量の不要ファイルが追加され、ビルドエラーが発生している可能性があります。

## 緊急対応

### 1. Vercelダッシュボードでの対応

1. Vercel Dashboard → Settings → Functions
2. Node.js Version を `18.x` に設定
3. Max Duration を `60` に設定

### 2. 環境変数の確認（既に設定済み）

- `GEMINI_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- その他の必須環境変数

### 3. ビルド設定の確認

Build & Development Settings:
- Framework Preset: `Next.js`
- Build Command: `npm run build` または `next build`
- Output Directory: `.next`

### 4. Root Directoryの確認

もしプロジェクトがサブディレクトリにある場合:
- Settings → General → Root Directory
- 空欄のままにする（ルートディレクトリの場合）

## 次のステップ

1. 現在のビルドログを確認
2. 具体的なエラーメッセージを特定
3. 必要に応じて不要なファイルを削除

## デバッグ用エンドポイント

デプロイ成功後、以下で確認：
- `/api/health` - 環境変数の設定状況
- `/api/build-test` - 詳細なビルド情報