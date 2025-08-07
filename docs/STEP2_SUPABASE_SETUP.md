# 🗄️ ステップ2: Supabaseプロジェクト作成ガイド

## 1️⃣ Supabaseアカウント作成

1. **Supabaseにアクセス**
   👉 https://app.supabase.com

2. **サインアップ（既にアカウントがある場合はログイン）**
   - GitHubアカウントでのサインアップが推奨
   - またはメールアドレスで登録

## 2️⃣ 新規プロジェクト作成

### プロジェクト情報を入力：

1. **Organization**
   - 個人の場合は自分の名前やチーム名

2. **Project name**
   ```
   fleeks-platform
   ```

3. **Database Password**
   - 強力なパスワードを生成（自動生成を使用推奨）
   - ⚠️ このパスワードは必ず保存してください

4. **Region**
   ```
   Northeast Asia (Tokyo)
   ```
   （日本のユーザー向けに最速）

5. **Pricing Plan**
   - Free plan（無料プラン）でOK

6. 「Create new project」をクリック

## 3️⃣ プロジェクト作成を待つ（約2分）

プロジェクトが作成されている間に、次の準備をしましょう。

## 4️⃣ API認証情報の取得

プロジェクトが作成されたら：

1. **左サイドバーの「Settings」をクリック**
2. **「API」タブを選択**
3. **以下の情報をコピー：**

### 必要な認証情報

| 項目 | Vercel環境変数名 | 説明 |
|------|-----------------|------|
| **Project URL** | NEXT_PUBLIC_SUPABASE_URL | https://xxxxx.supabase.co の形式 |
| **anon public** | NEXT_PUBLIC_SUPABASE_ANON_KEY | eyJhbGc... で始まる長い文字列 |
| **service_role** | SUPABASE_SERVICE_ROLE_KEY | eyJhbGc... で始まる長い文字列 |

## 5️⃣ データベーステーブルの作成

### SQL Editorで実行：

1. **左サイドバーの「SQL Editor」をクリック**
2. **「New query」をクリック**
3. **以下のSQLを貼り付けて実行：**

```sql
-- ユーザープロファイルテーブル
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  full_name TEXT,
  membership_type TEXT DEFAULT 'free' CHECK (membership_type IN ('free', 'premium')),
  membership_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 動画情報テーブル
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- 秒単位
  thumbnail_url TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 視聴履歴テーブル
CREATE TABLE watch_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- インデックスの作成
CREATE INDEX idx_profiles_user_id ON profiles(id);
CREATE INDEX idx_videos_youtube_id ON videos(youtube_id);
CREATE INDEX idx_watch_history_user_video ON watch_history(user_id, video_id);

-- Row Level Security (RLS) の有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- プロファイル: ユーザーは自分のプロファイルのみ閲覧・編集可能
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 動画: 全員閲覧可能
CREATE POLICY "Videos are viewable by everyone" ON videos
  FOR SELECT USING (true);

-- 視聴履歴: ユーザーは自分の履歴のみ閲覧・作成・更新可能
CREATE POLICY "Users can view own watch history" ON watch_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watch history" ON watch_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watch history" ON watch_history
  FOR UPDATE USING (auth.uid() = user_id);

-- プロファイル自動作成用のトリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー登録時のトリガー
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. **「Run」ボタンをクリックして実行**

## 6️⃣ 認証設定

1. **左サイドバーの「Authentication」をクリック**
2. **「Providers」タブを選択**
3. **「Email」が有効になっていることを確認**
4. **必要に応じて他のプロバイダー（Google、GitHub等）を有効化**

### Email設定の確認：
- **Enable Email provider**: ON
- **Confirm email**: ON（推奨）
- **Enable email confirmations**: ON

## 7️⃣ Vercelに認証情報を追加

1. **Vercelダッシュボードに戻る**
   👉 https://vercel.com/dashboard → fleeksonline → Settings → Environment Variables

2. **以下の環境変数を追加：**

| 変数名 | 値 | 環境 |
|--------|-----|------|
| NEXT_PUBLIC_SUPABASE_URL | （コピーしたProject URL） | All Environments ✓ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | （コピーしたanon public key） | All Environments ✓ |
| SUPABASE_SERVICE_ROLE_KEY | （コピーしたservice_role key） | Production ✓ |

3. **再デプロイを実行**

## ✅ チェックリスト

- [ ] Supabaseアカウントを作成した
- [ ] プロジェクトを作成した（fleeks-platform）
- [ ] API認証情報をコピーした
- [ ] データベーステーブルを作成した
- [ ] RLS（Row Level Security）を設定した
- [ ] Vercelに認証情報を追加した
- [ ] 再デプロイを実行した

## 🎯 次のステップ

Supabaseの設定が完了したら、次は：
**ステップ3: 認証機能の実装**

準備ができたら教えてください！