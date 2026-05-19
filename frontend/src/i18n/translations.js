// Bilingual content for BikerLink landing
export const translations = {
  it: {
    nav: {
      links: [
        { href: "#features", label: "Funzionalità" },
        { href: "#users", label: "Chi sei" },
        { href: "#race", label: "Race Mode" },
        { href: "#club", label: "Club" },
        { href: "#faq", label: "FAQ" },
      ],
      cta: "Scarica App",
      menu: "Menu",
    },
    hero: {
      tagline: "PIATTAFORMA SOCIAL · COMUNITÀ MOTOCICLISTICA ITALIANA",
      title: ["CONNETTI", "LA TUA", "PASSIONE"],
      subtitle:
        "Mappa in tempo reale, matching tra Biker e Zavorrine, SOS stradale e Race Mode. Tutto ciò che serve per vivere la strada con la tua tribù.",
      ctaPrimary: "App Store",
      ctaSecondary: "Google Play",
      stats: [
        { value: "18", label: "Tipi di Match" },
        { value: "100KM", label: "Raggio SOS" },
        { value: "50+", label: "Moto Club" },
        { value: "24/7", label: "Real-Time" },
      ],
    },
    userTypes: {
      eyebrow: "CHI SEI?",
      title: "TRE MODI DI VIVERE LA STRADA",
      subtitle:
        "BikerLink è pensato per ogni anima della community: chi guida, chi siede dietro e chi condivide tutto.",
      cards: [
        {
          tag: "01",
          title: "BIKER",
          desc:
            "Chi guida. Mostra il tuo garage, organizza uscite, registra ogni curva in Race Mode e trova compagni di viaggio compatibili.",
        },
        {
          tag: "02",
          title: "ZAVORRINE",
          desc:
            "Chi siede dietro. Trova biker compatibili per stile, brand e musica. La wishlist incontra il garage giusto.",
        },
        {
          tag: "03",
          title: "COPPIE",
          desc:
            "Chi condivide tutto. Un profilo unico per pianificare giri, vincere contest e crescere insieme nella community.",
        },
      ],
    },
    features: {
      eyebrow: "CONTROL ROOM",
      title: "TUTTO QUELLO CHE SERVE,\nIN UN CASCO.",
      subtitle:
        "Undici sistemi pensati per la strada. Real-time, sicurezza e community in un'unica piattaforma.",
      list: [
        {
          icon: "Map",
          title: "Mappa Real-Time",
          desc: "Utenti attivi, officine convenzionate e segnalazioni SOS in diretta sulla mappa.",
        },
        {
          icon: "Zap",
          title: "Matching Engine",
          desc: "18 tipi di match basati su garage, brand, wishlist, musica Last.fm e proposte di uscita.",
        },
        {
          icon: "Route",
          title: "Route Planning",
          desc: "Algoritmo curvy roads su OSM + GraphHopper. Niente autostrade, solo asfalto che si piega.",
        },
        {
          icon: "Users",
          title: "MotoClub",
          desc: "Sub-comunità per brand, modello o zona. Chat di gruppo, codici invito, eventi.",
        },
        {
          icon: "Gauge",
          title: "Race Mode",
          desc: "Velocità, 0-100, angolo di piega, distanza, altitudine. GPS adattivo, batteria intatta.",
        },
        {
          icon: "Camera",
          title: "Pic! Contest",
          desc: "Contest fotografico settimanale. Carica, vota, vinci visibilità nella community.",
        },
        {
          icon: "MessageCircle",
          title: "Chat SSE",
          desc: "Messaggi privati e di gruppo in tempo reale via Server-Sent Events. Niente lag.",
        },
        {
          icon: "Compass",
          title: "Proposte",
          desc: "Hub per creare e trovare uscite. Un'idea, un orario, un punto di ritrovo.",
        },
      ],
    },
    safety: {
      eyebrow: "SAFETY FIRST",
      title: "LA SICUREZZA NON È UN OPTIONAL.",
      subtitle:
        "Tre sistemi che lavorano in silenzio per te, ogni chilometro.",
      items: [
        {
          tag: "SOS BIKER",
          title: "Raggio 100 km.",
          desc: "Un tap e i biker nelle vicinanze ricevono la notifica. Possono accettare e aprire chat diretta. Quando serve davvero, qualcuno arriva.",
          stat: "100KM",
          statLabel: "raggio massimo",
        },
        {
          tag: "HANDS-OFF",
          title: "Sopra i 50 km/h, l'app si zittisce.",
          desc: "L'interfaccia si blocca automaticamente alle alte velocità. Niente distrazioni, solo strada davanti a te.",
          stat: "50KM/H",
          statLabel: "soglia automatica",
        },
        {
          tag: "PRIVACY",
          title: "Coordinate sfumate vicino casa.",
          desc: "Le posizioni reali di casa e lavoro non sono mai precise. La community sa che ci sei, non sa dove vivi.",
          stat: "FUZZY",
          statLabel: "geolocalizzazione",
        },
      ],
    },
    race: {
      eyebrow: "RACE MODE",
      title: "OGNI METRICA, OGNI CURVA.",
      subtitle:
        "Il cruscotto digitale che trasforma ogni uscita in dati. GPS adattivo, batteria intatta, telemetria pulita.",
      metrics: [
        { value: "287", unit: "KM/H", label: "Velocità massima" },
        { value: "3.4", unit: "SEC", label: "0-100 km/h" },
        { value: "52°", unit: "ANGLE", label: "Angolo di piega" },
        { value: "428", unit: "KM", label: "Distanza" },
      ],
      cta: "Scopri Race Mode",
    },
    club: {
      eyebrow: "MOTOCLUB",
      title: "LA TUA TRIBÙ TI ASPETTA.",
      subtitle:
        "Sub-comunità tematiche per brand, modello o zona. Chat di gruppo, eventi privati e codici invito per la tua crew.",
      bullets: [
        "Crea il tuo club in 30 secondi",
        "Inviti privati con codice univoco",
        "Chat di gruppo SSE real-time",
        "Eventi e proposte solo per i membri",
      ],
      cta: "Esplora i club",
    },
    contest: {
      eyebrow: "PIC! CONTEST",
      title: "VOTA LA FOTO DELLA SETTIMANA.",
      subtitle:
        "Ogni lunedì un nuovo tema. Carica lo scatto migliore della tua uscita e lascia che la community decida.",
      tags: ["#sunsetride", "#curvy", "#solo", "#brotherhood", "#track", "#touring"],
    },
    faq: {
      eyebrow: "FAQ",
      title: "DOMANDE FREQUENTI",
      items: [
        {
          q: "L'app è gratuita?",
          a: "Sì, il download e tutte le funzionalità core (mappa, matching, SOS, chat) sono gratuiti. Sono previste funzioni premium per Race Mode avanzato e analytics dettagliate.",
        },
        {
          q: "Come funziona la privacy delle coordinate?",
          a: "Le posizioni reali di casa e lavoro non sono mai precise. Applichiamo un offset randomico nell'intorno della tua zona, così la community sa che ci sei senza sapere dove vivi.",
        },
        {
          q: "SOS funziona ovunque in Italia?",
          a: "Sì, ovunque ci sia copertura GSM. Il segnale ha un raggio di 100 km e notifica tutti gli utenti attivi nell'area. Per emergenze gravi chiama sempre il 112.",
        },
        {
          q: "Posso usare l'app senza essere un biker?",
          a: "Assolutamente. Esistono tre profili: Biker, Zavorrine (passeggere) e Coppie. Ogni profilo ha il suo set di funzioni e match dedicati.",
        },
        {
          q: "Race Mode consuma molta batteria?",
          a: "No. Usiamo un GPS adattivo che riduce automaticamente la frequenza di campionamento in base alla velocità e al tipo di strada. Una giornata in moto consuma circa il 15-20% della batteria.",
        },
        {
          q: "Quando esce l'app sugli store?",
          a: "Lancio previsto su App Store e Google Play. Iscriviti alla waitlist dal pulsante in alto per ricevere l'invito beta.",
        },
      ],
    },
    footer: {
      tagline: "Built for the road. Made in Italy.",
      columns: [
        {
          title: "Prodotto",
          links: ["Funzionalità", "Sicurezza", "Race Mode", "MotoClub", "Pic! Contest"],
        },
        {
          title: "Community",
          links: ["Instagram", "TikTok", "YouTube", "Discord"],
        },
        {
          title: "Legale",
          links: ["Privacy Policy", "Termini di Servizio", "Cookie", "Contatti"],
        },
      ],
      copyright: "© 2025 BikerLink. Tutti i diritti riservati.",
      download: "Scarica l'app",
    },
  },
  en: {
    nav: {
      links: [
        { href: "#features", label: "Features" },
        { href: "#users", label: "Who you are" },
        { href: "#race", label: "Race Mode" },
        { href: "#club", label: "Club" },
        { href: "#faq", label: "FAQ" },
      ],
      cta: "Download App",
      menu: "Menu",
    },
    hero: {
      tagline: "SOCIAL PLATFORM · ITALIAN MOTORCYCLE COMMUNITY",
      title: ["CONNECT", "YOUR", "PASSION"],
      subtitle:
        "Real-time map, matching between Bikers and Pillions, road SOS and Race Mode. Everything you need to live the road with your tribe.",
      ctaPrimary: "App Store",
      ctaSecondary: "Google Play",
      stats: [
        { value: "18", label: "Match types" },
        { value: "100KM", label: "SOS range" },
        { value: "50+", label: "Moto Clubs" },
        { value: "24/7", label: "Real-Time" },
      ],
    },
    userTypes: {
      eyebrow: "WHO YOU ARE",
      title: "THREE WAYS TO LIVE THE ROAD",
      subtitle:
        "BikerLink is built for every soul in the community: those who ride, those who sit behind, and those who share it all.",
      cards: [
        {
          tag: "01",
          title: "BIKER",
          desc:
            "The rider. Show off your garage, plan rides, record every curve in Race Mode and find compatible travel companions.",
        },
        {
          tag: "02",
          title: "PILLION",
          desc:
            "The passenger. Find bikers matching your style, brand and music. Your wishlist meets the right garage.",
        },
        {
          tag: "03",
          title: "COUPLES",
          desc:
            "The duo. A single profile to plan trips, win contests and grow together inside the community.",
        },
      ],
    },
    features: {
      eyebrow: "CONTROL ROOM",
      title: "EVERYTHING YOU NEED,\nINSIDE ONE HELMET.",
      subtitle:
        "Eleven systems built for the road. Real-time, safety and community in one platform.",
      list: [
        {
          icon: "Map",
          title: "Real-Time Map",
          desc: "Active users, partner workshops and SOS alerts live on the map.",
        },
        {
          icon: "Zap",
          title: "Matching Engine",
          desc: "18 match types based on garage, brand, wishlist, Last.fm music and ride proposals.",
        },
        {
          icon: "Route",
          title: "Route Planning",
          desc: "Curvy-roads algorithm on OSM + GraphHopper. No highways, just bending asphalt.",
        },
        {
          icon: "Users",
          title: "MotoClub",
          desc: "Sub-communities by brand, model or area. Group chats, invite codes, events.",
        },
        {
          icon: "Gauge",
          title: "Race Mode",
          desc: "Speed, 0-100, lean angle, distance, altitude. Adaptive GPS, battery intact.",
        },
        {
          icon: "Camera",
          title: "Pic! Contest",
          desc: "Weekly photo contest. Upload, vote, win visibility in the community.",
        },
        {
          icon: "MessageCircle",
          title: "SSE Chat",
          desc: "Private and group messaging in real time over Server-Sent Events. No lag.",
        },
        {
          icon: "Compass",
          title: "Proposals",
          desc: "Hub to create and find rides. One idea, one time, one meeting point.",
        },
      ],
    },
    safety: {
      eyebrow: "SAFETY FIRST",
      title: "SAFETY ISN'T AN OPTION.",
      subtitle: "Three systems working silently for you, every kilometer.",
      items: [
        {
          tag: "SOS BIKER",
          title: "100 km radius.",
          desc: "One tap and nearby bikers get the alert. They can accept and open direct chat. When it really matters, someone shows up.",
          stat: "100KM",
          statLabel: "max range",
        },
        {
          tag: "HANDS-OFF",
          title: "Above 50 km/h, the app goes silent.",
          desc: "The interface auto-locks at higher speeds. No distractions, just the road ahead.",
          stat: "50KM/H",
          statLabel: "auto threshold",
        },
        {
          tag: "PRIVACY",
          title: "Fuzzy coords near home.",
          desc: "Real home and work positions are never exact. The community knows you're there, not where you live.",
          stat: "FUZZY",
          statLabel: "geolocation",
        },
      ],
    },
    race: {
      eyebrow: "RACE MODE",
      title: "EVERY METRIC, EVERY CURVE.",
      subtitle:
        "The digital dashboard that turns every ride into data. Adaptive GPS, battery intact, clean telemetry.",
      metrics: [
        { value: "287", unit: "KM/H", label: "Top speed" },
        { value: "3.4", unit: "SEC", label: "0-100 km/h" },
        { value: "52°", unit: "ANGLE", label: "Lean angle" },
        { value: "428", unit: "KM", label: "Distance" },
      ],
      cta: "Discover Race Mode",
    },
    club: {
      eyebrow: "MOTOCLUB",
      title: "YOUR TRIBE IS WAITING.",
      subtitle:
        "Themed sub-communities by brand, model or area. Group chats, private events and invite codes for your crew.",
      bullets: [
        "Create your club in 30 seconds",
        "Private invites with unique codes",
        "Real-time SSE group chat",
        "Events and proposals members-only",
      ],
      cta: "Explore clubs",
    },
    contest: {
      eyebrow: "PIC! CONTEST",
      title: "VOTE THE PHOTO OF THE WEEK.",
      subtitle:
        "Every Monday a new theme. Upload the best shot from your ride and let the community decide.",
      tags: ["#sunsetride", "#curvy", "#solo", "#brotherhood", "#track", "#touring"],
    },
    faq: {
      eyebrow: "FAQ",
      title: "FREQUENTLY ASKED",
      items: [
        {
          q: "Is the app free?",
          a: "Yes, download and all core features (map, matching, SOS, chat) are free. Premium features are planned for advanced Race Mode and detailed analytics.",
        },
        {
          q: "How does coordinate privacy work?",
          a: "Your real home and work positions are never precise. We apply a random offset around your area so the community knows you're there without knowing where you live.",
        },
        {
          q: "Does SOS work anywhere in Italy?",
          a: "Yes, anywhere there is GSM coverage. The signal has a 100 km radius and notifies all active users in the area. For serious emergencies always call 112.",
        },
        {
          q: "Can I use the app without being a biker?",
          a: "Absolutely. There are three profiles: Biker, Pillion (passenger) and Couples. Each profile has its own feature set and dedicated matches.",
        },
        {
          q: "Does Race Mode drain the battery?",
          a: "No. We use adaptive GPS that automatically reduces sampling frequency based on speed and road type. A full day of riding consumes about 15-20% of battery.",
        },
        {
          q: "When does the app launch on stores?",
          a: "Launch planned on App Store and Google Play. Join the waitlist via the button above to receive the beta invite.",
        },
      ],
    },
    footer: {
      tagline: "Built for the road. Made in Italy.",
      columns: [
        {
          title: "Product",
          links: ["Features", "Safety", "Race Mode", "MotoClub", "Pic! Contest"],
        },
        {
          title: "Community",
          links: ["Instagram", "TikTok", "YouTube", "Discord"],
        },
        {
          title: "Legal",
          links: ["Privacy Policy", "Terms of Service", "Cookies", "Contact"],
        },
      ],
      copyright: "© 2025 BikerLink. All rights reserved.",
      download: "Download app",
    },
  },
};

