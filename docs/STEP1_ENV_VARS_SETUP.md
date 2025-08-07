# 📋 ステップ1: 環境変数設定ガイド

## 1️⃣ セキュアなキーの生成

まず、必要なセキュリティキーを生成します。

### NEXTAUTH_SECRET の生成
```bash
# ターミナルで実行
openssl rand -base64 32
```
または
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### ENCRYPTION_KEY の生成
```bash
# ターミナルで実行
openssl rand -hex 32
```
または
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2️⃣ Vercelダッシュボードで設定

### 手順：
1. **Vercelダッシュボードを開く**
   - https://vercel.com/dashboard
   - 「fleeksonline」プロジェクトをクリック

2. **環境変数画面へ移動**
   - 上部メニューの「Settings」をクリック
   - 左サイドバーの「Environment Variables」をクリック

3. **以下の環境変数を追加**

#### 必須の環境変数（今すぐ設定）

| 変数名 | 値 | 環境 |
|--------|-----|------|
| NEXTAUTH_URL | https://app.fleeks.jp | Production |
| NEXTAUTH_SECRET | （上で生成した32文字以上の文字列） | Production |
| ENCRYPTION_KEY | （上で生成した64文字の16進数） | Production |

#### Supabase関連（次のステップで取得）

| 変数名 | 値 | 環境 |
|--------|-----|------|
| NEXT_PUBLIC_SUPABASE_URL | （Supabase作成後に取得） | All |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | （Supabase作成後に取得） | All |
| SUPABASE_SERVICE_ROLE_KEY | （Supabase作成後に取得） | Production |

## 3️⃣ 環境変数の追加方法

1. **「Add New」ボタンをクリック**

2. **各フィールドに入力**
   - Name: 環境変数名（例：NEXTAUTH_SECRET）
   - Value: 生成した値
   - Environment: 
     - Production ✓（本番環境）
     - Preview ✓（プレビュー環境）
     - Development（開発環境、通常は不要）

3. **「Save」をクリック**

## 4️⃣ 設定確認

すべての環境変数を追加したら：

1. 環境変数リストに表示されているか確認
2. 各変数の環境設定が正しいか確認
3. 値が暗号化されて表示されているか確認（●●●●●）

## 5️⃣ 再デプロイ

環境変数を設定した後は、必ず再デプロイが必要です：

### 方法1: Vercelダッシュボードから
1. Deploymentsタブをクリック
2. 最新のデプロイメントの「...」メニュー
3. 「Redeploy」を選択
4. 「Redeploy」ボタンをクリック

### 方法2: コマンドラインから
```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
npx vercel --prod --yes
```

## ✅ チェックリスト

- [ ] NEXTAUTH_SECRET を生成した
- [ ] ENCRYPTION_KEY を生成した
- [ ] NEXTAUTH_URL を設定した（https://app.fleeks.jp）
- [ ] NEXTAUTH_SECRET を設定した
- [ ] ENCRYPTION_KEY を設定した
- [ ] 再デプロイを実行した

## 🎯 次のステップ

環境変数の設定が完了したら、次は：
**ステップ2: Supabaseプロジェクトの作成**

準備ができたら教えてください！