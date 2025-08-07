# 🔐 VercelにSupabase環境変数を追加

## 📋 追加する環境変数

SupabaseのAPI認証情報をVercelに追加します。

### 1. Vercelダッシュボードにアクセス
👉 https://vercel.com/dashboard

### 2. fleeksonlineプロジェクトを選択

### 3. Settings → Environment Variables

### 4. 以下の3つを追加

| 環境変数名 | 値 | Environment |
|------------|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://xxxxx.supabase.co | All ✓ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | eyJhbGc... (anon public key) | All ✓ |
| `SUPABASE_SERVICE_ROLE_KEY` | eyJhbGc... (service_role key) | Production ✓ |

### 追加方法：
1. 「Add New」ボタンをクリック
2. Name: 環境変数名を入力
3. Value: Supabaseから取得した値を貼り付け
4. Environment: 
   - `NEXT_PUBLIC_*` → All Environments
   - `SUPABASE_SERVICE_ROLE_KEY` → Production only
5. 「Save」をクリック

### 5. 再デプロイ

環境変数を追加したら必ず再デプロイ：
- Deploymentsタブ → 最新のデプロイメント → 「...」 → 「Redeploy」

## ✅ チェックリスト

- [ ] NEXT_PUBLIC_SUPABASE_URL を追加
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY を追加
- [ ] SUPABASE_SERVICE_ROLE_KEY を追加（Production only）
- [ ] 再デプロイを実行

## 🎯 確認方法

再デプロイ後、ブラウザのコンソールで：
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// undefined以外が表示されればOK
```

設定が完了したら教えてください！