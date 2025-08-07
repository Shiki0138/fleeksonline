import './globals.css'

export const metadata = {
  title: 'FLEEKS Platform',
  description: '美容業界プロフェッショナル向け学習プラットフォーム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
