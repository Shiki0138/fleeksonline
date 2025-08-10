'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PlusCircle, BookOpen, Edit, Trash2, ChevronRight, Image } from 'lucide-react'

interface Chapter {
  id: string
  chapter_number: number
  title: string
  description: string
  slug: string
  is_published: boolean
}

interface EducationContent {
  id: string
  title: string
  chapter_id: string
  is_premium: boolean
  status: string
  created_at: string
  reading_time: number
  featured_image?: string
  education_chapters?: Chapter
}

export default function EducationManagementPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [contents, setContents] = useState<EducationContent[]>([])
  const [selectedChapter, setSelectedChapter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchChapters()
    fetchContents()
  }, [])

  const fetchChapters = async () => {
    const { data, error } = await supabase
      .from('education_chapters')
      .select('*')
      .order('sort_order')

    if (!error && data) {
      setChapters(data)
    }
  }

  const fetchContents = async () => {
    setLoading(true)
    let query = supabase
      .from('education_contents')
      .select(`
        *,
        education_chapters (
          id,
          title,
          chapter_number
        )
      `)
      .order('created_at', { ascending: false })

    if (selectedChapter !== 'all') {
      query = query.eq('chapter_id', selectedChapter)
    }

    const { data, error } = await query

    if (!error && data) {
      setContents(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('このコンテンツを削除してもよろしいですか？')) return

    const { error } = await supabase
      .from('education_contents')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchContents()
    } else {
      alert('削除に失敗しました')
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      archived: 'bg-gray-100 text-gray-800'
    }
    return styles[status as keyof typeof styles] || styles.draft
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">教育コンテンツ管理</h1>
        <p className="text-gray-600">美容師向け教育コンテンツの管理</p>
      </div>

      {/* 章フィルター */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => {
            setSelectedChapter('all')
            fetchContents()
          }}
          className={`px-4 py-2 rounded-lg transition ${
            selectedChapter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          すべて
        </button>
        {chapters.map((chapter) => (
          <button
            key={chapter.id}
            onClick={() => {
              setSelectedChapter(chapter.id)
              fetchContents()
            }}
            className={`px-4 py-2 rounded-lg transition ${
              selectedChapter === chapter.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            第{chapter.chapter_number}章
          </button>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="mb-6 flex gap-4">
        <Link
          href="/admin/education/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <PlusCircle className="w-5 h-5" />
          新規コンテンツ作成
        </Link>
        <Link
          href="/admin/education/chapters"
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition flex items-center gap-2"
        >
          <BookOpen className="w-5 h-5" />
          章の管理
        </Link>
      </div>

      {/* コンテンツリスト */}
      {loading ? (
        <div className="text-center py-8">読み込み中...</div>
      ) : contents.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">コンテンツがまだありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  コンテンツ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  章
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  タイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  読了時間
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {contents.map((content) => (
                <tr key={content.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      {content.featured_image ? (
                        <img
                          src={content.featured_image}
                          alt=""
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {content.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(content.created_at).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {content.education_chapters?.title || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                      content.is_premium
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {content.is_premium ? '有料' : '無料'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                      getStatusBadge(content.status)
                    }`}>
                      {content.status === 'published' ? '公開中' : 
                       content.status === 'draft' ? '下書き' : 'アーカイブ'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {content.reading_time}分
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/education/${content.id}/edit`}
                        className="text-blue-600 hover:text-blue-900 transition"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(content.id)}
                        className="text-red-600 hover:text-red-900 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}