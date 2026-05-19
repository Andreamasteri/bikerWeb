import React from "react";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { images } from "../i18n/translations";

const cardImages = [images.userBiker, images.userZavorrina, images.userCoppie];

export const UserTypes = () => {
  const { t } = useLanguage();
  return (
    <section
      id="users"
      data-testid="user-types-section"
      className="relative bg-[#0a0a0a] py-24 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4">
              {t.userTypes.eyebrow}
            </div>
            <h2
              data-testid="user-types-title"
              className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight"
            >
              {t.userTypes.title}
            </h2>
          </div>
          <p className="text-white/60 text-base md:text-lg max-w-md leading-relaxed">
            {t.userTypes.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {t.userTypes.cards.map((c, i) => (
            <article
              key={c.title}
              data-testid={`user-card-${i}`}
              className="group relative h-[520px] rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF3B30]/60 transition-all duration-500"
            >
              <img
                src={cardImages[i]}
                alt={c.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
              <div className="absolute inset-0 racing-stripes opacity-0 group-hover:opacity-30 transition-opacity duration-500" />

              <div className="absolute top-5 left-5 right-5 flex items-start justify-between">
                <span className="font-mono text-xs tracking-widest text-white/60">
                  / {c.tag}
                </span>
                <ArrowUpRight className="w-5 h-5 text-white/40 group-hover:text-[#FF3B30] group-hover:rotate-45 transition-all duration-500" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <h3 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3 text-white">
                  {c.title}
                </h3>
                <p className="text-sm md:text-base text-white/75 leading-relaxed">
                  {c.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
