import React from "react";
import { Check, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { images } from "../i18n/translations";

export const MotoClub = () => {
  const { t } = useLanguage();
  return (
    <section
      id="club"
      data-testid="club-section"
      className="relative bg-[#0a0a0a] py-24 md:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-[4/5]">
              <img
                src={images.motoclub}
                alt="MotoClub group ride"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="font-mono text-[10px] tracking-widest text-white">
                    12 ONLINE
                  </span>
                </div>
                <div className="bg-[#FF3B30] text-white font-bold uppercase text-xs tracking-widest px-3 py-2 rounded-full">
                  Sunday Ride
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4">
              {t.club.eyebrow}
            </div>
            <h2
              data-testid="club-title"
              className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-6"
            >
              {t.club.title}
            </h2>
            <p className="text-white/60 text-base md:text-lg max-w-xl leading-relaxed mb-10">
              {t.club.subtitle}
            </p>

            <ul className="space-y-4 mb-10">
              {t.club.bullets.map((b, i) => (
                <li
                  key={i}
                  data-testid={`club-bullet-${i}`}
                  className="flex items-start gap-4 group"
                >
                  <span className="mt-1 w-6 h-6 rounded-full bg-[#FF3B30]/10 border border-[#FF3B30]/40 flex items-center justify-center flex-shrink-0 group-hover:bg-[#FF3B30] transition-colors">
                    <Check
                      className="w-3.5 h-3.5 text-[#FF3B30] group-hover:text-white"
                      strokeWidth={3}
                    />
                  </span>
                  <span className="text-white/80 text-base md:text-lg">{b}</span>
                </li>
              ))}
            </ul>

            <a
              href="#download"
              data-testid="club-cta"
              className="inline-flex items-center gap-2 bg-transparent border-2 border-white/20 text-white font-bold uppercase tracking-wider px-6 py-3 rounded-full hover:border-[#FF3B30] hover:bg-[#FF3B30]/5 transition-all text-sm"
            >
              {t.club.cta}
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
