# 認証エラー防止ガイド

## 問題の概要

ユーザー管理ページで「認証エラー: 再度ログインしてください」というエラーが発生していました。

## 根本原因

1. **不適切な認証方法**: `supabaseClient.auth.getUser(token)` はトークンを直接受け取らない
2. **Authorizationヘッダーの不適切な使用**: Next.js App RouterではCookieベースの認証が推奨される
3. **サーバーサイドとクライアントサイドの認証方法の混在**

## 解決策

### 1. APIルートでの正しい認証方法

```typescript
// ❌ 間違い
const { data: { user }, error } = await supabaseClient.auth.getUser(token)

// ✅ 正しい方法
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const supabase = createServerComponentClient({ cookies })
const { data: { session }, error } = await supabase.auth.getSession()
```

### 2. クライアントサイドのAPI呼び出し

```typescript
// ❌ 間違い
const response = await fetch('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`
  }
})

// ✅ 正しい方法
const response = await fetch('/api/admin/users', {
  credentials: 'include' // Cookieを含める
})
```

## 今後の開発のためのベストプラクティス

### 1. 統一された認証パターンを使用

```typescript
// API ルートのテンプレート
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 認証済みの処理
  } catch (error) {
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

### 2. エラーハンドリングの改善

```typescript
// クライアントサイドのエラーハンドリング
const fetchData = async () => {
  try {
    const response = await fetch('/api/endpoint', {
      credentials: 'include'
    })
    
    if (!response.ok) {
      if (response.status === 401) {
        // 認証エラーの場合はログインページへ
        toast.error('セッションが期限切れです。再度ログインしてください。')
        router.push('/login')
        return
      }
      
      const error = await response.json()
      throw new Error(error.error || 'エラーが発生しました')
    }
    
    const data = await response.json()
    // データ処理
  } catch (error) {
    console.error('Error:', error)
    toast.error('データの取得に失敗しました')
  }
}
```

### 3. 管理者権限の確認

```typescript
// 管理者権限チェックのヘルパー関数
export async function isAdmin(userId: string, userEmail?: string | null) {
  // 特定のメールアドレスは常に管理者
  if (userEmail === 'greenroom51@gmail.com') {
    return true
  }
  
  // プロファイルテーブルでロールを確認
  const { data: profile } = await supabase
    .from('fleeks_profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()
  
  return profile?.role === 'admin'
}
```

### 4. TypeScriptの型定義

```typescript
// API レスポンスの型定義
interface ApiResponse<T> {
  data?: T
  error?: string
  details?: string
}

// 統一されたレスポンス形式
return NextResponse.json<ApiResponse<User[]>>({
  data: users,
  error: null
})
```

### 5. デバッグログの活用

```typescript
// 開発環境でのみデバッグログを出力
if (process.env.NODE_ENV === 'development') {
  console.log('[API] Session check:', {
    hasSession: !!session,
    userId: session?.user?.id,
    userEmail: session?.user?.email
  })
}
```

## チェックリスト

新しいAPIエンドポイントを作成する際は、以下を確認してください：

- [ ] `createServerComponentClient` を使用してセッションを取得
- [ ] クライアント側で `credentials: 'include'` を設定
- [ ] 401エラーの適切なハンドリング
- [ ] エラーメッセージのログ出力
- [ ] TypeScriptの型定義
- [ ] 管理者権限の適切な確認

## 参考リンク

- [Supabase Auth Helpers for Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Next.js App Router Authentication](https://nextjs.org/docs/app/building-your-application/authentication)