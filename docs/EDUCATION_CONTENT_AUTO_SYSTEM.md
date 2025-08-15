# 教育コンテンツ自動作成投稿システム 実装ガイド

## 概要
このシステムは、教育コンテンツを管理画面から簡単に作成・投稿・管理できる仕組みです。チャプター形式でコンテンツを構造化し、アクセス制限機能も実装しています。

## システム構成

### 1. データベース設計

#### 1.1 教育コンテンツテーブル (`education_contents`)
```sql
CREATE TABLE education_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  category VARCHAR(100),
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  access_level VARCHAR(50) DEFAULT 'free', -- 'free', 'partial', 'premium'
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_education_contents_slug ON education_contents(slug);
CREATE INDEX idx_education_contents_published ON education_contents(is_published);
CREATE INDEX idx_education_contents_access ON education_contents(access_level);
```

#### 1.2 チャプターテーブル (`education_chapters`)
```sql
CREATE TABLE education_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID REFERENCES education_contents(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_education_chapters_content ON education_chapters(content_id);
CREATE INDEX idx_education_chapters_order ON education_chapters(order_index);
```

### 2. フロントエンド実装

#### 2.1 フォルダ構造
```
src/
├── app/
│   ├── admin/
│   │   ├── education/
│   │   │   ├── page.tsx         # 一覧画面
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # 新規作成画面
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx # 編集画面
│   ├── education/
│   │   ├── page.tsx             # 公開側一覧
│   │   ├── layout.tsx           # レイアウト
│   │   └── [slug]/
│   │       └── page.tsx         # 詳細表示
│   └── api/
│       └── admin/
│           └── education/
│               └── route.ts     # API エンドポイント
├── components/
│   └── education/
│       ├── ChapterEditor.tsx    # チャプター編集コンポーネント
│       └── ContentCard.tsx      # コンテンツカード
└── lib/
    └── supabase-browser.ts      # Supabase クライアント
```

#### 2.2 新規作成画面 (`/app/admin/education/new/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  Eye,
  EyeOff,
  Image,
  Tag,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Chapter {
  id: string
  title: string
  content: string
  order_index: number
  is_premium: boolean
}

