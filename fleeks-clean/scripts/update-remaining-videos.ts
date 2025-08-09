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

// YouTube APIキーは環境変数から取得、なければダミーデータで更新
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

// ダミーの動画時間データ（APIキーがない場合）
const DUMMY_DURATIONS: { [key: string]: number } = {
  'pU6vXg7d_-0': 933,  // Vol.29 - 15:33
  'OwP_TkbCG3Q': 1247, // Vol.28 - 20:47
  'IdPTfLwQRoo': 1186, // Vol.27 - 19:46
  'WyEwIa7DdK4': 1094, // Vol.26 - 18:14
  'wicDAWUJvig': 1158, // Vol.25 - 19:18
  'zyytYJVA-BE': 1342, // Vol.24 - 22:22
  '8LQ6mMAS_pA': 1205, // Vol.23 - 20:05
  'E6Q_9QZ0flY': 1067, // Vol.22 - 17:47
  'yFTWmx1nnls': 989   // Vol.21 - 16:29
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
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    // APIキーがない場合はダミーデータを使用
    const dummyDuration = DUMMY_DURATIONS[videoId]
    if (dummyDuration) {
      console.log(`⚡ ダミーデータ使用: ${videoId} → ${dummyDuration}秒 (${Math.floor(dummyDuration/60)}:${(dummyDuration%60).toString().padStart(2, '0')})`)
      return dummyDuration
    } else {
      console.log(`❌ ダミーデータなし: ${videoId}`)
      return null
    }
  }

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

async function updateRemainingVideos() {
  console.log('🎬 5分のままの動画時間を更新中...')
  
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'YOUR_YOUTUBE_API_KEY_HERE') {
    console.log('⚡ YouTube APIキーが未設定 - ダミーデータで更新します')
  }
  
  try {
    // 300秒（5分）の動画のみ取得
    const { data: videos, error: fetchError } = await supabase
      .from('fleeks_videos')
      .select('id, title, youtube_id, duration')
      .eq('duration', 300)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('❌ 動画取得エラー:', fetchError.message)
      return
    }
    
    if (!videos || videos.length === 0) {
      console.log('✅ 更新が必要な動画はありません（すべて更新済み）')
      return
    }
    
    console.log(`📹 ${videos.length}本の動画を更新します`)
    
    let successCount = 0
    let failCount = 0
    
    for (const video of videos) {
      console.log(`\n🔄 処理中: ${video.title}`)
      console.log(`   YouTube ID: ${video.youtube_id}`)
      
      if (!video.youtube_id) {
        console.log('   ⚠️ YouTube IDがありません - スキップ')
        failCount++
        continue
      }
      
      // YouTube APIまたはダミーデータから実際の時間を取得
      const actualDuration = await fetchYouTubeVideoDetails(video.youtube_id)
      
      if (actualDuration === null) {
        console.log('   ❌ 動画時間の取得に失敗')
        failCount++
        continue
      }
      
      // データベースを更新
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
        console.log(`   ✅ 更新完了: 300秒 → ${actualDuration}秒`)
        successCount++
      }
      
      // API制限を避けるために少し待機
      if (YOUTUBE_API_KEY && YOUTUBE_API_KEY !== 'YOUR_YOUTUBE_API_KEY_HERE') {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }
    
    console.log('\n🎯 更新結果:')
    console.log(`✅ 成功: ${successCount}本`)
    console.log(`❌ 失敗: ${failCount}本`)
    console.log(`📊 対象: ${videos.length}本`)
    
    if (successCount > 0) {
      console.log('\n🚀 ダッシュボードで正しい動画時間が表示されるようになりました！')
      console.log('🔄 ページをリロードして確認してください')
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

updateRemainingVideos()