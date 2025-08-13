import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen, Lock, Crown } from 'lucide-react'
import ArticleFooterCTA from '@/components/ArticleFooterCTA'
import fs from 'fs/promises'
import path from 'path'
import ReactMarkdown from 'react-markdown'

// アクセスレベルを記事番号から判定
function getAccessLevel(articleNumber: number): 'free' | 'partial' | 'premium' {
  const index = (articleNumber - 1) % 20
  if (index < 5) return 'free'
  if (index < 15) return 'partial'
  return 'premium'
}

// チャプター情報を取得
function getChapterInfo(articleNumber: number) {
  if (articleNumber <= 20) return { number: 1, name: '初心者編', icon: '🌱' }
  if (articleNumber <= 40) return { number: 2, name: '経営編', icon: '💼' }
  if (articleNumber <= 60) return { number: 3, name: 'DX編', icon: '🚀' }
  return { number: 4, name: '総合編', icon: '🎯' }
}

export default async function EducationContentPage({
  params
}: {
  params: { slug: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  // slugから記事番号を抽出
  const articleNumber = parseInt(params.slug, 10)
  const chapter = getChapterInfo(articleNumber)
  const accessLevel = getAccessLevel(articleNumber)
  
  // 記事データをファイルから読み込み
  let article = null
  try {
    const articlePath = path.join(process.cwd(), 'data', 'education-articles', `article_${params.slug}.json`)
    const articleData = await fs.readFile(articlePath, 'utf-8')
    const jsonData = JSON.parse(articleData)
    
    article = {
      id: jsonData.id,
      title: jsonData.title,
      content: jsonData.content,
      category: jsonData.category,
      keywords: jsonData.keywords,
      readingTime: 7,
      publishedAt: jsonData.postedAt || jsonData.generatedAt,
    }
  } catch (error) {
    console.error('Error loading article:', error)
    notFound()
  }
  
  // ユーザーのプラン確認
  let isPremiumUser = false
  if (user) {
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    isPremiumUser = profile?.role === 'paid' || profile?.role === 'admin'
  }
  
  // アクセス権限の確認
  const hasFullAccess = accessLevel === 'free' || isPremiumUser
  const hasPartialAccess = user && accessLevel === 'partial'
  const canRead = hasFullAccess || hasPartialAccess

  // プレビューコンテンツを生成（有料記事の場合）
  const getPreviewContent = (content: string) => {
    const lines = content.split('\n')
    const previewLines = lines.slice(0, Math.min(30, Math.floor(lines.length * 0.3)))
    return previewLines.join('\n')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <Link
            href="/education"
            className="inline-flex items-center gap-2 text-purple-200 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            教育コンテンツ一覧に戻る
          </Link>
          
          <div className="flex items-center gap-4 text-sm text-purple-200 mb-4">
            <span className="flex items-center gap-1">
              <span className="text-xl">{chapter.icon}</span>
              第{chapter.number}章 {chapter.name}
            </span>
            <span>•</span>
            <span>記事No.{articleNumber}</span>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {article.title}
          </h1>
          
          <div className="flex items-center gap-4 text-purple-200">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.readingTime}分で読了
            </span>
            <span className="flex items-center gap-1">
              {accessLevel === 'free' && (
                <>
                  <BookOpen className="w-4 h-4" />
                  無料公開
                </>
              )}
              {accessLevel === 'partial' && (
                <>
                  <Crown className="w-4 h-4" />
                  一部有料
                </>
              )}
              {accessLevel === 'premium' && (
                <>
                  <Lock className="w-4 h-4" />
                  プレミアム限定
                </>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {canRead ? (
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown>
                  {hasPartialAccess && !hasFullAccess ? getPreviewContent(article.content) : article.content}
                </ReactMarkdown>
                
                {hasPartialAccess && !hasFullAccess && (
                  <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      続きを読むにはプレミアムプランへ
                    </h3>
                    <p className="text-purple-700 mb-4">
                      この記事の全文と、他の有料記事すべてが読み放題になります。
                    </p>
                    <Link
                      href="/membership/upgrade"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
                    >
                      <Crown className="w-5 h-5" />
                      プレミアムプランで続きを読む
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-4">
                  {!user ? 'ログインが必要です' : 'プレミアム限定コンテンツ'}
                </h2>
                <p className="text-gray-600 mb-8">
                  {!user 
                    ? 'この記事を読むにはログインが必要です。' 
                    : 'この記事はプレミアムプラン会員限定です。'
                  }
                </p>
                {!user ? (
                  <Link
                    href={`/login?redirect=/education/${params.slug}`}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
                  >
                    ログインして読む
                  </Link>
                ) : (
                  <Link
                    href="/membership/upgrade"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition"
                  >
                    <Crown className="w-5 h-5" />
                    プレミアムプランで読む
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          {canRead && (
            <div className="mt-12">
              <ArticleFooterCTA 
                isLoggedIn={!!user} 
                isPremiumUser={isPremiumUser} 
              />
            </div>
          )}

          {/* キーワード */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.keywords.map((keyword: string) => (
                <span
                  key={keyword}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                >
                  #{keyword}
                </span>
              ))}
            </div>
          )}

          {/* ナビゲーション */}
          <div className="mt-16 pt-8 border-t border-gray-200 flex items-center justify-between">
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              教育コンテンツ一覧
            </Link>
            
            {!isPremiumUser && (
              <Link
                href="/membership/upgrade"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                全記事を読む
                <Crown className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// 動的なメタデータ
export async function generateMetadata({
  params
}: {
  params: { slug: string }
}) {
  try {
    const articlePath = path.join(process.cwd(), 'data', 'education-articles', `article_${params.slug}.json`)
    const articleData = await fs.readFile(articlePath, 'utf-8')
    const article = JSON.parse(articleData)
    
    return {
      title: `${article.title} | FLEEKS教育コンテンツ`,
      description: article.leadText || article.title.substring(0, 160),
    }
  } catch {
    return {
      title: 'コンテンツが見つかりません | FLEEKS',
      description: '指定された教育コンテンツは見つかりませんでした。',
    }
  }
}