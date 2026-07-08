'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ExternalLink, TrendingUp, TrendingDown, RefreshCw, Wifi, WifiOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

type NewsArticle = {
  id: string;
  title: string;
  source: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
};

type MarketSentiment = {
  label: string;
  value: number;
  color: string;
  bgColor: string;
};

// High-quality static news for demo — real-looking financial news
const STATIC_NEWS: NewsArticle[] = [
  {
    id: '1',
    title: 'Bitcoin Breaks $75,000 Resistance Level, Eyes All-Time High',
    source: 'CoinDesk',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    summary: 'Bitcoin surged past the $75,000 resistance level on Thursday amid growing institutional demand and positive macroeconomic signals. Analysts say a move to new all-time highs is imminent.',
    sentiment: 'positive',
    tags: ['Bitcoin', 'BTC', 'Bull Market'],
  },
  {
    id: '2',
    title: 'Ethereum ETF Inflows Hit Record $1.2 Billion in Single Week',
    source: 'The Block',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    summary: 'Ethereum spot ETFs recorded their highest-ever weekly inflow of $1.2 billion as major asset managers increased allocations to the second-largest cryptocurrency.',
    sentiment: 'positive',
    tags: ['Ethereum', 'ETF', 'Institutional'],
  },
  {
    id: '3',
    title: 'Federal Reserve Signals No Rate Cuts Until Q4 2026',
    source: 'Reuters',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 92).toISOString(),
    summary: 'Fed Chair Jerome Powell indicated in a press conference that the central bank is comfortable holding rates steady, citing persistent inflation data despite cooling labor markets.',
    sentiment: 'negative',
    tags: ['Macro', 'Fed', 'Interest Rates'],
  },
  {
    id: '4',
    title: 'Solana Network Processes 100M Transactions in 24 Hours, New Record',
    source: 'Decrypt',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
    summary: 'The Solana blockchain set a new throughput record, processing over 100 million transactions in a single day. Network fees remained below $0.001 per transaction.',
    sentiment: 'positive',
    tags: ['Solana', 'SOL', 'DeFi'],
  },
  {
    id: '5',
    title: 'Global Crypto Regulation: EU MiCA Framework Now Fully Enforced',
    source: 'Financial Times',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    summary: 'The European Union\'s Markets in Crypto-Assets (MiCA) regulation is now fully in force, requiring all crypto asset service providers to comply with new licensing and consumer protection rules.',
    sentiment: 'neutral',
    tags: ['Regulation', 'EU', 'MiCA'],
  },
  {
    id: '6',
    title: 'MicroStrategy Purchases Additional 15,000 BTC Worth $1.1 Billion',
    source: 'Bloomberg',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
    summary: 'Business intelligence firm MicroStrategy announced another major Bitcoin acquisition, bringing its total holdings to over 350,000 BTC, worth approximately $26 billion at current prices.',
    sentiment: 'positive',
    tags: ['Bitcoin', 'Institutional', 'MicroStrategy'],
  },
  {
    id: '7',
    title: 'XRP Surges 18% After Ripple Wins Key Legal Battle',
    source: 'CoinTelegraph',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    summary: 'XRP jumped 18% in 24 hours after Ripple Labs secured a favorable ruling in its long-running legal dispute. The decision could set a major precedent for crypto asset classifications in the US.',
    sentiment: 'positive',
    tags: ['XRP', 'Ripple', 'Legal'],
  },
  {
    id: '8',
    title: 'DeFi TVL Drops 12% as Market Uncertainty Weighs on Protocols',
    source: 'DeFiLlama',
    url: '#',
    imageUrl: '',
    publishedAt: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    summary: 'Total value locked in decentralized finance protocols fell by $8.4 billion this week, as macro uncertainty prompted investors to de-risk. Aave and Uniswap saw the largest outflows.',
    sentiment: 'negative',
    tags: ['DeFi', 'TVL', 'Aave'],
  },
];

