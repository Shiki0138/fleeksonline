import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// 緊急ログイン用API（レート制限回避）
export async function POST(request: Request) {
  try {
    const { email, password, emergencyCode } = await request.json()
    
    // 緊急コードの確認
    if (emergencyCode !== process.env.EMERGENCY_LOGIN_CODE) {
      return NextResponse.json(
        { error: '無効な緊急コードです' },
        { status: 401 }
      )
    }
    
    // 管理者メールアドレスの確認
    if (email !== 'greenroom51@gmail.com') {
      return NextResponse.json(
        { error: '管理者アカウントのみ使用可能です' },
        { status: 403 }
      )
    }
    
    const supabase = createRouteHandlerClient({ cookies })
    
    // セッションを作成（レート制限を考慮した待機時間付き）
    await new Promise(resolve => setTimeout(resolve, 3000)) // 3秒待機
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Emergency login error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: data.user,
      message: '緊急ログインに成功しました'
    })
    
  } catch (err) {
    console.error('Emergency login error:', err)
    return NextResponse.json(
      { error: '緊急ログインに失敗しました' },
      { status: 500 }
    )
  }
}