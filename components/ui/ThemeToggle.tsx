'use client';

import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-9 h-9';
  const iconSize = size === 'sm' ? 14 : 16;

  // Render a placeholder until mounted to avoid hydration mismatch
  if (!mounted) {
    return <div className={`${btnSize} rounded-xl bg-white/5 animate-pulse`} />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`relative ${btnSize} rounded-xl flex items-center justify-center transition-all duration-200
        dark:glass dark:hover:bg-white/[0.08] dark:text-slate-300 dark:hover:text-amber-300
        bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-amber-500
        border dark:border-white/10 border-slate-200/80
        ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center"
          >
            <Moon size={iconSize} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ opacity: 0, rotate: 30, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -30, scale: 0.7 }}
            transition={{ duration: 0.18 }}
            className="flex items-center justify-center"
          >
            <Sun size={iconSize} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
