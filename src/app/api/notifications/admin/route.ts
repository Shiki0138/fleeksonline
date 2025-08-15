import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 管理者へのプッシュ通知送信
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, title, message, questionId, questionTitle } = body

    // 管理者のデバイストークンを取得
    const { data: admins } = await supabase
      .from('fleeks_profiles')
      .select('id, push_token, notification_preferences')
      .eq('role', 'admin')
      .not('push_token', 'is', null)

    if (!admins || admins.length === 0) {
      return NextResponse.json({ message: 'No admin devices found' })
    }

    // 各管理者にプッシュ通知を送信
    const notifications = []
    for (const admin of admins) {
      // 通知設定をチェック
      const prefs = admin.notification_preferences || {}
      if (prefs.forum_notifications === false) {
        continue
      }

      // データベースに通知を記録
      const { data: notification } = await supabase
        .from('notifications')
        .insert({
          user_id: admin.id,
          type,
          title,
          message,
          link: questionId ? `/admin/forum?question=${questionId}` : '/admin/forum',
          metadata: {
            questionId,
            questionTitle,
            timestamp: new Date().toISOString()
          }
        })
        .select()
        .single()

      notifications.push(notification)

      // プッシュ通知を送信
      if (admin.push_token) {
        try {
          await sendPushNotification({
            token: admin.push_token,
            title,
            body: message,
            data: {
              type,
              questionId,
              url: `/admin/forum?question=${questionId}`
            }
          })
        } catch (error) {
          console.error('Push notification failed:', error)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      notifications,
      adminCount: admins.length 
    })
  } catch (error) {
    console.error('Error sending admin notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// プッシュ通知送信関数
async function sendPushNotification({ token, title, body, data }: {
  token: string
  title: string
  body: string
  data?: any
}) {
  // Web Push通知の送信
  const payload = {
    notification: {
      title,
      body,
      icon: '/icons/favicon-96x96.png',
      badge: '/icons/favicon-96x96.png',
      tag: 'forum-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: '確認する'
        },
        {
          action: 'close',
          title: '閉じる'
        }
      ],
      data
    }
  }

  // ここでWeb Push APIまたはFirebase Cloud Messagingを使用
  // 今回はAPIの枠組みのみ実装
  console.log('Push notification sent:', payload)
}