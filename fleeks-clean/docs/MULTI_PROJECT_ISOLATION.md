# 複数プロジェクトでのアカウント分離方法

## 現在の問題
- 同じSupabaseインスタンスで複数プロジェクトを運用
- beauty_usersテーブルを共有
- FLEEKSで登録したユーザーが他プロジェクトにもログインできる可能性

## 解決策

### 1. 🎯 推奨：アプリケーション側でのプロジェクト識別（実装済み）

現在の実装で既に対策済み：
- `fleeks_profiles`テーブルでFLEEKSユーザーのみ管理
- ログイン時に`fleeks_profiles`の存在チェック
- プロファイルがない場合はアクセス拒否

**追加の強化策：**

```typescript
// src/app/auth/login/page.tsx に追加
const handleLogin = async (e: React.FormEvent) => {
  // ... 既存のログイン処理 ...
  
  // FLEEKSプロファイルの存在確認
  const { data: profileData, error: profileError } = await supabase
    .from('fleeks_profiles')
    .select('*')
    .eq('id', data.user.id)
    .single()
  
  if (!profileData) {
    // FLEEKSのプロファイルがない = 他プロジェクトのユーザー
    await supabase.auth.signOut()
    setError('このアカウントはFLEEKSでは使用できません')
    return
  }
}
```

### 2. 🔐 RLS（Row Level Security）による強化

```sql
-- fleeks_profilesテーブルのRLSポリシー
ALTER TABLE fleeks_profiles ENABLE ROW LEVEL SECURITY;

-- FLEEKSユーザーのみアクセス可能
CREATE POLICY "fleeks_users_only" ON fleeks_profiles
  FOR ALL 
  TO authenticated
  USING (auth.uid() = id);

-- fleeks_videosテーブルも同様に保護
ALTER TABLE fleeks_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fleeks_members_can_view" ON fleeks_videos
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM fleeks_profiles 
      WHERE fleeks_profiles.id = auth.uid()
    )
  );
```

### 3. 🏷️ プロジェクト識別子の追加

```sql
-- beauty_usersテーブルに app_source カラムを追加（可能であれば）
ALTER TABLE beauty_users 
ADD COLUMN app_source TEXT DEFAULT 'unknown';

-- FLEEKSユーザーには 'fleeks' を設定
UPDATE beauty_users 
SET app_source = 'fleeks'
WHERE id IN (SELECT id FROM fleeks_profiles);
```

### 4. 🛡️ Middleware での完全分離

```typescript
// src/middleware.ts を更新
export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (session) {
    // FLEEKSプロファイルの存在確認
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('id')
      .eq('id', session.user.id)
      .single()
    
    if (!profile) {
      // FLEEKSユーザーでない場合は自動ログアウト
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', req.url))
    }
  }
  
  return res
}
```

### 5. 🚀 カスタムクレームの使用（上級）

Supabaseのカスタムクレームを使用してプロジェクトを識別：

```sql
-- auth.usersのraw_app_meta_dataにプロジェクト情報を追加
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"project": "fleeks"}'::jsonb
WHERE id IN (SELECT id FROM fleeks_profiles);

-- PostgreSQL関数でチェック
CREATE OR REPLACE FUNCTION is_fleeks_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_app_meta_data->>'project' = 'fleeks'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 実装の優先順位

1. **既に実装済み**: fleeks_profilesでの分離 ✅
2. **すぐ実装可能**: RLSポリシー追加 ⭐
3. **推奨**: Middlewareでの二重チェック ⭐
4. **オプション**: カスタムクレーム

## セキュリティのベストプラクティス

1. **多層防御**: 複数の方法を組み合わせる
2. **早期チェック**: ログイン直後に検証
3. **定期監査**: 不正アクセスのログ確認
4. **明確なエラー**: ユーザーに適切なメッセージ表示