'use client';

import { useEffect, useState, useRef } from 'react';
import { Languages, ChevronDown, Check, Globe } from 'lucide-react';

// -----------------------------------------------------------------
// Supported languages for the manual picker fallback
// -----------------------------------------------------------------
const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文 (简体)', flag: '🇨🇳' },
  { code: 'zh-TW', label: '中文 (繁體)', flag: '🇹🇼' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', label: 'Svenska', flag: '🇸🇪' },
  { code: 'id', label: 'Indonesia', flag: '🇮🇩' },
  { code: 'ms', label: 'Melayu', flag: '🇲🇾' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'uk', label: 'Українська', flag: '🇺🇦' },
  { code: 'ro', label: 'Română', flag: '🇷🇴' },
  { code: 'cs', label: 'Čeština', flag: '🇨🇿' },
  { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
];

// Map browser navigator.language -> our lang code
function detectBrowserLang(): string {
  if (typeof navigator === 'undefined') return 'en';
  const lang = navigator.language || (navigator as any).userLanguage || 'en';
  const base = lang.split('-')[0].toLowerCase();
  const full = lang.toLowerCase();

  // Chinese variants
  if (full === 'zh-tw' || full === 'zh-hk') return 'zh-TW';
  if (full.startsWith('zh')) return 'zh-CN';

  const match = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === base || l.code.toLowerCase().startsWith(base));
  return match?.code || 'en';
}

// Get a readable cookie value
function getCookieLang(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  const stored = localStorage.getItem('goldcrest_lang');
  return stored;
}

// Extend window type for Google Translate
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (config: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: any;
            autoDisplay?: boolean;
            multilanguagePage?: boolean;
          }, elementId: string): any;
          InlineLayout: { SIMPLE: number; HORIZONTAL: number; VERTICAL: number };
        };
      };
    };
  }
}

