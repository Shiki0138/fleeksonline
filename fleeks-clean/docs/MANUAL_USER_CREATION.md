# 手動ユーザー作成ガイド

Service Role Keyが利用できない場合の代替手順です。

## 方法1: CSVインポート（プロファイルのみ）

1. **CSVファイルを生成**
   ```bash
   npx tsx scripts/generate-users-csv.ts
   ```

2. **Supabaseでプロファイルを作成**
   - Supabase Dashboard → Table Editor → fleeks_profiles
   - "Insert rows" → "Import data from CSV"
   - 生成された `fleeks-users-import.csv` をアップロード

3. **ユーザーへの案内**
   - ユーザーには「パスワードを忘れた場合」機能を使用してもらう
   - https://your-app-url/auth/login → "パスワードを忘れた場合"
   - メールアドレスを入力してパスワード設定リンクを送信

## 方法2: Supabase Dashboard で個別作成

### Authユーザーの作成

1. **Supabase Dashboard** → **Authentication** → **Users**
2. **"Add user"** をクリック
3. 各ユーザーについて：
   - Email: ユーザーのメールアドレス
   - Password: 一時的なパスワード（8文字以上）
   - Auto Confirm User: チェック

### プロファイルの作成

1. **Supabase Dashboard** → **Table Editor** → **fleeks_profiles**
2. **"Insert row"** をクリック
3. 各ユーザーについて：
   - id: AuthユーザーのUUID（Userページからコピー）
   - email: ユーザーのメールアドレス
   - full_name: メールアドレスのローカル部
   - membership_type: "premium"
   - membership_expires_at: 1年後の日付

## 方法3: Service Role Keyを取得して自動実行

### Service Role Keyの確認方法

1. **Supabase Dashboard** にログイン
2. プロジェクトを選択
3. **Settings** → **API** に移動
4. **Project API keys** セクションで：
   - ❌ "anon public" key （現在設定済み）
   - ✅ **"service_role"** key （必要なキー）

### 正しいキーの設定

```bash
# .env.local を編集
SUPABASE_SERVICE_ROLE_KEY=eyJ...（service_roleキー）
```

### 実行

```bash
# 接続テスト
npx tsx scripts/test-supabase-connection.ts

# 一括登録実行
npm run bulk-register
```

## 推奨の手順

1. **まずはCSVインポートでプロファイル作成**（簡単）
2. **各ユーザーに「パスワードを忘れた場合」でパスワード設定を依頼**
3. または **Service Role Keyを取得して自動化**（最も効率的）

## 注意事項

- CSVインポートではAuthユーザーは作成されません
- ユーザーが初回ログイン時に「パスワードを忘れた場合」機能を使う必要があります
- Service Role Keyがあれば全て自動化できます

## 生成されたファイル

- `fleeks-users-import.csv`: プロファイル用CSVファイル
- 合計179名のユーザー（重複除去済み）