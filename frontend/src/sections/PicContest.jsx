import React from "react";
import { Heart, Trophy } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

const photos = [
  {
    src: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=1200&q=80",
    author: "@marco_v4",
    votes: 1247,
  },
  {
    src: "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&w=1200&q=80",
    author: "@giulia.rides",
    votes: 983,
  },
  {
    src: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    author: "@duke_790",
    votes: 821,
  },
  {
    src: "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&w=1200&q=80",
    author: "@stelviopass",
    votes: 712,
  },
  {
    src: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&w=1200&q=80",
    author: "@cafe_racer_it",
    votes: 654,
  },
];

export const PicContest = () => {
  const { t } = useLanguage();

  return (
    <section
      id="contest"
      data-testid="contest-section"
      className="relative bg-[#0a0a0a] py-24 md:py-32 border-t border-white/5 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
          <div className="max-w-2xl">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4 flex items-center gap-2">
              <Trophy className="w-3.5 h-3.5" />
              {t.contest.eyebrow}
            </div>
            <h2
              data-testid="contest-title"
              className="font-display text-5xl md:text-7xl font-black uppercase leading-[0.9] tracking-tight mb-4"
            >
              {t.contest.title}
            </h2>
            <p className="text-white/60 text-base md:text-lg leading-relaxed">
              {t.contest.subtitle}
            </p>
          </div>
        </div>

        {/* Hashtag ticker */}
        <div className="relative overflow-hidden mb-12 border-y border-white/10 py-4">
          <div className="flex animate-ticker whitespace-nowrap gap-10">
            {[...t.contest.tags, ...t.contest.tags, ...t.contest.tags].map(
              (tag, i) => (
                <span
                  key={i}
                  className="font-display text-2xl md:text-3xl font-bold uppercase tracking-tight text-white/60 hover:text-[#FF3B30] transition-colors"
                >
                  {tag}
                  <span className="text-[#FF3B30] ml-10">/</span>
                </span>
              )
            )}
          </div>
        </div>

        <Carousel
          opts={{ align: "start", loop: true }}
          className="relative"
          data-testid="contest-carousel"
        >
          <CarouselContent className="-ml-4">
            {photos.map((p, i) => (
              <CarouselItem
                key={i}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3"
                data-testid={`contest-photo-${i}`}
              >
                <div className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 hover:border-[#FF3B30]/60 transition-all">
                  <img
                    src={p.src}
                    alt={`Contest photo by ${p.author}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-xl px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                    <Heart
                      className="w-3.5 h-3.5 text-[#FF3B30]"
                      fill="currentColor"
                    />
                    <span className="font-mono text-xs text-white">
                      {p.votes}
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="font-mono text-sm text-white/90">
                      {p.author}
                    </span>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious
            data-testid="contest-prev"
            className="hidden md:flex -left-4 bg-black/70 border-white/20 text-white hover:bg-[#FF3B30] hover:border-[#FF3B30]"
          />
          <CarouselNext
            data-testid="contest-next"
            className="hidden md:flex -right-4 bg-black/70 border-white/20 text-white hover:bg-[#FF3B30] hover:border-[#FF3B30]"
          />
        </Carousel>
      </div>
    </section>
  );
};
