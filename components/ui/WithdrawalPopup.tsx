'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Globe, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { WithdrawalAlert } from '@/types';

// Curated baseline testimonies representing worldwide operations
const STATIC_MOCK_ALERTS: WithdrawalAlert[] = [
  { username: 'Sarah L.', amount: 4820.00, asset: 'USDT', location: 'London, UK' },
  { username: 'David K.', amount: 1540.00, asset: 'BTC', location: 'Munich, Germany' },
  { username: 'Chen W.', amount: 9600.00, asset: 'ETH', location: 'Singapore' },
  { username: 'Elena R.', amount: 3250.00, asset: 'USDT', location: 'Madrid, Spain' },
  { username: 'Marcus B.', amount: 780.00, asset: 'SOL', location: 'Austin, USA' },
  { username: 'Yuki T.', amount: 12400.00, asset: 'BTC', location: 'Tokyo, Japan' },
  { username: 'Amara O.', amount: 2150.00, asset: 'USDT', location: 'Lagos, Nigeria' },
  { username: 'Mateo S.', amount: 6200.00, asset: 'ETH', location: 'Buenos Aires, Argentina' },
  { username: 'Emma H.', amount: 1850.00, asset: 'USDT', location: 'Sydney, Australia' },
  { username: 'Lucas G.', amount: 3900.00, asset: 'SOL', location: 'Paris, France' },
];

export function WithdrawalPopup() {
  const [alerts, setAlerts] = useState<WithdrawalAlert[]>(STATIC_MOCK_ALERTS);
  const [currentAlert, setCurrentAlert] = useState<WithdrawalAlert | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Fetch custom admin withdrawal alerts from Supabase on mount
  useEffect(() => {
    async function fetchCustomAlerts() {
      try {
        const { data, error } = await supabase
          .from('withdrawal_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching custom alerts:', error);
          return;
        }

        if (data && data.length > 0) {
          // Merge static alerts with custom database alerts, placing custom ones first
          setAlerts([...data, ...STATIC_MOCK_ALERTS]);
        }
      } catch (err) {
        console.error('Failed to load database alerts:', err);
      }
    }

    fetchCustomAlerts();
  }, []);

  // Timed loop system: 15-25 seconds random interval after each popup closes
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    function triggerNextPopup() {
      if (alerts.length === 0) return;
      
      // Select a random alert from the pool
      const randomIndex = Math.floor(Math.random() * alerts.length);
      const selected = alerts[randomIndex];
      
      setCurrentAlert(selected);
      setIsVisible(true);

      // Hide the popup after exactly 6 seconds of display time
      timer = setTimeout(() => {
        setIsVisible(false);
        
        // Schedule the NEXT popup after a random cooldown of 15 to 25 seconds
        const nextCooldown = Math.floor(Math.random() * (25000 - 15000 + 1)) + 15000;
        timer = setTimeout(triggerNextPopup, nextCooldown);
      }, 6000);
    }

    // Schedule the first popup after 12 seconds of landing on the homepage
    timer = setTimeout(triggerNextPopup, 12000);

    return () => clearTimeout(timer);
  }, [alerts]);

  return (
    <AnimatePresence>
      {isVisible && currentAlert && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="fixed bottom-6 left-6 z-[9999] max-w-sm w-[calc(100vw-48px)] sm:w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 p-4 shadow-2xl backdrop-blur-xl shadow-emerald-500/5 hover:border-emerald-500/20 transition-colors"
        >
          {/* Top border emerald glow effect */}
          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

          <div className="flex gap-3">
            {/* Emerald Checkmark Circle */}
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>

            {/* Content Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Withdrawal Completed</p>
                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[9px] font-bold bg-white/[0.04] text-slate-300 border border-white/5">
                  {currentAlert.asset}
                </span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">
                {currentAlert.username}
              </p>
              <p className="text-sm font-black text-emerald-400 mt-0.5">
                +${Number(currentAlert.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              
              {/* Location Badge */}
              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <Globe size={11} className="text-slate-500" />
                <span className="truncate">{currentAlert.location || 'Global Client'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span className="text-slate-600 flex items-center gap-0.5">
                  <TrendingUp size={9} /> Instant payout
                </span>
              </div>
            </div>
          </div>

          {/* Depleting visual timeline progress bar */}
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 6, ease: 'linear' }}
            className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-emerald-500 via-emerald-400 to-blue-500"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
