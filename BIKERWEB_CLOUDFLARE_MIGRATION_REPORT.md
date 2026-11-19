# Migrazione BikerWeb → Cloudflare — report operativo

**Aggiornato:** 19 novembre 2026 (UTC)
**Stato:** candidate pronto e validato su Cloudflare Preview; **cutover non eseguito**. Il Gate 1 resta bloccato sulle verifiche autenticate. Il frontend ufficiale è ancora servito da Railway e il backend Railway è rimasto attivo e invariato.

## Architettura e stato live

| Componente | Stato verificato |
| --- | --- |
| Sito ufficiale `https://biker-link.net` | HTTP 200; DNS continua a puntare direttamente a Railway, quindi non è ancora sul Worker. Nessuna modifica DNS applicata. |
| Backend Railway produzione | `bikerlink-production.up.railway.app`; `/api/health` HTTP 200, `degraded=false`, revisione `aedfb278f487105a10567c9efa4c090705b3d801`. Nessun deploy o modifica variabili Railway di produzione. |
| DNS Cloudflare apex | Un record CNAME, `biker-link.net` → `bikerlink-production.up.railway.app`, DNS-only (`proxied:false`), ID `f4b67198cdea0c5f2f61d65e53ce6841`, TTL Auto. Snapshot Cloudflare: 46 record totali; nessun record email o hostname alternativo modificato. |
| BikerTest | `https://bikertest.biker-link.net/` HTTP 200; Worker distinto e non modificato. Il record AAAA `100::` resta proxied. |
| Cloudflare R2 | Bucket `bikerlink-website-assets`: 49 oggetti, 6.044.133 byte, manifest allineato alla sorgente Railway verificata. Nessun oggetto modificato durante questa fase. |
| Worker candidato | Preview isolato su `workers.dev`, non produzione. Preview ID `fa7a694ccc584f439a2cef32f65be791`; deployment 9 `3c35e4a7-8080-41ef-a23a-71d07f37e30d`, URL immutabile <https://3c35e4a7-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev>. Nessun custom domain o route apex collegato. |
| Static Assets e variabili | Il candidate serve i file in `workers/bikerlink-website-production/public` tramite `ASSETS`, usa R2 via `SITE_ASSETS`, `RAILWAY_ORIGIN=https://bikerlink-production.up.railway.app` e `PUBLIC_SITE_ORIGIN=https://biker-link.net`. Variabili non segrete nel file Wrangler; nessun segreto nel repository. |
| TLS e connessioni persistenti | La zona usa SSL Full e WebSockets attivi secondo l’audit precedente; il candidate apre TLS direttamente verso l’hostname Railway, senza fetch del dominio apex e quindi senza loop. Le prove WebSocket sono state anonime. |

La tabella completa delle precedenze è in [`workers/bikerlink-website-production/ROUTES.md`](workers/bikerlink-website-production/ROUTES.md). `/api` e `/api/*` hanno sempre precedenza e inoltrano tutti i metodi a Railway. Sono inoltre instradati esplicitamente `/healthz`, `/ws/admin/notifications`, `/ws/diagnostic*`, l’handshake Expo su `GET /` con header `expo-platform`, pagine legacy, blog, matching, docs, media e asset origin-owned. Non esiste un catch-all che restituisce HTML per un path sconosciuto.

La verifica ha trovato che `/blog` generava canonical e Open Graph con l’hostname `*.up.railway.app` quando passava attraverso il subrequest Worker. Il candidate riscrive quell’hostname nelle sole risposte HTML non-API e negli eventuali redirect assoluti; body API/JSON, cookie, media, SSE e WebSocket non vengono trasformati. L’asset immutato `web-session.js` dal commit backend `aedfb278f487105a10567c9efa4c090705b3d801` viene servito da Static Assets perché Railway restituisce 404 su quel percorso pur iniettandolo nelle pagine. Le sue richieste `/api/auth/*` restano su Railway.

## Inventario del traffico

- **API applicative:** `/api` e `/api/*`, ogni metodo, query string, header, cookie e body inoltrati a Railway.
- **Readiness e handshake:** `GET/HEAD /healthz`; `GET /` con `expo-platform: ios|android`; WebSocket diretti `/ws/admin/notifications`, `/ws/diagnostic` e `/ws/diagnostic/*`.
- **Pagine e servizi Railway:** elenco esplicito di pagine legacy/app, `/blog/*`, `/matching/*`, `/docs/*`, `/uploads/*`, `/music/*`, `/assets/*` non immagini e file documentato in `ROUTES.md`.
- **Frontend Cloudflare:** le 18 pagine già approvate su BikerTest, più `robots.txt`, `sitemap.xml` e `web-session.js` come Static Assets.
- **Immagini R2:** `GET` semplice da `bikerlink-website-assets`; HEAD, Range, `If-*` e oggetti mancanti ricadono su Railway per mantenere i validator e le risposte condizionali dell’origine.
- **CORS, callback e webhook:** i preflight CORS sono stati provati; nessun webhook o callback è stato invocato. Non sono state trovate route applicative pubbliche di scrittura fuori da `/api/*`; gli endpoint diretti sopra sono elencati separatamente.

## Backup Forge e rollback

Backup pre-migrazione registrato e verificato nella fase precedente:

`/home/andrea/backups/bikerweb/bikerweb-pre-cloudflare-production-20261119.zip`

