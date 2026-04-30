'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, BarChart3, TrendingUp, Globe } from 'lucide-react';

export function TradingViewFeatures() {
  const chartContainer = useRef<HTMLDivElement>(null);
  const tickerContainer = useRef<HTMLDivElement>(null);
  const marketOverviewContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Advanced Chart Widget
    if (chartContainer.current) {
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
      chartContainer.current.innerHTML = '';
      chartContainer.current.appendChild(script);
    }

    // Market Overview Widget
    if (marketOverviewContainer.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
      script.type = 'text/javascript';
      script.async = true;
      script.innerHTML = JSON.stringify({
        colorTheme: "dark",
        dateRange: "12M",
        showChart: true,
        locale: "en",
        largeChartUrl: "",
        isTransparent: true,
        showSymbolLogo: true,
        showFloatingTooltip: false,
        width: "100%",
        height: "100%",
        tabs: [
          {
            title: "Indices",
            symbols: [
              { s: "FOREXCOM:SPX500", d: "S&P 500" },
              { s: "FOREXCOM:NSXUSD", d: "US 100" },
              { s: "FOREXCOM:DJI", d: "Dow 30" },
              { s: "INDEX:NKY", d: "Nikkei 225" },
              { s: "INDEX:DAX", d: "DAX Index" },
              { s: "FOREXCOM:UKXGBP", d: "UK 100" }
            ],
            originalTitle: "Indices"
          },
          {
            title: "Futures",
            symbols: [
              { s: "CME_MINI:ES1!", d: "S&P 500" },
              { s: "CME:6E1!", d: "Euro" },
              { s: "COMEX:GC1!", d: "Gold" },
              { s: "NYMEX:CL1!", d: "Crude Oil" },
              { s: "NYMEX:NG1!", d: "Natural Gas" },
              { s: "CBOT:ZC1!", d: "Corn" }
            ],
            originalTitle: "Futures"
          },
          {
            title: "Bonds",
            symbols: [
              { s: "CME:GE1!", d: "Eurodollar" },
              { s: "CBOT:ZB1!", d: "T-Bond" },
              { s: "CBOT:UB1!", d: "Ultra T-Bond" },
              { s: "EUREX:FGBL1!", d: "Euro Bund" },
              { s: "EUREX:FBTP1!", d: "Euro BTP" },
              { s: "EUREX:FGBM1!", d: "Euro Bobl" }
            ],
            originalTitle: "Bonds"
          },
          {
            title: "Forex",
            symbols: [
              { s: "FX:EURUSD", d: "EUR/USD" },
              { s: "FX:GBPUSD", d: "GBP/USD" },
              { s: "FX:USDJPY", d: "USD/JPY" },
              { s: "FX:USDCHF", d: "USD/CHF" },
              { s: "FX:AUDUSD", d: "AUD/USD" },
              { s: "FX:USDCAD", d: "USDCAD" }
            ],
            originalTitle: "Forex"
          }
        ]
      });
      marketOverviewContainer.current.innerHTML = '';
      marketOverviewContainer.current.appendChild(script);
    }
  }, []);

  return (
    <section id="tradingview-features" className="py-24 bg-[#040c18] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mb-14 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 glass rounded-full text-sm text-blue-400 border border-blue-500/20 mb-4">
            <Globe size={14} />
            <span>Professional Trading Tools</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Global Market <span className="gradient-text">Insights</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Access institutional-grade analysis tools and live market feeds to stay ahead of the competition.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 h-[700px]">
          {/* Market Overview */}
          <motion.div
            className="lg:col-span-1 glass rounded-3xl overflow-hidden border border-white/[0.05] shadow-2xl h-full"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="p-4 border-b border-white/[0.05] flex items-center gap-2">
              <BarChart3 size={18} className="text-blue-400" />
              <span className="font-semibold text-white">Market Overview</span>
            </div>
            <div className="tradingview-widget-container h-[calc(100%-52px)] w-full" ref={marketOverviewContainer}>
              <div className="tradingview-widget-container__widget h-full w-full"></div>
            </div>
          </motion.div>

          {/* Advanced Chart */}
          <motion.div
            className="lg:col-span-2 glass rounded-3xl overflow-hidden border border-white/[0.05] shadow-2xl h-full"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="p-4 border-b border-white/[0.05] flex items-center gap-2">
              <AreaChart size={18} className="text-blue-400" />
              <span className="font-semibold text-white">Advanced Technical Analysis</span>
            </div>
            <div className="tradingview-widget-container h-[calc(100%-52px)] w-full" ref={chartContainer}>
              <div className="tradingview-widget-container__widget h-full w-full"></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
