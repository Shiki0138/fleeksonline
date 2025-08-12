import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 管理者用のSupabaseクライアント（Service Role Key使用）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword, adminPassword } = await request.json()

    // 簡易的な管理者認証（本番環境では適切な認証を実装してください）
    if (adminPassword !== process.env.ADMIN_RESET_PASSWORD) {
      return NextResponse.json(
        { error: '管理者パスワードが正しくありません' },
        { status: 401 }
      )
    }

    // ユーザーのパスワードを更新
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      email, // 実際にはユーザーIDが必要だが、まずはメールで検索
      { password: newPassword }
    )

    // メールアドレスからユーザーを検索する代替方法
    const { data: users, error: searchError } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single()

    if (searchError || !users) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      )
    }

    // ユーザーIDでパスワードを更新
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      users.id,
      { password: newPassword }
    )

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'パスワードを更新しました'
    })

  } catch (error: any) {
    console.error('Admin password reset error:', error)
    return NextResponse.json(
      { error: error.message || 'パスワードのリセットに失敗しました' },
      { status: 500 }
    )
  }
}