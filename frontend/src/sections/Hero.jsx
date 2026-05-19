import React from "react";
import { Apple, Play, ArrowDownRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { images } from "../i18n/translations";

export const Hero = () => {
  const { t } = useLanguage();

  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative min-h-screen w-full overflow-hidden grain"
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={images.hero}
          alt="Biker on dark road"
          className="w-full h-full object-cover object-center scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      {/* Racing stripe accent */}
      <div className="absolute top-24 right-0 w-1/3 h-1 racing-stripes opacity-60 hidden md:block" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-32 md:pt-44 pb-20 min-h-screen flex flex-col justify-between">
        <div className="max-w-3xl">
          <div
            data-testid="hero-tagline"
            className="inline-flex items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.32em] text-white/70 mb-8 fade-up"
          >
            <span className="w-8 h-px bg-[#FF3B30]" />
            {t.hero.tagline}
          </div>

          <h1
            data-testid="hero-title"
            className="font-display font-black uppercase leading-[0.85] tracking-tight text-white text-6xl sm:text-7xl md:text-8xl lg:text-[9rem] fade-up"
          >
            {t.hero.title[0]}
            <br />
            <span className="text-white/40">{t.hero.title[1]}</span>
            <br />
            <span className="glow-red text-[#FF3B30]">{t.hero.title[2]}.</span>
          </h1>

          <p
            data-testid="hero-subtitle"
            className="mt-8 text-base md:text-lg text-white/70 max-w-xl leading-relaxed fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {t.hero.subtitle}
          </p>

          <div
            id="download"
            className="mt-10 flex flex-col sm:flex-row gap-4 fade-up"
            style={{ animationDelay: "0.35s" }}
          >
            <a
              href="#"
              data-testid="hero-cta-appstore"
              className="group inline-flex items-center gap-3 bg-white text-black font-bold uppercase tracking-wider px-6 py-4 rounded-full hover:bg-[#FF3B30] hover:text-white transition-all"
            >
              <Apple className="w-5 h-5" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] tracking-[0.25em] opacity-70">
                  Download
                </span>
                <span className="text-sm">{t.hero.ctaPrimary}</span>
              </div>
            </a>
            <a
              href="#"
              data-testid="hero-cta-googleplay"
              className="group inline-flex items-center gap-3 bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-wider px-6 py-4 rounded-full hover:border-[#FF3B30] hover:bg-[#FF3B30]/10 transition-all"
            >
              <Play className="w-5 h-5" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] tracking-[0.25em] opacity-70">
                  Get it on
                </span>
                <span className="text-sm">{t.hero.ctaSecondary}</span>
              </div>
            </a>
          </div>
        </div>

        {/* Stats strip */}
        <div
          data-testid="hero-stats"
          className="relative mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl"
        >
          {t.hero.stats.map((s, i) => (
            <div
              key={i}
              data-testid={`hero-stat-${i}`}
              className="bg-black/40 p-5 md:p-7 flex flex-col gap-1"
            >
              <span className="font-display text-3xl md:text-5xl font-black text-white">
                {s.value}
              </span>
              <span className="text-[10px] md:text-xs uppercase tracking-[0.25em] text-white/50">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <a
          href="#users"
          aria-label="Scroll to next section"
          className="absolute bottom-6 right-6 md:bottom-10 md:right-10 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.3em] text-white/50 hover:text-white transition-colors"
          data-testid="hero-scroll-indicator"
        >
          Scroll
          <ArrowDownRight className="w-4 h-4" />
        </a>
      </div>
    </section>
  );
};
