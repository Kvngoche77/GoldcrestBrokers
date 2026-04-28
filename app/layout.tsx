import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Goldcrest Broker | Premium Investment & Trading Platform',
  description:
    'Trade stocks and cryptocurrencies, access asset-backed investment plans, and earn through our referral program on Goldcrest Broker.',
  keywords: 'investment, trading, crypto, stocks, passive income, referral program',
  openGraph: {
    title: 'Goldcrest Broker | Premium Investment Platform',
    description: 'Asset-backed investment plans with up to 150% ROI. Trade crypto and stocks on the most trusted platform.',
    type: 'website',
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
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
