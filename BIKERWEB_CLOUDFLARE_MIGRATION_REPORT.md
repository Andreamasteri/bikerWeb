# Migrazione BikerWeb → Cloudflare — report operativo

**Aggiornato:** 19 novembre 2026 (UTC)
**Stato:** candidate verificato su Cloudflare Preview e codice unito in main via PR #1; **cutover non eseguito**. Il Gate 1 resta bloccato sulle verifiche autenticate e sulla conferma del DB staging. Il sito ufficiale continua a essere servito da Railway; il backend production è rimasto attivo e invariato.

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

Report dettagliati: [`API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md), [`API_PREVIEW_REPORT.md`](docs/cloudflare-migration/API_PREVIEW_REPORT.md), [`API_BEFORE.json`](docs/cloudflare-migration/API_BEFORE.json) e [`API_PREVIEW.json`](docs/cloudflare-migration/API_PREVIEW.json), [`API_STAGING_ANON.json`](docs/cloudflare-migration/API_STAGING_ANON.json) e [`API_STAGING_ANON_REPORT.md`](docs/cloudflare-migration/API_STAGING_ANON_REPORT.md).

| Target e acquisizione | Controlli | PASS | FAIL | Mediana | Revisione backend |
| --- | ---: | ---: | ---: | ---: | --- |
| Baseline apex — `13:03:15Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Baseline Railway — `13:03:15Z` | 38 | 38 | 0 | 182,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Preview Cloudflare — `13:14:29Z` | 38 | 38 | 0 | 192,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Apex contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Railway contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 186 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

Il confronto Preview → baseline apex ha trovato **0 differenze** nei 38 controlli. Comprende health/readiness, auth/profile/chat anonimi, configurazione e community, CORS, BikerBlog canonical, redirect, HEAD, immagine completa/hash, validator condizionali, Range, SSE anonimi e handshake WebSocket anonimi. I `401` sono quelli attesi per richieste senza sessione.

**Gate 1: BLOCKED, non PASS.** Sul Preview production e sull’origine production la suite anonima passa senza regressioni, ma non verifica cookie/sessione valida. Mancano login, matching autenticato, telemetry, chat/notifiche con sessione, upload, SOS, callback e stream SSE/WebSocket autenticati. L’autenticazione Wrangler è verificata; non equivale a un’identità BikerLink.

Il backend staging servito al momento dei test è il branch feat/telemetry-capability-close-20261103, revisione cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374. Il codice di quella revisione mappa staging su DATABASE_URL_CANDIDATE e rifiuta l’uso della variabile DATABASE_URL generica; nello stesso ambiente Railway esiste un servizio Postgres separato con volume da 500 MB. Tuttavia il connettore Railway restituisce solo i nomi delle variabili e oscura i valori: l’host effettivo di DATABASE_URL_CANDIDATE non è stato verificato, quindi non dichiaro dimostrato l’isolamento DB.

Smoke staging in sola lettura: 31/38 controlli PASS. I 7 FAIL sono preflight CORS eseguiti con origine production; lo staging non restituisce ACAO per biker-link.net o bikertest.biker-link.net. Due preflight separati per l’origine staging stessa restituiscono ACAO, credenziali, metodi e header attesi. Evidenza e interpretazione sono in API_STAGING_ANON_REPORT.md. Questa prova non include autenticazione.

Non ho lanciato lo smoke backend automatico: il runner registra account, aggiorna direttamente il DB per la verifica email e all’avvio ripulisce possibili account smoke precedenti usando DATABASE_URL_CANDIDATE. Senza host DB verificato e sessione autorizzata, quei write non sono sicuri. Nessuna scrittura DB è stata eseguita e la patch staged Railway non è stata toccata.

Finché Gate 1 non passa, non si esegue il deployment production né il cambio DNS. **Gate 2 e Gate 3: NOT RUN**; API_AFTER.json non esiste perché il cutover non è avvenuto.

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

- Repository: Andreamasteri/bikerWeb.
- Branch dedicato: codex/bikerweb-cloudflare-production-20261119; base verificata main a 7827790d7f26c8060319e29772d073160fd23af0.
- Commit sorgente candidate: 1fec50617a2c6aad9f84bc87ce993f07aba106ab; il sorgente del Preview 9 corrisponde a quel commit.
- PR #1: https://github.com/Andreamasteri/bikerWeb/pull/1, unita il 19 novembre 2026 alle 17:26:27Z. Merge commit: 3627b464c593f66164dd75e3e7160b1790e52d04. Stato verificato via API GitHub.
- Non esistono workflow .github/workflows; la PR non aveva check CI automatici. Verifiche locali sul candidate: npm run test:routing (35/35 PASS), npm run dry-run (PASS; 38 file statici e binding ASSETS, SITE_ASSETS, RAILWAY_ORIGIN, PUBLIC_SITE_ORIGIN).
- Wrangler 4.165.0 è fissato nel lockfile. L’account Cloudflare è autenticato. Cloudflare API non trova configurazione Workers Builds per il Worker candidate; l’elenco script production continua a non includerlo. Il merge GitHub non ha pubblicato il Worker.
- Nessun deployment production, custom domain o route apex è stato creato.

## Decisione

Il candidate è unito in main e resta solo in Preview; la migrazione production **non è conclusa**. DNS, sito ufficiale, backend Railway e BikerTest sono rimasti invariati. Per chiudere Gate 1 servono una sessione utente di test autorizzata e la prova del target effettivo del DB candidato. Il connettore Railway oscura i valori e il download della CLI Railway è fallito per connessione rifiutata al rilascio GitHub; la sessione browser sandbox condivisa non era avviabile. Non ho creato utenti, letto/scritto dati DB o invocato notifiche. Il cutover resta bloccato secondo il piano.
