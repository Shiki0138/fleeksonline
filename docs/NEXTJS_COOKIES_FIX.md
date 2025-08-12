# Next.js 14 Cookies エラー修正

## 問題
```
Error: Dynamic server usage: Page couldn't be rendered statically because it used `cookies`
```

## 原因
Next.js 14のApp RouterのRoute Handlers（`route.ts`）では、`createServerComponentClient`の使用が制限されています。

## 解決策

### 1. Route Handlerでの正しい実装
```typescript
// ❌ 間違い
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
const supabase = createServerComponentClient({ cookies })

// ✅ 正しい
import { createClient } from '@supabase/supabase-js'
export const dynamic = 'force-dynamic'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 2. Server Componentでの実装
Server Components（`page.tsx`など）では引き続き`createServerComponentClient`を使用できます。

## 重要なポイント

1. **Route Handlers** (`route.ts`):
   - `createClient`を使用
   - `export const dynamic = 'force-dynamic'`を追加

2. **Server Components** (`page.tsx`):
   - `createServerComponentClient`を使用可能
   - 認証が必要な場合に有効

3. **環境変数**:
   - `NEXT_PUBLIC_*`の変数のみクライアントサイドで使用可能
   - サーバーサイドでは全ての環境変数が使用可能