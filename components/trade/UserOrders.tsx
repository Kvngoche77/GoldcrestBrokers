'use client';

import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function UserOrders() {
  return (
    <div className="flex flex-col h-full bg-[#0b0e11]">
      <Tabs defaultValue="open" className="flex-1 flex flex-col">
        <div className="px-4 pt-2 border-b border-[#1e2329]">
          <TabsList className="bg-transparent h-10 p-0 gap-6">
            <TabsTrigger 
              value="open" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-10 text-xs px-0"
            >
              Open Orders(0)
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-10 text-xs px-0"
            >
              Trade History
            </TabsTrigger>
            <TabsTrigger 
              value="funds" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-yellow-500 border-b-2 border-transparent data-[state=active]:border-yellow-500 rounded-none h-10 text-xs px-0"
            >
              Funds
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="open" className="flex-1 m-0">
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 space-y-2">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 12V20M32 44V52M52 32H44M20 32H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M46.1421 17.8579L40.4853 23.5147M23.5147 40.4853L17.8579 46.1421M46.1421 46.1421L40.4853 40.4853M23.5147 23.5147L17.8579 17.8579" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <p className="text-xs">No open orders</p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 m-0 overflow-hidden">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader className="bg-[#161a1e] sticky top-0 z-10">
                <TableRow className="border-b border-[#1e2329] hover:bg-transparent">
                  <TableHead className="text-[10px] h-8">Date</TableHead>
                  <TableHead className="text-[10px] h-8">Pair</TableHead>
                  <TableHead className="text-[10px] h-8">Side</TableHead>
                  <TableHead className="text-[10px] h-8">Price</TableHead>
                  <TableHead className="text-[10px] h-8 text-right">Executed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                  <TableCell className="text-[10px] py-2 text-gray-400">2026-05-06 08:00:12</TableCell>
                  <TableCell className="text-[10px] py-2 font-medium">BTC/USDT</TableCell>
                  <TableCell className="text-[10px] py-2 text-green-500 font-medium">Buy</TableCell>
                  <TableCell className="text-[10px] py-2">64,250.50</TableCell>
                  <TableCell className="text-[10px] py-2 text-right">0.0050 BTC</TableCell>
                </TableRow>
                <TableRow className="border-b border-[#1e2329]/50 hover:bg-[#1e2329]/30">
                  <TableCell className="text-[10px] py-2 text-gray-400">2026-05-06 07:45:30</TableCell>
                  <TableCell className="text-[10px] py-2 font-medium">ETH/USDT</TableCell>
                  <TableCell className="text-[10px] py-2 text-red-500 font-medium">Sell</TableCell>
                  <TableCell className="text-[10px] py-2">3,450.75</TableCell>
                  <TableCell className="text-[10px] py-2 text-right">1.2000 ETH</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
