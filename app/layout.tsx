import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'Goldcrest Broker | Premium Investment & Trading Platform',
    template: '%s | Goldcrest Broker',
  },
  description:
    'Trade stocks and cryptocurrencies, access asset-backed investment plans, and earn through our referral program on Goldcrest Broker.',
  keywords: ['investment', 'trading', 'crypto', 'stocks', 'passive income', 'referral program', 'copy trading', 'broker'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Goldcrest Broker | Premium Investment Platform',
    description: 'Asset-backed investment plans with up to 150% ROI. Trade crypto and stocks on the most trusted platform.',
    type: 'website',
    siteName: 'Goldcrest Broker',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Goldcrest Broker',
    description: 'Asset-backed investment plans with up to 150% ROI.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Translate & Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://translate.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://translate.google.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://translate-pa.googleapis.com" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
