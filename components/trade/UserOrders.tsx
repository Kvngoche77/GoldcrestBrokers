'use client';

import React, { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useTradeStore } from '@/hooks/use-trade-store';
import { Wallet, History, Info, Landmark } from 'lucide-react';

const COIN_FALLBACK_PRICES: Record<string, number> = {
  BTC: 64250.50,
  ETH: 3450.75,
  SOL: 145.20,
  BNB: 580.40,
  ADA: 0.45,
  XRP: 0.52,
};

export function UserOrders() {
  const { user, profile } = useAuth();
  const { selectedMarket } = useTradeStore();
  const [activeTab, setActiveTab] = useState('Open Orders');

  const tabs = ['Open Orders', 'Order History', 'Trade History', 'Funds'];

  // Fetch real-time completed trade transactions
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['user-trade-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'investment')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  // Calculate dynamic crypto holdings
  const holdings: Record<string, number> = {};
  transactions.forEach((tx: any) => {
    if (tx.status === 'completed') {
      const side = tx.metadata?.side || (tx.description?.toLowerCase().includes('sell') ? 'sell' : 'buy');
      const symbol = tx.metadata?.symbol || 'BTC/USDT';
      const price = tx.metadata?.price || (symbol.includes('BTC') ? 64000 : symbol.includes('ETH') ? 3400 : 150);
      const usdAmount = tx.amount || 0;
      const coin = symbol.split('/')[0];

      if (!coin) return;
      const cryptoQty = usdAmount / price;

      if (!holdings[coin]) holdings[coin] = 0;
      if (side === 'buy') {
        holdings[coin] += cryptoQty;
      } else {
        holdings[coin] -= cryptoQty;
      }
    }
  });

  // Calculate funds details
  let cryptoValue = 0;
  const holdingsList = Object.entries(holdings)
    .map(([coin, amount]) => {
      if (amount < 0.000001) return null;
      const coinPrice = selectedMarket.symbol.startsWith(coin)
        ? selectedMarket.price
        : (COIN_FALLBACK_PRICES[coin] || 1);
      const value = amount * coinPrice;
      cryptoValue += value;
      return { coin, amount, price: coinPrice, value };
    })
    .filter((h): h is { coin: string; amount: number; price: number; value: number } => h !== null);

  const totalEstimatedValue = (profile?.balance ?? 0) + cryptoValue;

  return (
    <div className="flex flex-col h-full bg-[#0b0e11] select-none border-t border-[#1e2329]">
      {/* Tabs */}
      <div className="px-4 h-10 border-b border-[#1e2329] flex items-center gap-6 flex-shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "text-[12px] font-bold h-full border-b-2 transition-all pt-1 outline-none",
              activeTab === tab 
                ? "text-[#f0b90b] border-[#f0b90b]" 
                : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
            )}
          >
            {tab}{tab === 'Open Orders' ? ' (0)' : ''}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {activeTab === 'Open Orders' && (
            <div className="flex flex-col items-center justify-center py-12 text-[#848e9c] text-xs">
              <History size={32} className="text-[#1e2329] mb-3 animate-pulse" />
              <span>No open orders. Orders are processed instantly.</span>
            </div>
          )}

          {(activeTab === 'Order History' || activeTab === 'Trade History') && (
            <>
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#848e9c] text-xs">
                  <History size={32} className="text-[#1e2329] mb-3" />
                  <span>No trading history found. Start trading now!</span>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-[#161a1e] sticky top-0 z-10">
                    <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Date</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Pair</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Side</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Price</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Amount</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Total (USD)</TableHead>
                      <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => {
                      const side = tx.metadata?.side || (tx.description?.toLowerCase().includes('sell') ? 'sell' : 'buy');
                      const symbol = tx.metadata?.symbol || 'BTC/USDT';
                      const price = tx.metadata?.price || (symbol.includes('BTC') ? 64000 : symbol.includes('ETH') ? 3400 : 150);
                      const isBuy = side === 'buy';
                      const coin = symbol.split('/')[0];
                      const cryptoQty = tx.amount / price;

                      return (
                        <TableRow key={tx.id} className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                          <TableCell className="text-[11px] py-2 text-[#848e9c] font-mono whitespace-nowrap">
                            {new Date(tx.created_at).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 font-bold text-[#eaecef]">{symbol}</TableCell>
                          <TableCell className={cn(
                            "text-[11px] py-2 font-bold uppercase",
                            isBuy ? "text-[#0ecb81]" : "text-[#f6465d]"
                          )}>
                            {side}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                            ${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                            {cryptoQty.toFixed(6)} {coin}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                            ${Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 text-right text-[#0ecb81] font-bold">Filled</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </>
          )}

          {activeTab === 'Funds' && (
            <div className="p-4 space-y-6">
              {/* Balances Dashboard */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#848e9c] uppercase tracking-wider">
                    <span>Total Wallet Balance</span>
                    <Landmark size={14} className="text-amber-500" />
                  </div>
                  <div className="mt-3 text-lg font-bold text-white font-mono">
                    ${Number(totalEstimatedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[11px] text-[#f0b90b]">USDT</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#848e9c] uppercase tracking-wider">
                    <span>Available Cash (USDT)</span>
                    <Wallet size={14} className="text-blue-500" />
                  </div>
                  <div className="mt-3 text-lg font-bold text-white font-mono">
                    ${Number(profile?.balance ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-blue-400">USDT</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-bold text-[#848e9c] uppercase tracking-wider">
                    <span>Crypto Portfolio Value</span>
                    <Info size={14} className="text-[#0ecb81]" />
                  </div>
                  <div className="mt-3 text-lg font-bold text-white font-mono">
                    ${Number(cryptoValue).toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[11px] text-[#0ecb81]">USDT</span>
                  </div>
                </div>
              </div>

              {/* Dynamic Assets Holdings Table */}
              <div>
                <h4 className="text-xs font-bold text-[#eaecef] uppercase tracking-wider mb-3">Portfolio Holdings</h4>
                {holdingsList.length === 0 ? (
                  <div className="p-6 text-center text-[#848e9c] text-xs italic bg-white/[0.01] rounded-xl border border-white/[0.04]">
                    Your portfolio is currently empty. Buy some crypto in the Trade Panel to start!
                  </div>
                ) : (
                  <Table className="border border-white/[0.04] rounded-xl overflow-hidden">
                    <TableHeader className="bg-[#161a1e]">
                      <TableRow className="border-b border-[#1e2329]">
                        <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Asset</TableHead>
                        <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Total Balance</TableHead>
                        <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Available</TableHead>
                        <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Estimated Price</TableHead>
                        <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c] text-right">Value (USDT)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {holdingsList.map((asset) => (
                        <TableRow key={asset.coin} className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                          <TableCell className="text-[11px] py-2 font-bold text-[#eaecef]">{asset.coin}</TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">{asset.amount.toFixed(6)}</TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">{asset.amount.toFixed(6)}</TableCell>
                          <TableCell className="text-[11px] py-2 font-mono text-[#eaecef]">
                            ${Number(asset.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-[11px] py-2 text-right font-mono text-[#0ecb81] font-bold">
                            ${Number(asset.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
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
