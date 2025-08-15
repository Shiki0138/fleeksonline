import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 質問一覧の取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'newest'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    let query = supabase
      .from('forum_questions')
      .select(`
        *,
        user:fleeks_profiles!user_id(id, nickname, avatar_url),
        category:forum_categories!category_id(name, slug, icon),
        answers:forum_answers(count),
        likes:forum_likes(count)
      `)

    // フィルター
    if (category) {
      query = query.eq('category_id', category)
    }
    if (tag) {
      query = query.contains('tags', [tag])
    }
    if (status === 'resolved') {
      query = query.eq('is_resolved', true)
    } else if (status === 'unresolved') {
      query = query.eq('is_resolved', false)
    }

    // ソート
    switch (sort) {
      case 'popular':
        query = query.order('view_count', { ascending: false })
        break
      case 'unanswered':
        query = query.order('created_at', { ascending: false })
        // TODO: 回答数が0の質問のみフィルター
        break
      default:
        query = query.order('created_at', { ascending: false })
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching questions:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    return NextResponse.json({ 
      questions: data || [],
      pagination: {
        page,
        limit,
        hasMore: data?.length === limit
      }
    })
  } catch (error) {
    console.error('Error in GET /api/forum/questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 質問の投稿
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // プレミアム会員チェック
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('membership_type, role')
      .eq('id', user.id)
      .single()

    const isPremiumMember = profile?.membership_type === 'premium' || 
                           profile?.membership_type === 'vip' || 
                           profile?.role === 'admin' || 
                           profile?.role === 'paid'

    if (!isPremiumMember) {
      return NextResponse.json({ 
        error: 'Premium membership required',
        message: 'フォーラムへの投稿には有料会員登録が必要です' 
      }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, category_id, tags, is_anonymous, is_admin_question } = body

    // バリデーション
    if (!title || !content || !category_id) {
      return NextResponse.json({ error: 'Required fields missing' }, { status: 400 })
    }

    if (title.length > 200) {
      return NextResponse.json({ error: 'Title too long' }, { status: 400 })
    }

    // 質問を作成
    const { data, error } = await supabase
      .from('forum_questions')
      .insert({
        user_id: user.id,
        title,
        content,
        category_id,
        tags: tags || [],
        is_anonymous: is_anonymous || false,
        is_admin_question: is_admin_question || false,
        priority: is_admin_question ? 'high' : 'normal'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating question:', error)
      return NextResponse.json({ error: 'Failed to create question' }, { status: 500 })
    }

    // ポイントを付与（質問投稿: 10pt）
    await supabase
      .from('fleeks_profiles')
      .update({ forum_points: supabase.raw('forum_points + 10') })
      .eq('id', user.id)

    return NextResponse.json({ question: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/forum/questions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}