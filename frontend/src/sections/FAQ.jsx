import React from "react";
import { useLanguage } from "../i18n/LanguageContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";

export const FAQ = () => {
  const { t } = useLanguage();
  return (
    <section
      id="faq"
      data-testid="faq-section"
      className="relative bg-[#0a0a0a] py-24 md:py-32 border-t border-white/5"
    >
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          <div className="md:col-span-4">
            <div className="text-xs font-bold uppercase tracking-[0.32em] text-[#FF3B30] mb-4">
              {t.faq.eyebrow}
            </div>
            <h2
              data-testid="faq-title"
              className="font-display text-5xl md:text-6xl font-black uppercase leading-[0.9] tracking-tight"
            >
              {t.faq.title}
            </h2>
          </div>

          <div className="md:col-span-8">
            <Accordion
              type="single"
              collapsible
              className="w-full"
              data-testid="faq-accordion"
            >
              {t.faq.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="border-white/10"
                  data-testid={`faq-item-${i}`}
                >
                  <AccordionTrigger
                    className="text-left text-base md:text-lg font-semibold text-white hover:text-[#FF3B30] hover:no-underline py-6"
                    data-testid={`faq-trigger-${i}`}
                  >
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-white/65 text-sm md:text-base leading-relaxed pb-6">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
};
