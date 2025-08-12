import EducationContentList from '@/components/EducationContentList'
import ArticleFooterCTA from '@/components/ArticleFooterCTA'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const metadata = {
  title: '教育コンテンツ | FLEEKS',
  description: '美容師のためのスキルアップ教育コンテンツ。初心者から経営者まで、80記事で体系的に学べます。',
}

export default async function EducationPage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  
  let isPremiumUser = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_plan')
      .eq('id', user.id)
      .single()
    
    isPremiumUser = profile?.subscription_plan === 'premium'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold text-center mb-4">
            美容師のための教育コンテンツ
          </h1>
          <p className="text-xl text-gray-600 text-center max-w-3xl mx-auto">
            初心者から経営者まで、あなたのレベルに合わせた80記事の体系的な学習プログラム
          </p>
        </div>
      </div>

      <EducationContentList />
      
      {!isPremiumUser && (
        <div className="max-w-7xl mx-auto px-4 pb-16">
          <ArticleFooterCTA isLoggedIn={!!user} isPremiumUser={isPremiumUser} />
        </div>
      )}
    </div>
  )
}
