import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/admin/settings - Get system settings (without sensitive data)
export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Get settings from database (create table if needed)
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('*')
      .single()
    
    if (error && error.code === 'PGRST116') {
      // No settings found, return defaults
      return NextResponse.json({
        siteName: 'FLEEKS Platform',
        siteDescription: 'ビジネスと個人開発のための動画プラットフォーム',
        contactEmail: 'support@fleeks.jp',
        maintenanceMode: false,
        allowRegistration: true,
        requireEmailVerification: true,
        freeVideoLimit: 300,
        emailNotifications: true,
        // Don't send sensitive keys to client
        hasStripeKeys: !!process.env.STRIPE_SECRET_KEY,
        hasOpenAIKey: !!process.env.OPENAI_API_KEY
      })
    }
    
    // Remove sensitive data before sending to client
    const { 
      stripe_secret_key, 
      openai_api_key, 
      slack_webhook,
      ...safeSettings 
    } = settings || {}
    
    return NextResponse.json({
      ...safeSettings,
      hasStripeKeys: !!stripe_secret_key || !!process.env.STRIPE_SECRET_KEY,
      hasOpenAIKey: !!openai_api_key || !!process.env.OPENAI_API_KEY
    })
    
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/settings - Update system settings
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check admin role
    const { data: profile } = await supabase
      .from('fleeks_profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    const body = await request.json()
    
    // Separate sensitive and non-sensitive settings
    const {
      stripePublicKey,
      stripeSecretKey,
      openaiApiKey,
      slackWebhook,
      ...generalSettings
    } = body
    
    // Update or insert settings
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        id: 1, // Single row for system settings
        ...generalSettings,
        // Only update sensitive fields if they're provided and not empty
        ...(stripeSecretKey && stripeSecretKey !== '********' ? { stripe_secret_key: stripeSecretKey } : {}),
        ...(openaiApiKey && openaiApiKey !== '********' ? { openai_api_key: openaiApiKey } : {}),
        ...(slackWebhook && slackWebhook !== '********' ? { slack_webhook: slackWebhook } : {}),
        updated_at: new Date().toISOString()
      })
    
    if (error) {
      console.error('Error updating settings:', error)
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
    
    // Log the settings update for audit
    await supabase
      .from('audit_logs')
      .insert({
        user_id: user.id,
        action: 'settings_update',
        details: { updated_fields: Object.keys(body) }
      })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}