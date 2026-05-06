'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function UserOrders() {
  return (
    <div className="flex flex-col h-full bg-[#0b0e11] select-none">
      <div className="px-4 h-10 border-b border-[#1e2329] flex items-center gap-6">
        {['Open Orders', 'Order History', 'Trade History', 'Funds'].map((tab) => (
          <button
            key={tab}
            className={cn(
              "text-[12px] font-bold h-full border-b-2 transition-all pt-1",
              tab === 'Open Orders' 
                ? "text-[#f0b90b] border-[#f0b90b]" 
                : "text-[#848e9c] border-transparent hover:text-[#eaecef]"
            )}
          >
            {tab}{tab === 'Open Orders' ? '(0)' : ''}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <Table>
            <TableHeader className="bg-[#161a1e] sticky top-0 z-10">
              <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Date</TableHead>
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Pair</TableHead>
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Side</TableHead>
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Price</TableHead>
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c]">Executed</TableHead>
                <TableHead className="text-[10px] h-8 uppercase font-bold text-[#848e9c] text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                <TableCell className="text-[11px] py-1.5 text-[#848e9c] font-mono">2026-05-06 08:00:12</TableCell>
                <TableCell className="text-[11px] py-1.5 font-bold text-[#eaecef]">BTC/USDT</TableCell>
                <TableCell className="text-[11px] py-1.5 text-[#0ecb81] font-bold uppercase">Buy</TableCell>
                <TableCell className="text-[11px] py-1.5 font-mono text-[#eaecef]">64,250.50</TableCell>
                <TableCell className="text-[11px] py-1.5 font-mono text-[#eaecef]">0.0050 BTC</TableCell>
                <TableCell className="text-[11px] py-1.5 text-right text-[#0ecb81] font-bold">Filled</TableCell>
              </TableRow>
              <TableRow className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                <TableCell className="text-[11px] py-1.5 text-[#848e9c] font-mono">2026-05-06 07:45:30</TableCell>
                <TableCell className="text-[11px] py-1.5 font-bold text-[#eaecef]">ETH/USDT</TableCell>
                <TableCell className="text-[11px] py-1.5 text-[#f6465d] font-bold uppercase">Sell</TableCell>
                <TableCell className="text-[11px] py-1.5 font-mono text-[#eaecef]">3,450.75</TableCell>
                <TableCell className="text-[11px] py-1.5 font-mono text-[#eaecef]">1.2000 ETH</TableCell>
                <TableCell className="text-[11px] py-1.5 text-right text-[#0ecb81] font-bold">Filled</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </div>
  );
}
