# 🚀 今すぐ実行！デプロイ手順

## 📍 現在の状況
- ドメイン: ムームードメイン（fleeks.jp）
- サーバー: エックスサーバー
- アプリ: Next.js（fleeks-clean）

## ✅ 推奨: Vercel + ムームーDNS

### 1️⃣ Vercelデプロイ（5分）
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
npx vercel
```

回答:
- Set up and deploy? → **y**
- Which scope? → **個人アカウント**
- Link to existing? → **n**
- Project name? → **fleeks-app**
- Directory? → **./**
- Override? → **n**

### 2️⃣ 環境変数設定（3分）

1. https://vercel.com/dashboard
2. プロジェクトクリック
3. Settings → Environment Variables
4. 追加:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_SECRET`

### 3️⃣ カスタムドメイン追加（1分）

1. Settings → Domains
2. Add → `app.fleeks.jp`
3. CNAMEの値をコピー

### 4️⃣ ムームーDNS設定（2分）

1. https://muumuu-domain.com/ ログイン
2. **ドメイン操作** → **ムームーDNS**
3. **fleeks.jp** の「変更」
4. カスタム設定:
   ```
   サブドメイン: app
   種別: CNAME
   内容: cname.vercel-dns.com
   ```
5. **セットアップ情報変更**

### 5️⃣ 完了！（10-30分待つ）

SSL証明書が自動発行されたら:
```
https://app.fleeks.jp
```

## 🎉 これで完了！

---

## 📝 もしエックスサーバーで直接ホストする場合

### 静的書き出し版を作成

1. **next.config.js編集**
```javascript
module.exports = {
  output: 'export',
  images: { unoptimized: true }
}
```

2. **ビルド**
```bash
npm run build
npx next export
```

3. **FTPでアップロード**
- 接続先: sv***.xserver.jp
- アップロード先: `/fleeks.jp/public_html/app/`
- アップロード内容: `out`フォルダの中身

でも、**Vercelの方が簡単で高機能です！**