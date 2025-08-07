const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminUser() {
  try {
    // 管理者アカウントを作成
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'greenroom51@gmail.com',
      password: 'Fkyosai51',
      email_confirm: true,
      user_metadata: {
        full_name: 'システム管理者',
        role: 'admin'
      }
    })

    if (error) {
      console.error('管理者作成エラー:', error)
      return
    }

    console.log('管理者アカウントが作成されました:')
    console.log('メールアドレス: greenroom51@gmail.com')
    console.log('パスワード: Fkyosai51')
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

createAdminUser()