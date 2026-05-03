'use client';

import { useEffect } from 'react';
import { Languages } from 'lucide-react';

// Extend Window interface for type safety
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (
            config: { pageLanguage: string; layout: any; autoDisplay?: boolean },
            elementId: string
          ): any;
          InlineLayout: {
            SIMPLE: number;
          };
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
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,
            },
            'google_translate_element'
          );
        }
      };

      window.googleTranslateElementInit = initCallback;

      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;

      script.onerror = () => {
        console.error('Google Translate script failed to load');
      };

      document.body.appendChild(script);
    }

    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit;
      }
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl border border-white/10 hover:border-white/20 transition-all group">
      <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/20 transition-all">
        <Languages size={15} />
      </div>
      <div id="google_translate_element" className="google-translate-container" />
      
      <style jsx global>{`
        .google-translate-container {
          min-width: 130px;
        }
        .goog-te-gadget-simple {
          background-color: transparent !important;
          border: none !important;
          padding: 0 !important;
          font-family: inherit !important;
          display: flex !important;
          align-items: center !important;
        }
        .goog-te-gadget-simple span {
          color: #94a3b8 !important;
          font-size: 13px !important;
          font-weight: 500 !important;
        }
        .goog-te-gadget-simple span:hover {
          color: #ffffff !important;
        }
        .goog-te-gadget-icon {
          display: none !important;
        }
        .goog-te-menu-value img {
          display: none !important;
        }
        .goog-te-menu-value span {
          border-left: none !important;
        }
        .goog-te-banner-frame {
          display: none !important;
        }
        body {
          top: 0 !important;
        }
        .goog-te-menu-frame {
          box-shadow: 0 10px 25px rgba(0,0,0,0.5) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
}