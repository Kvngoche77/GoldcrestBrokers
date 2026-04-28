'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart } from 'lucide-react';

export function TradingViewChart() {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: "BINANCE:BTCUSDT",
      interval: "D",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_side_toolbar: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: "https://www.tradingview.com"
    });

    container.current.innerHTML = '';
    container.current.appendChild(script);
  }, []);

  return (
    <section className="py-12 bg-[#040c18]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="mb-10 text-center lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
           <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <AreaChart size={14} />
            <span>Advanced Analytics</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Live Market <span className="gradient-text">Analysis</span></h2>
          <p className="text-slate-400">Professional-grade charting tools to track price movements in real-time.</p>
        </motion.div>

        <motion.div 
          className="glass rounded-3xl overflow-hidden border border-white/[0.05] h-[600px] shadow-2xl relative"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Chart Container */}
          <div className="tradingview-widget-container h-full w-full" ref={container}>
            <div className="tradingview-widget-container__widget h-full w-full"></div>
          </div>
          
          {/* Glossy overlay for edges */}
          <div className="absolute inset-0 pointer-events-none border border-white/[0.05] rounded-3xl" />
        </motion.div>
      </div>
    </section>
  );
}
