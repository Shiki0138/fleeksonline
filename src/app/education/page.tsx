import EducationContentListNew from '@/components/EducationContentListNew'

export const metadata = {
  title: '教育コンテンツ | FLEEKS',
  description: '美容師のためのスキルアップ教育コンテンツ。初心者から経営者まで、80記事で体系的に学べます。',
}

export default async function EducationPage() {
  return <EducationContentListNew />
}
