import { notFound } from 'next/navigation'
import ArticleGate from '@/components/ArticleGate'
import ArticleFooterCTA from '@/components/ArticleFooterCTA'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import fs from 'fs'
import path from 'path'

interface Article {
  id: string
  title: string
  content: string
  category: string
  accessLevel: 'free' | 'partial' | 'premium'
  keywords: string[]
  leadText?: string
}

async function getArticle(id: string): Promise<Article | null> {
  try {
    // 開発環境では、ローカルファイルから読み込み
    const articlePath = path.join(process.cwd(), 'data', 'education-articles', `${id}.json`)
    if (fs.existsSync(articlePath)) {
      const data = JSON.parse(fs.readFileSync(articlePath, 'utf8'))
      return data
    }
    
    // 本番環境では、Supabaseから取得
    // const supabase = createServerComponentClient({ cookies })
    // const { data } = await supabase
    //   .from('education_articles')
    //   .select('*')
    //   .eq('id', id)
    //   .single()
    // return data
    
    return null
  } catch (error) {
    console.error('Error loading article:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)
  
  if (!article) {
    return {
      title: '記事が見つかりません | FLEEKS',
    }
  }

  return {
    title: `${article.title} | FLEEKS`,
    description: article.leadText || `${article.category}の教育コンテンツ`,
    keywords: article.keywords.join(', '),
  }
}

export default async function ArticlePage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id)
  
  if (!article) {
    notFound()
  }

  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  let isPremiumUser = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
    
    isPremiumUser = profile?.subscription_plan === 'premium'
  }

  // コンテンツを解析して、セクションに分割
  const sections = article.content.split(/\n##\s+/).slice(1)
  const firstSection = sections[0] || ''
  const premiumSections = sections.slice(1)

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* パンくずリスト */}
        <nav className="mb-8 text-sm">
          <ol className="flex items-center gap-2 text-gray-500">
            <li><a href="/education" className="hover:text-purple-600">教育コンテンツ</a></li>
            <li>/</li>
            <li className="text-gray-900">{article.title}</li>
          </ol>
        </nav>

        {/* 記事コンテンツ */}
        <ArticleGate
          accessLevel={article.accessLevel}
          content={{
            title: article.title,
            leadText: article.leadText || '',
            firstSection: firstSection,
            premiumSections: premiumSections,
            summary: `${article.category}のプロフェッショナル向け実践ガイド`
          }}
          articleId={article.id}
        />

        {/* 有料記事の場合、実際のコンテンツを表示 */}
        {(article.accessLevel === 'free' || isPremiumUser) && (
          <article className="prose prose-lg max-w-none">
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
          </article>
        )}

        {/* CTA */}
        <ArticleFooterCTA isLoggedIn={!!user} isPremiumUser={isPremiumUser} />
      </div>
    </div>
  )
}