- Dimensione: **8.598.088 byte**.
- SHA-256: `d129429c1161df1388816c5815f0cac2c219bd8bc454948a757da60ef7f31745`.
- Verifiche registrate: test ZIP, checksum `SHA256SUMS`, estrazione controllata dei file manifestati e ripristino dei sorgenti TypeScript/pagine HTML; include `MANIFEST.json` e `RESTORE.md`.
- Il contenuto è un backup dei sorgenti e delle configurazioni del frontend/routing, non un dump completo del servizio Railway, dei database o dei segreti.
- Il percorso Forge non è montato nel container `/workspace` di questo passaggio; non ho ricalcolato il digest nel controllo corrente. Il dato riportato è quello della verifica precedente, non un nuovo checksum.

Rollback documentato in `RESTORE.md`: mantenere Railway attivo, ripristinare il solo CNAME apex DNS-only verso Railway, rimuovere soltanto l’eventuale route/custom domain Worker apex aggiunto dal cutover e verificare propagazione, TLS, homepage e API finché tornano effettivamente al servizio precedente. Nessun rollback è stato eseguito perché non c’è stato cutover.

## API — Gate 1

Report dettagliati: [`API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md), [`API_PREVIEW_REPORT.md`](docs/cloudflare-migration/API_PREVIEW_REPORT.md), [`API_BEFORE.json`](docs/cloudflare-migration/API_BEFORE.json) e [`API_PREVIEW.json`](docs/cloudflare-migration/API_PREVIEW.json).

| Target e acquisizione | Controlli | PASS | FAIL | Mediana | Revisione backend |
| --- | ---: | ---: | ---: | ---: | --- |
| Baseline apex — `13:03:15Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Baseline Railway — `13:03:15Z` | 38 | 38 | 0 | 182,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Preview Cloudflare — `13:14:29Z` | 38 | 38 | 0 | 192,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Apex contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Railway contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 186 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

Il confronto Preview → baseline apex ha trovato **0 differenze** nei 38 controlli. Comprende health/readiness, auth/profile/chat anonimi, configurazione e community, CORS, BikerBlog canonical, redirect, HEAD, immagine completa/hash, validator condizionali, Range, SSE anonimi e handshake WebSocket anonimi. I `401` sono quelli attesi per richieste senza sessione.

**Gate 1: BLOCKED, non PASS.** La suite non verifica un cookie/sessione valida e non ha eseguito login, matching autenticato, telemetria scritta, chat/notifiche con sessione, upload, SOS, callback o WebSocket/SSE autenticati. L’autenticazione Wrangler è ora verificata sull’account Cloudflare previsto; questo non fornisce un’identità applicativa sandbox. Il progetto Railway contiene un ambiente `staging` attivo con servizio backend e Postgres, ma il servizio usa un branch/revisione diversi (`feat/telemetry-capability-close-20261103`, `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`). Ho verificato health 200 e `degraded=false`, ma non un’identità di test autorizzata né il collegamento esclusivo di quel backend al database di test. Non sono state eseguite scritture né toccata la patch già staged nello staging.

Finché Gate 1 non passa, non si esegue il deployment production né il cambio DNS. **Gate 2 e Gate 3: NOT RUN**; `API_AFTER.json` non esiste perché la pubblicazione non è avvenuta.

## Sito e browser

Evidenza browser aggiornata per deployment 9 in [`BROWSER_PREVIEW.json`](docs/cloudflare-migration/BROWSER_PREVIEW.json), acquisita alle `13:19:08Z`:

- Chromium desktop 1365×900 e Pixel 7 emulato 412 px; homepage, `/blog`, `/matching`, `/community` tutti HTTP 200 e senza overflow.
- Homepage canonical `https://biker-link.net/`, meta robots `index,follow`; 13/13 immagini R2 caricate dopo scroll progressivo su entrambi i viewport.
- `/blog` canonical `https://biker-link.net/blog`; nessun hostname Railway rimasto nel markup.
- `/web-session.js` 200, MIME `text/javascript`, 4.827 byte; menu mobile apre 10 link.
- Zero eccezioni JavaScript, richieste fallite o metodi di scrittura; quattro risposte HTTP 401 ad `/api/auth/me` sono i rifiuti anonimi attesi.
- Il Preview ha `X-Robots-Tag: noindex`; BikerTest e gli hostname non-apex restano fuori dal candidate.
- Non è stato usato un dispositivo Android fisico.

## GitHub, CI e deployment

- Repository: `Andreamasteri/bikerWeb`.
- Branch: `codex/bikerweb-cloudflare-production-20261119`; base verificata `main` a `7827790d7f26c8060319e29772d073160fd23af0`.
- PR #1: <https://github.com/Andreamasteri/bikerWeb/pull/1>, draft e non merged al checkpoint precedente. Stato e commit remoto saranno aggiornati dopo il push delle ultime evidenze.
- Il repository non contiene `.github/workflows`; non c’è una pipeline CI attiva. I controlli locali obbligatori del candidate sono: `npm run test:routing` (**35/35 PASS**), `npm run dry-run` (**PASS**, 38 file statici e binding `ASSETS`, `SITE_ASSETS`, `RAILWAY_ORIGIN`, `PUBLIC_SITE_ORIGIN`).
- Wrangler `4.165.0` è fissato nel manifest/lockfile. L’autenticazione OAuth è salvata fuori dal repository; il Worker creato resta Preview, non production.

## Decisione

La preparazione e il Preview sono completati; la migrazione **non è conclusa**. Frontend ufficiale, DNS e backend sono rimasti nello stato precedente; BikerTest è operativo. Il motivo del blocco è il Gate 1: non è disponibile un account/sessione applicativa sandbox già autorizzato e verificato come isolato dai dati di produzione. Il login Wrangler completa l’accesso Cloudflare ma non sostituisce questa identità applicativa. Quando sarà disponibile, si potrà eseguire la suite autenticata sullo staging corretto e rivalutare il cutover secondo i gate vincolanti.
