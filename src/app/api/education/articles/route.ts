import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Route Segment Configを追加
export const dynamic = 'force-dynamic'

// サンプルデータ生成関数
function generateSampleArticles() {
  const articles = []
  const categories = ['beginner', 'management', 'dx', 'general']
  const today = new Date()
  
  let articleNumber = 1
  categories.forEach((category) => {
    for (let i = 1; i <= 20; i++) {
      const dayOffset = Math.floor((articleNumber - 1) / 2)
      const publishDate = new Date(today)
      publishDate.setDate(today.getDate() - dayOffset) // 過去の日付に設定
      
      articles.push({
        id: `article_${String(articleNumber).padStart(3, '0')}`,
        title: getArticleTitle(category, i),
        category,
        accessLevel: i <= 5 ? 'free' : i <= 15 ? 'partial' : 'premium',
        publishDate: publishDate.toISOString(),
        isPublished: true, // すべて公開済みとして表示
        readTime: 7
      })
      
      articleNumber++
    }
  })
  
  return articles
}

function getArticleTitle(category: string, index: number): string {
  const titles: Record<string, string[]> = {
    beginner: [
      '美容師のための効果的な挨拶とその心理学的効果',
      'アイコンタクトの重要性と実践的なテクニック',
      '初回カウンセリングで信頼を得る5つのポイント',
      'プロの美容師が実践する聴き方の技術',
      '失敗しない！新人美容師のための接客マナー',
      '顧客満足度を高める会話術の基本',
      'クレーム対応の基本と実践的なアプローチ',
      '美容師のための心理学入門：顧客心理を読む',
      'リピーターを増やす接客の極意',
      '施術中の適切な会話のタイミングと内容',
      '顧客の要望を正確に理解する質問技術',
      '美容師のための非言語コミュニケーション',
      '信頼関係を築く第一印象の作り方',
      'プロフェッショナルな立ち振る舞いの基本',
      '顧客タイプ別の接客アプローチ',
      '施術説明を分かりやすく伝える方法',
      '美容師のためのストレス管理と感情コントロール',
      'チームワークを高めるコミュニケーション術',
      '新人美容師が陥りやすい接客の落とし穴',
      '接客スキルを向上させる日々の習慣'
    ],
    management: [
      '美容室の売上を向上させる価格設定の考え方',
      'リピート率90%を実現する顧客管理の方法',
      'スタッフのモチベーションを高める経営手法',
      '効果的な集客戦略とマーケティングの基本',
      '美容室の利益率を改善する経費管理術',
      '成功する美容室の組織作りとスタッフ教育',
      '顧客単価を上げるメニュー開発の秘訣',
      '美容室経営における数値管理の重要性',
      'SNSを活用した効果的な集客方法',
      '予約管理システムで業務効率を向上させる',
      '美容室の立地選定と商圏分析の方法',
      'フランチャイズvs独立開業のメリット・デメリット',
      '資金調達と事業計画書の作成方法',
      '美容室の労務管理と法令遵守のポイント',
      '競合分析と差別化戦略の立て方',
      '顧客満足度調査の実施と活用方法',
      '美容室の在庫管理と仕入れ最適化',
      'スタッフの採用と定着率向上の方法',
      '美容室のブランディング戦略',
      '経営者のためのリーダーシップ論'
    ],
    dx: [
      '美容室のDX化：最初の一歩',
      'オンライン予約システムの導入と活用',
      '顧客データベースの構築と活用方法',
      'POSシステムで売上分析を効率化',
      'タブレットを使った電子カルテの導入',
      'SNS連携による集客自動化の仕組み',
      'クラウド会計で経理業務を効率化',
      '美容室向けCRMシステムの選び方',
      'AIを活用したヘアスタイル提案システム',
      'VRを使った新しい顧客体験の創出',
      'キャッシュレス決済の導入メリット',
      'スタッフシフト管理のデジタル化',
      'オンラインカウンセリングの実施方法',
      'デジタルサイネージを活用した店内演出',
      '美容室アプリの開発と運用のポイント',
      'IoTデバイスを使った在庫管理',
      'ビッグデータ分析で顧客ニーズを把握',
      'セキュリティ対策の基本と実践',
      'DX推進における組織変革の進め方',
      '美容室DXの成功事例と失敗事例'
    ],
    general: [
      '美容業界の最新トレンドと今後の展望',
      'サステナブルな美容室経営の実践',
      'インバウンド顧客への対応方法',
      '美容師のキャリアプランニング',
      '独立開業への道のりと準備',
      '美容師のための健康管理と職業病対策',
      'ヘアケア商品の知識と提案方法',
      '最新の美容技術とトレンド情報',
      '美容師のための写真撮影テクニック',
      'コンテストへの挑戦と準備方法',
      '海外研修で学ぶ最新技術',
      '美容師のための語学学習のすすめ',
      'メンズ美容市場の拡大と対応策',
      'エイジングケアの需要と技術',
      '美容室のSDGsへの取り組み',
      'フリーランス美容師として成功する方法',
      '美容師のための資産形成と将来設計',
      '業界団体との関わり方とメリット',
      '美容師のためのプレゼンテーション術',
      '次世代の美容師教育について考える'
    ]
  }
  
  return titles[category]?.[index - 1] || `${category} 第${index}回`
}

export async function GET() {
  try {
    // Route HandlerではcreateClientを使用
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // 教育コンテンツを取得（デバッグ情報付き）
    console.log('Fetching education contents...')
    
    const { data: contents, error } = await supabase
      .from('education_contents')
      .select(`
        id,
        article_number,
        title,
        slug,
        access_level,
        publish_date,
        reading_time,
        status,
        chapter_id,
        education_chapters (
          id,
          category,
          title,
          chapter_number
        )
      `)
      .eq('status', 'published')
      .lte('publish_date', new Date().toISOString())
      .order('article_number', { ascending: true })
    
    console.log('Query result:', { 
      contentCount: contents?.length || 0,
      error: error?.message 
    })

    if (error) {
      console.error('Error fetching education contents:', error)
      // エラー時は一時的にサンプルデータを返す
      return NextResponse.json({ 
        articles: generateSampleArticles(), 
        error: error.message,
        debug: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          message: 'Using sample data due to database error'
        }
      })
    }
    
    // データが空の場合もサンプルデータを返す
    if (!contents || contents.length === 0) {
      console.log('No contents found, returning sample data')
      return NextResponse.json({ 
        articles: generateSampleArticles(),
        debug: { message: 'No published contents found in database' }
      })
    }

    // クライアント用のフォーマットに変換
    const articles = contents?.map(content => {
      const publishDate = new Date(content.publish_date)
      const now = new Date()
      const isPublished = content.status === 'published' && publishDate <= now

      return {
        id: `article_${String(content.article_number).padStart(3, '0')}`,
        title: content.title,
        category: content.education_chapters?.category || 'general',
        accessLevel: content.access_level,
        publishDate: content.publish_date,
        isPublished,
        readTime: content.reading_time
      }
    }) || []

    return NextResponse.json({ articles })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ articles: [] })
  }
}