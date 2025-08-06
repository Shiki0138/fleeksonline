# 🚀 5分でデプロイ！クイックガイド

## 📍 現在の状況
- メインサイト: https://fleeks.jp （既存）
- 新アプリ: Next.jsプラットフォーム（デプロイ待ち）

## 🏆 推奨: サブドメイン app.fleeks.jp

### 理由
1. **既存サイトに影響なし**
2. **今すぐデプロイ可能**
3. **管理が簡単**

## 📋 デプロイ手順（5分）

### Step 1: Vercelアカウント作成
```
https://vercel.com/signup
```

### Step 2: デプロイ実行
```bash
cd fleeks-clean
npx vercel

# 質問への回答
✔ Set up and deploy? … yes
✔ Which scope? … 個人アカウント
✔ Link to existing project? … no
✔ Project name? … fleeks-app
✔ Directory? … ./
✔ Override settings? … no
```

### Step 3: 環境変数設定
Vercelダッシュボード > Settings > Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=あなたのURL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのキー
SUPABASE_SERVICE_ROLE_KEY=あなたのキー
NEXTAUTH_SECRET=あなたのシークレット
```

### Step 4: カスタムドメイン追加
Vercelダッシュボード > Settings > Domains
- 追加: `app.fleeks.jp`

### Step 5: DNS設定
fleeks.jpのDNS管理画面で：

```
レコードタイプ: CNAME
ホスト名: app
値: cname.vercel-dns.com
TTL: 3600
```

## ✅ 完了！

数分でSSL付きで公開されます：
```
https://app.fleeks.jp
```

## 🎯 もしサブディレクトリが必要なら...

後から以下の設定でリダイレクト可能：
```
fleeks.jp/app → app.fleeks.jp
```

まずはサブドメインで始めることをお勧めします！