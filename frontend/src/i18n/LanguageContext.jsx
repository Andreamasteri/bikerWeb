import React, { createContext, useContext, useState, useMemo } from "react";
import { translations } from "./translations";

const LanguageContext = createContext({
  lang: "it",
  setLang: () => {},
  t: translations.it,
});

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState("it");
  const value = useMemo(
    () => ({ lang, setLang, t: translations[lang] }),
    [lang]
  );
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
