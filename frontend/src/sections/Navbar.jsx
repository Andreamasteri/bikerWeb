import React, { useEffect, useState } from "react";
import { Menu, X, Download } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

export const Navbar = () => {
  const { t, lang, setLang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      data-testid="site-navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/70 backdrop-blur-xl border-b border-white/10"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 md:h-20 flex items-center justify-between">
        <a
          href="#top"
          data-testid="nav-logo"
          className="flex items-center gap-2 group"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF3B30] shadow-[0_0_14px_rgba(255,59,48,0.8)] group-hover:scale-125 transition-transform" />
          <span className="font-display text-xl md:text-2xl font-black uppercase tracking-tight text-white">
            Biker<span className="text-[#FF3B30]">Link</span>
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {t.nav.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              data-testid={`nav-link-${l.href.replace("#", "")}`}
              className="text-sm font-medium uppercase tracking-widest text-white/70 hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            data-testid="lang-toggle"
            className="hidden sm:flex items-center bg-white/5 border border-white/10 rounded-full p-1 text-xs font-bold tracking-widest"
          >
            <button
              data-testid="lang-it"
              onClick={() => setLang("it")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "it" ? "bg-[#FF3B30] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              IT
            </button>
            <button
              data-testid="lang-en"
              onClick={() => setLang("en")}
              className={`px-3 py-1 rounded-full transition-colors ${
                lang === "en" ? "bg-[#FF3B30] text-white" : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
          </div>

          <a
            href="#download"
            data-testid="nav-cta-download"
            className="hidden md:inline-flex items-center gap-2 bg-gradient-to-r from-[#FF3B30] to-[#FF6A00] text-white font-bold uppercase tracking-wider px-5 py-2.5 text-sm rounded-full hover:brightness-110 transition-all shadow-[0_0_24px_rgba(255,59,48,0.35)]"
          >
            <Download className="w-4 h-4" strokeWidth={2.4} />
            {t.nav.cta}
          </a>

          <button
            data-testid="mobile-menu-button"
            aria-label={t.nav.menu}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden w-10 h-10 inline-flex items-center justify-center rounded-full border border-white/15 text-white hover:bg-white/5"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          data-testid="mobile-menu"
          className="lg:hidden bg-black/95 backdrop-blur-xl border-t border-white/10"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {t.nav.links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                data-testid={`mobile-nav-link-${l.href.replace("#", "")}`}
                className="text-base font-semibold uppercase tracking-widest text-white/80 py-2 border-b border-white/5"
              >
                {l.label}
              </a>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <button
                data-testid="mobile-lang-it"
                onClick={() => setLang("it")}
                className={`px-4 py-2 text-xs font-bold tracking-widest rounded-full border ${
                  lang === "it"
                    ? "bg-[#FF3B30] border-[#FF3B30]"
                    : "border-white/15 text-white/70"
                }`}
              >
                IT
              </button>
              <button
                data-testid="mobile-lang-en"
                onClick={() => setLang("en")}
                className={`px-4 py-2 text-xs font-bold tracking-widest rounded-full border ${
                  lang === "en"
                    ? "bg-[#FF3B30] border-[#FF3B30]"
                    : "border-white/15 text-white/70"
                }`}
              >
                EN
              </button>
            </div>
            <a
              href="#download"
              onClick={() => setOpen(false)}
              data-testid="mobile-cta-download"
              className="mt-2 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF3B30] to-[#FF6A00] text-white font-bold uppercase tracking-wider px-5 py-3 rounded-full"
            >
              <Download className="w-4 h-4" />
              {t.nav.cta}
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
