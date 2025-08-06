# 🔒 安全な環境変数テンプレート

## ✅ 公開可能な .env.example

```bash
# ===================================
# 1. Supabase設定（必須）
# ===================================
# Supabaseプロジェクトを作成: https://app.supabase.com
# Project Settings > API から取得

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# ===================================
# 2. Square決済設定（保留）
# ===================================
# Square開発者アカウント作成: https://developer.squareup.com
# Sandbox環境の認証情報を使用
# 注：決済機能は保留中

# SQUARE_ACCESS_TOKEN=YOUR_SQUARE_ACCESS_TOKEN
# SQUARE_LOCATION_ID=YOUR_SQUARE_LOCATION_ID
# SQUARE_ENVIRONMENT=sandbox
# SQUARE_WEBHOOK_SIGNATURE_KEY=YOUR_WEBHOOK_SIGNATURE_KEY

# ===================================
# 3. AI設定（一部オプション）
# ===================================
# Hugging Face（無料）: https://huggingface.co/settings/tokens
HUGGINGFACE_API_KEY=YOUR_HUGGINGFACE_API_KEY

# OpenAI（オプション - 高度な機能用）
OPENAI_API_KEY=YOUR_OPENAI_API_KEY

# ===================================
# 4. セキュリティ設定（必須）
# ===================================
# ランダムな32文字の文字列を生成
# 生成方法: openssl rand -base64 32
JWT_SECRET=YOUR_JWT_SECRET_HERE

# WebAuthn設定
WEBAUTHN_RP_NAME=Fleeks Beauty Platform
WEBAUTHN_RP_ID=localhost
WEBAUTHN_ORIGIN=http://localhost:3000

# 暗号化キー（32バイト = 64文字の16進数）
# 生成方法: openssl rand -hex 32
ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY_HERE
BIOMETRIC_ENCRYPTION_KEY=YOUR_BIOMETRIC_ENCRYPTION_KEY_HERE

# ===================================
# 5. DRM設定（オプション）
# ===================================
# 動画保護を強化する場合のみ
DRM_LICENSE_SERVER_URL=
DRM_CERTIFICATE_URL=

# ===================================
# 6. 分析設定（推奨）
# ===================================
# Google Analytics 4: https://analytics.google.com
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX

# ===================================
# 7. アプリ設定（必須）
# ===================================
NEXT_PUBLIC_APP_NAME=Fleeks Beauty Platform
NEXT_PUBLIC_APP_URL=http://localhost:3000
MONTHLY_PRICE=7980
CURRENCY=JPY

# ===================================
# 8. YouTube設定（オプション）
# ===================================
# 動画メタデータ取得用: https://console.cloud.google.com
YOUTUBE_API_KEY=YOUR_YOUTUBE_API_KEY

# ===================================
# 9. Redis設定（オプション）
# ===================================
# キャッシュ高速化用
REDIS_URL=redis://localhost:6379

# ===================================
# 10. メール設定（オプション）
# ===================================
# 通知メール送信用
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=YOUR_SMTP_EMAIL
SMTP_PASS=YOUR_SMTP_PASSWORD
```

## ⚠️ 危険な情報（公開してはいけない）

```bash
# ❌ 実際のSupabaseプロジェクトURL
NEXT_PUBLIC_SUPABASE_URL=https://kbvaekypkszvzrwlbkug.supabase.co

# ❌ 実際の暗号化キー
JWT_SECRET=y5LqsTUARY9lkFM4KvFexK2h+BTVrdEq2OlGp0O8EsEkOLA2yLZfo5mVms/y7TDH7cIL7u5uZ8WuMSCgW5Ta0Q==
ENCRYPTION_KEY=8973124742b882ec8bf42ed46ae95b31da9db91f035895f575c1ca4ccc9030ef
```

## 🛡️ セキュリティ対策

### 1. 新しい暗号化キーの生成
```bash
# 新しいJWT秘密鍵
openssl rand -base64 32

# 新しい暗号化キー
openssl rand -hex 32
```

### 2. Supabase プロジェクトの保護
```bash
# Row Level Security (RLS) の有効化
# API制限の設定
# 不要な権限の削除
```

### 3. 環境別管理
```bash
# 開発環境: .env.local（Git管理外）
# 本番環境: 環境変数で設定
# 共有: .env.example（プレースホルダーのみ）
```

---

**結論**: 現在の設定ファイルは**部分的にリスクがあります**。新しい暗号化キーの生成とSupabaseプロジェクトのセキュリティ強化を推奨します。