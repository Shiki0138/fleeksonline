'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Plus, FileText, Edit, Trash2, Eye, Calendar, Tag } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface BlogPost {
  id: string
  title: string
  excerpt: string
  slug: string
  category: string
  tags: string[]
  status: 'draft' | 'published' | 'archived'
  view_count: number
  created_at: string
  published_at: string | null
}

export default function BlogManagementPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all')

  useEffect(() => {
    fetchPosts()
  }, [filter])

  const fetchPosts = async () => {
    try {
      let query = supabase
        .from('fleeks_blog_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
      toast.error('ブログ記事の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この記事を削除してもよろしいですか？')) return

    try {
      const { error } = await supabase
        .from('fleeks_blog_posts')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('記事を削除しました')
      fetchPosts()
    } catch (error) {
      console.error('Error deleting post:', error)
      toast.error('記事の削除に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">公開中</span>
      case 'draft':
        return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">下書き</span>
      case 'archived':
        return <span className="bg-gray-500/20 text-gray-400 px-2 py-1 rounded-full text-xs">アーカイブ</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>管理画面に戻る</span>
          </button>

          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold flex items-center">
              <FileText className="w-8 h-8 mr-3 text-blue-500" />
              ブログ管理
            </h1>
            <button
              onClick={() => router.push('/admin/blog/new')}
              className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition"
            >
              <Plus className="w-5 h-5" />
              <span>新規投稿</span>
            </button>
          </div>

          {/* フィルター */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'all' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFilter('published')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'published' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              公開中
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'draft' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              下書き
            </button>
          </div>

          {/* 記事一覧 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400 mb-4">まだブログ記事がありません</p>
              <button
                onClick={() => router.push('/admin/blog/new')}
                className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded-lg transition"
              >
                最初の記事を作成
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-semibold">{post.title}</h3>
                        {getStatusBadge(post.status)}
                      </div>
                      <p className="text-gray-400 mb-3 line-clamp-2">{post.excerpt}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.view_count} views</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4" />
                          <span>{post.category}</span>
                        </div>
                      </div>
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {post.tags.map((tag) => (
                            <span
                              key={tag}
                              className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => router.push(`/admin/blog/${post.id}/edit`)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}