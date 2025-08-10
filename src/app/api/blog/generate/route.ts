import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(request: NextRequest) {
  try {
    const { source, content, type } = await request.json()

    // プロンプトを生成
    let prompt = ''
    
    switch (type) {
      case 'wordpress':
        prompt = `
以下のWordPress記事を、ローカルビジネスオーナー向けに最適化してリライトしてください：

【元記事】
${content}

【要件】
- トーンは親しみやすく、実践的に
- 具体的な数値や事例を追加
- Instagram集客の観点を含める
- 心理学的アプローチを組み込む
- SEOを意識したキーワードを含める
- 文字数は2000-3000文字程度

【出力形式】
{
  "title": "記事タイトル",
  "content": "記事本文（Markdown形式）",
  "excerpt": "記事の要約（150文字程度）",
  "category": "カテゴリー名",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "seo_title": "SEO用タイトル",
  "seo_description": "SEO用説明文"
}
`
        break
        
      case 'spreadsheet':
        prompt = `
以下のアイデアメモから、実践的なブログ記事を作成してください：

【アイデア】
${content}

【記事構成】
1. 導入（問題提起）
2. 理論的背景
3. 実践方法（ステップバイステップ）
4. 事例紹介
5. まとめとアクションプラン

【要件】
- ローカルビジネスオーナー向け
- 具体的で実践可能な内容
- 2000-3000文字程度

【出力形式】
{
  "title": "記事タイトル",
  "content": "記事本文（Markdown形式）",
  "excerpt": "記事の要約（150文字程度）",
  "category": "カテゴリー名",
  "tags": ["タグ1", "タグ2", "タグ3"],
  "seo_title": "SEO用タイトル",
  "seo_description": "SEO用説明文"
}
`
        break
        
      default:
        throw new Error('Invalid type')
    }

    // OpenAI APIで記事を生成
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'あなたはローカルビジネス向けのマーケティング専門家です。実践的で分かりやすい記事を書いてください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    })

    const generatedContent = JSON.parse(completion.choices[0].message.content || '{}')

    // Supabaseに保存
    const { data: blogPost, error } = await supabase
      .from('fleeks_blog_posts')
      .insert({
        title: generatedContent.title,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt,
        slug: generatedContent.title.toLowerCase()
          .replace(/[^a-z0-9ぁ-んァ-ヶー一-龠]+/g, '-')
          .replace(/^-+|-+$/g, ''),
        category: generatedContent.category,
        tags: generatedContent.tags,
        status: 'draft',
        source_type: type,
        source_url: source,
        seo_title: generatedContent.seo_title,
        seo_description: generatedContent.seo_description,
        author_id: 'system', // システム生成
      })
      .select()
      .single()

    if (error) throw error

    // 生成ログを記録
    await supabase.from('fleeks_blog_generation_logs').insert({
      post_id: blogPost.id,
      source_content: content.substring(0, 1000), // 最初の1000文字のみ保存
      prompt: prompt,
      ai_model: 'gpt-4-turbo-preview',
      generation_params: {
        temperature: 0.7,
        model: 'gpt-4-turbo-preview'
      },
      generated_content: generatedContent.content,
      status: 'completed',
    })

    return NextResponse.json({ 
      success: true, 
      postId: blogPost.id,
      message: '記事が生成されました（下書きとして保存）'
    })

  } catch (error) {
    console.error('Blog generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate blog post' },
      { status: 500 }
    )
  }
}

// 週次自動生成のためのスケジューラー（Vercel Cronで実行）
export async function GET(request: NextRequest) {
  // 認証チェック（Vercel Cronのシークレットキー）
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    // ここでスプレッドシートやWordPressから最新のコンテンツを取得
    // 今回は例として固定のコンテンツを使用
    const sampleContent = {
      source: 'auto-generated',
      content: '今週のトレンド：Instagram新機能を活用した集客方法',
      type: 'spreadsheet'
    }

    // POSTエンドポイントを呼び出し
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/blog/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sampleContent),
    })

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: '週次ブログ記事が生成されました',
      result
    })
    
  } catch (error) {
    console.error('Weekly blog generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate weekly blog' },
      { status: 500 }
    )
  }
}