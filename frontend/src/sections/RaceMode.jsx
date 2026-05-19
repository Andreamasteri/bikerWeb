import React from "react";
import { Activity, ChevronRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { images } from "../i18n/translations";

export const RaceMode = () => {
  const { t } = useLanguage();
  return (
    <section
      id="race"
      data-testid="race-section"
      className="relative bg-black py-24 md:py-32 overflow-hidden grain"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,59,48,0.12)_0%,transparent_60%)]" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left: Phone mockup */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative">
              <div className="absolute -inset-6 bg-gradient-to-tr from-[#FF3B30]/20 to-[#FF6A00]/10 blur-3xl rounded-full" />
              <img
                src={images.raceMode}
                alt="Race Mode dashboard"
                className="relative w-full max-w-md mx-auto rounded-3xl border border-white/10 shadow-2xl"
              />
              {/* Telemetry badge */}
              <div className="absolute -top-3 -right-3 bg-[#FF3B30] text-white text-[10px] font-bold tracking-[0.3em] uppercase px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE TELEMETRY
              </div>
            </div>
          </div>

          {/* Right: Content + metrics */}
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              {t.race.eyebrow}
            </div>
            <h2
              data-testid="race-title"
              className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-6"
            >
              {t.race.title}
            </h2>
            <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed mb-10">
              {t.race.subtitle}
            </p>

            <div className="grid grid-cols-2 gap-px bg-white/5 border border-white/10 rounded-2xl overflow-hidden mb-8">
              {t.race.metrics.map((m, i) => (
                <div
                  key={i}
                  data-testid={`race-metric-${i}`}
                  className="bg-[#0a0a0a] p-6 md:p-7"
                >
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="font-display text-5xl md:text-6xl font-black text-white glow-red">
                      {m.value}
                    </span>
                    <span className="font-mono text-xs tracking-widest text-[#FF3B30]">
                      {m.unit}
                    </span>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            <a
              href="#download"
              data-testid="race-cta"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white border-b border-white/30 hover:border-[#FF3B30] hover:text-[#FF3B30] pb-1 transition-colors"
            >
              {t.race.cta}
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
