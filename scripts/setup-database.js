#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('🗄️ Supabaseデータベーススキーマセットアップ開始...\n')

// 環境変数を読み込み
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ エラー: Supabase環境変数が設定されていません')
  console.log('以下を.env.localファイルに設定してください:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 管理者権限でSupabaseクライアント作成
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// スキーマファイルを読み込み
const schemaPath = path.join(__dirname, '..', 'src', 'supabase-schema.sql')
let schema

try {
  schema = fs.readFileSync(schemaPath, 'utf8')
} catch (error) {
  console.error('❌ スキーマファイルが見つかりません:', schemaPath)
  process.exit(1)
}

// SQLを実行する関数
async function executeSQL(sql) {
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: sql })
  
  if (error) {
    console.error('SQL実行エラー:', error)
    return false
  }
  
  return true
}

// メイン処理
async function setupDatabase() {
  try {
    console.log('📡 Supabaseに接続中...')
    
    // 接続テスト
    const { data, error } = await supabase.from('beauty_users').select('count').limit(1)
    
    if (error && error.code !== 'PGRST116') { // テーブルが存在しない場合のエラーコードを除外
      console.error('❌ Supabase接続エラー:', error.message)
      return
    }
    
    console.log('✅ Supabase接続成功\n')
    
    // スキーマを段階的に実行
    console.log('🏗️ データベーススキーマを作成中...')
    
    // SQLを分割して実行
    const sqlStatements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📄 ${sqlStatements.length}個のSQL文を実行します\n`)
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i] + ';'
      
      // CREATE文の種類を特定
      const createMatch = statement.match(/CREATE\s+(\w+)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)/i)
      const objType = createMatch ? createMatch[1].toUpperCase() : 'SQL'
      const objName = createMatch ? createMatch[2] : `Statement ${i + 1}`
      
      process.stdout.write(`⏳ ${objType} ${objName} を作成中...`)
      
      try {
        // 直接SQLクエリを実行（RPCではなく）
        const { error } = await supabase.rpc('exec', { sql: statement })
        
        if (error) {
          // すでに存在する場合は警告レベル
          if (error.message.includes('already exists')) {
            console.log(' ⚠️  既に存在します')
          } else {
            console.log(' ❌ エラー')
            console.error(`   Error: ${error.message}`)
          }
        } else {
          console.log(' ✅ 完了')
        }
        
      } catch (err) {
        console.log(' ❌ エラー')
        console.error(`   Error: ${err.message}`)
      }
    }
    
    console.log('\n🎉 データベースセットアップ完了!')
    console.log('\n📊 作成されたテーブル:')
    console.log('- beauty_users (ユーザー情報)')
    console.log('- beauty_videos (動画データ)')
    console.log('- beauty_interactions (ユーザーインタラクション)')
    console.log('- beauty_recommendations (AI推薦)')
    console.log('- beauty_posts (コミュニティ投稿)')
    console.log('- beauty_conversations (AI会話)')
    console.log('- beauty_challenges (ゲーミフィケーション)')
    console.log('- beauty_achievements (実績)')
    console.log('- beauty_profiles (美容プロフィール)')
    console.log('- beauty_scheduled_content (コンテンツスケジュール)')
    console.log('- beauty_security_logs (セキュリティログ)')
    
    console.log('\n🚀 次のステップ:')
    console.log('1. npm run dev でアプリを起動')
    console.log('2. ブラウザで http://localhost:3000 にアクセス')
    console.log('3. Google認証でログイン')
    
  } catch (error) {
    console.error('❌ セットアップ中にエラーが発生しました:', error)
  }
}

// サンプルデータを挿入する関数
async function insertSampleData() {
  console.log('\n📝 サンプルデータを挿入中...')
  
  // サンプル動画データ
  const sampleVideos = [
    {
      title: '美容師のためのSNS集客入門',
      description: 'InstagramとTikTokを活用した効果的な集客方法を学びます',
      youtube_id: 'sample_video_1',
      category: 'マーケティング',
      tags: ['SNS', 'Instagram', 'TikTok', '集客'],
      is_premium: true,
      preview_seconds: 300,
      view_count: 125
    },
    {
      title: 'AI活用で効率化！美容室経営の未来',
      description: '最新のAI技術を使って美容室の業務を効率化する方法',
      youtube_id: 'sample_video_2', 
      category: 'テクノロジー',
      tags: ['AI', '効率化', '経営', '未来'],
      is_premium: true,
      preview_seconds: 300,
      view_count: 89
    },
    {
      title: 'カラーリング技術の基礎から応用まで',
      description: 'プロのカラーリスト直伝！基礎技術から最新トレンドまで',
      youtube_id: 'sample_video_3',
      category: '技術',
      tags: ['カラー', '技術', 'トレンド'],
      is_premium: false,
      preview_seconds: 180,
      view_count: 203
    }
  ]
  
  try {
    const { data, error } = await supabase
      .from('beauty_videos')
      .insert(sampleVideos)
    
    if (error) {
      console.error('サンプルデータ挿入エラー:', error)
    } else {
      console.log('✅ サンプル動画データを挿入しました')
    }
  } catch (error) {
    console.error('サンプルデータ挿入中にエラー:', error)
  }
}

// 実行
setupDatabase().then(() => {
  insertSampleData()
})