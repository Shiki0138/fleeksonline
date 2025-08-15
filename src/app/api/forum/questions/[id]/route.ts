import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 特定の質問の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    // 現在のユーザーが管理者かチェック
    const { data: { user } } = await supabase.auth.getUser()
    let isAdmin = false
    if (user) {
      const { data: profile } = await supabase
        .from('fleeks_profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      isAdmin = profile?.role === 'admin'
    }

    const { data: question, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        user:fleeks_profiles!user_id(id, nickname, avatar_url, membership_type, role),
        category:forum_categories!category_id(name, slug, icon),
        answers:forum_answers(
          *,
          user:fleeks_profiles!user_id(id, nickname, avatar_url, membership_type, role)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 管理者以外は管理者が返信した質問のみ表示
    if (!isAdmin && !question.has_admin_answer) {
      return NextResponse.json({ error: 'Question not available' }, { status: 403 })
    }

    // View count を増やす
    await supabase
      .from('forum_questions')
      .update({ view_count: (question.view_count || 0) + 1 })
      .eq('id', id)

    return NextResponse.json({ question })
  } catch (error) {
    console.error('Error in GET /api/forum/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 質問の更新（管理者のみ）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // 質問の所有者チェック
    const { data: question } = await supabase
      .from('forum_questions')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 管理者または質問の所有者のみ更新可能
    if (!isAdmin && question.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, category_id, tags, is_resolved } = body

    // 更新データの準備
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (category_id !== undefined) updateData.category_id = category_id
    if (tags !== undefined) updateData.tags = tags
    if (is_resolved !== undefined) updateData.is_resolved = is_resolved

    // 管理者が編集した場合は編集者情報を記録
    if (isAdmin && question.user_id !== user.id) {
      updateData.edited_by = user.id
      updateData.edited_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('forum_questions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating question:', error)
      return NextResponse.json({ error: 'Failed to update question' }, { status: 500 })
    }

    return NextResponse.json({ question: data })
  } catch (error) {
    console.error('Error in PUT /api/forum/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 質問の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { id } = params

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isAdmin = profile?.role === 'admin'

    // 質問の所有者チェック
    const { data: question } = await supabase
      .from('forum_questions')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 管理者または質問の所有者のみ削除可能
    if (!isAdmin && question.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('forum_questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting question:', error)
      return NextResponse.json({ error: 'Failed to delete question' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/forum/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}