export default function NewEducationContentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('beauty-tech')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [accessLevel, setAccessLevel] = useState<'free' | 'partial' | 'premium'>('free')
  const [isPublished, setIsPublished] = useState(false)
  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order_index: 0,
      is_premium: false
    }
  ])

  // URLスラッグ自動生成
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // タイトル変更時にスラッグも自動生成
  const handleTitleChange = (value: string) => {
    setTitle(value)
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value))
    }
  }

  // チャプター追加
  const addChapter = () => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: '',
      content: '',
      order_index: chapters.length,
      is_premium: accessLevel === 'premium'
    }
    setChapters([...chapters, newChapter])
  }

  // チャプター削除
  const removeChapter = (id: string) => {
    if (chapters.length === 1) {
      toast.error('最低1つのチャプターが必要です')
      return
    }
    
    const newChapters = chapters
      .filter(ch => ch.id !== id)
      .map((ch, index) => ({ ...ch, order_index: index }))
    setChapters(newChapters)
  }

  // チャプター更新
  const updateChapter = (id: string, updates: Partial<Chapter>) => {
    setChapters(chapters.map(ch => 
      ch.id === id ? { ...ch, ...updates } : ch
    ))
  }

  // チャプター並び替え
  const moveChapter = (fromIndex: number, toIndex: number) => {
    const newChapters = [...chapters]
    const [movedChapter] = newChapters.splice(fromIndex, 1)
    newChapters.splice(toIndex, 0, movedChapter)
    
    // order_indexを更新
    newChapters.forEach((ch, index) => {
      ch.order_index = index
    })
    
    setChapters(newChapters)
  }

  // タグ追加
  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag])
    }
  }

  // タグ削除
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  // 保存処理
  const handleSave = async () => {
    // バリデーション
    if (!title || !slug || !description) {
      toast.error('タイトル、スラッグ、説明は必須です')
      return
    }

    if (chapters.some(ch => !ch.title || !ch.content)) {
      toast.error('すべてのチャプターにタイトルと内容を入力してください')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/admin/education', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title,
          slug,
          description,
          category,
          thumbnail_url: thumbnailUrl,
          tags,
          access_level: accessLevel,
          is_published: isPublished,
          chapters: chapters.map(({ id, ...ch }) => ch)
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '保存に失敗しました')
      }

      toast.success('教育コンテンツを作成しました')
      router.push('/admin/education')
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* ヘッダー */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/10 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">新規教育コンテンツ作成</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsPublished(!isPublished)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                  isPublished 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                {isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{isPublished ? '公開' : '下書き'}</span>
              </button>
              
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? '保存中...' : '保存'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左側：基本情報 */}
          <div className="lg:col-span-1 space-y-6">
            {/* 基本情報 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                基本情報
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    タイトル <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                    placeholder="例: カラーリング基礎講座"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    URLスラッグ <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                    placeholder="例: color-basics"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    URL: /education/{slug}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    説明 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                    placeholder="コンテンツの概要を入力"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    カテゴリー
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  >
                    <option value="beauty-tech">美容技術</option>
                    <option value="management">経営・マネジメント</option>
                    <option value="marketing">マーケティング</option>
                    <option value="customer-service">接客・サービス</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    アクセスレベル
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value as any)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  >
                    <option value="free">無料</option>
                    <option value="partial">一部限定</option>
                    <option value="premium">プレミアム限定</option>
                  </select>
                </div>
              </div>
            </div>

            {/* サムネイル */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Image className="w-5 h-5 mr-2" />
                サムネイル画像
              </h2>
              
              <div>
                <input
                  type="url"
                  value={thumbnailUrl}
                  onChange={(e) => setThumbnailUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  placeholder="画像URLを入力"
                />
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt="サムネイルプレビュー"
                    className="mt-4 w-full rounded-lg"
                  />
                )}
              </div>
            </div>

            {/* タグ */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Tag className="w-5 h-5 mr-2" />
                タグ
              </h2>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 bg-blue-600/20 text-blue-300 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-2 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                
                <input
                  type="text"
                  placeholder="タグを入力してEnter"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.target as HTMLInputElement
                      addTag(input.value.trim())
                      input.value = ''
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* 右側：チャプター */}
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">チャプター</h2>
                <button
                  onClick={addChapter}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>チャプター追加</span>
                </button>
              </div>

              <div className="space-y-4">
                {chapters.map((chapter, index) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 rounded-lg p-6 border border-white/10"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
                        <span className="text-lg font-medium">
                          チャプター {index + 1}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={chapter.is_premium}
                            onChange={(e) => updateChapter(chapter.id, { is_premium: e.target.checked })}
                            className="rounded"
                          />
                          <span className="text-sm">プレミアム限定</span>
                        </label>
                        
                        <button
                          onClick={() => removeChapter(chapter.id)}
                          className="p-2 hover:bg-red-600/20 rounded transition"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          タイトル
                        </label>
                        <input
                          type="text"
                          value={chapter.title}
                          onChange={(e) => updateChapter(chapter.id, { title: e.target.value })}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                          placeholder="チャプタータイトル"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          内容
                        </label>
                        <textarea
                          value={chapter.content}
                          onChange={(e) => updateChapter(chapter.id, { content: e.target.value })}
                          rows={6}
                          className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
                          placeholder="チャプターの内容を入力..."
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3. バックエンド実装

#### 3.1 API エンドポイント (`/app/api/admin/education/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// GET: 教育コンテンツ一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // コンテンツ取得
    const { data: contents, error } = await supabase
      .from('education_contents')
      .select(`
        *,
        education_chapters (
          id,
          title,
          order_index,
          is_premium
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ contents })
  } catch (error) {
    console.error('Education GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新規作成
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { chapters, ...contentData } = body

    // トランザクション的な処理
    // 1. コンテンツを作成
    const { data: content, error: contentError } = await supabaseAdmin
      .from('education_contents')
      .insert({
        ...contentData,
        author_id: session.user.id
      })
      .select()
      .single()

    if (contentError) throw contentError

    // 2. チャプターを作成
    if (chapters && chapters.length > 0) {
      const chaptersData = chapters.map((ch: any) => ({
        ...ch,
        content_id: content.id
      }))

      const { error: chaptersError } = await supabaseAdmin
        .from('education_chapters')
        .insert(chaptersData)

      if (chaptersError) {
        // ロールバック: コンテンツを削除
        await supabaseAdmin
          .from('education_contents')
          .delete()
          .eq('id', content.id)
        
        throw chaptersError
      }
    }

    return NextResponse.json({ content })
  } catch (error) {
    console.error('Education POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT: 更新
export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { id, chapters, ...contentData } = body

    // 1. コンテンツを更新
    const { error: contentError } = await supabaseAdmin
      .from('education_contents')
      .update({
        ...contentData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (contentError) throw contentError

    // 2. 既存のチャプターを削除
    const { error: deleteError } = await supabaseAdmin
      .from('education_chapters')
      .delete()
      .eq('content_id', id)

    if (deleteError) throw deleteError

    // 3. 新しいチャプターを作成
    if (chapters && chapters.length > 0) {
      const chaptersData = chapters.map((ch: any) => ({
        ...ch,
        content_id: id
      }))

      const { error: chaptersError } = await supabaseAdmin
        .from('education_chapters')
        .insert(chaptersData)

      if (chaptersError) throw chaptersError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Education PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: 削除
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 管理者チェック
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    // カスケード削除（チャプターも自動的に削除される）
    const { error } = await supabaseAdmin
      .from('education_contents')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Education DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 4. 公開側の実装

#### 4.1 一覧ページ (`/app/education/page.tsx`)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BookOpen, Clock, Lock, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

interface EducationContent {
  id: string
  title: string
  slug: string
  description: string
  thumbnail_url?: string
  category: string
  tags: string[]
  access_level: 'free' | 'partial' | 'premium'
  created_at: string
  education_chapters: {
    id: string
  }[]
}

export default function EducationPage() {
  const [contents, setContents] = useState<EducationContent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    fetchContents()
    checkProfile()
  }, [])

  const checkProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
    }
  }

  const fetchContents = async () => {
    try {
      const { data, error } = await supabase
        .from('education_contents')
        .select(`
          *,
          education_chapters (id)
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setContents(data || [])
    } catch (error) {
      console.error('Error fetching contents:', error)
    } finally {
      setLoading(false)
    }
  }

  const canAccessContent = (content: EducationContent) => {
    if (content.access_level === 'free') return true
    if (!profile) return false
    return profile.membership_type === 'premium' || profile.role === 'admin'
  }

  const filteredContents = contents.filter(content => {
    if (filter === 'free') return content.access_level === 'free'
    if (filter === 'premium') return content.access_level !== 'free'
    return true
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <h1 className="text-4xl font-bold mb-4">教育コンテンツ</h1>
          <p className="text-xl">プロフェッショナルのための学習リソース</p>
        </div>
      </div>

      {/* フィルター */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            すべて
          </button>
          <button
            onClick={() => setFilter('free')}
            className={`px-6 py-2 rounded-full transition ${
              filter === 'free'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            無料
          </button>
          <button
            onClick={() => setFilter('premium')}
            className={`px-6 py-2 rounded-full transition ${
              filter === 'premium'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            プレミアム
          </button>
        </div>

        {/* コンテンツグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContents.map((content) => {
            const canAccess = canAccessContent(content)
            
            return (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="bg-white rounded-lg shadow-lg overflow-hidden"
              >
                {content.thumbnail_url && (
                  <div className="relative h-48 bg-gray-200">
                    <img
                      src={content.thumbnail_url}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    {!canAccess && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Lock className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">{content.category}</span>
                    {content.access_level !== 'free' && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        プレミアム
                      </span>
                    )}
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{content.title}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">{content.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <BookOpen className="w-4 h-4 mr-1" />
                      {content.education_chapters.length} チャプター
                    </div>
                    
                    {canAccess ? (
                      <Link
                        href={`/education/${content.slug}`}
                        className="text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        学習を始める
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    ) : (
                      <Link
                        href="/membership/upgrade"
                        className="text-purple-600 hover:text-purple-700 flex items-center"
                      >
                        アップグレード
                        <Lock className="w-4 h-4 ml-1" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
```

#### 4.2 詳細ページ (`/app/education/[slug]/page.tsx`)

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Lock,
  ChevronRight
} from 'lucide-react'
import { supabase } from '@/lib/supabase-browser'

interface Chapter {
  id: string
  title: string
  content: string
  order_index: number
  is_premium: boolean
}

interface EducationContent {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  category: string
  tags: string[]
  access_level: 'free' | 'partial' | 'premium'
  education_chapters: Chapter[]
}

export default function EducationDetailPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  const router = useRouter()
  const [content, setContent] = useState<EducationContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentChapter, setCurrentChapter] = useState(0)
  const [profile, setProfile] = useState<any>(null)
  const [completedChapters, setCompletedChapters] = useState<string[]>([])

  useEffect(() => {
    fetchContent()
    checkProfile()
  }, [params.slug])

  const checkProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      setProfile(data)
    }
  }

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('education_contents')
        .select(`
          *,
          education_chapters (*)
        `)
        .eq('slug', params.slug)
        .eq('is_published', true)
        .single()

      if (error) throw error
      
      // チャプターを順番でソート
      if (data) {
        data.education_chapters.sort((a: Chapter, b: Chapter) => 
          a.order_index - b.order_index
        )
        setContent(data)
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      router.push('/education')
    } finally {
      setLoading(false)
    }
  }

  const canAccessChapter = (chapter: Chapter) => {
    if (!chapter.is_premium) return true
    if (!profile) return false
    return profile.membership_type === 'premium' || profile.role === 'admin'
  }

  const handleChapterComplete = (chapterId: string) => {
    if (!completedChapters.includes(chapterId)) {
      setCompletedChapters([...completedChapters, chapterId])
    }
  }

  const nextChapter = () => {
    if (content && currentChapter < content.education_chapters.length - 1) {
      setCurrentChapter(currentChapter + 1)
    }
  }

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(currentChapter - 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!content) {
    return null
  }

  const currentChapterData = content.education_chapters[currentChapter]
  const canAccess = canAccessChapter(currentChapterData)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">{content.title}</h1>
                <p className="text-gray-600">{content.description}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              {completedChapters.length} / {content.education_chapters.length} 完了
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* サイドバー：チャプターリスト */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="font-semibold mb-4">チャプター</h2>
              <div className="space-y-2">
                {content.education_chapters.map((chapter, index) => (
                  <button
                    key={chapter.id}
                    onClick={() => setCurrentChapter(index)}
                    className={`w-full text-left p-3 rounded-lg transition flex items-center justify-between ${
                      index === currentChapter
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {completedChapters.includes(chapter.id) ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          index === currentChapter
                            ? 'border-blue-600'
                            : 'border-gray-300'
                        }`} />
                      )}
                      <span className="text-sm">{chapter.title}</span>
                    </div>
                    {chapter.is_premium && (
                      <Lock className="w-4 h-4 text-purple-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="lg:col-span-3">
            <motion.div
              key={currentChapter}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-lg shadow-md p-8"
            >
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">
                  {currentChapterData.title}
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>チャプター {currentChapter + 1}</span>
                  {currentChapterData.is_premium && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                      プレミアム
                    </span>
                  )}
                </div>
              </div>

              {canAccess ? (
                <>
                  <div className="prose max-w-none mb-8">
                    {currentChapterData.content.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-4">{paragraph}</p>
                    ))}
                  </div>

                  {/* アクションボタン */}
                  <div className="flex items-center justify-between pt-6 border-t">
                    <button
                      onClick={prevChapter}
                      disabled={currentChapter === 0}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>前のチャプター</span>
                    </button>

                    <button
                      onClick={() => handleChapterComplete(currentChapterData.id)}
                      className={`px-6 py-2 rounded-lg transition ${
                        completedChapters.includes(currentChapterData.id)
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {completedChapters.includes(currentChapterData.id)
                        ? '完了済み'
                        : '完了にする'}
                    </button>

                    <button
                      onClick={nextChapter}
                      disabled={currentChapter === content.education_chapters.length - 1}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                    >
                      <span>次のチャプター</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">
                    プレミアムコンテンツ
                  </h3>
                  <p className="text-gray-600 mb-6">
                    このチャプターはプレミアム会員限定です
                  </p>
                  <Link
                    href="/membership/upgrade"
                    className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                  >
                    プレミアムにアップグレード
                  </Link>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 5. セキュリティとパフォーマンス

#### 5.1 Row Level Security (RLS) ポリシー

```sql
-- 教育コンテンツの閲覧ポリシー
CREATE POLICY "Public can view published education contents"
ON education_contents FOR SELECT
USING (is_published = true);

-- 管理者のみ作成・更新・削除可能
CREATE POLICY "Admins can manage education contents"
ON education_contents FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  )
);

-- チャプターの閲覧ポリシー
CREATE POLICY "Public can view chapters of published contents"
ON education_chapters FOR SELECT
USING (
  content_id IN (
    SELECT id FROM education_contents WHERE is_published = true
  )
);

-- プレミアムチャプターのアクセス制限
CREATE OR REPLACE FUNCTION can_access_premium_chapter(chapter_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- チャプターがプレミアムでない場合は誰でもアクセス可能
  IF NOT EXISTS (
    SELECT 1 FROM education_chapters 
    WHERE id = chapter_id AND is_premium = true
  ) THEN
    RETURN true;
  END IF;
  
  -- ユーザーがログインしていない場合はアクセス不可
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;
  
  -- プレミアム会員または管理者の場合はアクセス可能
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND (membership_type = 'premium' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 6. 追加機能

#### 6.1 検索機能
```typescript
// 全文検索用のインデックス
CREATE INDEX idx_education_contents_search 
ON education_contents 
USING gin(to_tsvector('japanese', title || ' ' || description));

// 検索API
const searchContents = async (query: string) => {
  const { data, error } = await supabase
    .from('education_contents')
    .select('*')
    .textSearch('title,description', query, {
      type: 'websearch',
      config: 'japanese'
    })
    .eq('is_published', true)
    .limit(20)
}
```

#### 6.2 進捗保存
```sql
CREATE TABLE education_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES education_contents(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES education_chapters(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, chapter_id)
);
```

### 7. デプロイメントチェックリスト

1. **データベース設定**
   - [ ] テーブル作成SQL実行
   - [ ] RLSポリシー設定
   - [ ] インデックス作成

2. **環境変数**
   - [ ] `NEXT_PUBLIC_SUPABASE_URL`
   - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - [ ] `SUPABASE_SERVICE_ROLE_KEY`

3. **フロントエンド**
   - [ ] 全ファイルをプロジェクトに配置
   - [ ] 依存関係インストール (`framer-motion`, `lucide-react`, etc.)
   - [ ] スタイリング調整

4. **テスト**
   - [ ] 管理者ログインでコンテンツ作成
   - [ ] 公開・非公開の切り替え
   - [ ] アクセス制限の動作確認
   - [ ] レスポンシブデザイン確認

### 8. カスタマイズポイント

1. **カテゴリーの変更**
   - `category`の選択肢を業界に合わせて変更

2. **アクセスレベル**
   - 必要に応じてアクセスレベルを追加（例：`gold`, `platinum`）

3. **コンテンツタイプ**
   - 動画埋め込み対応
   - PDFダウンロード機能
   - クイズ機能

4. **通知機能**
   - 新コンテンツ公開時のメール通知
   - 進捗リマインダー

このシステムを実装することで、教育コンテンツを効率的に作成・管理・配信できるようになります。