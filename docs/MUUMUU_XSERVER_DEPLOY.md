# 🚀 ムームードメイン × エックスサーバー デプロイ完全ガイド

## 📋 前提条件
- ドメイン管理: ムームードメイン
- サーバー: エックスサーバー
- 目標: app.fleeks.jp でNext.jsアプリを公開

## 🎯 2つの選択肢

### 選択肢1: エックスサーバーで直接ホスト（Node.js対応プランの場合）
### 選択肢2: Vercelでホスト + ムームードメインでDNS設定（推奨）

---

## 📝 選択肢1: エックスサーバーで直接ホスト

### ⚠️ 注意: エックスサーバーのプランを確認
- **スタンダード/プレミアム/ビジネス**: Node.js非対応 ❌
- **VPS/クラウド**: Node.js対応 ✅

### Node.js非対応プランの場合の回避策

#### 1. 静的書き出し（Static Export）に変更

```bash
# fleeks-cleanディレクトリで
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
```

**next.config.jsを編集:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com'],
    unoptimized: true, // 静的書き出し用
  },
  output: 'export', // 静的HTML書き出し
}

module.exports = nextConfig
```

**package.jsonにビルドコマンド追加:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "export": "next build && next export"
  }
}
```

#### 2. ビルド実行
```bash
npm run build
npx next export
# outディレクトリに静的ファイルが生成される
```

#### 3. エックスサーバーにアップロード

**FTP接続情報（エックスサーバー管理画面から取得）:**
- FTPホスト: sv***.xserver.jp
- FTPユーザー: あなたのユーザー名
- FTPパスワード: あなたのパスワード

**アップロード手順:**
1. FTPクライアント（FileZilla等）で接続
2. `/home/ユーザー名/fleeks.jp/public_html/app/` ディレクトリを作成
3. `out`フォルダの中身をすべてアップロード

---

## 🚀 選択肢2: Vercelでホスト（推奨）

### Step 1: Vercelにデプロイ

```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean

# Vercelでデプロイ
npx vercel

# 以下の質問に答える
✔ Set up and deploy? … yes
✔ Which scope? … 個人アカウント選択
✔ Link to existing project? … no
✔ Project name? … fleeks-app
✔ Directory? … ./
✔ Override settings? … no
```

デプロイ完了後、一時的なURL（例: fleeks-app-xxx.vercel.app）が発行されます。

### Step 2: Vercelで環境変数設定

1. https://vercel.com/dashboard にアクセス
2. プロジェクトを選択
3. Settings → Environment Variables
4. 以下を追加:
   ```
   NEXT_PUBLIC_SUPABASE_URL = あなたのSupabase URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY = あなたのAnon Key
   SUPABASE_SERVICE_ROLE_KEY = あなたのService Role Key
   NEXTAUTH_SECRET = あなたのシークレット
   NEXTAUTH_URL = https://app.fleeks.jp
   ```
5. 「Save」をクリック

### Step 3: Vercelでカスタムドメイン設定

1. Settings → Domains
2. 「Add」をクリック
3. `app.fleeks.jp` を入力
4. 「Add」をクリック
5. 表示されるDNS設定をメモ（次で使用）

### Step 4: ムームードメインでDNS設定

1. **ムームードメインにログイン**
   https://muumuu-domain.com/

2. **コントロールパネル → ドメイン操作 → ムームーDNS**

3. **「変更」をクリック**

4. **カスタム設定を追加**
   ```
   サブドメイン: app
   種別: CNAME
   内容: cname.vercel-dns.com
   優先度: （空欄でOK）
   ```

5. **「セットアップ情報変更」をクリック**

### Step 5: SSL証明書の自動発行を待つ

- Vercelが自動的にSSL証明書を発行（通常10-30分）
- https://app.fleeks.jp でアクセス可能に

---

## 🔧 エックスサーバーでサブディレクトリリダイレクト設定（オプション）

fleeks.jp/app → app.fleeks.jp へのリダイレクトを設定する場合:

### .htaccessファイルを作成
```apache
# /home/ユーザー名/fleeks.jp/public_html/.htaccess

RewriteEngine On
RewriteCond %{HTTP_HOST} ^fleeks\.jp$ [NC]
RewriteRule ^app/(.*)$ https://app.fleeks.jp/$1 [R=301,L]
```

---

## 📊 どちらを選ぶべきか？

### Vercel（選択肢2）を推奨する理由:

1. **簡単** - Node.jsの設定不要
2. **高速** - CDNで世界中から高速アクセス
3. **自動デプロイ** - GitHubと連携で自動更新
4. **無料** - 個人利用なら無料枠で十分
5. **SSL自動** - 証明書の更新も自動

### エックスサーバー直接の場合:
- 静的サイトのみ対応（APIルート使用不可）
- 手動アップロードが必要
- Node.js VPSプランは月額3,000円〜

---

## 🎯 推奨手順まとめ

1. **Vercelでデプロイ**（5分）
2. **環境変数設定**（3分）
3. **ムームーDNSでCNAME設定**（2分）
4. **SSL発行を待つ**（10-30分）

合計: 約30分で https://app.fleeks.jp が利用可能に！

## ❓ トラブルシューティング

### DNS反映が遅い場合
- 最大48時間かかる場合があります
- `nslookup app.fleeks.jp` で確認

### SSLエラーの場合
- Vercelダッシュボードで証明書の状態を確認
- 「Refresh」ボタンをクリック

### 表示されない場合
- ブラウザのキャッシュをクリア
- シークレットモードで確認