// -----------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------
export function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [gtReady, setGtReady] = useState(false);
  const [gtFailed, setGtFailed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // -----------------------------------------------------------------
  // Step 1: Detect initial language (cookie > browser locale)
  // -----------------------------------------------------------------
  useEffect(() => {
    const saved = getCookieLang();
    const detected = detectBrowserLang();
    const initial = saved || detected;
    setCurrentLang(initial);
  }, []);

  // -----------------------------------------------------------------
  // Step 2: Load Google Translate script once (idempotent)
  // -----------------------------------------------------------------
  useEffect(() => {
    const SCRIPT_ID = 'google-translate-script-v2';

    // Define the init callback before script loads
    window.googleTranslateElementInit = () => {
      try {
        if (window.google?.translate?.TranslateElement) {
          new window.google.translate.TranslateElement(
            {
              pageLanguage: 'en',
              // Comma-separated list of all our supported languages
              includedLanguages: SUPPORTED_LANGUAGES.map(l => l.code).join(','),
              layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay: false,    // We handle auto-display ourselves
              multilanguagePage: false,
            },
            'google_translate_element_hidden'
          );
          setGtReady(true);
          setGtFailed(false);
        }
      } catch (e) {
        console.warn('[Translate] Widget init failed, using fallback', e);
        setGtFailed(true);
      }
    };

    // Don't re-add the script if already added
    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('[Translate] Google script blocked/failed, using fallback mode');
        setGtFailed(true);
      };
      document.head.appendChild(script);
    } else {
      // Script already in DOM; if widget is already available, mark ready
      if (window.google?.translate?.TranslateElement) {
        setGtReady(true);
      }
    }

    return () => {
      // Do NOT remove the script on unmount – Google Translate is global
    };
  }, []);

  // -----------------------------------------------------------------
  // Step 3: Auto-translate on load if non-English region detected
  // -----------------------------------------------------------------
  useEffect(() => {
    if (!gtReady) return;
    const saved = getCookieLang();
    const detected = detectBrowserLang();
    const targetLang = saved || detected;

    if (targetLang && targetLang !== 'en') {
      triggerGoogleTranslate(targetLang);
    }
  }, [gtReady]);

  // -----------------------------------------------------------------
  // Close dropdown on outside click
  // -----------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // -----------------------------------------------------------------
  // Core translate function – writes the googtrans cookie & fires change
  // -----------------------------------------------------------------
  function triggerGoogleTranslate(langCode: string) {
    // Set cookie that Google Translate reads
    const cookieVal = langCode === 'en' ? '/en/en' : `/en/${langCode}`;
    document.cookie = `googtrans=${cookieVal}; path=/; domain=${window.location.hostname}`;
    document.cookie = `googtrans=${cookieVal}; path=/`;

    // Persist manual preference
    try { localStorage.setItem('goldcrest_lang', langCode); } catch {}

    // Try clicking the hidden Google widget select via DOM manipulation
    const tryViaWidget = () => {
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change'));
        return true;
      }
      return false;
    };

    // Try immediately, then retry after a delay if widget isn't ready yet
    if (!tryViaWidget()) {
      setTimeout(tryViaWidget, 600);
      setTimeout(tryViaWidget, 1500);
    }

    setCurrentLang(langCode);
    setIsOpen(false);
  }

  // -----------------------------------------------------------------
  // Handle manual language selection
  // -----------------------------------------------------------------
  function handleSelectLang(code: string) {
    if (code === 'en') {
      // Restore original English – reload is the most reliable way
      document.cookie = 'googtrans=/en/en; path=/; domain=' + window.location.hostname;
      document.cookie = 'googtrans=/en/en; path=/';
      try { localStorage.setItem('goldcrest_lang', 'en'); } catch {}
      setCurrentLang('en');
      setIsOpen(false);
      window.location.reload();
      return;
    }
    triggerGoogleTranslate(code);
  }

  const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* Hidden Google Translate widget anchor (needed for DOM injection) */}
      <div
        id="google_translate_element_hidden"
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Our custom styled language picker */}
      <div ref={dropdownRef} className="relative" id="language-switcher">
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 glass rounded-xl border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.06] transition-all duration-200 group"
          title="Select Language"
          aria-label="Change language"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Globe size={14} className="text-blue-400 group-hover:text-blue-300 transition-colors flex-shrink-0" />
          <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors hidden sm:inline leading-none">
            {currentLangObj.flag} {currentLangObj.code.toUpperCase().slice(0, 2)}
          </span>
          <span className="text-[11px] font-bold text-slate-300 group-hover:text-white transition-colors sm:hidden leading-none">
            {currentLangObj.flag}
          </span>
          <ChevronDown
            size={11}
            className={`text-slate-500 group-hover:text-slate-300 transition-all duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
          />
          {!gtReady && !gtFailed && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0" title="Translator loading..." />
          )}
          {gtFailed && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" title="Fallback mode active" />
          )}
        </button>

        {isOpen && (
          <div
            role="listbox"
            aria-label="Language selection"
            className="absolute right-0 top-full mt-2 w-48 max-h-72 overflow-y-auto rounded-2xl shadow-2xl z-[9999] border border-white/10 bg-[#060d1a]/98 backdrop-blur-xl"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}
          >
            <div className="p-1.5 space-y-0.5">
              <p className="px-3 py-1.5 text-[9px] font-extrabold text-slate-500 uppercase tracking-[0.15em]">
                Select Language
              </p>
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isActive = currentLang === lang.code;
                return (
                  <button
                    key={lang.code}
                    role="option"
                    aria-selected={isActive}
                    onClick={() => handleSelectLang(lang.code)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base leading-none">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                    {isActive && <Check size={12} className="text-blue-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Global styles to hide Google Translate default banner/bar and fix body offset */}
      <style jsx global>{`
        /* Kill the top bar that pushes content down */
        .goog-te-banner-frame,
        .goog-te-balloon-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        body {
          top: 0 !important;
          position: static !important;
        }
        /* Hide the "Translated by Google" attribution */
        .goog-logo-link,
        .goog-te-gadget span,
        .goog-te-gadget > a {
          display: none !important;
        }
        /* Hide the hidden widget container */
        #google_translate_element_hidden {
          display: none !important;
        }
        /* Make the combo select invisible (we use our own UI) */
        .goog-te-combo {
          opacity: 0;
          position: absolute;
          pointer-events: none;
          width: 0;
          height: 0;
        }
        /* Smooth all translated text reflow */
        font {
          vertical-align: inherit !important;
          background-color: transparent !important;
        }
      `}</style>
    </>
  );
}