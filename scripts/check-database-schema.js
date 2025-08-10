#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

// Environment setup
const SUPABASE_URL = 'https://kbvaekypkszvzrwlbkug.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtidmFla3lwa3N6dnpyd2xia3VnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTAwNDk3OSwiZXhwIjoyMDY0NTgwOTc5fQ.Tcidqsnp3OcjWJlF2OmC_JD0b3D7spk_5G4VqCf3OPk'

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkDatabaseSchema() {
  console.log('🔍 データベーススキーマ確認中...\n')

  try {
    // 1. テーブル一覧を取得（スキップして直接確認）
    console.log('📋 直接テーブル確認を開始します...')

    // 2. fleeks_profilesテーブル構造確認
    console.log('\n🏗️  fleeks_profilesテーブル構造:')
    const { data: fleeksProfiles, error: fleeksError } = await supabaseAdmin
      .from('fleeks_profiles')
      .select('*')
      .limit(1)

    if (fleeksError) {
      console.error('❌ fleeks_profiles エラー:', fleeksError)
    } else {
      console.log('✅ fleeks_profiles テーブル存在確認')
      if (fleeksProfiles && fleeksProfiles.length > 0) {
        console.log('📊 カラム一覧:', Object.keys(fleeksProfiles[0]))
      } else {
        console.log('📊 テーブルは空です')
      }
    }

    // 3. auth.usersテーブル確認（管理者用）
    console.log('\n👤 auth.users テーブル確認:')
    const { data: authUsers, error: authError } = await supabaseAdmin
      .from('users')
      .select('id, email, email_confirmed_at, created_at')
      .limit(5)

    if (authError) {
      console.error('❌ auth.users アクセスエラー:', authError)
    } else {
      console.log('✅ 認証ユーザー数:', authUsers.length)
      if (authUsers.length > 0) {
        authUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`)
        })
      }
    }

    // 4. 他の関連テーブル確認
    const tablesToCheck = ['beauty_users', 'profiles', 'users_fleeks']
    
    for (const table of tablesToCheck) {
      console.log(`\n🔍 ${table} テーブル確認:`)
      const { data, error } = await supabaseAdmin
        .from(table)
        .select('*')
        .limit(1)

      if (error) {
        console.log(`❌ ${table} エラー:`, error.message)
      } else {
        console.log(`✅ ${table} テーブル存在`)
        if (data && data.length > 0) {
          console.log(`📊 カラム:`, Object.keys(data[0]))
        } else {
          console.log('📊 テーブルは空です')
        }
      }
    }

    // 5. greenroom51@gmail.comを別テーブルで検索
    console.log('\n🔍 greenroom51@gmail.com をすべてのテーブルで検索:')
    
    const searchTables = ['fleeks_profiles', 'beauty_users', 'profiles']
    for (const table of searchTables) {
      try {
        console.log(`\n検索中: ${table}`)
        
        // まず全データを取得してemailフィールドを探す
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('*')
          .limit(10)

        if (error) {
          console.log(`❌ ${table} エラー:`, error.message)
          continue
        }

        if (data && data.length > 0) {
          const sample = data[0]
          const emailFields = Object.keys(sample).filter(key => 
            key.toLowerCase().includes('email') || 
            key.toLowerCase().includes('mail')
          )
          
          console.log(`📧 メール関連フィールド:`, emailFields)
          
          // greenroom51を含む値を検索
          for (const item of data) {
            for (const [key, value] of Object.entries(item)) {
              if (typeof value === 'string' && value.includes('greenroom51')) {
                console.log(`🎯 発見: ${table}.${key} = ${value}`)
              }
            }
          }
        }
      } catch (err) {
        console.log(`❌ ${table} 検索エラー:`, err.message)
      }
    }

  } catch (error) {
    console.error('❌ 全体エラー:', error)
  }
}

checkDatabaseSchema()