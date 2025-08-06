# 📋 Supabase Dashboard テーブル作成ガイド

## ✅ 実装手順

### 1️⃣ **Supabase SQL Editor にアクセス**
```
https://app.supabase.com/project/kbvaekypkszvzrwlbkug/sql/new
```

### 2️⃣ **以下のSQLをコピー&ペースト**

```sql
-- ファイル: /supabase/create-tables.sql の内容をすべてコピー
```

### 3️⃣ **「Run」ボタンをクリック**
- 右下の緑色の「Run」ボタンをクリック
- 実行完了メッセージが表示されれば成功

### 4️⃣ **作成されたテーブルを確認**
- 左サイドバー → Table Editor
- 以下のテーブルが表示されていればOK：
  - ✅ beauty_users
  - ✅ beauty_videos  
  - ✅ beauty_posts
  - ✅ beauty_interactions
  - ✅ beauty_recommendations

### 5️⃣ **サンプルデータを確認**
- beauty_videos テーブルを開く
- 6件のサンプル動画データが入っていることを確認

---

## 🎉 実装完了後の確認

### **アプリで動作確認**

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでアクセス**
   ```
   http://localhost:3001
   ```

3. **以下を確認**
   - 🎬 動画一覧が表示される
   - 🔥 注目の動画セクションにデータが表示される
   - 🔐 Googleログインボタンが動作する

### **Supabase Dashboard で確認**

1. **Authentication → Users**
   - ログインしたユーザーが表示される

2. **Table Editor → beauty_users**
   - ログインユーザーのレコードが作成される

3. **Table Editor → beauty_videos**
   - 6件のサンプル動画が表示される

---

## 🚨 トラブルシューティング

### **エラー: "relation already exists"**
→ すでにテーブルが作成済み。正常です。

### **エラー: "permission denied"**
→ SQL Editorで実行してください（Table Editorではない）

### **動画が表示されない**
→ RLSポリシーを確認：
```sql
SELECT * FROM pg_policies WHERE tablename = 'beauty_videos';
```

### **ログインできない**
→ Authentication → Providers → Google が有効か確認

---

## ✅ 実装完了チェックリスト

- [ ] SQLを実行した
- [ ] テーブルが5個作成された
- [ ] サンプルデータが入った
- [ ] アプリで動画一覧が表示される
- [ ] Googleログインが動作する

すべて✅になれば、実装完了です！