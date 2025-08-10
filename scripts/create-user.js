const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.production' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUser(email, password, fullName, role = 'user', membershipType = 'free') {
  try {
    // ユーザーアカウントを作成
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: role
      }
    })

    if (error) {
      console.error('ユーザー作成エラー:', error)
      return
    }

    console.log('ユーザーアカウントが作成されました:')
    console.log('メールアドレス:', email)
    console.log('パスワード:', password)
    console.log('ユーザーID:', data.user.id)

    // プロフィールテーブルにユーザー情報を追加
    const { error: profileError } = await supabase
      .from('fleeks_profiles')
      .insert({
        id: data.user.id,
        full_name: fullName,
        role: role,
        membership_type: membershipType
      })

    if (profileError) {
      console.error('プロフィール作成エラー:', profileError)
    } else {
      console.log('ユーザープロフィールが作成されました')
    }

  } catch (err) {
    console.error('エラーが発生しました:', err)
  }
}

// 新規ユーザーを作成
createUser('mail@invest-master.net', 'SecurePassword123!', 'Invest Master User')