'use client'

import { useState } from 'react'
import { Plus, Search, Bell } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function ForumHeader() {
  const [searchQuery, setSearchQuery] = useState('')
  const { user } = useAuth()

  return (
    <div className="bg-gradient-to-r from-purple-900 to-pink-900 text-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              運営サポートフォーラム
            </h1>
            <p className="text-purple-100 text-lg">
              インスタ集客・AI活用・経営戦略についてご質問ください
            </p>
          </div>
          
          {user && (
            <div className="flex gap-3">
              <Link
                href="/forum/notifications"
                className="bg-white/20 backdrop-blur p-3 rounded-lg hover:bg-white/30 transition"
              >
                <Bell className="w-5 h-5" />
              </Link>
              <Link
                href="/forum/questions/new"
                className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                質問する
              </Link>
            </div>
          )}
        </div>
        
        {/* 検索バー */}
        <div className="mt-8 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="キーワードで検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
        
        {/* 統計情報 */}
        <div className="mt-8 flex flex-wrap gap-8 text-sm">
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-purple-100">質問総数</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0</div>
            <div className="text-purple-100">回答総数</div>
          </div>
          <div>
            <div className="text-2xl font-bold">0%</div>
            <div className="text-purple-100">解決率</div>
          </div>
        </div>
      </div>
    </div>
  )
}