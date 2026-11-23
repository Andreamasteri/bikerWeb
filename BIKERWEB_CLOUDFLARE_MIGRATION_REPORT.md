# Migrazione BikerWeb → Cloudflare — report operativo

**Aggiornato:** 23 novembre 2026, 17:04 UTC
**Stato corrente:** Il cutover è live: biker-link.net/* passa dal Worker bikerlink-website-production; il CNAME apex mantiene Railway come origine con proxy Cloudflare attivo. Railway è READY alla revisione 7c3ae1137dc56ec3110a6a755660f11f744882ff. Gate 1: 19/19 PASS sul Worker ufficiale di staging. Gate 2: suite autenticata di produzione 15/15 PASS, inclusi session SSE e notifiche WebSocket, senza POST o scritture applicative; l’health è READY e la revisione backend è invariata. Gate 3: PASS su desktop, Android Chrome, pagine, immagini R2, BikerBlog e console senza eccezioni JavaScript; i 401 anonimi su /api/auth/me sono attesi. Backup e rollback sono verificati e documentati. La migrazione è completata secondo i gate previsti, senza regressioni rilevate.

> Questo stato in testa è l’aggiornamento operativo più recente; le sezioni successive conservano la cronologia delle verifiche precedenti.


## Cutover produzione — 23 novembre 2026, 15:12 UTC

Il passaggio è stato eseguito dopo il Gate 1 autenticato 19/19 PASS fornito per il Worker Gate 1 ufficiale, il test isolato Chat SSE PASS, il Worker produzione su `workers.dev` verificato e la produzione Railway `READY`.

- Worker: `bikerlink-website-production`, deployment `ac1d844e-74d1-4a0b-83e7-71df81065f99`, versione `105b9fa8-a12c-485d-ab8b-1947f174b2cd`, sorgente `ad5e9fe471dc92d3376279b6d18c18e3cc0bed6c`.
- Route: `biker-link.net/*`, ID `ca3e4114a545455695000bb164fdf63a`.
- DNS: il record CNAME `f4b67198cdea0c5f2f61d65e53ce6841` mantiene il target `bikerlink-production.up.railway.app`; è stato cambiato solo `proxied:false` → `proxied:true`.
- TLS: certificato Cloudflare attivo per `biker-link.net` prima del passaggio.
- Backend: Railway resta operativo, `READY`, revisione `1114ec588d19332e1393d7eba9d3bae89fb45a3d`.
- Gate 2 HTTP smoke post-cutover: **13/13 PASS** alle 15:12Z. Dopo il deploy Railway concorrente PR #483 (15:13Z), il recheck core è **5/5 PASS** alle 15:25Z; il nuovo backend `7c3ae113…` è READY e il Worker restituisce lo stesso corpo della Railway diretta. Dati: [`API_AFTER.json`](docs/cloudflare-migration/API_AFTER.json), report: [`API_AFTER_REPORT.md`](docs/cloudflare-migration/API_AFTER_REPORT.md). Ultimo recheck read-only alle 15:33Z: **8/8 PASS** tra apex e Railway, inclusi health/body hash identico, 401 anonimi JSON identici, preflight CORS, homepage, BikerTest, BikerBlog e immagine R2. Evidenza: [`API_AFTER_FINAL_RECHECK.json`](docs/cloudflare-migration/API_AFTER_FINAL_RECHECK.json). Dopo la merge della PR #31, il recheck live alle 15:42Z ha passato **7/7** controlli tra apex, Railway, BikerTest, BikerBlog e R2. Evidenza: [`API_AFTER_LIVE_RECHECK_20261123.json`](docs/cloudflare-migration/API_AFTER_LIVE_RECHECK_20261123.json).
- Verifica versione Matching: il 23 novembre alle 16:17Z /matching/come-funziona ha risposto 200 sull’apice e sul Worker production, con identico corpo HTML (SHA-256 668f4e743ea76ad5364efe1b6adb068d1d166c2940411cf1ed907abfc5b08132). Questo conferma che la pagina mostrata su Android è contenuto della distribuzione Cloudflare corrente. Evidenza: docs/cloudflare-migration/API_AFTER_MATCHING_ROUTE_RECHECK_20261123.json.
- Gate 2 completo: PASS. La suite autenticata sul dominio ufficiale, eseguita il 23 novembre alle 17:02:58Z, ha superato 15/15 controlli: auth, health READY, profilo, matching, telemetria, chat list, notifiche, lettura SOS, AI config, session SSE e notification WSS. Non sono state inviate richieste POST o scritti dati applicativi. Backend Railway: revisione 7c3ae1137dc56ec3110a6a755660f11f744882ff. Evidenza: docs/cloudflare-migration/API_AFTER_AUTH_READONLY_20261123.json.
- Gate 3: **PASS**; Browser Rendering ha catturato desktop, viewport mobile iPhone e Android, menu aperto, 34/34 pagine statiche, 22/22 immagini homepage, BikerBlog HTTP 200 e console JS. La console mostra quattro richieste anonime `GET /api/auth/me` con JSON 401 atteso; zero eccezioni JavaScript e nessun altro 4xx/5xx. L’utente ha confermato il caricamento su Android Chrome della homepage e della pagina matching; dopo la verifica visiva la suite API autenticata di produzione ha passato 15/15. Evidenza: [`GATE3_PUBLIC_BROWSER_RENDERING_20261123.json`](docs/cloudflare-migration/GATE3_PUBLIC_BROWSER_RENDERING_20261123.json).
- BikerTest continua a rispondere via Cloudflare e non è stato modificato. Non sono stati cambiati backend, database, matching, telemetria, R2, MX/TXT o altri host.

Rollback pronto: eliminare solo la route `ca3e4114a545455695000bb164fdf63a`, riportare il record CNAME `f4b67198cdea0c5f2f61d65e53ce6841` a `proxied:false` e verificare che il traffico torni effettivamente a Railway. La procedura è anche in `RESTORE.md` e in [`API_AFTER_REPORT.md`](docs/cloudflare-migration/API_AFTER_REPORT.md).

## Ripristino dei contenuti originali — aggiornamento

La revisione richiesta dal proprietario ha rilevato che la homepage candidate aveva sostituito la pagina originale con una versione più corta. Nel branch `codex/bikerweb-content-preservation-20261119` sono state ripristinate le 22 pagine pubbliche marketing/editoriali/legali dal sito originale e sono stati aggiunti i percorsi Static Assets espliciti. La home originale, con 18 piazzamenti immagine e tabella comparativa completa, è stata ripristinata senza riscriverne il contenuto. Tutte le 8 tabelle e le 25 immagini originali sono conservate; i 22 file immagine/varianti `src` e `srcset` usati dalle pagine sono già presenti in R2. Manifest e conteggi: [`CONTENT_PRESERVATION_REPORT.md`](docs/cloudflare-migration/CONTENT_PRESERVATION_REPORT.md) e [`LEGACY_CONTENT_MANIFEST.json`](docs/cloudflare-migration/LEGACY_CONTENT_MANIFEST.json).

La modifica di contenuti è stata unita in `main` tramite [PR #4](https://github.com/Andreamasteri/bikerWeb/pull/4), merge commit `83bc454193abe18f678541b02e4e4c49a641c3ac`. Le 8 pagine applicative `/delete-account` e `/docs*` restano su Railway. API, DB, DNS ufficiale e Worker BikerTest non sono stati modificati. Dopo l’autenticazione Wrangler ho pubblicato la sorgente ripristinata sul Worker separato `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`; non ha trigger o hostname personalizzati.

## Architettura e stato live — snapshot precedente al cutover

| Componente | Stato verificato |
| --- | --- |
| Sito ufficiale `https://biker-link.net` | HTTP 200; DNS continua a puntare direttamente a Railway, quindi non è ancora sul Worker. Nessuna modifica DNS applicata. |
| Backend Railway produzione | `bikerlink-production.up.railway.app`; controllo read-only 20 novembre 2026, 11:05Z: `/api/health` HTTP 200, `ready`, `degraded=false`, revisione `579c84d85a436f3fde485625294560e6be977d8b`; stessa revisione sull’API del dominio apex. |
| DNS Cloudflare apex | Un record CNAME, `biker-link.net` → `bikerlink-production.up.railway.app`, DNS-only (`proxied:false`), ID `f4b67198cdea0c5f2f61d65e53ce6841`, TTL Auto. Snapshot Cloudflare: 46 record totali; nessun record email o hostname alternativo modificato. |
| BikerTest | `https://bikertest.biker-link.net/` HTTP 200; Worker distinto e non modificato. Il record AAAA `100::` resta proxied. |
| Cloudflare R2 | Bucket `bikerlink-website-assets`: 49 oggetti, 6.044.133 byte, manifest allineato alla sorgente Railway verificata. Nessun oggetto modificato durante questa fase. |
| Worker candidato | Worker separato `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`, URL <https://bikerlink-website-content-preview.andreamasteri-nadir-radio.workers.dev>. Wrangler mostra zero trigger; nessun custom domain o route apex collegato. Il precedente Preview 9 è rimasto distinto e non è stato sovrascritto. |
| Worker Gate 1 ufficiale | bikerlink-website-gate1-staging; deployment 20e7a310-8bd4-427b-b1a4-bba51002a959, versione bc67f2af-a8d4-4c6a-8ebf-ff877bbe749b; solo workers.dev, origine Railway staging, nessuna route o dominio personalizzato. |
| Static Assets e variabili | Il candidate serve i file in `workers/bikerlink-website-production/public` tramite `ASSETS`, usa R2 via `SITE_ASSETS`, `RAILWAY_ORIGIN=https://bikerlink-production.up.railway.app` e `PUBLIC_SITE_ORIGIN=https://biker-link.net`. Variabili non segrete nel file Wrangler; nessun segreto nel repository. |
| TLS e connessioni persistenti | La zona usa SSL Full e WebSockets attivi secondo l’audit precedente; il candidate apre TLS direttamente verso l’hostname Railway, senza fetch del dominio apex e quindi senza loop. Le prove WebSocket sono state anonime. |

Controllo di stato read-only del 20 novembre 2026 alle 11:05Z: homepage apex HTTP 200; `/api/health` sul dominio principale e sull’hostname Railway production HTTP 200 con revisione `579c84d85a436f3fde485625294560e6be977d8b`; health staging HTTP 200 con revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`; BikerTest HTTP 200. Nessuna modifica DNS è stata applicata.

La tabella completa delle precedenze è in [`workers/bikerlink-website-production/ROUTES.md`](workers/bikerlink-website-production/ROUTES.md). `/api` e `/api/*` hanno sempre precedenza e inoltrano tutti i metodi a Railway. Sono inoltre instradati esplicitamente `/healthz`, `/ws/admin/notifications`, `/ws/diagnostic*`, l’handshake Expo su `GET /` con header `expo-platform`, pagine legacy, blog, matching, docs, media e asset origin-owned. Non esiste un catch-all che restituisce HTML per un path sconosciuto.

La verifica ha trovato che `/blog` generava canonical e Open Graph con l’hostname `*.up.railway.app` quando passava attraverso il subrequest Worker. Il candidate riscrive quell’hostname nelle sole risposte HTML non-API e negli eventuali redirect assoluti; body API/JSON, cookie, media, SSE e WebSocket non vengono trasformati. L’asset immutato `web-session.js` dal commit backend `aedfb278f487105a10567c9efa4c090705b3d801` viene servito da Static Assets perché Railway restituisce 404 su quel percorso pur iniettandolo nelle pagine. Le sue richieste `/api/auth/*` restano su Railway.

## Inventario del traffico

- **API applicative:** `/api` e `/api/*`, ogni metodo, query string, header, cookie e body inoltrati a Railway.
- **Readiness e handshake:** `GET/HEAD /healthz`; `GET /` con `expo-platform: ios|android`; WebSocket diretti `/ws/admin/notifications`, `/ws/diagnostic` e `/ws/diagnostic/*`.
- **Pagine e servizi Railway:** elenco esplicito di pagine legacy/app, `/blog/*`, `/matching/*`, `/docs/*`, `/uploads/*`, `/music/*`, `/assets/*` non immagini e file documentato in `ROUTES.md`.
- **Frontend Cloudflare:** il sorgente contiene 34 route statiche esplicite: 22 pagine originali complete più le pagine aggiuntive del candidate e le pagine inglesi. Il nuovo Worker Preview è stato verificato dopo il ripristino dei contenuti.
- **Immagini R2:** `GET` semplice da `bikerlink-website-assets`; HEAD, Range, `If-*` e oggetti mancanti ricadono su Railway per mantenere i validator e le risposte condizionali dell’origine.
- **CORS, callback e webhook:** i preflight CORS sono stati provati in precedenza; nessun endpoint webhook HTTP o callback al dominio del sito è emerso dalla revisione delle route staging. Last.fm restituisce `bikerlink://lastfm-callback`, deep link dell’app non dipendente dal dominio BikerWeb. Non è stato invocato. Non sono state trovate route applicative pubbliche di scrittura fuori da `/api/*`; gli endpoint diretti sopra sono elencati separatamente.

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

> La decisione in questa sezione e negli aggiornamenti datati successivi descrive lo stato **prima del cutover**; lo stato live è riassunto nella sezione iniziale e in “Cutover produzione”.

Report dettagliati: [`API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md), [`API_PREVIEW_REPORT.md`](docs/cloudflare-migration/API_PREVIEW_REPORT.md), [`API_GATE1_CURRENT_REPORT.md`](docs/cloudflare-migration/API_GATE1_CURRENT_REPORT.md), le acquisizioni anonime [`API_GATE1_ANON_CURRENT.json`](docs/cloudflare-migration/API_GATE1_ANON_CURRENT.json)/[`API_GATE1_ANON_RECHECK.json`](docs/cloudflare-migration/API_GATE1_ANON_RECHECK.json), lo staging anonimo [`API_GATE1_STAGING_READONLY.json`](docs/cloudflare-migration/API_GATE1_STAGING_READONLY.json), l’autenticazione admin [`API_AUTH_STAGING_REPORT.md`](docs/cloudflare-migration/API_AUTH_STAGING_REPORT.md)/[`API_AUTH_STAGING.json`](docs/cloudflare-migration/API_AUTH_STAGING.json) e il nuovo smoke autenticato minimizzato [`API_GATE1_AUTHENTICATED_READONLY.json`](docs/cloudflare-migration/API_GATE1_AUTHENTICATED_READONLY.json).

| Target e acquisizione | Controlli | PASS | FAIL | Mediana | Revisione backend |
| --- | ---: | ---: | ---: | ---: | --- |
| Baseline apex — `13:03:15Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Baseline Railway — `13:03:15Z` | 38 | 38 | 0 | 182,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Preview Cloudflare — `13:14:29Z` | 38 | 38 | 0 | 192,5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Apex contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 148 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Railway contemporaneo — `13:14:29Z` | 38 | 38 | 0 | 186 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

Il confronto Preview → baseline apex ha trovato **0 differenze** nei 38 controlli. Comprende health/readiness, auth/profile/chat anonimi, configurazione e community, CORS, BikerBlog canonical, redirect, HEAD, immagine completa/hash, validator condizionali, Range, SSE anonimi e handshake WebSocket anonimi. I `401` sono quelli attesi per richieste senza sessione.

Verifica read-only successiva, 19 novembre 2026 alle 22:59Z: il nuovo Worker Preview con contenuti ripristinati, Railway diretta e apex restituiscono tutti `/api/health` HTTP 200 e la stessa revisione live `72c7508644b86f268765e2873310dcf45aa0ffb9` (`ready`, `degraded=false`). `/api/auth/me` anonimo risponde HTTP 401 come atteso. La revisione backend è diversa dalla baseline delle 13:14Z; la stessa revisione live è stata osservata su tutte e tre le origini. Questo smoke limitato non sostituisce la suite da 38 controlli né i test autenticati e non sblocca Gate 1. Evidenza: [`CONTENT_PREVIEW_VERIFICATION.json`](docs/cloudflare-migration/CONTENT_PREVIEW_VERIFICATION.json).

Suite read-only aggiornata, 19 novembre 2026 alle 23:29Z: 38/38 PASS su apex, Railway e Worker Preview, con revisione backend `34f03bb77e631907aa6c9ada6846bff064b9f977`. Il confronto API/readiness/WebSocket non mostra regressioni funzionali. Le cinque differenze rilevate sono limitate a MIME/cache delle pagine HTML statiche `/blog` e `/contact`; `/api/health` restituisce lo stesso corpo di 711 byte ma il Worker non inoltra `Content-Length`. Il report completo e le evidenze sono in [`API_GATE1_CURRENT_REPORT.md`](docs/cloudflare-migration/API_GATE1_CURRENT_REPORT.md).

**Gate 1, controlli autenticati HTTP/storage: PASS; gate completo di rilascio: BLOCKED.** La suite anonima precedente passa su tutte e tre le origini; lo staging diretto ha 14/14 prove autenticate read-only e il Worker Cloudflare isolato ha 19/19 controlli autenticati. API JSON, SSE sessione e WebSocket notifiche sono PASS. L’upload immagine autenticato via Worker ha restituito POST/GET 200; i 70 byte hanno lo SHA-256 atteso, il readback diretto R2 corrisponde e la chiave è stata eliminata/verificata assente. Le POST SOS/chat con payload invalidi hanno restituito i 400 JSON attesi, prima della persistenza. Il test locale del routing è 91/91, compresa la preservazione del cookie/contatore visite `bl_vid` sulle pagine statiche. Il preflight Chat SSE autenticato ha restituito 200 ma ha rilevato una conversazione e saltato lo stream; nessun evento di presenza è stato inviato. Gate 2 e cutover restano fermi. Evidenze: [`API_GATE1_CLOUDFLARE_PREVIEW.json`](docs/cloudflare-migration/API_GATE1_CLOUDFLARE_PREVIEW.json), [`API_GATE1_CURRENT_REPORT.md`](docs/cloudflare-migration/API_GATE1_CURRENT_REPORT.md), [`GATE1_CHAT_SSE_PREFLIGHT_20261120.json`](docs/cloudflare-migration/GATE1_CHAT_SSE_PREFLIGHT_20261120.json) e [`GATE1_STAGING_R2_UPLOAD_PROBE.md`](docs/cloudflare-migration/GATE1_STAGING_R2_UPLOAD_PROBE.md).

I `401` nella Console all’apertura della pagina erano i controlli iniziali di sessione di `web-session.js`, eseguiti prima del login. L’operatore conferma un tentativo di login con password errata; il successivo login riuscito e la prova autenticata hanno restituito HTTP 200. Non sono errori della suite autenticata.

Il backend staging servito al momento dei test è il branch feat/telemetry-capability-close-20261103, revisione cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374. Il codice di quella revisione mappa staging su DATABASE_URL_CANDIDATE e rifiuta l’uso della variabile DATABASE_URL generica. L’operatore ha eseguito `railway run --environment staging --service Bikerlink-Staging` e ha riportato l’host `postgres.railway.internal`; Railway mostra il servizio `Postgres` e il volume da 500 MB nello stesso environment staging. L’host candidato è verificato come staging.

Smoke staging in sola lettura: 31/38 controlli PASS. I 7 FAIL sono preflight CORS eseguiti con origine production; lo staging non restituisce ACAO per biker-link.net o bikertest.biker-link.net. Due preflight separati per l’origine staging stessa restituiscono ACAO, credenziali, metodi e header attesi. Evidenza e interpretazione sono in API_STAGING_ANON_REPORT.md. Questa prova non include autenticazione.

Non ho lanciato lo smoke backend automatico: il runner registra account, aggiorna direttamente il DB per la verifica email e all’avvio ripulisce possibili account smoke precedenti usando DATABASE_URL_CANDIDATE. L’host del DB ora è verificato, ma il runner resta non eseguito perché crea utenti e modifica dati. Per provare il flusso auth ho effettuato un login/logout normale dell’admin sul solo staging: nessun utente creato, sessione distrutta; il normale bookkeeping di login ha scritto sul DB staging. Il verificatore production è read-only; nessuna scrittura DB production e nessuna modifica della patch staged Railway.

Gate 1 è PASS. Il deployment del Worker production e il cambio DNS non sono ancora stati eseguiti. **Gate 2 e Gate 3: NOT RUN**; `API_AFTER.json` non esiste perché il cutover non è avvenuto.

## Preservazione del tracciamento visite pre-cutover — 20 novembre 2026

Il confronto del preview candidato con l’apex ha rilevato che le pagine statiche non emettevano il cookie `bl_vid`. Il backend Railway lo usa per conteggiare le visite alle pagine pubbliche e attribuire login/registrazioni; il cookie è `HttpOnly`, `SameSite=Lax`, `Secure`, con durata di un anno. Per non perdere questa funzione senza modificare backend o database, il Worker ora serve il contenuto da Static Assets e invia in background al middleware Railway esistente il solo GET della pagina. La logica si attiva sul dominio ufficiale e sul Worker Gate 1 solo se l’origine esatta è lo staging; preview di produzione su `.workers.dev` non genera scritture di visite production. La rotta `/api/*` resta prioritaria e inalterata.

Verifiche della correzione: test routing 91/91 PASS; dry-run Wrangler production e Gate 1 staging PASS; commit GitHub `f4c3ebac97d36ffa58691d238878f5e0dd905dfd`; deployment esclusivamente sul Worker `bikerlink-website-gate1-staging`, versione `f8f61d8d-5704-432e-8e02-994113dd666c`. Live staging: `/blog` 200 HTML (201.679 byte), cookie `bl_vid` con `Path=/`, `Max-Age=31536000`, `HttpOnly`, `SameSite=Lax`, `Secure`; `/api/health` 200, `READY`, `degraded=false`, revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`; `/api/auth/me` anonimo 401 JSON atteso. Il Worker ha inoltrato al middleware tracking staging il GET previsto; non è stata interrogata direttamente la tabella `siteVisits`, quindi la persistenza della riga non è attestata. Evidenza sanitizzata: [`STATIC_VISITOR_TRACKING_STAGING.json`](docs/cloudflare-migration/STATIC_VISITOR_TRACKING_STAGING.json).

La verifica pre-cutover del commit candidato, con il preview `workers.dev` appena pubblicato, passa 38/38 su apex, origine Railway e preview; tutte e tre mostrano la revisione backend production `579c84d85a436f3fde485625294560e6be977d8b`. Le differenze automatizzate restano cinque intestazioni statiche `/blog` e `/contact` (MIME/cache); nessuna regressione API, 404 o 500. Evidenza: [`API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md), [`API_BEFORE.json`](docs/cloudflare-migration/API_BEFORE.json) e [`API_PRECUTOVER_COMPARE_20261120.json`](docs/cloudflare-migration/API_PRECUTOVER_COMPARE_20261120.json). PR #15 è stata unita alle 12:05:21Z (merge `2d9adeceb35dbc552cfa15b5e1d26a668d7555b5`); la baseline è stata poi aggiornata con PR #16 alle 12:07:07Z (merge `26718382d563baf1944775bbd8c50786aa777bb7`).

## Stato storico pre-fix: blocco Chat SSE (20 novembre, 12:20 UTC)

Il Worker inoltra `/api/chat/stream` senza trasformazioni e l’SSE autenticata `/api/auth/session-events` è PASS. Il probe [`GATE1_CHAT_SSE_SAFE_PROBE.js`](docs/cloudflare-migration/GATE1_CHAT_SSE_SAFE_PROBE.js) è stato eseguito nella scheda staging autenticata il 20 novembre alle 12:20:32Z: `/api/chat/conversations?limit=1&offset=0` ha risposto 200 con `count=1`; il probe ha impostato `attempted=false`, `skip_reason=active_conversation_present_presence_probe_skipped`. Nessun stream è stato aperto e nessun evento di presenza inviato. Evidenza sanitizzata: [`GATE1_CHAT_SSE_PREFLIGHT_20261120.json`](docs/cloudflare-migration/GATE1_CHAT_SSE_PREFLIGHT_20261120.json). Il runtime browser condiviso continua a non essere accessibile (`gaas-browser node_repl sandbox cannot be disabled`).

Ho ispezionato il flusso di registrazione staging prima di creare un account: gli utenti standard ricevono una conversazione di benvenuto e una notifica email; inoltre il login staging rifiuta gli account non admin. Un utente creato attraverso la registrazione non sarebbe quindi un account vuoto utilizzabile, e forzare un account admin richiederebbe modifiche DB non autorizzate. Non ho creato account o cambiato dati. Per completare il gate serve un account admin staging preesistente, autorizzato e senza conversazioni.

## Sito e browser

[`BROWSER_PREVIEW.json`](docs/cloudflare-migration/BROWSER_PREVIEW.json) conserva le prove browser del deployment 9, acquisite alle `13:19:08Z`. Il nuovo preview dei contenuti ripristinati è verificato in [`CONTENT_PREVIEW_VERIFICATION.json`](docs/cloudflare-migration/CONTENT_PREVIEW_VERIFICATION.json), acquisito alle `22:59:10Z`:

- Nuovo Worker: `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`; 22/22 pagine storiche identiche agli SHA-256 sorgente e 34/34 route statiche HTTP 200.
- Homepage: 18/18 immagini caricate su desktop 1440 px e mobile 390 px; tabella originale con 21 righe e 147 celle. Il menu mobile apre 10 link; nessun overflow orizzontale, eccezione JavaScript o richiesta browser fallita.
- Tutti i 24 URL immagine rilevati nella sorgente rispondono 200; il manifest conferma le immagini originali nel bucket R2.
- Preview `workers.dev` con `X-Robots-Tag: noindex`; canonical resta `https://biker-link.net/`. L’host ufficiale continua a rispondere `index, follow` senza header `noindex`.
- Il nuovo preview non ha trigger o hostname personalizzati. Nessun DNS, Railway, Worker BikerTest, database o servizio matching/telemetria è stato modificato.

Verifiche del deployment 9 (storiche):

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
- Ripristino contenuti PR #4: https://github.com/Andreamasteri/bikerWeb/pull/4, unita il 19 novembre 2026 alle 22:38:03Z. Source `ac5a9d64c5c8eeb97be35ab7a05c273f69646c29`; merge commit `83bc454193abe18f678541b02e4e4c49a641c3ac`. `main` è stato aggiornato e verificato.
- Protezione `noindex` per le pagine viste tramite `.workers.dev` e test associati: branch `codex/bikerweb-preview-noindex-20261119`, commit sorgente `b14897b945861fff019595e95636bb85505b79c3`; il codice del deployment preview è identico a questo commit. PR [#6](https://github.com/Andreamasteri/bikerWeb/pull/6) è stata unita il 19 novembre 2026 alle 23:05:27Z; merge commit `89820c90fc3fb582306ecad7a04e2590cfed7e8c`.
- Non esistono workflow .github/workflows; le PR non hanno check CI automatici. Il test di routing del sorgente ora conta 79/79 PASS; `npm run dry-run` ha letto 70 file e confermato i binding ASSETS, R2 e Railway.
- Wrangler 4.165.0 è fissato nel lockfile. L’account Cloudflare è autenticato. Cloudflare API non trova configurazione Workers Builds per il Worker candidate; l’elenco script production continua a non includerlo. Il merge GitHub non ha pubblicato il Worker.
- Il primo tentativo autenticato di deploy del Worker separato si era fermato sul controllo dei metadati R2. Dopo il nuovo login Device Authorization, il deploy è riuscito sul Worker dedicato `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`. Il Worker BikerTest e il candidato Preview 9 non sono stati sovrascritti.
- Nessun deployment production, custom domain o route apex è stato creato.

## Verifiche aggiornate — 22 novembre 2026

La baseline API_BEFORE.json è stata acquisita il 22 novembre alle 15:28:51 UTC prima di qualsiasi modifica a produzione: 38/38 controlli anonimi sull’apice pubblico e 38/38 sull’hostname Railway, entrambi sulla revision 6ad354ff2af155929549c6d15ddc6c100f6a740b, READY, degraded=false. Mediane rispettive: 72 ms e 1.099,5 ms. L’apice continua a risolvere direttamente a Railway con DNS-only; il confronto includeva solo GET, HEAD, OPTIONS e handshake WebSocket anonimi, senza login o scritture. Il runner ha segnalato differenze rispetto al baseline storico del 19 novembre (26 campi: revision backend, hash del body health e validator degli asset aggiornati); nessuno dei 76 controlli correnti è fallito. Il dettaglio è in docs/cloudflare-migration/API_BEFORE_REPORT.md.

Il backup Forge /home/andrea/backups/bikerweb/bikerweb-pre-cloudflare-production-20261119.zip è stato verificato nuovamente: 8.598.088 byte, SHA-256 d129429c1161df1388816c5815f0cac2c219bd8bc454948a757da60ef7f31745; unzip -t, verifica SHA256SUMS, estrazione temporanea e lettura dell’archivio sorgente frontend sono PASS. Il pacchetto consente di ripristinare i sorgenti del frontend e documenta il ritorno DNS; non è un dump Railway né un backup database.

La prova Chat SSE del 20 novembre è conservata in GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json. Il 22 novembre è stata ripetuta con l’entrypoint del Worker di produzione corrente, distribuito solo sul Worker isolato bikerlink-chat-sse-gate1-isolated-20261120 (deployment 89c11dc7-3563-48f7-a4a8-d9e03d129ed6, versione 8c8931fd-66b8-4d63-9c52-aac0d1e75ff6), collegato esclusivamente al backend Railway di test dedicato. Registrazione 201, auth/me 200, zero conversazioni e logout 200. Chat SSE diretta: 200, evento connected e primo chunk a 1.101 ms; via Worker: 200, evento connected e primo chunk a 140 ms. La SSE sessione passa in entrambi i percorsi (primo chunk via Worker 469 ms). all_pass=true. Evidenza normalizzata e senza cookie o credenziali: GATE1_CHAT_SSE_TRANSPORT_RESULT_20261122.json. Il probe ha interrogato anche /__diag/chat-sse, che ha restituito 404 atteso perché il Worker corrente usa l’entrypoint applicativo e non include quell’endpoint diagnostico temporaneo; questo path non fa parte delle API BikerLink e non è un fallimento dei test SSE.

Questo supera il sottogate di trasporto isolato sul codice Worker corrente, non la suite autenticata completa sul Worker Gate 1 ufficiale. Il deploy staging e il test post-deploy sul Worker ufficiale sono il prossimo gate; fino ad allora restano non eseguiti cutover DNS, deploy production, Gate 2 e Gate 3.


## Decisione

Il ripristino completo del sito è verificato sul Worker Preview isolato; la migrazione production **non è conclusa**. DNS, sito ufficiale, backend Railway e BikerTest sono rimasti operativi e non modificati da questa attività. Routing API, storage e altre prove autenticate passano, ma il gate completo resta bloccato dal test autenticato Chat SSE via Worker; evidenza e diagnosi corrente sono riportate nell’aggiornamento Gate 1 qui sotto. Nessun utente staging o production è stato creato e nessuna tabella o schema è stato modificato direttamente; il probe Node ha creato account usa e getta soltanto nel database del servizio Railway isolato. Il test `bl_vid` ha inviato un GET al middleware di visita staging; la persistenza della riga analytics non è stata interrogata. L’unico oggetto R2 di prova è stato eliminato e verificato assente. Nessun segreto è stato salvato. Non sono stati eseguiti il cutover DNS né Gate 2/3.

## Aggiornamento Gate 1 — diagnosi SSE isolata (20 novembre 2026)

La prova Node eseguita dall’operatore alle 19:00Z ha avuto registrazione,
autenticazione, sessione, conversazioni vuote e logout PASS. L’SSE diretto al
backend Railway isolato ha risposto 200 con evento `connected` in 1.117 ms;
lo stesso flusso attraverso il Worker candidato Cloudflare è scaduto a 15.007 s
senza ricevere gli header. I log Railway riportano il 200 sul percorso Worker
alla chiusura del client dopo circa 14.6 s. L’host Railway non è cambiato.

Per localizzare il buffering senza esporre cookie o contenuti, il branch attivo
aggiunge una diagnostica confinata al Worker SSE isolato: autentica la sessione,
verifica zero conversazioni, legge solo l’evento iniziale e restituisce status,
content type e latenze. Il candidato Cloudflare
`bikerlink-chat-sse-gate1-isolated-20261120` usa esclusivamente il backend
Railway usa e getta; deployment `14a1da83-5a97-4c4c-af6c-c27e4f9e63d2`, versione
`4eb850e4-df11-4edf-afb1-343dcc0f6465`. Il probe aggiornato chiama la diagnosi
su quel candidato separato, mantenendo la sessione registrata sull’hostname di
test. I controlli locali sono 95/95 PASS; il test Node dei sorgenti passa la
sintassi. Il proxy propaga il segnale di abort alla richiesta Railway.

La diagnosi via `worker.fetch` eseguita alle 19:12:28Z è scaduta prima degli
header dopo 8.550 ms; il percorso pubblico del candidato è scaduto a 15.009 s.
La suite Railway mostra gli SSE completati a 7.996 ms e 14.970 ms,
corrispondenti agli abort. Il successivo test diagnostico, ancora da eseguire,
esegue dal Worker una `fetch` minimale all'origine Railway isolata mantenendo
solo i cookie e gli header SSE essenziali; questo distinguerà il proxy generico
dalla fetch Worker di base. Il candidato Cloudflare aggiornato è deployment
`ccad2b1d-b77e-43d4-b5de-d95afdc803db`, versione
`cc27009f-f9a9-4101-8475-b6832b7238b2`; il binding verso il solo backend usa e
getta è stato riverificato. L'host Workers non è raggiungibile dai runner del
workspace, quindi per il controllo autenticato serve il probe Windows già
aggiornato sul branch. Il tentativo delle 19:25:07Z è stato fermato dal limite
staging `POST /api/auth/register` (429) prima di creare sessione o aprire SSE.
I log Railway verificano tre registrazioni ammesse dallo stesso IP alle
18:53:34Z, 19:00:03Z e 19:12:32Z e il 429 alle 19:25:10Z. Il codice della
route imposta `max: 3` e una finestra di un'ora; la diagnostica raw rimane in
attesa e non va rilanciata prima della scadenza della finestra. Gate 1 completo
rimane **BLOCKED**; non si eseguono
deployment production, modifiche DNS, Gate 2 o Gate 3. Lo staging e il database
isolato non sono stati modificati; gli account usa e getta creati dal probe
appartengono soltanto al database del backend isolato.

Checkpoint GitHub aggiornato: repository `Andreamasteri/bikerWeb`, branch
`codex/bikerweb-isolated-chat-sse-gate1-20261120`, commit `eb86457`
(`eb864578540e0ff7065c9bb4a3829345c910fc89`), push verificato. Non ci sono
workflow in `.github/workflows`; nessuna CI è partita.

## Diagnosi comparativa SSE — 20 novembre 2026, 20:51 UTC

Il probe Node sul Worker isolato, con una sola sessione autenticata usa e
getta, ha superato registrazione (201), `/api/auth/me` (200), zero conversazioni
e logout (200). La Chat SSE diretta al Railway isolato ha restituito `200`,
`text/event-stream` ed evento `connected` dopo 1.06–1.61 s. La stessa Chat via
Worker è scaduta a 15 s prima degli header; la `fetch` raw dal Worker è scaduta
a 9.27 s senza header. Il controllo raw è stato ripetuto dopo la correzione del
riferimento alla rotta e ha restituito `AbortError`, quindi il risultato non è
un errore della diagnostica.

Nella stessa sessione `/api/auth/session-events` ha restituito `200`,
`text/event-stream` e `connected` sia direttamente (1.14 s) sia tramite Worker
(0.47 s). Il Worker candidato, quindi, riesce a inoltrare una SSE autenticata
verso lo stesso backend isolato.

Le risposte dirette differiscono negli header: Chat ha `Cache-Control: no-cache`
e `Vary: Accept-Encoding`; la SSE di sessione ha `Cache-Control: no-store,
no-transform` e nessun `Vary`. Il sorgente backend alla revisione distribuita
`cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374` mostra middleware globale
`compression()`. La route di sessione commenta che imposta `no-transform` per
saltare compressione e trasformazioni proxy; la route Chat chiama
`flushHeaders()` e scrive `connected`, ma non imposta quella direttiva. Le
prove indicano dunque un problema specifico nella risposta Chat lungo il
percorso origin/proxy, associato al comportamento di compressione/trasformazione;
non un limite del piano Cloudflare né un guasto generale dello streaming Worker.

Non ho modificato backend o database. Per il vincolo operativo del task, il
cutover resta BLOCKED: la correzione da valutare è esclusivamente di trasporto
sulla risposta Chat SSE (allineare le direttive `no-store, no-transform` e
verificare il flush), ma va trattata nel checkout e nel flusso di rilascio del
backend, con test staging prima del nuovo probe. Nessun DNS, Worker production,
BikerTest o servizio Railway è stato modificato. Il Worker di prova rimane
`workers.dev` only e punta al backend usa e getta.

## Risoluzione del buffering Chat SSE — 20 novembre 2026, 22:57 UTC

La causa era nella risposta backend: compression() è middleware globale; la route Chat impostava Cache-Control: no-cache, mentre /api/auth/session-events impostava no-store, no-transform. Sul test isolato, aggiungere no-transform alla Chat SSE ha rimosso Vary: Accept-Encoding e consentito la consegna immediata del frame connected. Non serve un upgrade del piano Cloudflare; il Worker inoltra correttamente lo stream una volta che l’origine non lo bufferizza.

Il fix di trasporto è nel repository Andreamasteri/Bikerlink, PR [#468](https://github.com/Andreamasteri/Bikerlink/pull/468), commit sorgente e8a5f4f24256d9da017e4a3d211a79d5e5725a2b, merge commit c277eebb07c53ff7526749887a7350bddc9ded24. La route Chat ora invia Cache-Control: no-cache, no-transform prima di flushHeaders(); metodi, path, body, cookie, auth e logica delle conversazioni non cambiano. Test mirati: 10/10 Vitest, Oxlint e build server PASS. I quattro controlli GitHub richiesti sono PASS; il controllo non richiesto Matching surface inventory fallisce per docs/matching-surface-inventory.current.json stale su main. Nessun file matching è stato modificato.

Deploy Railway verificati sul merge commit c277eebb:
- Test isolato: deployment 450b1998-9aef-4b18-9adf-8aabcabe0cb9, commit e8a5f4f.
- Staging: deployment e9e82ea9-867e-4b82-a567-cddcb05e62aa; health HTTP 200, revisione c277eebb, READY, degraded=false, DB circuit CLOSED.
- Production: deployment 5c7c66d1-d185-40f2-b060-ae381cb236ea; health HTTP 200, revisione c277eebb, READY, degraded=false, DB circuit CLOSED.

Il probe isolato autenticato ha superato registrazione 201, auth 200, preflight zero conversazioni, Chat SSE diretto Railway 200 (connected, primo chunk 1.081 ms), diagnostica upstream del Worker 200 (primo chunk 43 ms), Chat SSE via Worker 200 (connected, primo chunk 97 ms), Session SSE in entrambi i percorsi e logout 200; all_pass=true. Evidenza senza credenziali: [GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json](docs/cloudflare-migration/GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json) e [GATE1_ISOLATED_CHAT_SSE_NODE_PROBE.md](docs/cloudflare-migration/GATE1_ISOLATED_CHAT_SSE_NODE_PROBE.md).

Questo supera il precedente blocco tecnico del buffering Chat SSE nell’ambiente isolato. La suite completa post-deploy sul Worker Gate 1 ufficiale resta da ripetere; non dichiaro il Gate 1 complessivo o il cutover conclusi. Nessun Worker Cloudflare production o record DNS è stato modificato; BikerTest resta invariato. Gate 2 e Gate 3 non sono stati eseguiti.

Il cutover resta sospeso finché i controlli autenticati sul Worker Gate 1 aggiornato non sono ripetuti e PASS. Railway rimane il backend applicativo; nessun deploy backend, modifica DNS, Worker production o BikerTest è stato eseguito in questa fase. Il rollback resta basato su Railway attivo e sul ripristino del record apex DNS-only, come descritto nel backup. Gate 2 e Gate 3 non sono stati eseguiti.

## Verifica live del Worker Gate 1 ufficiale — 22 novembre 2026

Il deployment ufficiale di verifica è bikerlink-website-gate1-staging, versione bc67f2af-a8d4-4c6a-8ebf-ff877bbe749b, deployment 20e7a310-8bd4-427b-b1a4-bba51002a959. È pubblicato solo su workers.dev, usa l’origine Railway staging e il binding R2 bikerlink-website-assets; non ha hostname personalizzato o route sul dominio ufficiale.

Il controllo live alle 16:33 UTC ha restituito HTTP 200 su /api/health sia dal Worker Gate 1 sia da Railway staging diretta, ma entrambi mostrano la stessa revisione 6ad354ff2af155929549c6d15ddc6c100f6a740b in stato DEGRADED. Le cause dichiarate dal backend sono un gap dello scheduler matching e una violazione alta di integrità del database; il circuito DB è CLOSED. La stessa revisione su Railway production è READY, degraded=false. Poiché il payload degradato è identico via Worker e direttamente dall’origine, non è una regressione introdotta dal proxy. Non è stato eseguito alcun deploy backend o scrittura diretta al database.

Le richieste anonime a /api/auth/me, /api/auth/session-events e /api/chat/conversations hanno restituito 401 JSON come atteso. Il Worker ha servito /blog (200 HTML, 201.679 byte, noindex), /robots.txt (200) e l’immagine R2 hero-forest.webp (200 image/webp, 337.534 byte; SHA-256 8de037be4d1c61509a9001fad23fc32b726d793b56d642999ae8b75c3bdf4659). La home ufficiale ha restituito 200, BikerTest 200 e BikerBlog 200. L’apice ha continuato a rispondere da Railway.

Il preflight OPTIONS verso /api/auth/register con Origin https://biker-link.net è stato confrontato sulle tre origini. Worker Gate 1 e Railway staging diretta hanno restituito entrambi 200 senza Access-Control-Allow-Origin o altri header CORS; Railway production diretta ha restituito l’origine ufficiale, credenziali true, metodi e header attesi. La differenza è presente nell’ambiente backend staging, non è introdotta dal Worker; va considerata nella valutazione di test cross-origin. Le chiamate same-origin dell’apice non dipendono da questo preflight.

La lettura Cloudflare del DNS conferma che biker-link.net resta CNAME DNS-only verso bikerlink-production.up.railway.app e che non esiste una route Worker sull’apice. Il Worker production non è presente nell’account; il Worker Gate 1, BikerTest e le route radio esistenti risultano separati e non modificati.

Le richieste GET alle pagine pubbliche dell’apice e dello staging possono attivare i rispettivi middleware esistenti di conteggio visite. Non sono stati eseguiti comandi o query dirette al database; non è stata verificata la persistenza degli eventuali eventi analytics generati dai GET.

**Decisione aggiornata:** Gate 1 resta BLOCKED. La suite autenticata post-deploy sul Worker Gate 1 ufficiale non è stata ripetuta perché la sessione disponibile in questo runtime autentica Cloudflare, non BikerLink. Inoltre la readiness staging è DEGRADED e segnala un problema di integrità DB preesistente rispetto al proxy. La prova Chat SSE isolata sul codice corrente è PASS, ma non sostituisce i controlli ufficiali staging. Gate 2 e Gate 3 non sono stati eseguiti. Non sono stati cambiati DNS production, Worker production, backend Railway, database o BikerTest.

Evidenza completa sanitizzata: [API_GATE1_OFFICIAL_STAGING_POST_DEPLOY_20261122.json](docs/cloudflare-migration/API_GATE1_OFFICIAL_STAGING_POST_DEPLOY_20261122.json).

## Verifica live Gate 1 — 23 novembre 2026

La verifica read-only è stata acquisita da Forge alle **01:57 UTC**. Il Worker ufficiale di verifica è aggiornato: Cloudflare conferma deployment `20e7a310-8bd4-427b-b1a4-bba51002a959`, versione `bc67f2af-a8d4-4c6a-8ebf-ff877bbe749b`, al 100% sul solo hostname workers.dev. Railway conferma il deployment staging `70e6e99e-7848-4917-9461-2b61123fa874` in stato SUCCESS, con una replica attiva.

| Endpoint | HTTP | Stato applicativo | Revisione | SHA-256 risposta |
| --- | ---: | --- | --- | --- |
| Railway staging `/api/health` | 200 | DEGRADED | `6ad354ff2af155929549c6d15ddc6c100f6a740b` | `fa39f84ef9ed17fb86570dac0b5d5eae48e9bfa647f3e6cdd3ced38b30e2075e` |
| Worker Gate 1 `/api/health` | 200 | DEGRADED | `6ad354ff2af155929549c6d15ddc6c100f6a740b` | `fa39f84ef9ed17fb86570dac0b5d5eae48e9bfa647f3e6cdd3ced38b30e2075e` |
| Apice production `/api/health` | 200 | READY | `6ad354ff2af155929549c6d15ddc6c100f6a740b` | `02029b819725ef0a97a9f52bd2e52c5795fbb2b4002facda7122acb96a26acb2` |

Il corpo della risposta staging è identico attraverso Railway e Cloudflare: il degrado è nell’ambiente/dati staging, non introdotto dal Worker. Le cause correnti sono il gap del ciclo matching (3.537 minuti senza run completato) e una violazione alta di integrità DB. Il circuito DB è CLOSED. Lo stesso commit backend è READY sull’apice production, che continua a essere servito da Railway (`server: railway-hikari`, senza `cf-ray`). Non ho riavviato né ridistribuito servizi.

Il test locale `npm run test:routing`, eseguito nella directory del Worker sul commit `d70c4792f6b94650be073f500d5e27d88c8aac5a`, passa **95/95**. La prima richiesta di prova dal runner con User-Agent Python ha ricevuto 403; la ripetizione con User-Agent browser e con curl ha restituito 200. Il 403 era specifico del User-Agent, non un errore persistente del Worker.

Il controllo infrastrutturale read-only dei runner è PASS, ma non certifica la salute applicativa Railway. La suite autenticata post-deploy sul Worker Gate 1 non è stata ripetuta: il browser condiviso non è accessibile in questa sessione Codex web. Non ho recuperato né utilizzato password o cookie. Il test autenticato e la verifica del dettaglio della violazione DB restano non attestati.

**Decisione:** Gate 1 resta **BLOCKED** per la salute degradata dello staging e l’assenza di una sessione BikerLink utilizzabile nel runner. Gate 2 e Gate 3 sono NOT RUN. L’apice DNS continua a puntare a Railway; nessun Worker production, deploy backend, modifica DB, variabili o DNS è stato eseguito. Evidenza sanitizzata: [API_GATE1_LIVE_RECHECK_20261123.json](docs/cloudflare-migration/API_GATE1_LIVE_RECHECK_20261123.json).

## Aggiornamento post-deploy Worker Gate 1 — 23 novembre 2026

Questo aggiornamento sostituisce come stato corrente le osservazioni staging degradato del 22–23 novembre riportate sopra. Evidenza read-only: [API_GATE1_POST_DEPLOY_20261123.json](docs/cloudflare-migration/API_GATE1_POST_DEPLOY_20261123.json).

- La PR [#23](https://github.com/Andreamasteri/bikerWeb/pull/23) ha attivato Smart Placement solo nella configurazione Gate 1; merge squash ba8e766.
- La PR [#24](https://github.com/Andreamasteri/bikerWeb/pull/24) ha corretto gli header SSE del proxy Worker; merge squash a18fc2b.
- Il checkout canonico è stato riallineato a main; commit a18fc2b42d05974b34b9cb3e6438a04b08732c06, clean e uguale a origin/main al momento del deploy.
- Wrangler ha pubblicato bikerlink-website-gate1-staging al 100% su workers.dev: deployment a19c32d7-3797-4a09-b652-6316b2766b0f, versione 08eed416-93fa-4e55-b4b4-3588cacde1f4. La versione Cloudflare conferma placement.mode=smart, backend Railway staging e binding R2 bikerlink-website-assets.
- Wrangler ha avvertito che Smart Placement insieme a run_worker_first può allungare i tempi degli asset statici. Dopo il deploy la home ha risposto in 56 ms e l’immagine R2 da 470 KB in 577 ms; non c’è una misura pre-placement equivalente, quindi non attribuisco né escludo una regressione degli asset.

### Controlli live dopo il deploy

- /api/health: 5/5 HTTP 200, READY, degraded=false, revision 1114ec588d19332e1393d7eba9d3bae89fb45a3d.
- Latenze headers Gate 1: 53–383 ms, mediana 67 ms; Railway diretta: 38–1.102 ms, mediana 45 ms. Questi cinque campioni non sono un benchmark A/B controllato: non dimostrano da soli che Smart Placement abbia risolto gli outlier precedenti (18–30 s), ma in questa acquisizione non si sono ripetuti.
- /api/auth/me anonimo e /api/chat/stream anonimo: entrambi 401 JSON, nessuna risposta HTML del frontend.
- Homepage Gate 1: 200; /web-session.js: 200; immagine /assets/images/hero-community.webp dal binding R2: 200 image/webp, 470.094 byte, Cache-Control public, max-age=31536000, immutable, ETag e byte-range presenti.
- BikerTest e BikerBlog: HTTP 200.
- Il DNS apex è ancora CNAME DNS-only (proxied=false) verso bikerlink-production.up.railway.app. Homepage e /api/health ufficiali rispondono 200 da railway-hikari; nessun cf-ray. Non è avvenuto il cutover.

### Diagnosi Chat SSE

Il test autenticato isolato documentato in GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json ha passato Chat SSE e session SSE attraverso un Worker e un backend usa e getta. La PR #24 applica gli header anti-compressione/anti-trasformazione solo alle richieste SSE, preservando il body streaming e gli header delle richieste non SSE; il test locale passa 96/96 e il dry-run Wrangler è PASS.

La prova isolata non equivale alla suite autenticata sul Worker Gate 1 ufficiale. In questa sessione non è stato possibile usare una sessione BikerLink staging autorizzata senza conversazioni; quindi Chat SSE autenticata e copertura autenticata completa post-deploy sull’hostname Gate 1 restano da ripetere. Non sono stati creati account né scritti dati di staging.

**Decisione:** Gate 1 complessivo resta **BLOCKED** fino alla suite autenticata ufficiale. Gate 2 e Gate 3 sono **NOT RUN**. Produzione, DNS, Worker production, Railway, database e BikerTest non sono stati modificati.

## Verifica supplementare — 23 novembre 2026, 12:28 UTC

Il test aggiornato sul Worker SSE isolato, collegato al solo backend e database Railway di test, è PASS: registrazione sintetica 201, autenticazione 200, zero conversazioni, Chat SSE e session SSE 200 con evento `connected` via Railway e via Worker, logout 200. Il Worker isolato esegue il sorgente `main` `8331329b6d89bba2bb7ae9e6f880204d9ee9a719`, versione Cloudflare `1af9566f-d96b-4ac8-bde7-619c5575b94a`. Il dettaglio è in [API_GATE1_ISOLATED_SSE_RECHECK_20261123.json](docs/cloudflare-migration/API_GATE1_ISOLATED_SSE_RECHECK_20261123.json).

Questa prova chiude il sottogate del trasporto SSE sul fixture isolato, ma non la suite autenticata post-deploy sul Worker Gate 1 ufficiale. Gate 1 resta **BLOCKED**; Gate 2 e Gate 3 restano **NOT RUN**. Nessun cutover production o modifica al DNS è stato eseguito.

## Readiness aggiornata — 23 novembre 2026, 12:43 UTC

La verifica live più recente restituisce HTTP 200 ma `degraded=true` sul Worker Gate 1 e sull’origine Railway staging, con payload identico e revisione backend `1114ec588d19332e1393d7eba9d3bae89fb45a3d`; l’origine Railway production è `READY` alla stessa revisione. Il watchdog staging segnala `scheduler.run_gap_no_lock` e un gap matching di 4.183 minuti. La verifica è read-only e documentata in [API_GATE1_READINESS_RECHECK_20261123.json](docs/cloudflare-migration/API_GATE1_READINESS_RECHECK_20261123.json).

Il control plane Railway conferma i deployment SUCCESS di Bikerlink-Staging, Postgres staging e Bikerlink production. Esiste una patch STAGED preesistente sul servizio indipendente Bikerlink-Audit-Staging, lasciata invariata. Gate 1 resta **BLOCKED** sia per la readiness degradata dello staging sia per il test autenticato post-deploy non eseguito sul Worker Gate 1 ufficiale. Non sono stati avviati cutover DNS, Gate 2 o Gate 3.

## Esito probe autenticato Gate 1 — 23 novembre 2026, 13:33 UTC

Il probe browser autenticato sul Worker ufficiale ha completato **19/19 controlli PASS**, revisione backend `1114ec588d19332e1393d7eba9d3bae89fb45a3d`; include session SSE, WebSocket e POST di validazione senza persistenza. Il risultato senza credenziali è in [API_GATE1_AUTHENTICATED_BROWSER_20261123.json](docs/cloudflare-migration/API_GATE1_AUTHENTICATED_BROWSER_20261123.json). Il flusso Chat SSE è PASS sul Worker isolato corrente; non è stato aperto sull’account ufficiale senza verifica che non coinvolga partecipanti.

Il controllo readiness immediatamente successivo mostra Gate 1 e origine staging entrambi HTTP 200 ma `degraded=true`, con identico payload per gap scheduler matching e query DB lenta; production è `READY` alla stessa revisione. Dettaglio: [API_GATE1_POST_AUTH_READINESS_20261123.json](docs/cloudflare-migration/API_GATE1_POST_AUTH_READINESS_20261123.json). **Il cutover resta fermo** fino al ripristino della readiness staging; Gate 2 e Gate 3 non sono stati eseguiti.


## Recheck pre-cutover — 23 novembre 2026, 14:12 UTC

L’operatore ha completato il probe autenticato sul Worker Gate 1 ufficiale alle 13:33:45Z: **19/19 PASS**, revisione backend `1114ec588d19332e1393d7eba9d3bae89fb45a3d`. Questo chiude il precedente blocco sulla suite autenticata, ma non include il flusso Chat SSE `/api/chat/stream`. Il test SSE corrente passa sul Worker isolato e database usa e getta, senza toccare staging o produzione.

Il confronto anonimo alle 14:10Z tra il preview production Cloudflare e Railway production ha verificato 10 GET API: status, MIME e SHA-256 dei body sono identici. `/api/health` è `READY`, `degraded=false`; le API autenticate senza cookie restituiscono il medesimo `401 application/json` sulle due origini. Il preflight CORS di `/api/auth/login` con origine `https://biker-link.net` è identico: HTTP 200, ACAO corretto e credenziali abilitate. Homepage, `/features`, `robots.txt` e l’immagine R2 `hero-community.webp` rispondono 200; il preview invia `X-Robots-Tag: noindex`. Evidenza: [API_PRODUCTION_PREVIEW_SAFE_SMOKE_20261123_141040Z.json](docs/cloudflare-migration/API_PRODUCTION_PREVIEW_SAFE_SMOKE_20261123_141040Z.json).

Il recheck health delle 14:03Z conferma che Railway staging e il Worker Gate 1 restituiscono lo stesso payload `DEGRADED`, revisione `1114ec588d19332e1393d7eba9d3bae89fb45a3d`, per `scheduler.run_gap_no_lock` e un ultimo run matching di 4.264 minuti fa. Railway production e il preview restano `READY`, `degraded=false`. Il difetto è quindi nell’ambiente staging a monte del Worker, non nel proxy; non ho modificato matching, telemetry, DB o backend.

Cloudflare conferma alle 14:12:57Z che l’apice resta `CNAME bikerlink-production.up.railway.app`, DNS-only (`proxied=false`); non esiste un custom domain Worker per l’apice né un deployment permanente `bikerlink-website-production`. Il Worker BikerTest e il suo deployment sono invariati. Evidenza combinata: [API_GATE1_READINESS_CLOUDFLARE_RECHECK_20261123_141257Z.json](docs/cloudflare-migration/API_GATE1_READINESS_CLOUDFLARE_RECHECK_20261123_141257Z.json).

**Decisione:** non ho eseguito il cutover DNS. Gate 1 resta bloccato finché staging non torna `READY` e il Chat SSE autenticato non è verificato in modo sicuro sul Gate 1 ufficiale. Gate 2 e Gate 3 restano NOT RUN. Non è stato effettuato alcun cambiamento production o a BikerTest.


## Stato operativo e test Worker production — 23 novembre 2026, 14:48 UTC

### Verifiche concluse

- Il Worker è stato compilato e pubblicato dal checkout canonico Forge /home/andrea/src/BikerWeb, da main al commit ad5e9fe471dc92d3376279b6d18c18e3cc0bed6c, allineato a origin/main e pulito al momento del deploy. Nessuna modifica al backend o al database è stata fatta.
- Backup Forge ricontrollato: /home/andrea/backups/bikerweb/bikerweb-pre-cloudflare-production-20261119.zip, 8.598.088 byte, SHA-256 d129429c1161df1388816c5815f0cac2c219bd8bc454948a757da60ef7f31745; unzip -t e file MANIFEST.json, RESTORE.md, SHA256SUMS presenti.
- Wrangler 4.165.0 whoami riuscito. wrangler deploy --dry-run ha letto 70 file Static Assets e i binding ASSETS, SITE_ASSETS (R2 bikerlink-website-assets), RAILWAY_ORIGIN e PUBLIC_SITE_ORIGIN. Harness routing: 96/96 PASS.
- Worker bikerlink-website-production distribuito al 100% solo su workers.dev, versione 105b9fa8-a12c-485d-ab8b-1947f174b2cd, deployment ac1d844e-74d1-4a0b-83e7-71df81065f99, dal commit ad5e9fe471dc92d3376279b6d18c18e3cc0bed6c.
- Smoke live workers.dev: /api/health 200 READY, revisione 1114ec588d19332e1393d7eba9d3bae89fb45a3d, corpo/hash identici a Railway; /api/auth/me e /api/chat/stream anonimi 401 JSON identici all’origine; CORS preflight login 200 con ACAO/credentials identici; /, /features, /faq, /blog, robots.txt e sitemap.xml 200; immagine R2 /assets/images/hero-forest.webp 200 image/webp, 337.534 byte. Sull’hostname workers.dev la risposta include X-Robots-Tag: noindex; l’HTML non contiene direttive noindex e mantiene canonical biker-link.net. Evidenza: [API_PRODUCTION_WORKERSDEV_SMOKE_20261123.json](docs/cloudflare-migration/API_PRODUCTION_WORKERSDEV_SMOKE_20261123.json).
- Cloudflare verificato dopo il deploy: DNS apex invariato (CNAME bikerlink-production.up.railway.app, proxied:false); nessun custom domain Worker per biker-link.net, nessuna route apex; BikerTest resta sul Worker bikerlink-website-test.

### Gate 1 e diagnosi

- Alle 13:33:45Z l’operatore ha eseguito la suite autenticata sul Worker Gate 1 ufficiale: 19/19 PASS, backend 1114ec588d19332e1393d7eba9d3bae89fb45a3d, incluse session SSE e WebSocket notifiche.
- La Chat SSE autenticata passa nel fixture isolato con account a zero conversazioni e database usa-e-getta: HTTP 200, text/event-stream, evento connected, prima risposta in circa 122 ms; diretto Railway e attraverso Worker. Evidenza: [API_GATE1_ISOLATED_SSE_RECHECK_20261123.json](docs/cloudflare-migration/API_GATE1_ISOLATED_SSE_RECHECK_20261123.json).
- Il fix backend no-transform è nel PR #468, merged; il commit e8a5f4f24256d9da017e4a3d211a79d5e5725a2b è antenato della revisione Railway 1114ec. La rotta server/routes/chat/stream.ts ha SHA identico a entrambe le revisioni. Il contenuto live del Worker Gate 1 include Accept-Encoding: identity, no-transform, risposta streaming e X-Accel-Buffering: no.
- Non è stata riaperta la Chat SSE usando la sessione dell’admin Gate 1 perché l’account aveva conversazioni attive e lo stream può notificare presenza. La prova isolata è PASS; la singola ripetizione autenticata sull’hostname ufficiale non è stata eseguita.
- La readiness staging risponde HTTP 200 ma DEGRADED per [watchdog] scheduler.run_gap_no_lock e ultima esecuzione matching vecchia di circa 4.291 minuti. La produzione è READY alla stessa revisione. Non ho modificato matching/telemetria. La patch preesistente staged su Bikerlink-Audit-Staging è rimasta intatta.

### Stato cutover

- Non è stato cambiato il DNS apex e il Worker production non è ancora collegato a un dominio personalizzato: il sito ufficiale rimane su Railway.
- Gate 2 e Gate 3 sono NOT RUN; non esistono API_AFTER.json o API_AFTER_REPORT.md. Il smoke workers.dev non equivale al controllo post-cutover dell’hostname ufficiale.
- Il desktop/browser condiviso non è avviabile in questo runtime (errore CUA: gaas-browser node_repl sandbox cannot be disabled). Non ho usato né estratto credenziali. Per eseguire Gate 2 dopo il cutover serve una sessione BikerLink autenticata nel browser, oppure l’operatore deve eseguire la probe read-only sanitizzata dal browser e restituire la sola riga JSON; non inviare password, cookie o token.
- Rollback pronto: il record DNS-only originale è ancora presente e Railway production è online. Le istruzioni e il backup ripristinabile sono conservati in RESTORE.md.

## Stato infrastrutturale verificato dopo il cutover — 23 novembre 2026

Questa appendice registra le verifiche correnti e la disattivazione richiesta di BikerTest. Le sezioni precedenti restano la cronologia delle verifiche svolte in quei momenti; gli esiti storici “cutover non eseguito” descrivono lo stato precedente e sono superati da questa verifica.

### Produzione

- La route Cloudflare **biker-link.net/*** è associata al Worker **bikerlink-website-production** (route ID **ca3e4114a545455695000bb164fdf63a**).
- Il record DNS apex resta CNAME verso **bikerlink-production.up.railway.app** con proxy Cloudflare attivo. Cloudflare resta il punto d’ingresso; il backend applicativo continua a essere Railway.
- Verifica da Forge: **https://biker-link.net/** ha risposto HTTP 200 con **server: cloudflare**; **/api/health** ha risposto HTTP 200 JSON, **state=READY**, **degraded=false**, revisione backend **7c3ae1137dc56ec3110a6a755660f11f744882ff**.
- Il probe autenticato read-only fornito dall’operatore il 23 novembre alle 17:02 UTC ha riportato **15/15 controlli PASS**, inclusi sessione SSE e WebSocket notifiche; nessuna scrittura applicativa.

### BikerTest

- Il custom domain **bikertest.biker-link.net** è stato staccato dal Worker **bikerlink-website-test**. La lista Cloudflare dei custom domain non contiene più quel nome e non rimangono record DNS per **bikertest.biker-link.net**.
- La risoluzione DNS pubblica verificata da Forge fallisce per **bikertest.biker-link.net**.
- Il sottodominio workers.dev del Worker di test e le preview risultano disabilitati. Il Worker e il suo script non sono stati eliminati, così l’ambiente può essere riattivato in futuro.
- Il controllo pubblico successivo ha confermato che **biker-link.net/** e **/api/health** continuano a rispondere HTTP 200. Non sono stati modificati record DNS di produzione, Railway, database o servizi applicativi.

### Ambito e limiti di questa verifica

La suite Gate 2 read-only riportata sopra è PASS sulla base del risultato autenticato fornito dall’operatore. Questa appendice non registra nuovi test di scrittura, né attribuisce un esito a controlli funzionali non ripetuti dopo la disattivazione di BikerTest. La disattivazione ha riguardato solo il custom domain e il relativo record DNS.
