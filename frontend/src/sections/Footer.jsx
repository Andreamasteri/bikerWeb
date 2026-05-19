import React from "react";
import { Apple, Play, Instagram, Youtube } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export const Footer = () => {
  const { t } = useLanguage();
  return (
    <footer
      data-testid="site-footer"
      className="relative bg-black border-t border-white/10 pt-20 md:pt-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] shadow-[0_0_14px_rgba(255,59,48,0.8)]" />
              <span className="font-display text-2xl font-black uppercase tracking-tight">
                Biker<span className="text-[#FF3B30]">Link</span>
              </span>
            </div>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed mb-6">
              {t.footer.tagline}
            </p>

            <div className="flex items-center gap-3 mb-8">
              <a
                href="#"
                data-testid="footer-appstore"
                className="inline-flex items-center gap-2 bg-white text-black font-bold uppercase tracking-wider px-4 py-2.5 rounded-full text-xs hover:bg-[#FF3B30] hover:text-white transition-colors"
              >
                <Apple className="w-4 h-4" />
                App Store
              </a>
              <a
                href="#"
                data-testid="footer-googleplay"
                className="inline-flex items-center gap-2 bg-transparent border-2 border-white/15 text-white font-bold uppercase tracking-wider px-4 py-2.5 rounded-full text-xs hover:border-[#FF3B30] transition-colors"
              >
                <Play className="w-4 h-4" />
                Google Play
              </a>
            </div>

            <div className="flex items-center gap-3">
              {[
                { Icon: Instagram, label: "instagram" },
                { Icon: Youtube, label: "youtube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  data-testid={`footer-social-${label}`}
                  className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-white/70 hover:text-white hover:border-[#FF3B30] transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {t.footer.columns.map((col, i) => (
            <div
              key={i}
              className="md:col-span-2 md:col-start-auto"
              data-testid={`footer-column-${i}`}
            >
              <h4 className="text-xs font-bold uppercase tracking-[0.25em] text-white mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((l, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      data-testid={`footer-link-${i}-${j}`}
                      className="text-sm text-white/55 hover:text-[#FF3B30] transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Massive wordmark */}
        <div
          aria-hidden
          className="relative leading-none mb-8 select-none"
          data-testid="footer-wordmark"
        >
          <h2 className="font-display font-black uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white/15 to-white/[0.02] text-[24vw] md:text-[20vw] lg:text-[18vw] leading-none">
            BIKERLINK
          </h2>
        </div>

        <div className="border-t border-white/10 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-white/40 tracking-wider">
            {t.footer.copyright}
          </p>
          <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/30">
            v1.0 · Built for the road
          </p>
        </div>
      </div>
    </footer>
  );
};
