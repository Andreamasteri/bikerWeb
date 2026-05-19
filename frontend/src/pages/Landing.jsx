import React from "react";
import { LanguageProvider } from "../i18n/LanguageContext";
import { Navbar } from "../sections/Navbar";
import { Hero } from "../sections/Hero";
import { UserTypes } from "../sections/UserTypes";
import { Features } from "../sections/Features";
import { Safety } from "../sections/Safety";
import { RaceMode } from "../sections/RaceMode";
import { MotoClub } from "../sections/MotoClub";
import { PicContest } from "../sections/PicContest";
import { FAQ } from "../sections/FAQ";
import { Footer } from "../sections/Footer";

export default function Landing() {
  return (
    <LanguageProvider>
      <div
        data-testid="landing-page"
        className="bg-[#0a0a0a] text-white min-h-screen"
      >
        <Navbar />
        <main>
          <Hero />
          <UserTypes />
          <Features />
          <Safety />
          <RaceMode />
          <MotoClub />
          <PicContest />
          <FAQ />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
