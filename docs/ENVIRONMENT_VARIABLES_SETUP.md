# 🔐 Vercel環境変数設定ガイド

## 必要な環境変数

### 1. Supabase設定（必須）

```env
# Supabaseプロジェクト設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# サービスロールキー（バックエンド処理用）
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 認証設定（必須）

```env
# NextAuth.js設定
NEXTAUTH_URL=https://app.fleeks.jp
NEXTAUTH_SECRET=ランダムな32文字以上の文字列

# 暗号化キー
ENCRYPTION_KEY=ランダムな64文字の16進数文字列
```

### 3. Square決済設定（本番用）

```env
# Square API設定
SQUARE_APPLICATION_ID=sandbox-sq0idb-xxxxxxxxxxxxx
SQUARE_ACCESS_TOKEN=EAAAExxxxxxxxxxxxxxxxxxxxxxxxx
SQUARE_LOCATION_ID=LXXXXXXXXXXXXxx
SQUARE_ENVIRONMENT=production
```

### 4. アプリケーション設定

```env
# アプリURL
NEXT_PUBLIC_APP_URL=https://app.fleeks.jp

# セッション設定
SESSION_TIMEOUT=86400
```

## 🚀 Vercelでの設定手順

### 1. Vercelダッシュボードアクセス
1. https://vercel.com/dashboard にログイン
2. 「fleeksonline」プロジェクトを選択

### 2. 環境変数画面へ
1. 上部メニューの「Settings」をクリック
2. 左サイドバーの「Environment Variables」を選択

### 3. 環境変数の追加
各変数について以下の手順で追加:

1. **Variable Name**: 環境変数名を入力
2. **Value**: 値を入力
3. **Environment**: Production, Preview, Developmentを選択
4. 「Save」をクリック

### 推奨設定パターン

#### Production環境のみ:
- SUPABASE_SERVICE_ROLE_KEY
- SQUARE_ACCESS_TOKEN
- NEXTAUTH_SECRET
- ENCRYPTION_KEY

#### 全環境共通:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_APP_URL

## 🔑 セキュアなキーの生成方法

### NEXTAUTH_SECRET
```bash
# macOS/Linux
openssl rand -base64 32

# またはNode.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ENCRYPTION_KEY
```bash
# macOS/Linux
openssl rand -hex 32

# またはNode.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 📋 Supabase認証情報の取得

### 1. Supabaseダッシュボード
1. https://app.supabase.com にログイン
2. プロジェクトを選択

### 2. API設定
1. 左サイドバーの「Settings」
2. 「API」セクション
3. 以下をコピー:
   - Project URL → NEXT_PUBLIC_SUPABASE_URL
   - anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY
   - service_role → SUPABASE_SERVICE_ROLE_KEY

## ⚠️ セキュリティ注意事項

### してはいけないこと:
- ❌ SERVICE_ROLE_KEYをクライアントサイドで使用
- ❌ 環境変数をGitにコミット
- ❌ 本番キーを開発環境で使用

### すべきこと:
- ✅ 本番・開発で異なるSupabaseプロジェクトを使用
- ✅ 定期的にキーをローテーション
- ✅ 最小限の権限でAPIキーを発行

## 🧪 設定確認方法

### 1. Vercelデプロイ後
```bash
# デプロイログを確認
# Functions タブで環境変数が読み込まれているか確認
```

### 2. ブラウザコンソール
```javascript
// app.fleeks.jpにアクセス後、コンソールで確認
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// undefined以外が表示されればOK
```

### 3. ネットワークタブ
- Supabaseへのリクエストが正常に送信されているか確認
- 401エラーが出ていないか確認

## 🔄 環境変数更新時の注意

1. **再デプロイが必要**
   - 環境変数を変更したら必ず再デプロイ
   - Vercelダッシュボードの「Redeploy」ボタン

2. **キャッシュクリア**
   - ブラウザキャッシュをクリア
   - Vercelのキャッシュも考慮

3. **段階的更新**
   - まずPreview環境でテスト
   - 問題なければProduction環境に適用

## 📊 環境変数チェックリスト

- [ ] NEXT_PUBLIC_SUPABASE_URL設定
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY設定
- [ ] SUPABASE_SERVICE_ROLE_KEY設定
- [ ] NEXTAUTH_URL設定（https://app.fleeks.jp）
- [ ] NEXTAUTH_SECRET生成・設定
- [ ] ENCRYPTION_KEY生成・設定
- [ ] Square API認証情報設定（本番運用時）
- [ ] 再デプロイ実行
- [ ] 動作確認完了

これらの設定が完了すれば、FLEEKSプラットフォームの全機能が利用可能になります！