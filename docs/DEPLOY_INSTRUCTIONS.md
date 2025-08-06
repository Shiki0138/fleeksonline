# 🚀 FLEEKS Platform デプロイ手順

## デプロイの準備が完了しました！

以下の手順でVercelにデプロイしてください：

## 1. Supabaseのセットアップ

1. [Supabase](https://app.supabase.com)にアクセス
2. 新しいプロジェクトを作成
3. プロジェクトが作成されたら、以下の情報をメモ：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: `eyJhbGciOiJ...`

## 2. Vercelでのデプロイ

### 方法A: Vercel Webインターフェース（推奨）

1. [Vercel](https://vercel.com)にログイン
2. "Import Project"をクリック
3. GitHubリポジトリを選択またはローカルプロジェクトをアップロード
4. 以下の環境変数を設定：

```
NEXT_PUBLIC_SUPABASE_URL=あなたのSupabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anonキー
NEXT_PUBLIC_APP_NAME=FLEEKS Platform
NEXT_PUBLIC_APP_URL=https://あなたのアプリ名.vercel.app
```

5. "Deploy"をクリック

### 方法B: Vercel CLI

1. ターミナルで以下を実行：

```bash
# プロジェクトディレクトリで
vercel --yes

# 環境変数を設定
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add NEXT_PUBLIC_APP_NAME production
vercel env add NEXT_PUBLIC_APP_URL production

# 本番環境にデプロイ
vercel --prod
```

## 3. Supabaseデータベース設定

Supabaseダッシュボードの"SQL Editor"で以下を実行：

```sql
-- ユーザープロファイル拡張
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  membership_type TEXT DEFAULT 'FREE',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- RLSポリシー
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

## 4. デプロイ後の設定

1. **Supabase認証設定**：
   - Authentication → URL Configuration
   - Site URL: `https://あなたのアプリ名.vercel.app`
   - Redirect URLs: `https://あなたのアプリ名.vercel.app/auth/callback`

2. **動作確認**：
   - デプロイされたURLにアクセス
   - ユーザー登録・ログイン機能をテスト
   - 動画再生機能をテスト（5分制限）

## 5. カスタムドメイン（オプション）

Vercelダッシュボードで：
1. Settings → Domains
2. カスタムドメインを追加
3. DNSレコードを設定

## ⚠️ 重要な注意事項

- **環境変数は必ず設定**してください
- **Supabaseの無料プランの制限**に注意
- **YouTube API**を使用する場合は、Google Cloud ConsoleでAPIキーを取得

## 🎉 デプロイ完了！

デプロイが完了したら、以下をご確認ください：
- ✅ トップページが表示される
- ✅ ユーザー登録ができる
- ✅ ログインができる
- ✅ 動画再生ができる（5分制限確認）

## サポート

問題がある場合は、以下を確認してください：
- Vercelのビルドログ
- ブラウザのコンソールエラー
- Supabaseのログ