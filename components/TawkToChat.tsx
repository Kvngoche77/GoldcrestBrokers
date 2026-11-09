'use client';

import { useEffect } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TawkToChat – embeds the Tawk.to live chat widget site-wide.
//
// HOW TO CONFIGURE:
//  1. Sign up / log in at https://tawk.to
//  2. Go to Administration → Chat Widget → Direct Chat Link section.
//  3. Copy your Property ID and Widget ID from the embed snippet, e.g.:
//       https://embed.tawk.to/PROPERTY_ID/WIDGET_ID
//  4. Set the two env vars in your .env.local (and in Netlify's env settings):
//       NEXT_PUBLIC_TAWKTO_PROPERTY_ID=your_property_id
//       NEXT_PUBLIC_TAWKTO_WIDGET_ID=your_widget_id
// ─────────────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    Tawk_API?: {
      onLoad?: () => void;
      hideWidget?: () => void;
      showWidget?: () => void;
      setAttributes?: (attrs: Record<string, string>, callback?: (error: unknown) => void) => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export function TawkToChat() {
  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWKTO_PROPERTY_ID;
    const widgetId = process.env.NEXT_PUBLIC_TAWKTO_WIDGET_ID;

    // Skip if env vars are not configured yet
    if (!propertyId || !widgetId) {
      if (process.env.NODE_ENV === 'development') {
        console.info(
          '[TawkToChat] NEXT_PUBLIC_TAWKTO_PROPERTY_ID and NEXT_PUBLIC_TAWKTO_WIDGET_ID are not set. ' +
          'Add them to your .env.local to enable live chat.'
        );
      }
      return;
    }

    // Avoid loading twice (e.g. React StrictMode double-invoke)
    if (document.getElementById('tawkto-script')) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement('script');
    script.id = 'tawkto-script';
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount (dev HMR safety)
      const existing = document.getElementById('tawkto-script');
      if (existing) existing.remove();
    };
  }, []);

  return null; // This component renders nothing — the widget injects itself.
}
