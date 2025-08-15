'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Bell, Check, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string
  is_read: boolean
  priority: number
  metadata: any
  created_at: string
  time_ago: string
}

interface NotificationSummary {
  total_notifications: number
  unread_count: number
  unread_questions: number
  high_priority_count: number
  latest_notification: string
}

export default function NotificationBell() {
  const supabase = createClientComponentClient()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchNotifications()
    fetchSummary()
    
    // リアルタイム更新のためのポーリング
    const interval = setInterval(() => {
      fetchSummary()
      if (isOpen) {
        fetchNotifications()
      }
    }, 30000) // 30秒ごと

    return () => clearInterval(interval)
  }, [isOpen])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications')
      const data = await response.json()
      
      if (response.ok) {
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/notifications/summary')
      const data = await response.json()
      
      if (response.ok) {
        setSummary(data.summary)
      }
    } catch (error) {
      console.error('Error fetching notification summary:', error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        )
        fetchSummary()
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/notifications/read-all', {
        method: 'POST'
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, is_read: true }))
        )
        fetchSummary()
        toast.success('すべての通知を既読にしました')
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    if (notification.link) {
      window.location.href = notification.link
    }
    setIsOpen(false)
  }

  const unreadCount = summary?.unread_count || 0
  const hasHighPriority = (summary?.high_priority_count || 0) > 0

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          hasHighPriority 
            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400' 
            : unreadCount > 0
            ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400'
            : 'bg-white/10 hover:bg-white/20 text-gray-400'
        }`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full text-xs font-bold flex items-center justify-center ${
              hasHighPriority 
                ? 'bg-red-500 text-white' 
                : 'bg-purple-500 text-white'
            }`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50"
          >
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">通知</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    disabled={loading}
                    className="text-sm text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                  >
                    すべて既読
                  </button>
                )}
              </div>
              {summary && (
                <div className="flex gap-4 mt-2 text-sm text-gray-400">
                  <span>未読: {summary.unread_count}</span>
                  <span>質問: {summary.unread_questions}</span>
                </div>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-400">
                  通知はありません
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${
                      !notification.is_read 
                        ? 'bg-purple-500/10 hover:bg-purple-500/20' 
                        : 'hover:bg-white/5'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium text-white">
                            {notification.title}
                          </h4>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-purple-500 rounded-full" />
                          )}
                          {notification.priority >= 2 && (
                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <p className="text-sm text-gray-300 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {notification.time_ago}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!notification.is_read) {
                            markAsRead(notification.id)
                          }
                        }}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {notification.is_read ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <X className="w-4 h-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}