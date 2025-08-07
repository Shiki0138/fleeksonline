# 🚀 次の実装計画

## 現在の状態
- ✅ Vercelデプロイ完了
- ✅ カスタムドメイン設定完了（app.fleeks.jp）
- ⏳ 基本的なUIのみ実装済み

## 📋 優先順位別タスク

### 1️⃣ 最優先：環境変数設定（今すぐ）

#### Vercelダッシュボードで設定
1. https://vercel.com/dashboard → fleeksonline → Settings → Environment Variables
2. 以下を追加：

```env
# Supabase（まだない場合は次のステップで作成）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# 認証
NEXTAUTH_URL=https://app.fleeks.jp
NEXTAUTH_SECRET=（32文字以上のランダム文字列）

# 暗号化
ENCRYPTION_KEY=（64文字の16進数）
```

### 2️⃣ Supabaseプロジェクト作成（30分）

#### 手順
1. https://app.supabase.com にアクセス
2. 新規プロジェクト作成
3. 以下のテーブルを作成：

```sql
-- ユーザープロファイル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free',
  membership_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 動画情報
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER,
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 視聴履歴
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  video_id UUID REFERENCES videos(id),
  watched_seconds INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);
```

### 3️⃣ 認証機能実装（1-2時間）

実装するファイル：
- `/src/lib/supabase-client.ts` - Supabaseクライアント設定
- `/src/app/auth/login/page.tsx` - ログインページ改修
- `/src/app/auth/signup/page.tsx` - サインアップページ作成
- `/src/middleware.ts` - 認証ミドルウェア

### 4️⃣ 動画管理機能（2-3時間）

実装内容：
- YouTube動画の登録機能
- 動画一覧表示
- 動画プレイヤーコンポーネント
- 5分制限機能（無料会員）

### 5️⃣ 決済機能（Square）（3-4時間）

必要な設定：
- Square開発者アカウント
- Webhook設定
- 料金プラン設定

## 🎯 今日中に完了すべきこと

1. **環境変数設定**（5分）
2. **Supabaseプロジェクト作成**（30分）
3. **基本的な認証実装**（1時間）

## 📊 1週間の目標

- Day 1-2: 認証システム完成
- Day 3-4: 動画管理・視聴制限
- Day 5-6: 決済統合
- Day 7: テスト・最適化

## 🔧 開発開始コマンド

```bash
# ローカル開発環境起動
cd /Users/leadfive/Desktop/system/031_Fleeks/fleeks-clean
npm run dev

# 別ターミナルでログ確認
tail -f .next/server/app-paths/*
```

## 💡 実装のポイント

1. **段階的実装** - 小さく始めて徐々に機能追加
2. **テスト重視** - 各機能実装後に動作確認
3. **エラーハンドリング** - ユーザーフレンドリーなエラー表示
4. **レスポンシブ対応** - モバイルファーストで設計

## 🚨 注意事項

- 環境変数変更後は必ず再デプロイ
- 本番DBと開発DBは分ける
- APIキーは絶対にコミットしない

準備はいかがですか？どの部分から始めましょうか？