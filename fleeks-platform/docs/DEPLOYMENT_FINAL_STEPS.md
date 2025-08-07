# 🚀 最終デプロイ手順

## ✅ 完了したこと

1. **DNS設定**: X-ServerでCNAMEレコード設定完了
2. **DNS反映**: app.fleeks.jp → cname.vercel-dns.com
3. **SSL証明書**: Vercelが自動発行中（10-30分）

## 📋 残りのタスク

### 1. SSL証明書の発行を待つ（10-30分）

Vercelダッシュボードで確認：
- Settings → Domains
- app.fleeks.jp のステータスが「✓ Valid」になるまで待つ

### 2. fleeks-platformディレクトリをデプロイ

モダンなUIの新バージョンをデプロイしましょう：

```bash
# fleeks-platformディレクトリに移動
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-platform

# Vercelにデプロイ
npx vercel --prod

# プロンプトが出たら:
# - Set up and deploy? → Y
# - Which scope? → 既存のスコープを選択
# - Link to existing project? → Y
# - Project name? → fleeksonline
```

### 3. Supabaseの最終設定

Supabaseダッシュボード → Authentication → URL Configuration：

**Site URL:**
```
https://app.fleeks.jp
```

**Redirect URLs:**
```
https://app.fleeks.jp/auth/callback
https://fleeksonline-*.vercel.app/auth/callback
```

### 4. 動作確認チェックリスト

- [ ] https://app.fleeks.jp にアクセス可能
- [ ] SSL証明書が有効（鍵マーク）
- [ ] ホームページが表示される
- [ ] /auth/signup でアカウント作成
- [ ] メール確認
- [ ] /auth/login でログイン
- [ ] /dashboard にアクセス
- [ ] ログアウト機能

## 🎯 デプロイコマンド（コピペ用）

```bash
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-platform && npx vercel --prod --yes
```

## 🎉 完成イメージ

デプロイが完了すると：
- モダンなAIツール風のUI
- 完全な認証システム
- 美しいダッシュボード
- プロ仕様の学習プラットフォーム

準備ができたらデプロイを実行しましょう！