import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 質問詳細の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const questionId = params.id

    // 質問を取得
    const { data: question, error } = await supabase
      .from('forum_questions')
      .select(`
        *,
        user:fleeks_profiles!user_id(id, nickname, avatar_url, experience_years, specialty_tags),
        category:forum_categories!category_id(name, slug, icon),
        answers:forum_answers(
          id,
          content,
          is_best_answer,
          created_at,
          user:fleeks_profiles!user_id(id, nickname, avatar_url, experience_years),
          likes:forum_likes(count),
          comments:forum_comments(
            id,
            content,
            created_at,
            user:fleeks_profiles!user_id(id, nickname, avatar_url)
          )
        ),
        likes:forum_likes(count),
        follows:forum_follows(count)
      `)
      .eq('id', questionId)
      .single()

    if (error) {
      console.error('Error fetching question:', error)
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 閲覧数を増やす
    await supabase
      .from('forum_questions')
      .update({ view_count: question.view_count + 1 })
      .eq('id', questionId)

    // 現在のユーザーの状態を取得
    const { data: { user } } = await supabase.auth.getUser()
    let userState = {
      hasLiked: false,
      isFollowing: false,
      isAuthor: false
    }

    if (user) {
      // いいね状態
      const { data: likeData } = await supabase
        .from('forum_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single()
      
      userState.hasLiked = !!likeData

      // フォロー状態
      const { data: followData } = await supabase
        .from('forum_follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('question_id', questionId)
        .single()
      
      userState.isFollowing = !!followData
      userState.isAuthor = question.user_id === user.id
    }

    return NextResponse.json({ 
      question,
      userState
    })
  } catch (error) {
    console.error('Error in GET /api/forum/questions/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 質問の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const questionId = params.id

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 質問の所有者チェック
    const { data: question } = await supabase
      .from('forum_questions')
      .select('user_id')
      .eq('id', questionId)
      .single()

    if (!question || question.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, tags, is_resolved } = body

    // 更新
    const { data, error } = await supabase
      .from('forum_questions')
      .update({
        title,
        content,
        tags,
        is_resolved,
        updated_at: new Date().toISOString()
      })
      .eq('id', questionId)
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
    const questionId = params.id

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 質問の所有者チェック
    const { data: question } = await supabase
      .from('forum_questions')
      .select('user_id')
      .eq('id', questionId)
      .single()

    if (!question || question.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 削除
    const { error } = await supabase
      .from('forum_questions')
      .delete()
      .eq('id', questionId)

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