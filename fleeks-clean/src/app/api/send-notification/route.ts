import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Note: Install web-push package for production use
// npm install web-push

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    if (!userData?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { title, body, url, userIds } = await request.json()

    // Get push subscriptions for target users
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds || [])

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    // In production, use web-push library to send notifications
    // Example implementation:
    /*
    const webpush = require('web-push')
    
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    )

    const notifications = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth
            }
          },
          JSON.stringify({
            title,
            body,
            url,
            icon: '/icon-192x192.png',
            badge: '/icon-72x72.png'
          })
        )
        return { userId: subscription.user_id, success: true }
      } catch (error) {
        console.error('Push failed for user:', subscription.user_id, error)
        return { userId: subscription.user_id, success: false }
      }
    })

    const results = await Promise.all(notifications)
    */

    // For now, just save to notification history
    const notificationRecords = userIds.map((userId: string) => ({
      user_id: userId,
      title,
      body,
      url
    }))

    await supabase
      .from('notification_history')
      .insert(notificationRecords)

    return NextResponse.json({ 
      success: true, 
      message: 'Notifications queued',
      count: userIds.length 
    })
  } catch (error) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}