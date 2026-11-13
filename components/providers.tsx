'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,       // 1 minute — data stays fresh
            gcTime: 5 * 60 * 1000,      // 5 minutes — keep unused cache
            retry: 1,                   // one retry on error
            refetchOnWindowFocus: true, // refresh when tab regains focus
            refetchOnReconnect: true,   // refresh when network reconnects
          },
          mutations: {
            retry: 0, // never retry mutations (avoid duplicate DB writes)
          },
        },
      })
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--foreground))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '12px',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
              },
              success: {
                iconTheme: { primary: '#10d982', secondary: '#fff' },
                duration: 4000,
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#fff' },
                duration: 5000, // errors stay longer
              },
              loading: {
                iconTheme: { primary: '#3b82f6', secondary: '#fff' },
              },
            }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
