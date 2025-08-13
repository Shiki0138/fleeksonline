import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 開発環境専用：レート制限を回避する一時的なログイン
export async function POST(request: Request) {
  try {
    const { email, bypassCode } = await request.json()
    
    // 開発環境でのみ動作
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: '本番環境では利用できません' },
        { status: 403 }
      )
    }
    
    // バイパスコードの確認
    if (bypassCode !== 'DEV-BYPASS-2024') {
      return NextResponse.json(
        { error: '無効なバイパスコードです' },
        { status: 401 }
      )
    }
    
    // 管理者メールのみ許可
    if (email !== 'greenroom51@gmail.com') {
      return NextResponse.json(
        { error: '管理者アカウントのみ利用可能です' },
        { status: 403 }
      )
    }
    
    // セッションを手動で作成（開発環境のみ）
    const mockSession = {
      access_token: 'dev-mock-token',
      token_type: 'bearer',
      expires_in: 3600,
      refresh_token: 'dev-mock-refresh-token',
      user: {
        id: 'dev-admin-id',
        email: 'greenroom51@gmail.com',
        role: 'admin',
        app_metadata: { provider: 'email' },
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      }
    }
    
    // クッキーにセッション情報を設定
    const response = NextResponse.json({
      success: true,
      user: mockSession.user,
      message: '開発環境での仮ログインに成功しました'
    })
    
    // セッションクッキーを設定
    response.cookies.set('dev-session', JSON.stringify(mockSession), {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 3600
    })
    
    return response
    
  } catch (err) {
    console.error('Bypass login error:', err)
    return NextResponse.json(
      { error: 'バイパスログインに失敗しました' },
      { status: 500 }
    )
  }
}