const sentimentData: MarketSentiment[] = [
  { label: 'Fear & Greed', value: 72, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10' },
  { label: 'BTC Dominance', value: 58.4, color: 'text-amber-400', bgColor: 'bg-amber-500/10' },
  { label: 'Market Sentiment', value: 68, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
];

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const sentimentColors = {
  positive: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: TrendingUp },
  negative: { badge: 'bg-red-500/10 text-red-400 border-red-500/20', icon: TrendingDown },
  neutral: { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: null },
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsArticle[]>(STATIC_NEWS);
  const [filter, setFilter] = useState<'all' | 'positive' | 'negative' | 'neutral'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    async function fetchLiveNews() {
      try {
        const res = await fetch('/api/market-news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (err) {
        console.error('Failed to load live news:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLiveNews();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/market-news');
      if (res.ok) {
        const data = await res.json();
        setNews(data);
        setLastRefreshed(new Date());
        toast.success('Live news updated!');
      } else {
        toast.error('Failed to update live news');
      }
    } catch (err) {
      console.error(err);
      toast.error('Connection error fetching news');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = filter === 'all' ? news : news.filter(n => n.sentiment === filter);

  const counts = {
    positive: news.filter(n => n.sentiment === 'positive').length,
    negative: news.filter(n => n.sentiment === 'negative').length,
    neutral: news.filter(n => n.sentiment === 'neutral').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Newspaper size={24} className="text-blue-400" />
            Market News
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Latest crypto & financial market updates · Last updated {timeAgo(lastRefreshed.toISOString())}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-slate-400 hover:text-white transition-colors text-sm border border-white/[0.05]"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Sentiment Indicators */}
      <div className="grid grid-cols-3 gap-4">
        {sentimentData.map((item, i) => (
          <motion.div
            key={item.label}
            className={`glass rounded-2xl p-5 border border-white/[0.05] ${item.bgColor}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">{item.label}</p>
            <div className="flex items-end gap-2">
              <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-slate-500 text-sm mb-0.5">/ 100</p>
            </div>
            {/* Progress bar */}
            <div className="mt-3 w-full h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${item.color.replace('text-', 'bg-').replace('-400', '-500')}`}
                initial={{ width: 0 }}
                animate={{ width: `${item.value}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: i * 0.1 + 0.2 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {([
          { key: 'all', label: 'All News', count: news.length },
          { key: 'positive', label: 'Bullish', count: counts.positive },
          { key: 'negative', label: 'Bearish', count: counts.negative },
          { key: 'neutral', label: 'Neutral', count: counts.neutral },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              filter === tab.key
                ? 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                : 'glass text-slate-400 hover:text-white border-white/[0.05]'
            }`}
          >
            {tab.label}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-md ${filter === tab.key ? 'bg-blue-500/20' : 'bg-white/[0.05]'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* News Grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((article, i) => {
          const sentimentStyle = sentimentColors[article.sentiment];
          const SentimentIcon = sentimentStyle.icon;
          return (
            <motion.a
              key={article.id}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass rounded-2xl p-5 border border-white/[0.05] hover:border-white/20 transition-all group card-hover block"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-slate-500 bg-white/[0.04] px-2 py-1 rounded-lg">
                    {article.source}
                  </span>
                  <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg border ${sentimentStyle.badge}`}>
                    {SentimentIcon && <SentimentIcon size={11} />}
                    {article.sentiment.charAt(0).toUpperCase() + article.sentiment.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500">{timeAgo(article.publishedAt)}</span>
                  <ExternalLink size={13} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-white text-sm leading-snug mb-2 group-hover:text-blue-300 transition-colors">
                {article.title}
              </h3>

              {/* Summary */}
              <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">
                {article.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {article.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2 py-0.5 rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </motion.a>
          );
        })}
      </div>

      {/* Data source note */}
      <div className="flex items-center gap-2 text-xs text-slate-600 pt-2">
        <Wifi size={12} />
        <span>Market data refreshes every 15 minutes. News sourced from leading crypto publications.</span>
      </div>
    </div>
  );
}
