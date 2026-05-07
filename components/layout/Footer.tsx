import Link from 'next/link';
import { TrendingUp, Twitter, Linkedin, Github, Mail, Shield, Globe } from 'lucide-react';

const footerLinks = {
  Platform: [
    { href: '/#markets', label: 'Markets' },
    { href: '/dashboard/trade', label: 'Spot Trading' },
    { href: '/dashboard/trade/copy', label: 'Copy Trading' },
    { href: '/#plans', label: 'Investment Plans' },
    { href: '/#referral', label: 'Referral Program' },
  ],
  Company: [
    { href: '/#about', label: 'About Us' },
    { href: '/legal/privacy', label: 'Privacy Policy' },
    { href: '/legal/terms', label: 'Terms of Service' },
    { href: '/legal/risk', label: 'Risk Disclosure' },
  ],
  Support: [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/help', label: 'Help Center' },
    { href: 'mailto:support@goldcrestbroker.com', label: 'Contact Support' },
    { href: '/faq', label: 'FAQ' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#040b15]">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center glow-blue transition-transform duration-300 group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight leading-none text-white">
                  GOLDCREST
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-blue-400 uppercase mt-0.5">
                Broker
              </span>
              </div>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs mb-6">
              A premium investment and trading platform offering asset-backed investment plans, real-time market data, and a rewarding referral program.
            </p>
            <div className="flex items-center gap-3">
              {[
                { icon: Twitter, href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
                { icon: Github, href: '#', label: 'GitHub' },
                { icon: Mail, href: 'mailto:support@goldcrestbroker.com', label: 'Email' },
              ].map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-semibold text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Trust bar */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 text-center md:text-left">
              &copy; {new Date().getFullYear()} Goldcrest Broker. All rights reserved. Investment involves risk.
            </p>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Shield size={13} className="text-emerald-500" />
                <span>256-bit SSL Secured</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Globe size={13} className="text-blue-500" />
                <span>Global Operations</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
