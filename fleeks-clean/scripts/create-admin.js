const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

async function createAdminUser() {
  // Use environment variables or command line arguments
  const adminEmail = process.env.ADMIN_EMAIL || process.argv[2] || 'admin@fleeks.jp'
  const adminPassword = process.env.ADMIN_PASSWORD || process.argv[3] || generateSecurePassword()
  const adminName = process.env.ADMIN_NAME || process.argv[4] || 'システム管理者'
  
  try {
    // 管理者アカウントを作成
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: 'admin'
      }
    })

    if (error) {
      console.error('管理者作成エラー:', error)
      return
    }

    console.log('管理者アカウントが作成されました:')
    console.log('メールアドレス:', adminEmail)
    console.log('パスワード:', adminPassword)
    console.log('ユーザーID:', data.user.id)

    // プロフィールテーブルに管理者情報を追加
    const { error: profileError } = await supabase
      .from('fleeks_profiles')
      .insert({
        id: data.user.id,
        full_name: 'システム管理者',
        role: 'admin',
        membership_type: 'vip'
      })

    if (profileError) {
      console.error('プロフィール作成エラー:', profileError)
    } else {
      console.log('管理者プロフィールが作成されました')
    }

  } catch (err) {
    console.error('エラーが発生しました:', err)
  }
}

// Usage instructions
if (process.argv.length > 2 && process.argv[2] === '--help') {
  console.log('Usage: node create-admin.js [email] [password] [fullName]')
  console.log('Or set environment variables: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME')
  process.exit(0)
}

createAdminUser()