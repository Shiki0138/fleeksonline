'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, Crown, Shield, Calendar, Mail, Search, Key, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  username?: string
  full_name?: string
  membership_type: 'free' | 'premium' | 'vip'
  membership_expires_at?: string
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'free' | 'premium' | 'admin'>('all')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // fleeks_profilesを取得
      const { data: profiles, error: profileError } = await supabase
        .from('fleeks_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) throw profileError

      // beauty_usersからメールアドレスを取得
      const userIds = profiles?.map(p => p.id) || []
      const { data: beautyUsers, error: userError } = await supabase
        .from('beauty_users')
        .select('id, email, created_at')
        .in('id', userIds)

      if (userError) throw userError

      // データを結合
      const userMap = new Map(beautyUsers?.map(u => [u.id, u]) || [])
      const formattedUsers = profiles?.map(profile => ({
        id: profile.id,
        email: userMap.get(profile.id)?.email || 'Unknown',
        username: profile.username,
        full_name: profile.full_name,
        membership_type: profile.membership_type,
        membership_expires_at: profile.membership_expires_at,
        role: profile.role,
        created_at: userMap.get(profile.id)?.created_at || profile.created_at,
        updated_at: profile.updated_at
      })) || []

      setUsers(formattedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('ユーザー情報の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMembership = async (userId: string, newType: string) => {
    try {
      const { error } = await supabase
        .from('fleeks_profiles')
        .update({ 
          membership_type: newType,
          membership_expires_at: newType === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('メンバーシップを更新しました')
      fetchUsers()
    } catch (error) {
      console.error('Error updating membership:', error)
      toast.error('メンバーシップの更新に失敗しました')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('fleeks_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      toast.success('ロールを更新しました')
      fetchUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      toast.error('ロールの更新に失敗しました')
    }
  }

  const handlePasswordUpdate = async () => {
    if (!selectedUser || !newPassword) return
    
    setIsUpdatingPassword(true)
    try {
      // Supabase Admin APIを使用してパスワードを更新
      const { error } = await supabase.auth.admin.updateUserById(
        selectedUser.id,
        { password: newPassword }
      )

      if (error) throw error

      toast.success('パスワードを更新しました')
      setShowPasswordModal(false)
      setNewPassword('')
      setSelectedUser(null)
    } catch (error) {
      console.error('Error updating password:', error)
      toast.error('パスワードの更新に失敗しました')
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handlePasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) throw error

      toast.success('パスワードリセットメールを送信しました')
    } catch (error) {
      console.error('Error sending reset email:', error)
      toast.error('リセットメールの送信に失敗しました')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMembershipBadge = (type: string) => {
    switch (type) {
      case 'vip':
        return <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-3 py-1 rounded-full text-xs font-bold">VIP</span>
      case 'premium':
        return <span className="bg-gradient-to-r from-purple-400 to-pink-400 text-white px-3 py-1 rounded-full text-xs font-bold">Premium</span>
      case 'free':
        return <span className="bg-gray-500/20 text-gray-400 px-3 py-1 rounded-full text-xs">Free</span>
      default:
        return null
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' ||
                         (filter === 'admin' && user.role === 'admin') ||
                         (filter === user.membership_type)
    
    return matchesSearch && matchesFilter
  })

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

          <h1 className="text-3xl font-bold mb-8 flex items-center">
            <Users className="w-8 h-8 mr-3 text-green-500" />
            ユーザー管理
          </h1>

          {/* 検索とフィルター */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="メールアドレス、名前で検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex space-x-4">
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
                onClick={() => setFilter('free')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'free' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                無料会員
              </button>
              <button
                onClick={() => setFilter('premium')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'premium' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                プレミアム
              </button>
              <button
                onClick={() => setFilter('admin')}
                className={`px-4 py-2 rounded-lg transition ${
                  filter === 'admin' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                管理者
              </button>
            </div>
          </div>

          {/* 統計情報 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">総ユーザー数</h3>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">無料会員</h3>
              <p className="text-2xl font-bold">{users.filter(u => u.membership_type === 'free').length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">プレミアム会員</h3>
              <p className="text-2xl font-bold">{users.filter(u => u.membership_type === 'premium').length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="text-sm text-gray-400 mb-1">VIP会員</h3>
              <p className="text-2xl font-bold">{users.filter(u => u.membership_type === 'vip').length}</p>
            </div>
          </div>

          {/* ユーザー一覧 */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-400">該当するユーザーが見つかりません</p>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-white/5 border-b border-white/10">
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ユーザー</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">メンバーシップ</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">ロール</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">登録日</th>
                      <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">アクション</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{user.full_name || user.username || 'ユーザー'}</p>
                            <p className="text-sm text-gray-400 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getMembershipBadge(user.membership_type)}
                          {user.membership_expires_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              期限: {formatDate(user.membership_expires_at)}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {user.role === 'admin' ? (
                            <span className="flex items-center text-red-400">
                              <Shield className="w-4 h-4 mr-1" />
                              管理者
                            </span>
                          ) : (
                            <span className="text-gray-400">一般ユーザー</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-400 flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(user.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <select
                              value={user.membership_type}
                              onChange={(e) => handleUpdateMembership(user.id, e.target.value)}
                              className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                            >
                              <option value="free" className="bg-gray-800">Free</option>
                              <option value="premium" className="bg-gray-800">Premium</option>
                              <option value="vip" className="bg-gray-800">VIP</option>
                            </select>
                            {user.email !== 'greenroom51@gmail.com' && (
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                                className="bg-white/10 border border-white/20 rounded px-2 py-1 text-sm"
                              >
                                <option value="user" className="bg-gray-800">一般</option>
                                <option value="admin" className="bg-gray-800">管理者</option>
                              </select>
                            )}
                            <button
                              onClick={() => {
                                setSelectedUser(user)
                                setShowPasswordModal(true)
                              }}
                              className="bg-white/10 hover:bg-white/20 p-2 rounded transition"
                              title="パスワード設定"
                            >
                              <Key className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePasswordReset(user.email)}
                              className="bg-white/10 hover:bg-white/20 p-2 rounded transition"
                              title="パスワードリセット"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* パスワード設定モーダル */}
          {showPasswordModal && selectedUser && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4"
              >
                <h3 className="text-xl font-semibold mb-4">パスワード設定</h3>
                <p className="text-gray-400 mb-4">
                  {selectedUser.email} のパスワードを設定します
                </p>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="新しいパスワード"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-blue-400 mb-4"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mb-6">
                  ※ パスワードは8文字以上で設定してください
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={!newPassword || newPassword.length < 8 || isUpdatingPassword}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUpdatingPassword ? '更新中...' : 'パスワードを設定'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(false)
                      setNewPassword('')
                      setSelectedUser(null)
                    }}
                    className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10 transition"
                  >
                    キャンセル
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}