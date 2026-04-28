'use client';

import { useEffect } from 'react';

// Extend Window interface for type safety
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          config: { pageLanguage: string; layout: any },
          elementId: string
        ) => void;
        TranslateElement: {
          InlineLayout: { SIMPLE: number };
        };
      };
    };
  }
}

export function GoogleTranslate() {
  useEffect(() => {
    const scriptId = 'google-translate-script';

    if (!document.getElementById(scriptId)) {
      const initCallback = () => {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
            },
            'google_translate_element'
          );
        }
      };

      window.googleTranslateElementInit = initCallback;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'; // ✅ Fixed: removed trailing space
      script.async = true;

      script.onerror = () => {
        console.error('Google Translate script failed to load');
      };

      document.body.appendChild(script);
    }

    return () => {
      // Optional cleanup for dev/HMR
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  return (
    <div className="translate-widget-wrapper min-h-[40px]">
      <div id="google_translate_element" />
    </div>
  );
}