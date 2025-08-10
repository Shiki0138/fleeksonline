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

async function checkVideoDurations() {
  console.log('📹 現在の動画時間を確認中...')
  
  try {
    const { data: videos, error } = await supabase
      .from('fleeks_videos')
      .select('id, title, youtube_id, duration')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 動画取得エラー:', error.message)
      return
    }
    
    if (!videos || videos.length === 0) {
      console.log('📺 動画が見つかりません')
      return
    }
    
    console.log(`\n📊 ${videos.length}本の動画時間:`)
    console.log('=' * 50)
    
    videos.forEach((video, index) => {
      const minutes = Math.floor(video.duration / 60)
      const seconds = video.duration % 60
      const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`
      
      console.log(`${index + 1}. ${video.title}`)
      console.log(`   YouTube ID: ${video.youtube_id || '❌ なし'}`)
      console.log(`   時間: ${video.duration}秒 (${timeString})`)
      console.log('')
    })
    
    const allSame = videos.every(v => v.duration === 300)
    if (allSame) {
      console.log('⚠️  すべての動画が5分(300秒)になっています')
      console.log('🔧 YouTube APIでの更新が必要です')
    } else {
      console.log('✅ 動画時間は更新済みです')
    }
    
  } catch (error) {
    console.error('❌ 予期しないエラー:', error)
  }
}

checkVideoDurations()