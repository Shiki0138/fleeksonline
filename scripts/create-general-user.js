const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// 環境変数チェック
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('エラー: 必要な環境変数が設定されていません')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createGeneralUser() {
  const email = 'mail@invest-master.net'
  const password = 'Skyosai51'
  const fullName = 'Invest Master'

  try {
    // 1. Supabase Authでユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })

    if (authError) {
      console.error('認証ユーザーの作成に失敗しました:', authError)
      return
    }

    console.log('✅ 認証ユーザーを作成しました:', authData.user.id)

    // 2. プロファイルを作成（一般ユーザーとして）
    const { error: profileError } = await supabase
      .from('fleeks_profiles')
      .insert({
        id: authData.user.id,
        username: email.split('@')[0],
        full_name: fullName,
        membership_type: 'free',
        role: 'user' // 一般ユーザー
      })

    if (profileError) {
      console.error('プロファイルの作成に失敗しました:', profileError)
      // ユーザーを削除
      await supabase.auth.admin.deleteUser(authData.user.id)
      return
    }

    console.log('✅ プロファイルを作成しました')
    console.log('=====================================')
    console.log('一般ユーザーアカウントが作成されました:')
    console.log('メールアドレス:', email)
    console.log('パスワード:', password)
    console.log('メンバーシップ: 無料会員')
    console.log('=====================================')

  } catch (error) {
    console.error('エラーが発生しました:', error)
  }
}

createGeneralUser()