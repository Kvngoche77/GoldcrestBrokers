'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronDown, Check, Globe } from 'lucide-react';

// -----------------------------------------------------------------
// Supported languages
// -----------------------------------------------------------------
const SUPPORTED_LANGUAGES = [
  { code: 'en',    label: 'English',      flag: '🇬🇧' },
  { code: 'es',    label: 'Español',      flag: '🇪🇸' },
  { code: 'fr',    label: 'Français',     flag: '🇫🇷' },
  { code: 'de',    label: 'Deutsch',      flag: '🇩🇪' },
  { code: 'pt',    label: 'Português',    flag: '🇵🇹' },
  { code: 'ar',    label: 'العربية',      flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文 (简体)',  flag: '🇨🇳' },
  { code: 'zh-TW', label: '中文 (繁體)',  flag: '🇹🇼' },
  { code: 'ru',    label: 'Русский',      flag: '🇷🇺' },
  { code: 'ja',    label: '日本語',       flag: '🇯🇵' },
  { code: 'ko',    label: '한국어',       flag: '🇰🇷' },
  { code: 'hi',    label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'it',    label: 'Italiano',     flag: '🇮🇹' },
  { code: 'tr',    label: 'Türkçe',       flag: '🇹🇷' },
  { code: 'pl',    label: 'Polski',       flag: '🇵🇱' },
  { code: 'nl',    label: 'Nederlands',   flag: '🇳🇱' },
  { code: 'sv',    label: 'Svenska',      flag: '🇸🇪' },
  { code: 'id',    label: 'Indonesia',    flag: '🇮🇩' },
  { code: 'ms',    label: 'Melayu',       flag: '🇲🇾' },
  { code: 'th',    label: 'ภาษาไทย',     flag: '🇹🇭' },
  { code: 'vi',    label: 'Tiếng Việt',  flag: '🇻🇳' },
  { code: 'uk',    label: 'Українська',  flag: '🇺🇦' },
  { code: 'ro',    label: 'Română',       flag: '🇷🇴' },
  { code: 'cs',    label: 'Čeština',      flag: '🇨🇿' },
  { code: 'hu',    label: 'Magyar',       flag: '🇭🇺' },
];

// CSS injected into <head> to suppress the native Google Translate UI
const TRANSLATE_HIDE_CSS = `
  .goog-te-banner-frame,
  .goog-te-balloon-frame,
  #goog-gt-tt,
  .goog-tooltip,
  .goog-tooltip:hover,
  .goog-te-menu-value:hover,
  .VIpgJd-ZVi9od-aZ2wEe-wOHMyf { display: none !important; }
  body { top: 0 !important; position: static !important; }
  .goog-logo-link,
  .goog-te-gadget span,
  .goog-te-gadget > a { display: none !important; }
  #google_translate_element_hidden { display: none !important; }
  .goog-te-combo {
    opacity: 0;
    position: absolute;
    pointer-events: none;
    width: 0;
    height: 0;
  }
  font { vertical-align: inherit !important; background-color: transparent !important; }
`;

// -----------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------
function detectBrowserLang(): string {
  if (typeof navigator === 'undefined') return 'en';
  const lang = (navigator.language || (navigator as any).userLanguage || 'en') as string;
  const full = lang.toLowerCase();
  if (full === 'zh-tw' || full === 'zh-hk') return 'zh-TW';
  if (full.startsWith('zh')) return 'zh-CN';
  const base = full.split('-')[0];
  const match = SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === base || l.code.toLowerCase().startsWith(base),
  );
  return match?.code || 'en';
}

function getSavedLang(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    // Check googtrans cookie first
    const cookieMatch = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    if (cookieMatch) return decodeURIComponent(cookieMatch[1]);
    // Fall back to localStorage
    return localStorage.getItem('goldcrest_lang');
  } catch {
    return null;
  }
}

function setGoogtransCookie(langCode: string) {
  const val = langCode === 'en' ? '/en/en' : `/en/${langCode}`;
  const domain = window.location.hostname;
  document.cookie = `googtrans=${val}; path=/; domain=${domain}`;
  document.cookie = `googtrans=${val}; path=/`;
}

