# 🔧 環境変数設定詳細ガイド

## 🎯 設定優先順位

### 🔴 **最優先（動作に必須）**
これらがないとアプリが起動しません。

### 🟡 **推奨（機能充実）**
AI機能やアナリティクスに必要。

### 🟢 **オプション（拡張機能）**
高度な機能を使う場合のみ。

---

## 🔴 1. Supabase設定（必須）

### 手順:
1. [Supabase](https://app.supabase.com) にアクセス
2. 「New Project」をクリック
3. Organization選択 → プロジェクト名入力 → パスワード設定
4. リージョンは「Northeast Asia (Tokyo)」を選択
5. 作成完了後、Project Settings > API へ移動

### 取得する値:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 📋 データベーススキーマ適用:
```bash
# Supabase CLIインストール
npm install -g supabase

# プロジェクトと接続
supabase link --project-ref your-project-id

# スキーマ適用
supabase db push
```

---

## 🔴 2. Square決済設定（必須）

### 手順:
1. [Square Developer](https://developer.squareup.com) にアクセス
2. 「Get Started」→ アカウント作成
3. 「Create App」→ アプリ名入力
4. Sandbox環境でテスト

### 取得する値:
```env
SQUARE_ACCESS_TOKEN=EAAAEOuLZGXXXXXXXX
SQUARE_LOCATION_ID=L123456789
SQUARE_ENVIRONMENT=sandbox
SQUARE_WEBHOOK_SIGNATURE_KEY=webhook-signature-key
```

### 📱 サブスクリプション設定:
1. Square Dashboard > Subscriptions
2. 「Create Plan」
3. 名前: "美容サロン月額プラン"
4. 金額: ¥7,980
5. 請求頻度: 月次

---

## 🟡 3. AI機能設定（推奨）

### Hugging Face（無料）:
1. [Hugging Face](https://huggingface.co) でアカウント作成
2. Profile > Settings > Access Tokens
3. 「New token」→ Read権限で作成

```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxx
```

### OpenAI（オプション）:
高度なAI機能用。月$5程度の従量課金。
```env
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxx
```

---

## 🟡 4. Google Analytics設定（推奨）

### 手順:
1. [Google Analytics](https://analytics.google.com) にアクセス
2. 「測定を開始」→ アカウント作成
3. プロパティ作成 → 業種「美容・フィットネス」
4. データストリーム設定 → ウェブ
5. 測定IDをコピー

```env
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🟢 5. YouTube API（オプション）

動画メタデータ自動取得用。

### 手順:
1. [Google Cloud Console](https://console.cloud.google.com)
2. 新しいプロジェクト作成
3. YouTube Data API v3を有効化
4. 認証情報 > APIキー作成

```env
YOUTUBE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🟢 6. メール設定（オプション）

通知メール送信用。Gmailの場合:

### 手順:
1. Googleアカウント > セキュリティ
2. 2段階認証を有効化
3. アプリパスワード生成

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🔒 自動生成される値

以下は自動生成されるため設定不要:

```env
JWT_SECRET=（自動生成）
ENCRYPTION_KEY=（自動生成）
BIOMETRIC_ENCRYPTION_KEY=（自動生成）
```

---

## ✅ 設定確認

### 自動セットアップスクリプト実行:
```bash
node scripts/setup-env.js
```

### 設定値テスト:
```bash
npm run test:env
```

### 開発サーバー起動:
```bash
npm run dev
```

---

## 🚨 よくあるエラーと解決方法

### Supabaseエラー:
```
Error: Invalid API key
```
**解決**: ANON_KEYとSERVICE_ROLE_KEYを確認

### Square決済エラー:
```
Error: Location not found
```
**解決**: LOCATION_IDが正しいか確認

### AI APIエラー:
```
Error: Invalid HuggingFace token
```
**解決**: APIキーの権限を確認（Read権限必要）

---

## 📞 サポート

設定でお困りの場合:
- GitHub Issues: 技術的な問題
- Discord: リアルタイムサポート
- メール: support@fleeks.beauty

---

## 🎉 完了！

すべて設定完了後:
```bash
npm run dev
```

http://localhost:3000 でアプリが起動します！