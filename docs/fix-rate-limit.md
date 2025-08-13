# Supabaseレート制限エラーの解決方法

## 問題
「今日初めてログインしたのに429エラーが出る」

## 原因
- Supabaseプロジェクト全体のレート制限に達している
- 同一IPアドレスからの複数の試行がカウントされている
- 開発環境での頻繁なテストによる累積

## 即時解決策

### 方法1: Supabaseダッシュボードでレート制限を調整

1. [Supabase Dashboard](https://app.supabase.com)にログイン
2. プロジェクトを選択
3. **Settings** → **Auth** → **Rate Limits**
4. 以下の値を一時的に増やす：
   - `Token refresh attempts per hour`: 30 → 100
   - `Email+Password logins per hour`: 30 → 100

### 方法2: 開発環境専用ログイン（実装済み）

レート制限を回避するため、開発環境専用のログインページを用意しました：

```
http://localhost:3000/auth/dev-login
```

このページから管理者としてログインできます（開発環境のみ）。

### 方法3: Supabase CLIでの直接アクセス

```bash
# Supabase CLIのインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトのリンク
supabase link --project-ref kbvaekypkszvzrwlbkug

# データベースに直接アクセス
supabase db remote
```

### 方法4: 別のIPアドレスから試行

- VPNを使用
- モバイルホットスポット経由
- 別のネットワークから接続

## 恒久的な対策

1. **レート制限の監視**
   - Supabaseダッシュボードで定期的に確認
   - アラートを設定

2. **認証フローの最適化**
   - セッションの再利用
   - 不要な認証試行を避ける
   - エラー時の適切なバックオフ

3. **プランのアップグレード検討**
   - 無料プランの制限: 30回/時間
   - Proプラン: 制限緩和可能

## manifest.jsonエラーの修正

vercel.jsonに以下を追加済み：
```json
"headers": [
  {
    "source": "/manifest.json",
    "headers": [
      {
        "key": "Content-Type",
        "value": "application/manifest+json; charset=utf-8"
      }
    ]
  }
]
```

デプロイ後に反映されます。