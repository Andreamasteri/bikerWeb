import React from "react";
import { ShieldAlert, EyeOff, HandMetal } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const icons = [ShieldAlert, HandMetal, EyeOff];

export const Safety = () => {
  const { t } = useLanguage();
  return (
    <section
      id="safety"
      data-testid="safety-section"
      className="relative bg-gradient-to-b from-[#0a0a0a] via-[#120606] to-[#0a0a0a] py-24 md:py-32 overflow-hidden"
    >
      {/* SOS pulse blob */}
      <div className="pointer-events-none absolute -top-32 -right-32 w-[460px] h-[460px] rounded-full bg-[#FF3B30]/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 w-[360px] h-[360px] rounded-full bg-[#FF6A00]/10 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10">
        <div className="max-w-3xl mb-16 md:mb-20">
          <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4">
            {t.safety.eyebrow}
          </div>
          <h2
            data-testid="safety-title"
            className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-6"
          >
            {t.safety.title}
          </h2>
          <p className="text-white/60 text-base md:text-lg leading-relaxed">
            {t.safety.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {t.safety.items.map((item, i) => {
            const Icon = icons[i] || ShieldAlert;
            const isSos = i === 0;
            return (
              <article
                key={i}
                data-testid={`safety-item-${i}`}
                className={`group relative rounded-2xl border p-8 md:p-10 overflow-hidden ${
                  isSos
                    ? "bg-[#1a0606] border-[#FF3B30]/40"
                    : "bg-[#0d0d0d] border-white/10"
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 ${
                    isSos
                      ? "bg-[#FF3B30] text-white sos-pulse"
                      : "bg-white/5 border border-white/10 text-white"
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={1.8} />
                </div>

                <div className="font-mono text-[10px] tracking-[0.3em] text-white/40 mb-3">
                  / {item.tag}
                </div>
                <h3 className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight mb-4 text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-white/65 leading-relaxed mb-8">
                  {item.desc}
                </p>

                <div className="flex items-end justify-between pt-6 border-t border-white/10">
                  <div>
                    <div
                      className={`font-display text-4xl md:text-5xl font-black ${
                        isSos ? "text-[#FF3B30] glow-red" : "text-white"
                      }`}
                    >
                      {item.stat}
                    </div>
                    <div className="text-[10px] tracking-[0.25em] uppercase text-white/40 mt-1">
                      {item.statLabel}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
