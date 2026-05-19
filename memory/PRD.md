# BikerLink — Landing Page PRD

## Original problem statement
"Crea una landing page" per BikerLink — piattaforma social e di utilità per la community motociclistica italiana (Biker, Zavorrine, Coppie). Funzionalità: mappa real-time, matching engine (18 tipi), SOS Biker (100 km), Race Mode (telemetria GPS), MotoClub, Proposte, Route Planning, Pic! Contest, Chat SSE, Hands-Off System, Privacy.

## User choices (verbatim)
- Stile: **Dark + accenti racing** (rosso/arancio).
- Sezioni: **Decidi tu il set ottimale**.
- CTA principale: **"Scarica l'app"**.
- Lingua: **Italiano + inglese (toggle)**.
- Immagini moto/strada: **sì**.

## Architecture
- **Frontend**: React 19 + react-router + Tailwind + shadcn/ui (Accordion, Carousel).
- **i18n**: `LanguageContext` + `translations.js` (chiave `it` / `en`).
- **Type system**: nessuno (JSX).
- **Backend**: invariato (FastAPI base template), nessuna nuova rotta.
- **DB**: nessuna scrittura (landing statica).
- **Fonts**: Barlow Condensed (display) + Manrope (body) + JetBrains Mono (accenti tecnici).

## User personas
1. **Biker** — chi guida la moto.
2. **Zavorrina / Pillion** — chi siede dietro.
3. **Coppia** — un profilo per due.
4. **Visitor curioso / press** — scopre la community prima del download.

## Core requirements (static)
- Layout single-page mobile-first.
- Toggle lingua IT/EN persistente per sessione.
- CTA download Apple App Store + Google Play.
- Sezioni richieste dalle guidelines design + safety in evidenza.

## What's been implemented (Dec 2025)
- **Navbar** sticky con logo, 5 link, toggle IT/EN, CTA "Scarica App", menu mobile.
- **Hero** cinematografico con titolo "CONNETTI LA TUA PASSIONE", subtitle, doppio CTA store, strip 4 stats (18 / 100KM / 50+ / 24/7).
- **User Types** bento 3 card (Biker / Zavorrine / Coppie) con immagini.
- **Features (Control Room)** griglia 8 card (Mappa, Matching, Route, MotoClub, Race, Pic, Chat, Proposte).
- **Safety** 3 colonne (SOS 100KM + pulse, Hands-Off 50KM/H, Privacy fuzzy).
- **Race Mode** showcase con telemetria (287 KM/H, 3.4 SEC, 52°, 428 KM) + mockup.
- **MotoClub** sezione con immagine + 4 bullet + CTA.
- **Pic! Contest** ticker hashtag + carousel shadcn con 5 foto + voti.
- **FAQ** Accordion shadcn 6 domande.
- **Footer** wordmark gigante BIKERLINK + 3 colonne link + social + store buttons.
- Tutti i `data-testid` presenti per testing.
- Verificato 100% dal testing agent (iteration_1).

## Backlog (P0/P1/P2)
- **P1** — Form waitlist email salvato in MongoDB (endpoint `/api/waitlist`) collegato al CTA hero.
- **P1** — Mini sezione "Stato sviluppo" / changelog pubblico per trasparenza beta.
- **P2** — Aggiungere screenshot/mockup app reali quando disponibili (Mappa, Match, Chat).
- **P2** — Sezione testimonial / press logo strip.
- **P2** — Newsletter integration (Resend / SendGrid) per drip beta invite.
- **P2** — Allineare anchor `#users` con testid `user-types-section` (puramente cosmetico).
- **P2** — Page transitions con Framer Motion per micro-animazioni più ricche.
- **P3** — Dark/light theme switch.
- **P3** — SEO: meta tag OG/Twitter cards, sitemap, schema.org.

## Next tasks
1. Decidere se aggiungere form waitlist (richiede endpoint backend + DB collection).
2. Sostituire foto Pic! Contest con asset reali brand-coerenti se forniti.
3. Definire dominio finale + analytics (Plausible / PostHog).
