# 🚀 FLEEKS ローカル環境セットアップガイド

## 📋 前提条件
- Node.js 18以上
- npm または yarn
- Supabaseアカウント（無料でOK）

## 🔧 セットアップ手順

### 1. 環境変数の設定

```bash
# .env.localファイルを作成
cp .env.example .env.local
```

### 2. セキュアキーの生成

```bash
# セキュリティキー生成スクリプトを実行
chmod +x scripts/generate-secure-keys.sh
./scripts/generate-secure-keys.sh
```

生成されたキーを`.env.local`にコピーしてください：
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `JWT_SECRET`

### 3. Supabaseプロジェクトの作成

1. [https://app.supabase.com](https://app.supabase.com) にアクセス
2. 新規プロジェクトを作成（名前: `fleeks-local`）
3. プロジェクトのURLとキーを取得して`.env.local`に設定：
   ```
   NEXT_PUBLIC_SUPABASE_URL=あなたのプロジェクトURL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのAnonキー
   SUPABASE_SERVICE_ROLE_KEY=あなたのService Roleキー
   ```

### 4. データベースのセットアップ

Supabaseダッシュボードで：
1. SQL Editorを開く
2. `/docs/SUPABASE_MIGRATION.sql`の内容を全てコピー
3. 実行（Run）をクリック

### 5. 依存関係のインストール

```bash
# プロジェクトのルートディレクトリで
npm install

# または
yarn install
```

### 6. 開発サーバーの起動

```bash
# fleeks-ai-platformディレクトリに移動
cd fleeks-ai-platform

# 開発サーバー起動
npm run dev

# または
yarn dev
```

## 🌐 アクセス方法

ブラウザで以下のURLにアクセス：
```
http://localhost:3000
```

## 🧪 動作確認チェックリスト

### 1. ホームページ
- [ ] ページが正常に表示される
- [ ] デザインが崩れていない

### 2. ログイン機能（/auth/login）
- [ ] ログインページが表示される
- [ ] メール/パスワード入力フォームが動作する
- [ ] Googleログインボタンが表示される

### 3. 認証コールバック
- [ ] `/auth/callback`にアクセスすると認証中画面が表示される

### 4. 動画プレーヤー機能
- [ ] VideoPlayerコンポーネントが動作する
- [ ] 5分制限のカウントダウンが表示される（無料会員）
- [ ] アップグレードモーダルが表示される

## 🔍 トラブルシューティング

### エラー: "Supabase client not initialized"
**解決策**: `.env.local`ファイルにSupabaseの認証情報が正しく設定されているか確認

### エラー: "Module not found"
**解決策**: 
```bash
npm install
# または
rm -rf node_modules package-lock.json
npm install
```

### エラー: "Database error"
**解決策**: Supabaseダッシュボードでテーブルが作成されているか確認

## 📱 テストアカウント

Supabaseダッシュボードで以下のテストユーザーを作成：
```sql
-- Authentication > Users でユーザーを作成後、以下を実行
INSERT INTO users (id, email, full_name, membership_tier) VALUES
('作成したユーザーのID', 'test@example.com', 'テストユーザー', 'free');
```

## 🎥 動画テスト用YouTube ID

以下のYouTube動画IDでテスト可能：
- `dQw4w9WgXcQ` (サンプル動画)

## 📝 確認ポイント

1. **セキュリティ設定**
   - [ ] 環境変数が正しく設定されている
   - [ ] `.env.local`がgitignoreに含まれている

2. **データベース**
   - [ ] 全てのテーブルが作成されている
   - [ ] RLSポリシーが有効になっている

3. **認証フロー**
   - [ ] ログイン/ログアウトが動作する
   - [ ] セッションが保持される

4. **動画制限**
   - [ ] 無料会員は5分で制限される
   - [ ] 有料会員は無制限アクセス可能

## 🚨 重要な注意事項

1. **本番環境では新しいSupabaseプロジェクトを作成してください**
2. **セキュリティキーは定期的に更新してください**
3. **`.env.local`ファイルは絶対にコミットしないでください**

---

何か問題があれば、`/docs`フォルダ内の各種ドキュメントを参照してください。