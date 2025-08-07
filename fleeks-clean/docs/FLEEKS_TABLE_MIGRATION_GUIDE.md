# 🚀 FLEEKS テーブル名前空間移行ガイド

## 📋 概要

このプロジェクトは他のシステムと共存するSupabaseプロジェクトを使用しているため、すべてのFLEEKS関連テーブルに `fleeks_` プレフィックスを付けて完全に分離します。

## 🎯 移行対象テーブル

### 既存テーブル → 新テーブル
- `profiles` → `fleeks_profiles`
- `videos` → `fleeks_videos`
- `blog_posts` → `fleeks_blog_posts`
- `blog_generation_logs` → `fleeks_blog_generation_logs`
- `watch_history` → `fleeks_watch_history`
- `video_access_logs` → `fleeks_video_access_logs`

### 参照のみ（変更しない）
- `beauty_users` - 既存システムのテーブル、外部キー参照のみ

## 🛠️ 移行手順

### ステップ1: データベース移行

**Supabase SQL Editorで以下を順番に実行:**

1. **メインマイグレーション**
   ```sql
   -- scripts/fleeks-isolated-migration.sql の内容をコピー＆実行
   ```

2. **Video Access Logsテーブル作成**
   ```sql
   -- scripts/fleeks-video-access-logs.sql の内容をコピー＆実行
   ```

3. **プロファイル同期**
   ```sql
   -- scripts/fleeks-profile-sync.sql の内容をコピー＆実行
   ```

### ステップ2: 既存データの移行（必要な場合）

既存のテーブルにデータがある場合は、以下のスクリプトで移行：

```sql
-- 既存のprofilesデータをfleeks_profilesに移行
INSERT INTO fleeks_profiles (id, username, full_name, membership_type, membership_expires_at, role, created_at, updated_at)
SELECT id, username, full_name, membership_type, membership_expires_at, role, created_at, updated_at
FROM profiles
WHERE NOT EXISTS (SELECT 1 FROM fleeks_profiles WHERE fleeks_profiles.id = profiles.id);

-- 既存のvideosデータをfleeks_videosに移行
INSERT INTO fleeks_videos 
SELECT * FROM videos
WHERE NOT EXISTS (SELECT 1 FROM fleeks_videos WHERE fleeks_videos.id = videos.id);

-- 既存のblog_postsデータをfleeks_blog_postsに移行
INSERT INTO fleeks_blog_posts 
SELECT * FROM blog_posts
WHERE NOT EXISTS (SELECT 1 FROM fleeks_blog_posts WHERE fleeks_blog_posts.id = blog_posts.id);

-- 既存のwatch_historyデータをfleeks_watch_historyに移行
INSERT INTO fleeks_watch_history 
SELECT * FROM watch_history
WHERE NOT EXISTS (SELECT 1 FROM fleeks_watch_history WHERE fleeks_watch_history.id = watch_history.id);
```

### ステップ3: アプリケーションコードの更新

✅ **すでに更新済みのファイル:**

1. **ライブラリ**
   - `/src/lib/supabase-client.ts` - customAuth.getProfile()

2. **管理画面**
   - `/src/app/admin/page.tsx`
   - `/src/app/admin/videos/new/page.tsx`
   - `/src/app/admin/videos/[id]/edit/page.tsx`
   - `/src/app/admin/blog/new/page.tsx`

3. **クライアント画面**
   - `/src/app/dashboard/page.tsx`
   - `/src/app/videos/[id]/page.tsx`

4. **API Routes**
   - `/src/app/api/blog/generate/route.ts`
   - `/src/app/api/videos/[videoId]/history/route.ts`

5. **スクリプト**
   - `/scripts/create-admin.js`

### ステップ4: 検証

以下のクエリで移行結果を確認：

```sql
-- テーブル一覧確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'fleeks_%'
ORDER BY table_name;

-- データ移行確認
SELECT 
  'fleeks_profiles' as table_name, COUNT(*) as count FROM fleeks_profiles
UNION ALL
SELECT 
  'fleeks_videos', COUNT(*) FROM fleeks_videos
UNION ALL
SELECT 
  'fleeks_blog_posts', COUNT(*) FROM fleeks_blog_posts
UNION ALL
SELECT 
  'fleeks_watch_history', COUNT(*) FROM fleeks_watch_history;

-- 管理者ユーザー確認
SELECT 
  bu.email,
  fp.role,
  fp.membership_type
FROM beauty_users bu
JOIN fleeks_profiles fp ON bu.id = fp.id
WHERE bu.email = 'greenroom51@gmail.com';
```

## ⚠️ 注意事項

1. **既存テーブルは触らない**
   - beauty_usersテーブルへの書き込みは行わない
   - 参照（SELECT）のみ許可

2. **外部キー制約**
   - fleeks_profiles.id は beauty_users.id を参照
   - CASCADE DELETEでユーザー削除時に自動削除

3. **RLS関数**
   - `fleeks_get_current_user_id()` - 現在のユーザーID取得
   - `fleeks_is_admin()` - 管理者権限チェック

4. **パフォーマンス**
   - 適切なインデックスが作成済み
   - RLSポリシーでセキュリティを確保

## 🔍 トラブルシューティング

### エラー: "relation 'profiles' does not exist"
→ コードがまだ古いテーブル名を参照している。上記のファイルリストを確認

### エラー: "function fleeks_get_current_user_id() does not exist"
→ fleeks-isolated-migration.sql を実行していない

### エラー: "permission denied for table fleeks_profiles"
→ RLSポリシーが正しく設定されていない。管理者権限で実行

## 🚀 デプロイ後の確認事項

1. ログイン機能が正常に動作するか
2. 動画の再生と視聴制限が機能するか
3. 管理画面でのCRUD操作が可能か
4. ブログ生成機能が動作するか

## 📝 将来の分離に向けて

このfleeks_プレフィックス付きテーブル構造により、将来的に：
- 独立したSupabaseプロジェクトへの移行が容易
- 他システムとの衝突を完全に回避
- データの完全性を保ちながら分離可能