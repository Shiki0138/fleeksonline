#!/usr/bin/env tsx

/**
 * パスワードリセットルートの修正案
 * 
 * 問題点:
 * 1. 異なるSupabaseクライアントの使用
 * 2. Cookie管理の不整合
 * 3. セッション確立の問題
 * 
 * 解決策:
 * createRouteHandlerClientを使用して、Next.jsのCookie管理と連携
 */

console.log(`
=== パスワードリセットルートの修正案 ===

現在の実装の問題点:
- reset/route.ts: 通常のcreateClientを使用
- callback/route.ts: createRouteHandlerClientを使用（正常動作）

修正が必要なファイル:
/src/app/auth/reset/route.ts

以下の修正を適用してください:
`);

const fixedCode = `import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  
  console.log('[Reset Route] Full URL:', request.url)
  console.log('[Reset Route] Params:', {
    token_hash,
    type,
    error,
    error_code,
    error_description
  })

  // エラーがある場合
  if (error || error_code) {
    console.error('[Reset Route] Error from Supabase:', { error, error_code, error_description })
    return NextResponse.redirect(\`\${requestUrl.origin}/login?error=\${error || error_code}\`)
  }

  if (type === 'recovery' && token_hash) {
    try {
      // createRouteHandlerClientを使用（重要）
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      console.log('[Reset Route] Verifying OTP with token_hash')
      
      // token_hashを使用してOTPを検証
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        token_hash,
        type: 'recovery'
      })
      
      if (verifyError) {
        console.error('[Reset Route] OTP verification error:', verifyError)
        return NextResponse.redirect(\`\${requestUrl.origin}/login?error=invalid_recovery_link\`)
      }
      
      if (data.user && data.session) {
        console.log('[Reset Route] OTP verified successfully, user:', data.user.email)
        console.log('[Reset Route] Session established, redirecting to password update')
        
        // createRouteHandlerClientがセッションを自動的に管理
        // 手動でCookieを設定する必要はない
        return NextResponse.redirect(\`\${requestUrl.origin}/auth/update-password?verified=true\`)
      }
      
      // ユーザーまたはセッションが存在しない場合
      console.error('[Reset Route] No user or session after verification')
      return NextResponse.redirect(\`\${requestUrl.origin}/login?error=verification_failed\`)
      
    } catch (error) {
      console.error('[Reset Route] Exception:', error)
      return NextResponse.redirect(\`\${requestUrl.origin}/login?error=server_error\`)
    }
  }
  
  // recoveryタイプでない、またはtoken_hashがない場合
  console.error('[Reset Route] Invalid recovery request')
  return NextResponse.redirect(\`\${requestUrl.origin}/login?error=invalid_link_type\`)
}`;

console.log(fixedCode);

console.log(`

=== 修正のポイント ===

1. createRouteHandlerClientの使用:
   - @supabase/auth-helpers-nextjsからインポート
   - Next.jsのCookie管理と自動的に連携

2. Cookie管理の削除:
   - 手動でのCookie設定を削除
   - Supabase Auth Helpersが自動的に管理

3. シンプルな実装:
   - token_hashのみを使用（推奨方法）
   - access_token/refresh_tokenのフォールバックを削除

4. エラーハンドリングの改善:
   - より明確なエラーメッセージ
   - 各ステップでのログ出力

=== 動作確認方法 ===

1. 修正を適用
2. npm run dev でサーバーを起動
3. パスワードリセットをリクエスト
4. メールのリンクをクリック
5. /auth/update-password にリダイレクトされることを確認
6. 新しいパスワードを設定できることを確認

=== 追加の確認事項 ===

1. Supabaseダッシュボードで:
   - Email Templates > Reset Password
   - Redirect URLが正しく設定されているか確認
   - {{ .SiteURL }}/auth/reset?token_hash={{ .TokenHash }}&type=recovery

2. 環境変数の確認:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXTAUTH_URL（本番環境では https://fleeks.jp）

この修正により、callback/route.tsと同じパターンで
パスワードリセットが正常に動作するはずです。
`);