'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, FileText, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

export default function NewBlogPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: 'Instagram集客',
    tags: '',
    status: 'draft',
    seo_title: '',
    seo_description: ''
  })

  const categories = [
    'Instagram集客',
    'SNSマーケティング',
    '接客スキル',
    'デジタルマーケティング',
    '経営戦略',
    'お知らせ'
  ]

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9ぁ-んァ-ヶー一-龠]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const slug = generateSlug(formData.title)
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)

      const { error } = await supabase
        .from('blog_posts')
        .insert({
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt || formData.content.substring(0, 150) + '...',
          slug: slug,
          category: formData.category,
          tags: tags,
          status: formData.status,
          seo_title: formData.seo_title || formData.title,
          seo_description: formData.seo_description || formData.excerpt,
          author_id: 'admin',
          published_at: formData.status === 'published' ? new Date().toISOString() : null
        })

      if (error) throw error

      toast.success('ブログ記事を作成しました')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating blog post:', error)
      toast.error('ブログ記事の作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAIGenerate = async () => {
    setIsGenerating(true)
    
    try {
      const prompt = formData.title || 'Instagram集客の最新トレンド'
      
      const response = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'manual',
          content: prompt,
          type: 'spreadsheet'
        })
      })

      if (!response.ok) throw new Error('Generation failed')

      const result = await response.json()
      toast.success('AIが記事を生成しました。編集画面に移動します。')
      
      // 生成された記事の編集画面に移動
      router.push(`/admin/blog/${result.postId}/edit`)
    } catch (error) {
      console.error('Error generating blog:', error)
      toast.error('AI記事生成に失敗しました')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>戻る</span>
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-400" />
              新規ブログ記事を作成
            </h1>
            <button
              onClick={handleAIGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isGenerating ? 'AI生成中...' : 'AIで記事を生成'}</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  タイトル *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Instagram集客の極意：エンゲージメント率を3倍にする方法"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  カテゴリー *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-800">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  公開状態
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                >
                  <option value="draft" className="bg-gray-800">下書き</option>
                  <option value="published" className="bg-gray-800">公開</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  抜粋（概要）
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="記事の概要を入力してください（150文字程度）"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  本文 * （Markdown形式対応）
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="記事の本文を入力してください。Markdown形式で記述できます。"
                  rows={15}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 font-mono text-sm"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  タグ（カンマ区切り）
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Instagram, 集客, マーケティング"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SEOタイトル
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                  placeholder="検索結果に表示されるタイトル"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  SEO説明文
                </label>
                <input
                  type="text"
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  placeholder="検索結果に表示される説明文"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 px-6 py-3 rounded-lg font-medium flex items-center justify-center space-x-2 transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                <span>{isLoading ? '保存中...' : '記事を作成'}</span>
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-white/20 rounded-lg hover:bg-white/10 transition"
              >
                キャンセル
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}