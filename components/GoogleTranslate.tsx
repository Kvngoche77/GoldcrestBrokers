'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
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

// CSS to suppress the native Google Translate UI chrome
const TRANSLATE_HIDE_CSS = `
  .goog-te-banner-frame,
  .goog-te-balloon-frame,
  #goog-gt-tt,
  .goog-tooltip,
  .goog-tooltip:hover,
  .goog-te-menu-value:hover,
  .VIpgJd-ZVi9od-aZ2wEe-wOHMyf,
  .VIpgJd-yAWNEb-L7lbkb { display: none !important; }
  body { top: 0 !important; position: static !important; }
  .goog-logo-link,
  .goog-te-gadget span,
  .goog-te-gadget > a { display: none !important; }
  #google_translate_element_hidden { position: absolute !important; width: 1px !important; height: 1px !important; overflow: hidden !important; opacity: 0 !important; pointer-events: none !important; }
  .goog-te-combo { opacity: 0; position: absolute; pointer-events: none; width: 0; height: 0; }
  font { vertical-align: inherit !important; background-color: transparent !important; }
`;

// -----------------------------------------------------------------
// Cookie & storage helpers
// -----------------------------------------------------------------
function getSavedLang(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const cookieMatch = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    if (cookieMatch) {
      const val = decodeURIComponent(cookieMatch[1]);
      if (val && val !== 'en') return val;
    }
    return localStorage.getItem('goldcrest_lang');
  } catch {
    return null;
  }
}

function setSavedLang(code: string) {
  try {
    localStorage.setItem('goldcrest_lang', code);
  } catch {}
}

function setGoogtransCookie(langCode: string) {
  const val = langCode === 'en' ? '/en/en' : `/en/${langCode}`;
  const domain = window.location.hostname;
  // Set for both the exact domain and with a leading dot (subdomain support)
  document.cookie = `googtrans=${val}; path=/; domain=.${domain}; SameSite=Lax`;
  document.cookie = `googtrans=${val}; path=/; domain=${domain}; SameSite=Lax`;
  document.cookie = `googtrans=${val}; path=/; SameSite=Lax`;
}

function clearGoogtransCookies() {
  const domain = window.location.hostname;
  const expired = 'googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `${expired}; domain=.${domain}`;
  document.cookie = `${expired}; domain=${domain}`;
  document.cookie = expired;
}

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

// Extend Window for Google Translate
declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    _goldcrestGTReady?: boolean;
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
// Core translation engine — fires the hidden widget's select change
// -----------------------------------------------------------------
function fireGoogleTranslate(langCode: string): Promise<boolean> {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = 20;

    const tryFire = () => {
      attempts++;
      const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
      if (select) {
        select.value = langCode;
        // Fire multiple event types for reliability across browsers
        select.dispatchEvent(new Event('change', { bubbles: true }));
        select.dispatchEvent(new Event('input', { bubbles: true }));
        // Also try the native input event format
        try {
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLSelectElement.prototype, 'value'
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(select, langCode);
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        } catch {}
        resolve(true);
        return;
      }

      if (attempts < maxAttempts) {
        setTimeout(tryFire, 300);
      } else {
        resolve(false);
      }
    };

    tryFire();
  });
}

// -----------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------
export function GoogleTranslate() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en');
  const [gtReady, setGtReady] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const widgetInitialized = useRef(false);
  const pathname = usePathname();

  // ---------------------------------------------------------------
  // 1. Inject hide-CSS once into <head>
  // ---------------------------------------------------------------
  useEffect(() => {
    const STYLE_ID = 'gt-hide-styles-v2';
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = TRANSLATE_HIDE_CSS;
      document.head.appendChild(style);
    }
    // Ensure the hidden widget div exists in the body
    const ANCHOR_ID = 'google_translate_element_hidden';
    if (!document.getElementById(ANCHOR_ID)) {
      const div = document.createElement('div');
      div.id = ANCHOR_ID;
      div.setAttribute('aria-hidden', 'true');
      document.body.appendChild(div);
    }
  }, []);

  // ---------------------------------------------------------------
  // 2. Detect initial language
  // ---------------------------------------------------------------
  useEffect(() => {
    const saved = getSavedLang();
    const detected = detectBrowserLang();
    setCurrentLang(saved || detected || 'en');
  }, []);

  // ---------------------------------------------------------------
  // 3. Initialize the Google Translate widget
  // ---------------------------------------------------------------
  const initWidget = useCallback(() => {
    if (widgetInitialized.current && window._goldcrestGTReady) return;

    try {
      if (window.google?.translate?.TranslateElement) {
        const ANCHOR_ID = 'google_translate_element_hidden';
        // Clear existing content so re-init works
        const anchor = document.getElementById(ANCHOR_ID);
        if (anchor) anchor.innerHTML = '';

        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: SUPPORTED_LANGUAGES.map((l) => l.code).join(','),
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: false,
          },
          ANCHOR_ID,
        );
        widgetInitialized.current = true;
        window._goldcrestGTReady = true;
        setGtReady(true);
      }
    } catch (e) {
      console.warn('[Translate] Widget init error:', e);
    }
  }, []);

  // ---------------------------------------------------------------
  // 4. Load Google Translate script (idempotent)
  // ---------------------------------------------------------------
  useEffect(() => {
    const SCRIPT_ID = 'google-translate-script-v4';

    window.googleTranslateElementInit = () => {
      initWidget();
    };

    if (window._goldcrestGTReady) {
      // Script already ran — just mark ready and re-apply saved language
      setGtReady(true);
      widgetInitialized.current = true;
    } else if (document.getElementById(SCRIPT_ID)) {
      // Script tag exists but callback hasn't fired yet — retry init
      if (window.google?.translate?.TranslateElement) {
        initWidget();
      }
    } else {
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
    }
  }, [initWidget]);

  // ---------------------------------------------------------------
  // 5. Auto-apply saved language when widget becomes ready
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!gtReady) return;
    const saved = getSavedLang();
    if (saved && saved !== 'en') {
      // Small delay to let widget fully render its select
      setTimeout(() => {
        fireGoogleTranslate(saved).then((ok) => {
          if (ok) setCurrentLang(saved);
        });
      }, 600);
    }
  }, [gtReady]);

  // ---------------------------------------------------------------
  // 6. Re-apply translation on client-side navigation (SPA routes)
  // ---------------------------------------------------------------
  useEffect(() => {
    if (!gtReady) return;
    const saved = getSavedLang();
    if (saved && saved !== 'en') {
      // Give the new page content time to render before translating
      setTimeout(() => {
        fireGoogleTranslate(saved);
      }, 800);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ---------------------------------------------------------------
  // 7. Close dropdown on outside click / Escape key
  // ---------------------------------------------------------------
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // ---------------------------------------------------------------
  // Core: set cookie + fire widget + persist choice
  // ---------------------------------------------------------------
  async function triggerTranslate(langCode: string) {
    setGoogtransCookie(langCode);
    setSavedLang(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);

    const ok = await fireGoogleTranslate(langCode);
    if (!ok) {
      // Widget select not found — force a page reload with cookie set so
      // Google Translate picks it up automatically on load
      window.location.reload();
    }
  }

  function handleSelectLang(code: string) {
    if (code === 'en') {
      // Reset to English: clear everything and reload
      clearGoogtransCookies();
      setSavedLang('en');
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
  );
}