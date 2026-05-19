import React from "react";
import {
  Map,
  Zap,
  Route,
  Users,
  Gauge,
  Camera,
  MessageCircle,
  Compass,
} from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

const iconMap = {
  Map,
  Zap,
  Route,
  Users,
  Gauge,
  Camera,
  MessageCircle,
  Compass,
};

export const Features = () => {
  const { t } = useLanguage();
  return (
    <section
      id="features"
      data-testid="features-section"
      className="relative bg-[#0a0a0a] py-24 md:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4">
              {t.features.eyebrow}
            </div>
            <h2
              data-testid="features-title"
              className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight whitespace-pre-line"
            >
              {t.features.title}
            </h2>
          </div>
          <p className="text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/10">
          {t.features.list.map((f, i) => {
            const Icon = iconMap[f.icon] || Zap;
            return (
              <div
                key={i}
                data-testid={`feature-card-${i}`}
                className="group relative bg-[#0d0d0d] p-7 md:p-8 min-h-[260px] flex flex-col justify-between hover:bg-[#121212] transition-colors duration-300"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:border-[#FF3B30] group-hover:text-[#FF3B30] transition-all duration-300">
                    <Icon className="w-5 h-5" strokeWidth={1.6} />
                  </div>
                  <span className="font-mono text-[10px] tracking-widest text-white/30">
                    0{i + 1}
                  </span>
                </div>
                <div className="mt-6">
                  <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-2 text-white">
                    {f.title}
                  </h3>
                  <p className="text-sm text-white/60 leading-relaxed">{f.desc}</p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF3B30]/0 to-transparent group-hover:via-[#FF3B30]/60 transition-all duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
