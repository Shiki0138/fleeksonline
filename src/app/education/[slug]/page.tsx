import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Clock, BookOpen, Lock, Crown, ChevronRight, Calendar, User, Tag } from 'lucide-react'
import ArticleFooterCTA from '@/components/ArticleFooterCTA'
import fs from 'fs/promises'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import Image from 'next/image'

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

// Unsplash画像を記事番号に基づいて取得
function getArticleImage(articleNumber: number) {
  // 美容関連のキーワードを記事のカテゴリーに応じて選択
  const keywords = [
    'beauty salon', 'hairdresser', 'hair styling', 'beauty treatment',
    'hair color', 'hair cutting', 'beauty professional', 'salon interior'
  ]
  const keyword = keywords[articleNumber % keywords.length]
  
  // 記事番号をシードとして使用し、同じ記事には常に同じ画像を表示
  return `https://source.unsplash.com/800x400/?${keyword}&sig=${articleNumber}`
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

  // 次の記事を取得
  const nextArticleNumber = articleNumber + 1
  const hasNextArticle = nextArticleNumber <= 80

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
          
          {/* パンくずリスト */}
          <div className="flex items-center gap-2 text-sm text-purple-200 mb-6">
            <Link href="/education" className="hover:text-white transition">
              教育コンテンツ
            </Link>
            <span>/</span>
            <span className="flex items-center gap-1">
              <span className="text-lg">{chapter.icon}</span>
              {chapter.name}
            </span>
            <span>/</span>
            <span>記事{articleNumber}</span>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <article className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* 記事ヘッダー */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            {/* アイキャッチ画像 */}
            <div className="relative h-64 md:h-96 bg-gray-200">
              <Image
                src={getArticleImage(articleNumber)}
                alt={article.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              
              {/* アクセスレベルバッジ */}
              <div className="absolute top-4 right-4">
                {accessLevel === 'free' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-full">
                    <BookOpen className="w-4 h-4" />
                    無料公開
                  </span>
                )}
                {accessLevel === 'partial' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-full">
                    <Crown className="w-4 h-4" />
                    一部有料
                  </span>
                )}
                {accessLevel === 'premium' && (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full">
                    <Lock className="w-4 h-4" />
                    プレミアム限定
                  </span>
                )}
              </div>
            </div>

            {/* 記事情報 */}
            <div className="p-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {article.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-8">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(article.publishedAt).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {article.readingTime}分で読了
                </span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  FLEEKS編集部
                </span>
              </div>

              {/* キーワードタグ */}
              {article.keywords && article.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                  {article.keywords.map((keyword: string) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-50 text-purple-700 text-sm rounded-full"
                    >
                      <Tag className="w-3 h-3" />
                      {keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 記事本文 */}
          <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
            {canRead ? (
              <>
                <div className="prose prose-lg max-w-none 
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:pb-3 prose-h2:border-b-2 prose-h2:border-purple-100
                  prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-purple-900
                  prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-6
                  prose-strong:text-purple-900 prose-strong:font-semibold
                  prose-ul:my-6 prose-ul:ml-6
                  prose-li:text-gray-700 prose-li:mb-2
                  prose-blockquote:border-l-4 prose-blockquote:border-purple-400 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-600
                  prose-a:text-purple-600 prose-a:underline prose-a:hover:text-purple-800
                ">
                  <ReactMarkdown
                    components={{
                      h2: ({ children }) => {
                        const text = String(children)
                        // "見出し1："のようなプレフィックスを除去
                        const cleanText = text.replace(/^見出し\d+[：:]\s*/, '')
                        return <h2>{cleanText}</h2>
                      },
                      h3: ({ children }) => {
                        const text = String(children)
                        const cleanText = text.replace(/^見出し\d+[：:]\s*/, '')
                        return <h3>{cleanText}</h3>
                      }
                    }}
                  >
                    {hasPartialAccess && !hasFullAccess ? getPreviewContent(article.content) : article.content}
                  </ReactMarkdown>
                </div>
                
                {hasPartialAccess && !hasFullAccess && (
                  <div className="mt-12 p-8 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <h3 className="text-xl font-bold text-purple-900 mb-3">
                      続きを読むにはプレミアムプランへ
                    </h3>
                    <p className="text-purple-700 mb-6">
                      この記事の全文と、他の有料記事すべてが読み放題になります。
                    </p>
                    <Link
                      href="/membership/upgrade"
                      className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg"
                    >
                      <Crown className="w-5 h-5" />
                      プレミアムプランで続きを読む
                    </Link>
                  </div>
                )}

                {/* 次の記事へのリンク */}
                {canRead && hasNextArticle && (
                  <div className="mt-16 p-6 bg-gray-50 rounded-xl">
                    <p className="text-sm text-gray-600 mb-3">次の記事</p>
                    <Link
                      href={`/education/${String(nextArticleNumber).padStart(3, '0')}`}
                      className="flex items-center justify-between group hover:bg-white rounded-lg p-4 transition"
                    >
                      <span className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition">
                        記事{nextArticleNumber}を読む
                      </span>
                      <ChevronRight className="w-6 h-6 text-gray-400 group-hover:text-purple-600 transition" />
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <Lock className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <h2 className="text-3xl font-bold mb-4 text-gray-900">
                  {!user ? 'ログインが必要です' : 'プレミアム限定コンテンツ'}
                </h2>
                <p className="text-gray-600 mb-8 text-lg">
                  {!user 
                    ? 'この記事を読むにはログインが必要です。' 
                    : 'この記事はプレミアムプラン会員限定です。'
                  }
                </p>
                {!user ? (
                  <Link
                    href={`/login?redirect=/education/${params.slug}`}
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
                  >
                    ログインして読む
                  </Link>
                ) : (
                  <Link
                    href="/membership/upgrade"
                    className="inline-flex items-center gap-2 bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition shadow-lg text-lg"
                  >
                    <Crown className="w-6 h-6" />
                    プレミアムプランで読む
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* CTA */}
          {canRead && !isPremiumUser && (
            <div className="mt-12">
              <ArticleFooterCTA 
                isLoggedIn={!!user} 
                isPremiumUser={isPremiumUser} 
              />
            </div>
          )}

          {/* ナビゲーション */}
          <div className="mt-16 flex items-center justify-between">
            <Link
              href="/education"
              className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 transition font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              教育コンテンツ一覧
            </Link>
            
            {!isPremiumUser && (
              <Link
                href="/membership/upgrade"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                全記事を読む
                <Crown className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </article>
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