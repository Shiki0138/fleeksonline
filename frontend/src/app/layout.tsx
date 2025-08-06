import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Fleeks - AI-Powered Beauty Platform',
  description: 'Experience beauty through AI with AR try-ons, gesture control, and personalized recommendations',
  manifest: '/manifest.json',
  themeColor: '#9333EA',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  keywords: 'beauty, AI, AR, makeup, skincare, cosmetics, virtual try-on',
  authors: [{ name: 'Fleeks Team' }],
  openGraph: {
    title: 'Fleeks - AI-Powered Beauty Platform',
    description: 'Experience beauty through AI with AR try-ons, gesture control, and personalized recommendations',
    type: 'website',
    locale: 'en_US',
    siteName: 'Fleeks',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fleeks - AI-Powered Beauty Platform',
    description: 'Experience beauty through AI with AR try-ons, gesture control, and personalized recommendations',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}