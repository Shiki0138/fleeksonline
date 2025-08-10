import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// YouTube API Key - 環境変数から取得
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY_HERE'

interface Video {
  id: string
  title: string
  youtube_id: string
  duration: number
}

// ISO 8601 duration (PT15M33S) を秒に変換
function parseYouTubeDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)
  
  return hours * 3600 + minutes * 60 + seconds
}

// YouTube APIから動画の詳細情報を取得
async function fetchYouTubeVideoDetails(videoId: string): Promise<number | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=contentDetails&key=${YOUTUBE_API_KEY}`
    )
    
    if (!response.ok) {
      console.error(`YouTube API error: ${response.status} ${response.statusText}`)
      return null
    }
    
    const data = await response.json()
    
    if (!data.items || data.items.length === 0) {
      console.error(`YouTube video not found: ${videoId}`)
      return null
    }
    
    const duration = data.items[0].contentDetails.duration
    const durationSeconds = parseYouTubeDuration(duration)
    
    console.log(`✅ ${videoId}: ${duration} → ${durationSeconds}秒 (${Math.floor(durationSeconds/60)}:${(durationSeconds%60).toString().padStart(2, '0')})`)
    
    return durationSeconds
    
  } catch (error) {
    console.error(`Error fetching YouTube data for ${videoId}:`, error)
    return null
  }
}

async function updateVideoDurations() {
  console.log('🎬 YouTube APIを使用して動画時間を更新中...')
  console.log('YouTube API Key:', YOUTUBE_API_KEY.substring(0, 10) + '...')
  
  try {
    // データベースから全動画を取得
    const { data: videos, error: fetchError } = await supabase
      .from('fleeks_videos')
      .select('id, title, youtube_id, duration')
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ 動画取得エラー:', fetchError.message)
      return
    }
    
    if (!videos || videos.length === 0) {
      console.log('📺 更新対象の動画がありません')
      return
    }
    
    console.log(`📹 ${videos.length}本の動画を処理します`)
    
    let successCount = 0
    let failCount = 0
    let skippedCount = 0
    
    for (const video of videos as Video[]) {
      console.log(`\n🔄 処理中: ${video.title}`)
      console.log(`   YouTube ID: ${video.youtube_id}`)
      console.log(`   現在の時間: ${video.duration}秒`)
      
      if (!video.youtube_id) {
        console.log('   ⚠️ YouTube IDがありません - スキップ')
        skippedCount++
        continue
      }
      
      // YouTube APIから実際の時間を取得
      const actualDuration = await fetchYouTubeVideoDetails(video.youtube_id)
      
      if (actualDuration === null) {
        console.log('   ❌ YouTube APIからの取得に失敗')
        failCount++
        continue
      }
      
      // 時間が異なる場合のみ更新
      if (actualDuration !== video.duration) {
        const { error: updateError } = await supabase
          .from('fleeks_videos')
          .update({
            duration: actualDuration,
            updated_at: new Date().toISOString()
          })
          .eq('id', video.id)
        
        if (updateError) {
          console.log(`   ❌ 更新エラー: ${updateError.message}`)
          failCount++
        } else {
          console.log(`   ✅ 更新完了: ${video.duration}秒 → ${actualDuration}秒`)
          successCount++
        }
      } else {
        console.log('   ℹ️ 時間は既に正しい値です')
        skippedCount++
      }
      
      // API制限を避けるために少し待機
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
    console.log('\n🎯 更新結果:')
    console.log(`✅ 成功: ${successCount}本`)
    console.log(`❌ 失敗: ${failCount}本`)
    console.log(`⏭️ スキップ: ${skippedCount}本`)
    console.log(`📊 合計: ${videos.length}本`)
    
    if (successCount > 0) {
      console.log('\n🚀 ダッシュボードで正しい動画時間が表示されるようになりました！')
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

// YouTube API Keyの確認
if (YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
  console.error('❌ YouTube API Keyが設定されていません')
  console.error('Google Cloud Consoleで以下の手順を実行してください:')
  console.error('1. https://console.cloud.google.com にアクセス')
  console.error('2. プロジェクトを選択/作成')
  console.error('3. "YouTube Data API v3" を有効化')
  console.error('4. 認証情報でAPI Keyを作成')
  console.error('5. .env.local に YOUTUBE_API_KEY=your_key_here を追加')
  process.exit(1)
}

updateVideoDurations()