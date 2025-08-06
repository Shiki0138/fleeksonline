# 🌐 FLEEKS サブドメイン展開ガイド

## 📋 サブドメインオプション

### 1. **app.fleeks.jp** (推奨)
- 用途：メインアプリケーション
- 例：https://app.fleeks.jp

### 2. **platform.fleeks.jp**
- 用途：学習プラットフォーム
- 例：https://platform.fleeks.jp

### 3. **learn.fleeks.jp**
- 用途：学習特化
- 例：https://learn.fleeks.jp

### 4. **members.fleeks.jp**
- 用途：会員専用エリア
- 例：https://members.fleeks.jp

## 🚀 展開方法

### Option 1: Vercel (推奨)

#### 1. Vercelアカウント作成
```bash
# Vercel CLIインストール
npm i -g vercel
```

#### 2. プロジェクトをVercelにデプロイ
```bash
cd fleeks-clean
vercel
```

#### 3. カスタムドメイン設定
1. Vercelダッシュボード > Settings > Domains
2. `app.fleeks.jp` を追加
3. DNSレコードを設定

#### 必要なDNSレコード
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

### Option 2: Netlify

#### 1. Netlifyにデプロイ
```bash
# ビルド
npm run build

# Netlify CLIでデプロイ
netlify deploy --prod
```

#### 2. カスタムドメイン設定
- Netlifyダッシュボード > Domain settings
- `app.fleeks.jp` を追加

#### 必要なDNSレコード
```
Type: CNAME
Name: app
Value: [your-site].netlify.app
```

### Option 3: 独自サーバー (VPS/Cloud)

#### 1. サーバー準備
```bash
# PM2でNode.jsアプリを管理
npm install -g pm2

# ビルド
npm run build

# 本番環境で起動
pm2 start npm --name "fleeks-app" -- start
```

#### 2. Nginxリバースプロキシ設定
```nginx
server {
    server_name app.fleeks.jp;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 DNS設定手順

### 1. DNSプロバイダーにログイン
- お名前.com
- Route53
- Cloudflare
- その他

### 2. サブドメインレコード追加
```
タイプ: CNAME または A
ホスト名: app (または選んだサブドメイン)
値: デプロイ先のURL/IP
TTL: 3600
```

### 3. SSL証明書
- Vercel/Netlify: 自動設定
- 独自サーバー: Let's Encrypt推奨

## 🔧 環境変数設定

### Vercelの場合
```bash
# Vercel CLIで設定
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 本番環境用.env.production
```env
NEXT_PUBLIC_APP_URL=https://app.fleeks.jp
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXTAUTH_URL=https://app.fleeks.jp
```

## ⚡ 推奨構成

### 最速でデプロイする方法

1. **Vercelを使用**
   - GitHubリポジトリと連携
   - 自動デプロイ
   - 無料プランで開始可能

2. **サブドメイン: app.fleeks.jp**
   - メインサイトと明確に区別
   - プロフェッショナルな印象

3. **DNSはCloudflare**
   - 高速
   - 無料SSL
   - DDoS保護

## 📊 デプロイチェックリスト

- [ ] プロジェクトのビルド確認 (`npm run build`)
- [ ] 環境変数の設定
- [ ] Supabaseプロジェクトの本番環境準備
- [ ] DNSレコードの追加
- [ ] SSL証明書の確認
- [ ] リダイレクト設定（www有無）

## 🎯 次のステップ

1. Vercelアカウント作成
2. GitHubにプロジェクトをプッシュ
3. Vercelでインポート
4. 環境変数設定
5. カスタムドメイン追加
6. DNS設定

サポートが必要な場合は、各ステップの詳細をお伝えします！