'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Image as ImageIcon } from 'lucide-react'
import dynamic from 'next/dynamic'

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false })
import 'react-quill/dist/quill.snow.css'

interface Chapter {
  id: string
  chapter_number: number
  title: string
}

interface ContentImage {
  id: string
  category: string
  image_url: string
  description: string
}

export default function NewEducationContentPage() {
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [chapterId, setChapterId] = useState('')
  const [isPremium, setIsPremium] = useState(false)
  const [category, setCategory] = useState('beginner')
  const [readingTime, setReadingTime] = useState(5)
  const [featuredImage, setFeaturedImage] = useState('')
  const [status, setStatus] = useState('draft')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [images, setImages] = useState<ContentImage[]>([])
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    fetchChapters()
    fetchImages()
  }, [])

  const fetchChapters = async () => {
    const { data } = await supabase
      .from('education_chapters')
      .select('*')
      .order('sort_order')
    
    if (data) setChapters(data)
  }

  const fetchImages = async () => {
    const { data } = await supabase
      .from('content_images')
      .select('*')
      .eq('category', category)
    
    if (data) setImages(data)
  }

  useEffect(() => {
    fetchImages()
  }, [category])

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim()
  }

  const handleTitleChange = (value: string) => {
    setTitle(value)
    setSlug(generateSlug(value))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('education_contents')
        .insert({
          title,
          slug,
          content,
          preview_content: isPremium ? previewContent : null,
          excerpt,
          chapter_id: chapterId,
          is_premium: isPremium,
          category,
          reading_time: readingTime,
          featured_image: featuredImage,
          status,
          published_at: status === 'published' ? new Date().toISOString() : null
        })

      if (error) throw error

      router.push('/admin/education')
    } catch (error) {
      console.error('Error creating content:', error)
      alert('コンテンツの作成に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <Link
          href="/admin/education"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          教育コンテンツ一覧に戻る
        </Link>
        <h1 className="text-3xl font-bold">新規教育コンテンツ作成</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">基本情報</h2>
          
          <div>
            <label className="block text-sm font-medium mb-1">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">スラッグ（URL）</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="auto-generated-from-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">章 *</label>
              <select
                value={chapterId}
                onChange={(e) => setChapterId(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">章を選択</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    第{chapter.chapter_number}章 - {chapter.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">カテゴリー</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">新人向け</option>
                <option value="management">経営</option>
                <option value="dx">DX・AI</option>
                <option value="general">一般</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">概要</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="記事の概要を入力"
            />
          </div>
        </div>

        {/* アイキャッチ画像 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">アイキャッチ画像</h2>
          
          <div className="space-y-4">
            {featuredImage && (
              <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage('')}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm"
                >
                  削除
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">画像URL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={featuredImage}
                  onChange={(e) => setFeaturedImage(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
                <button
                  type="button"
                  onClick={() => setShowImagePicker(!showImagePicker)}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {showImagePicker && (
              <div className="grid grid-cols-4 gap-2 p-4 bg-gray-50 rounded-lg">
                {images.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => {
                      setFeaturedImage(img.image_url)
                      setShowImagePicker(false)
                    }}
                    className="relative h-20 bg-gray-200 rounded overflow-hidden hover:ring-2 hover:ring-blue-500"
                  >
                    <img
                      src={img.image_url}
                      alt={img.description}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">コンテンツ</h2>
          
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={isPremium}
                  onChange={(e) => setIsPremium(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">有料コンテンツ</span>
              </label>
            </div>

            {isPremium && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  プレビューコンテンツ（無料で表示される部分）
                </label>
                <div className="h-64">
                  <ReactQuill
                    value={previewContent}
                    onChange={setPreviewContent}
                    modules={modules}
                    className="h-48"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">
                {isPremium ? 'メインコンテンツ（有料部分）' : 'コンテンツ'} *
              </label>
              <div className="h-96">
                <ReactQuill
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  className="h-80"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 設定 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">設定</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">読了時間（分）</label>
              <input
                type="number"
                value={readingTime}
                onChange={(e) => setReadingTime(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">ステータス</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">下書き</option>
                <option value="published">公開</option>
              </select>
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-4">
          <Link
            href="/admin/education"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            キャンセル
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}