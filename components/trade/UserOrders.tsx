'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTradeStore } from '@/hooks/use-trade-store';
import { Wallet, History, Landmark, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';

interface TradePosition {
  id: string;
  symbol: string;
  base_asset: string;
  quote_asset: string;
  quantity: number;
  avg_entry_price: number;
  total_invested: number;
  updated_at: string;
}

const TABS = ['Open Orders', 'Order History', 'Trade History', 'Funds'] as const;
type Tab = typeof TABS[number];

export function UserOrders() {
  const { user, profile } = useAuth();
  const { selectedMarket, markets } = useTradeStore();
  const [activeTab, setActiveTab] = useState<Tab>('Order History');

  // Fetch spot trade transactions (type = 'trade')
  const { data: tradeTransactions = [], isLoading: isLoadingTrades, refetch: refetchTrades } = useQuery({
    queryKey: ['user-trade-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'trade')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  // Fetch user's trade positions (holdings)
  const { data: positions = [], isLoading: isLoadingPositions, refetch: refetchPositions } = useQuery({
    queryKey: ['user-trade-positions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('trade_positions')
        .select('*')
        .eq('user_id', user.id)
        .gt('quantity', 0.000001);
      if (error) throw error;
      return (data as TradePosition[]) || [];
    },
    enabled: !!user?.id,
    refetchInterval: 15000,
  });

  const refetchAll = () => {
    refetchTrades();
    refetchPositions();
  };

  // Compute portfolio value from live prices
  const getMarketPrice = (symbol: string) => {
    const market = markets.find((m) => m.symbol === symbol);
    return market?.price ?? 0;
  };

  const portfolioValue = positions.reduce((sum, pos) => {
    const livePrice = getMarketPrice(pos.symbol);
    return sum + pos.quantity * livePrice;
  }, 0);

  const totalBalance = (profile?.balance ?? 0) + portfolioValue;
  const costBasis = positions.reduce((sum, pos) => sum + pos.total_invested, 0);
  const unrealizedPnL = portfolioValue - costBasis;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(6)}`;
  };

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] select-none border-t border-[#1e2329]">
      {/* Tabs */}
      <div className="px-4 h-10 border-b border-[#1e2329] flex items-center gap-5 flex-shrink-0 overflow-x-auto scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'text-[12px] font-bold h-full border-b-2 transition-all pt-1 outline-none whitespace-nowrap flex-shrink-0',
              activeTab === tab
                ? 'text-[#f0b90b] border-[#f0b90b]'
                : 'text-[#848e9c] border-transparent hover:text-[#eaecef]'
            )}
          >
            {tab}
          </button>
        ))}

        {/* Refresh button */}
        <button
          onClick={refetchAll}
          className="ml-auto flex-shrink-0 text-[#848e9c] hover:text-[#eaecef] transition-colors p-1"
          title="Refresh"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">

          {/* Open Orders — always empty (instant fill) */}
          {activeTab === 'Open Orders' && (
            <div className="flex flex-col items-center justify-center py-16 text-[#848e9c]">
              <History size={36} className="text-[#2b3139] mb-4" />
              <span className="text-sm font-medium">No open orders</span>
              <span className="text-xs text-[#5e6673] mt-1">All orders are filled instantly</span>
            </div>
          )}

          {/* Order History */}
          {activeTab === 'Order History' && (
            isLoadingTrades ? (
              <div className="flex justify-center items-center py-16">
                <div className="h-6 w-6 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tradeTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#848e9c]">
                <History size={36} className="text-[#2b3139] mb-4" />
                <span className="text-sm font-medium">No trade history</span>
                <span className="text-xs text-[#5e6673] mt-1">Start trading to see your orders here</span>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#161a1e] sticky top-0 z-10">
                  <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                    {['Date', 'Pair', 'Type', 'Side', 'Price', 'Amount', 'Total'].map((h) => (
                      <TableHead key={h} className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeTransactions.map((tx: any) => {
                    const meta = tx.metadata || {};
                    const isBuy = meta.side === 'buy';
                    const symbol = meta.symbol || 'BTCUSDT';
                    const base = meta.base_asset || symbol.replace('USDT', '');
                    const qty = meta.quantity || 0;
                    const price = meta.price || 0;
                    const fee = meta.fee || 0;

                    return (
                      <TableRow key={tx.id} className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                        <TableCell className="text-[11px] py-2 text-[#848e9c] font-mono whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-bold text-[#eaecef]">
                          {base}/USDT
                        </TableCell>
                        <TableCell className="text-[11px] py-2 text-[#848e9c] capitalize">
                          {meta.order_type || 'market'}
                        </TableCell>
                        <TableCell className={cn('text-[11px] py-2 font-bold uppercase', isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                          {meta.side || 'buy'}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                          {formatPrice(price)}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                          {Number(qty).toFixed(6)} {base}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                          ${Number(tx.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {/* Trade History — same as Order History but focused on amounts */}
          {activeTab === 'Trade History' && (
            isLoadingTrades ? (
              <div className="flex justify-center items-center py-16">
                <div className="h-6 w-6 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : tradeTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-[#848e9c]">
                <History size={36} className="text-[#2b3139] mb-4" />
                <span className="text-sm font-medium">No trades yet</span>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-[#161a1e] sticky top-0 z-10">
                  <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                    {['Date', 'Pair', 'Side', 'Price', 'Qty', 'Total', 'Fee', 'Status'].map((h) => (
                      <TableHead key={h} className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradeTransactions.map((tx: any) => {
                    const meta = tx.metadata || {};
                    const isBuy = meta.side === 'buy';
                    const base = meta.base_asset || (meta.symbol || 'BTC').replace('USDT', '');
                    return (
                      <TableRow key={tx.id} className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                        <TableCell className="text-[11px] py-2 text-[#848e9c] font-mono whitespace-nowrap">
                          {formatDate(tx.created_at)}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-bold text-[#eaecef]">{base}/USDT</TableCell>
                        <TableCell className={cn('text-[11px] py-2 font-bold uppercase', isBuy ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                          {meta.side}
                        </TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">{formatPrice(meta.price || 0)}</TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">{Number(meta.quantity || 0).toFixed(6)}</TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">${Number(tx.amount).toFixed(2)}</TableCell>
                        <TableCell className="text-[11px] py-2 font-mono text-[#848e9c]">${Number(meta.fee || 0).toFixed(4)}</TableCell>
                        <TableCell className="text-[11px] py-2 font-bold text-[#0ecb81]">Filled</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          )}

          {/* Funds Tab */}
          {activeTab === 'Funds' && (
            <div className="p-4 space-y-5">
              {/* Summary cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Total Balance',
                    value: `$${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    sub: 'USDT',
                    icon: Landmark,
                    color: 'text-amber-400',
                    bg: 'from-amber-500/10 to-transparent',
                  },
                  {
                    label: 'Available Cash',
                    value: `$${(profile?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    sub: 'USDT',
                    icon: Wallet,
                    color: 'text-blue-400',
                    bg: 'from-blue-500/10 to-transparent',
                  },
                  {
                    label: 'Crypto Value',
                    value: `$${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    sub: 'USDT',
                    icon: TrendingUp,
                    color: 'text-[#0ecb81]',
                    bg: 'from-[#0ecb81]/10 to-transparent',
                  },
                  {
                    label: 'Unrealized P&L',
                    value: `${unrealizedPnL >= 0 ? '+' : ''}$${Math.abs(unrealizedPnL).toFixed(2)}`,
                    sub: unrealizedPnL >= 0 ? 'Profit' : 'Loss',
                    icon: unrealizedPnL >= 0 ? TrendingUp : TrendingDown,
                    color: unrealizedPnL >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]',
                    bg: unrealizedPnL >= 0 ? 'from-[#0ecb81]/10 to-transparent' : 'from-[#f6465d]/10 to-transparent',
                  },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className={cn(
                      'p-4 rounded-xl bg-gradient-to-b border border-white/[0.05] flex flex-col',
                      bg
                    )}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-[#848e9c] uppercase tracking-wider mb-3">
                      <span>{label}</span>
                      <Icon size={13} className={color} />
                    </div>
                    <div className={cn('text-base font-black font-mono', color)}>{value}</div>
                    <div className="text-[10px] text-[#5e6673] mt-1">{sub}</div>
                  </div>
                ))}
              </div>

              {/* Holdings table */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-[#eaecef] uppercase tracking-wider">Portfolio Holdings</h4>
                  <span className="text-[10px] text-[#848e9c]">Live prices</span>
                </div>

                {isLoadingPositions ? (
                  <div className="flex justify-center py-8">
                    <div className="h-5 w-5 border-2 border-[#f0b90b] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : positions.length === 0 ? (
                  <div className="p-6 text-center text-[#848e9c] text-xs italic bg-white/[0.01] rounded-xl border border-white/[0.03]">
                    Your portfolio is empty. Buy some crypto to get started!
                  </div>
                ) : (
                  <Table className="border border-white/[0.04] rounded-xl overflow-hidden">
                    <TableHeader className="bg-[#161a1e]">
                      <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                        {['Asset', 'Balance', 'Avg. Entry', 'Current Price', 'Value', 'P&L'].map((h) => (
                          <TableHead key={h} className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">{h}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {positions.map((pos) => {
                        const livePrice = getMarketPrice(pos.symbol);
                        const value = pos.quantity * livePrice;
                        const pnl = value - pos.total_invested;
                        const pnlPct = pos.total_invested > 0 ? (pnl / pos.total_invested) * 100 : 0;
                        const isGain = pnl >= 0;

                        return (
                          <TableRow key={pos.id} className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                            <TableCell className="text-[11px] py-2.5 font-bold text-[#eaecef]">
                              <div>{pos.base_asset}</div>
                              <div className="text-[9px] text-[#848e9c] font-normal mt-0.5">{pos.symbol}</div>
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 font-mono text-[#eaecef]">
                              {Number(pos.quantity).toFixed(6)}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 font-mono text-[#848e9c]">
                              {formatPrice(pos.avg_entry_price)}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 font-mono text-[#eaecef]">
                              {livePrice > 0 ? formatPrice(livePrice) : '—'}
                            </TableCell>
                            <TableCell className="text-[11px] py-2.5 font-mono font-bold text-[#eaecef]">
                              ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell className={cn('text-[11px] py-2.5 font-mono font-bold', isGain ? 'text-[#0ecb81]' : 'text-[#f6465d]')}>
                              {isGain ? '+' : ''}${Math.abs(pnl).toFixed(2)}
                              <span className="text-[9px] ml-1 opacity-80">({isGain ? '+' : ''}{pnlPct.toFixed(2)}%)</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}

        </ScrollArea>
      </div>
    </div>
  );
}