// Extend Window for Google Translate
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: {
          new (config: {
            pageLanguage: string;
            includedLanguages?: string;
            layout?: number;
            autoDisplay?: boolean;
            multilanguagePage?: boolean;
          }, elementId: string): void;
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initAttempted = useRef(false);

  // ---------------------------------------------------------------
  // 1. Inject hide-CSS once into <head> (App Router compatible)
  // ---------------------------------------------------------------
  useEffect(() => {
    const STYLE_ID = 'gt-hide-styles';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = TRANSLATE_HIDE_CSS;
      document.head.appendChild(style);
    }
  }, []);

  // ---------------------------------------------------------------
  // 2. Detect initial language from cookie / localStorage / browser
  // ---------------------------------------------------------------
  useEffect(() => {
    const saved = getSavedLang();
    const detected = detectBrowserLang();
    setCurrentLang(saved || detected);
  }, []);

  // ---------------------------------------------------------------
  // 3. Load Google Translate script (idempotent)
  // ---------------------------------------------------------------
  const initWidget = useCallback(() => {
    if (initAttempted.current) return;
    initAttempted.current = true;

    try {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: SUPPORTED_LANGUAGES.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: false,
          },
          'google_translate_element_hidden',
        );
        setGtReady(true);
      }
    } catch (e) {
      console.warn('[Translate] Widget init error:', e);
    }
  }, []);

  useEffect(() => {
    const SCRIPT_ID = 'google-translate-script-v3';

    // Register global callback before script loads
    window.googleTranslateElementInit = () => {
      initWidget();
    };

    if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src =
        'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      script.defer = true;
      script.onerror = () => {
        console.warn('[Translate] Google Translate script failed to load.');
      };
      document.head.appendChild(script);
    } else if (window.google?.translate?.TranslateElement) {
      // Script already loaded; just init the widget
      initWidget();
    }
  }, [initWidget]);

  // ---------------------------------------------------------------
  // 4. Auto-translate once the widget is ready
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!gtReady) return;
    const saved = getSavedLang();
    const detected = detectBrowserLang();
    const target = saved || detected;
    if (target && target !== 'en') {
      triggerTranslate(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gtReady]);

  // ---------------------------------------------------------------
  // 5. Close dropdown on outside click
  // ---------------------------------------------------------------
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ---------------------------------------------------------------
  // Core translation trigger – sets cookie & fires widget change
  // ---------------------------------------------------------------
  function triggerTranslate(langCode: string) {
    setGoogtransCookie(langCode);
    try {
      localStorage.setItem('goldcrest_lang', langCode);
    } catch {}

    // Try to find the hidden Google select and change it
    const tryWidget = (): boolean => {
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    };

    if (!tryWidget()) {
      // Widget may not be injected yet; retry a few times
      setTimeout(tryWidget, 400);
      setTimeout(tryWidget, 1000);
      setTimeout(tryWidget, 2000);
    }

    setCurrentLang(langCode);
    setIsOpen(false);
  }

  // ---------------------------------------------------------------
  // Handle manual language selection
  // ---------------------------------------------------------------
  function handleSelectLang(code: string) {
    if (code === 'en') {
      // Resetting to English: clear cookies & reload (most reliable)
      setGoogtransCookie('en');
      try {
        localStorage.setItem('goldcrest_lang', 'en');
      } catch {}
      setCurrentLang('en');
      setIsOpen(false);
      window.location.reload();
      return;
    }
    triggerTranslate(code);
  }

  const currentLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) || SUPPORTED_LANGUAGES[0];

  return (
    <>
      {/* Hidden widget anchor required by Google Translate SDK */}
      <div
        id="google_translate_element_hidden"
        aria-hidden="true"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
      />

      {/* Custom styled language picker */}
      <div ref={dropdownRef} className="relative" id="language-switcher">
        <button
          onClick={() => setIsOpen((prev) => !prev)}
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
          {!gtReady && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"
              title="Translator loading…"
            />
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
    </>
  );
}