export const images = {
  hero: "https://static.prod-images.emergentagent.com/jobs/c52ae50d-f554-4341-a9ff-4380f336dee8/images/fa5dc6135c710f905507df1a70778da0274116679ca00dfd33b6c3b498f22db3.png",
  userBiker:
    "https://images.unsplash.com/photo-1768507109219-4408445c8762?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHw0fHxtb3RvcmN5Y2xlJTIwcmlkZXIlMjBkYXJrJTIwcm9hZHxlbnwwfHx8fDE3NzkxNTI1NjR8MA&ixlib=rb-4.1.0&q=85",
  userZavorrina:
    "https://images.unsplash.com/photo-1591259966748-4e4b9916858f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxtb3RvcmN5Y2xlJTIwcmlkZXIlMjBkYXJrJTIwcm9hZHxlbnwwfHx8fDE3NzkxNTI1NjR8MA&ixlib=rb-4.1.0&q=85",
  userCoppie:
    "https://static.prod-images.emergentagent.com/jobs/c52ae50d-f554-4341-a9ff-4380f336dee8/images/121db819839f9d1268e1a48fd6a2cd9cca693c8349a94887d700a35a8b26aa05.png",
  raceMode:
    "https://static.prod-images.emergentagent.com/jobs/c52ae50d-f554-4341-a9ff-4380f336dee8/images/7c093e67604bc6c4d54808463c031df425c11810b8cc798b93cc18f6244ab229.png",
  route:
    "https://static.prod-images.emergentagent.com/jobs/c52ae50d-f554-4341-a9ff-4380f336dee8/images/76fd9f634c2fc89413274e5a1e5086da4fa114bb35424dbd0921a5aa4f008858.png",
  motoclub:
    "https://images.unsplash.com/photo-1489731007795-388eee095ff6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NjZ8MHwxfHNlYXJjaHwyfHxtb3RvcmN5Y2xlJTIwZ3JvdXAlMjByaWRlcnN8ZW58MHx8fHwxNzc5MTUyNTgxfDA&ixlib=rb-4.1.0&q=85",
};
