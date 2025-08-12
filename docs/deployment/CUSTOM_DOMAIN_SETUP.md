# app.fleeks.jp カスタムドメイン設定ガイド

## 現在の状況

Vercelで`app.fleeks.jp`をカスタムドメインとして設定していますが、正しく動作していません。

## 設定手順

### 1. DNSレコードの設定

お使いのDNSプロバイダー（お名前.com、Cloudflare、Route53など）で以下の設定を行います：

#### オプションA: CNAMEレコード（推奨）
```
タイプ: CNAME
名前: app
値: cname.vercel-dns.com
TTL: 3600
```

#### オプションB: Aレコード
```
タイプ: A
名前: app
値: 76.76.21.21
TTL: 3600
```

### 2. Vercelでの確認

1. Vercelダッシュボードで「Settings」→「Domains」
2. `app.fleeks.jp`の横に✓マークが表示されるまで待つ（DNS伝播に最大48時間かかる場合があります）
3. SSL証明書が自動的に発行されます

### 3. 環境変数の更新

Vercelダッシュボードで以下の環境変数を更新：

```
NEXTAUTH_URL=https://app.fleeks.jp
NEXT_PUBLIC_APP_URL=https://app.fleeks.jp
```

### 4. Supabaseの設定更新

Supabaseダッシュボード → Authentication → URL Configuration：

```
Site URL: https://app.fleeks.jp

Redirect URLs:
- https://app.fleeks.jp/*
- https://fleeksonline.vercel.app/*
- http://localhost:3000/*
```

### 5. vercel.jsonの更新

```json
{
  "version": 2,
  "github": {
    "deploymentEnabled": {
      "main": true
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "https://kbvaekypkszvzrwlbkug.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMDQ5NzksImV4cCI6MjA2NDU4MDk3OX0.5vSllsb13X_iFdEA4MqzDB64bYn90INWhb-0V8_-ia0",
    "NEXT_PUBLIC_APP_NAME": "FLEEKS Platform",
    "NEXT_PUBLIC_APP_URL": "https://app.fleeks.jp",
    "NEXTAUTH_URL": "https://app.fleeks.jp"
  }
}
```

## DNSの確認方法

ターミナルで以下のコマンドを実行：

```bash
# CNAMEレコードの確認
dig app.fleeks.jp CNAME

# Aレコードの確認
dig app.fleeks.jp A

# NSルックアップ
nslookup app.fleeks.jp
```

## トラブルシューティング

### 1. DNSが伝播していない場合
- 最大48時間待つ
- DNSキャッシュをクリア: `sudo dscacheutil -flushcache` (Mac)

### 2. SSL証明書エラー
- Vercelが自動的に証明書を発行するまで待つ
- 手動で再発行: Vercelダッシュボード → Domains → SSL

### 3. リダイレクトループ
- すべての環境変数が`https://app.fleeks.jp`に統一されているか確認
- Supabaseの設定も確認

## 一時的な回避策

DNSの設定が完了するまで、`fleeksonline.vercel.app`を使用して動作確認を行うことをお勧めします。