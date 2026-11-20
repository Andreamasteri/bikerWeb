# Migrazione BikerWeb → Cloudflare — report operativo

**Aggiornato:** 20 novembre 2026, 12:01 UTC
**Stato:** Gate 1 è PASS per i percorsi verificati: suite autenticata Cloudflare 19/19, upload R2 autenticato con readback e cleanup, suite locale Worker 91/91. La baseline pre-cutover aggiornata passa 38/38 su apex, Railway e preview candidato, tutti sulla revisione backend `579c84d85a436f3fde485625294560e6be977d8b`. Il controllo pre-cutover ha inoltre trovato e corretto la perdita del cookie/contatore visite `bl_vid` sulle pagine statiche; la versione `f8f61d8d-5704-432e-8e02-994113dd666c` del Worker Gate 1 staging ha restituito `/blog` 200 con gli attributi cookie previsti, health 200 e la risposta anonima auth 401 JSON attesa. Il preview di produzione resta isolato su `workers.dev`. Nessun Worker production, DNS, backend o database production è stato modificato. Gate 2 e Gate 3 non sono ancora eseguiti; il cutover non è avvenuto.

## Ripristino dei contenuti originali — aggiornamento

La revisione richiesta dal proprietario ha rilevato che la homepage candidate aveva sostituito la pagina originale con una versione più corta. Nel branch `codex/bikerweb-content-preservation-20261119` sono state ripristinate le 22 pagine pubbliche marketing/editoriali/legali dal sito originale e sono stati aggiunti i percorsi Static Assets espliciti. La home originale, con 18 piazzamenti immagine e tabella comparativa completa, è stata ripristinata senza riscriverne il contenuto. Tutte le 8 tabelle e le 25 immagini originali sono conservate; i 22 file immagine/varianti `src` e `srcset` usati dalle pagine sono già presenti in R2. Manifest e conteggi: [`CONTENT_PRESERVATION_REPORT.md`](docs/cloudflare-migration/CONTENT_PRESERVATION_REPORT.md) e [`LEGACY_CONTENT_MANIFEST.json`](docs/cloudflare-migration/LEGACY_CONTENT_MANIFEST.json).

La modifica di contenuti è stata unita in `main` tramite [PR #4](https://github.com/Andreamasteri/bikerWeb/pull/4), merge commit `83bc454193abe18f678541b02e4e4c49a641c3ac`. Le 8 pagine applicative `/delete-account` e `/docs*` restano su Railway. API, DB, DNS ufficiale e Worker BikerTest non sono stati modificati. Dopo l’autenticazione Wrangler ho pubblicato la sorgente ripristinata sul Worker separato `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`; non ha trigger o hostname personalizzati.

## Architettura e stato live

| Componente | Stato verificato |
| --- | --- |
| Sito ufficiale `https://biker-link.net` | HTTP 200; DNS continua a puntare direttamente a Railway, quindi non è ancora sul Worker. Nessuna modifica DNS applicata. |
| Backend Railway produzione | `bikerlink-production.up.railway.app`; controllo read-only 20 novembre 2026, 11:05Z: `/api/health` HTTP 200, `ready`, `degraded=false`, revisione `579c84d85a436f3fde485625294560e6be977d8b`; stessa revisione sull’API del dominio apex. |
| DNS Cloudflare apex | Un record CNAME, `biker-link.net` → `bikerlink-production.up.railway.app`, DNS-only (`proxied:false`), ID `f4b67198cdea0c5f2f61d65e53ce6841`, TTL Auto. Snapshot Cloudflare: 46 record totali; nessun record email o hostname alternativo modificato. |
| BikerTest | `https://bikertest.biker-link.net/` HTTP 200; Worker distinto e non modificato. Il record AAAA `100::` resta proxied. |
| Cloudflare R2 | Bucket `bikerlink-website-assets`: 49 oggetti, 6.044.133 byte, manifest allineato alla sorgente Railway verificata. Nessun oggetto modificato durante questa fase. |
| Worker candidato | Worker separato `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`, URL <https://bikerlink-website-content-preview.andreamasteri-nadir-radio.workers.dev>. Wrangler mostra zero trigger; nessun custom domain o route apex collegato. Il precedente Preview 9 è rimasto distinto e non è stato sovrascritto. |
| Worker prova Gate 1 | `bikerlink-website-gate1-staging`, versione `b0adebc9-5c8f-4eee-97a7-6be89e83dba7`, deployment `28a875e9-f5c4-4269-89a7-81bd05c5db00`; URL <https://bikerlink-website-gate1-staging.andreamasteri-nadir-radio.workers.dev>. Solo `workers.dev`, nessun trigger o hostname personalizzato; `RAILWAY_ORIGIN` è esclusivamente Railway staging. Il Worker production e BikerTest non sono stati modificati. |
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

**Gate 1: PASS per routing e storage.** La suite anonima precedente passa su tutte e tre le origini; lo staging diretto ha 14/14 prove autenticate read-only e il Worker Cloudflare isolato ha 19/19 controlli autenticati. API JSON, SSE sessione e WebSocket notifiche sono PASS. L’upload immagine autenticato via Worker ha restituito POST/GET 200; i 70 byte hanno lo SHA-256 atteso, il readback diretto R2 corrisponde e la chiave è stata eliminata/verificata assente. Le POST SOS/chat con payload invalidi hanno restituito i 400 JSON attesi, prima della persistenza. Il test locale del routing è 91/91, compresa la preservazione del cookie/contatore visite `bl_vid` sulle pagine statiche. Isolamento storage: stessi bucket privato/pubblico EU, staging senza prefisso, produzione sotto `production/`. Chat SSE live non aperta per evitare presenza verso partecipanti; il codice Worker e il test locale verificano il pass-through `/api/chat/stream` senza trasformazioni, e l’SSE sessione passa live sullo stesso Worker. Nessun webhook HTTP o callback al dominio del sito; Last.fm usa `bikerlink://lastfm-callback`. Evidenze: [`API_GATE1_CLOUDFLARE_PREVIEW.json`](docs/cloudflare-migration/API_GATE1_CLOUDFLARE_PREVIEW.json), [`API_GATE1_CURRENT_REPORT.md`](docs/cloudflare-migration/API_GATE1_CURRENT_REPORT.md) e [`GATE1_STAGING_R2_UPLOAD_PROBE.md`](docs/cloudflare-migration/GATE1_STAGING_R2_UPLOAD_PROBE.md).

I `401` nella Console all’apertura della pagina erano i controlli iniziali di sessione di `web-session.js`, eseguiti prima del login. L’operatore conferma un tentativo di login con password errata; il successivo login riuscito e la prova autenticata hanno restituito HTTP 200. Non sono errori della suite autenticata.

Il backend staging servito al momento dei test è il branch feat/telemetry-capability-close-20261103, revisione cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374. Il codice di quella revisione mappa staging su DATABASE_URL_CANDIDATE e rifiuta l’uso della variabile DATABASE_URL generica. L’operatore ha eseguito `railway run --environment staging --service Bikerlink-Staging` e ha riportato l’host `postgres.railway.internal`; Railway mostra il servizio `Postgres` e il volume da 500 MB nello stesso environment staging. L’host candidato è verificato come staging.

Smoke staging in sola lettura: 31/38 controlli PASS. I 7 FAIL sono preflight CORS eseguiti con origine production; lo staging non restituisce ACAO per biker-link.net o bikertest.biker-link.net. Due preflight separati per l’origine staging stessa restituiscono ACAO, credenziali, metodi e header attesi. Evidenza e interpretazione sono in API_STAGING_ANON_REPORT.md. Questa prova non include autenticazione.

Non ho lanciato lo smoke backend automatico: il runner registra account, aggiorna direttamente il DB per la verifica email e all’avvio ripulisce possibili account smoke precedenti usando DATABASE_URL_CANDIDATE. L’host del DB ora è verificato, ma il runner resta non eseguito perché crea utenti e modifica dati. Per provare il flusso auth ho effettuato un login/logout normale dell’admin sul solo staging: nessun utente creato, sessione distrutta; il normale bookkeeping di login ha scritto sul DB staging. Il verificatore production è read-only; nessuna scrittura DB production e nessuna modifica della patch staged Railway.

Gate 1 è PASS. Il deployment del Worker production e il cambio DNS non sono ancora stati eseguiti. **Gate 2 e Gate 3: NOT RUN**; `API_AFTER.json` non esiste perché il cutover non è avvenuto.

## Preservazione del tracciamento visite pre-cutover — 20 novembre 2026

Il confronto del preview candidato con l’apex ha rilevato che le pagine statiche non emettevano il cookie `bl_vid`. Il backend Railway lo usa per conteggiare le visite alle pagine pubbliche e attribuire login/registrazioni; il cookie è `HttpOnly`, `SameSite=Lax`, `Secure`, con durata di un anno. Per non perdere questa funzione senza modificare backend o database, il Worker ora serve il contenuto da Static Assets e invia in background al middleware Railway esistente il solo GET della pagina. La logica si attiva sul dominio ufficiale e sul Worker Gate 1 solo se l’origine esatta è lo staging; preview di produzione su `.workers.dev` non genera scritture di visite production. La rotta `/api/*` resta prioritaria e inalterata.

Verifiche della correzione: test routing 91/91 PASS; dry-run Wrangler production e Gate 1 staging PASS; commit GitHub `f4c3ebac97d36ffa58691d238878f5e0dd905dfd`; deployment esclusivamente sul Worker `bikerlink-website-gate1-staging`, versione `f8f61d8d-5704-432e-8e02-994113dd666c`. Live staging: `/blog` 200 HTML (201.679 byte), cookie `bl_vid` con `Path=/`, `Max-Age=31536000`, `HttpOnly`, `SameSite=Lax`, `Secure`; `/api/health` 200, `READY`, `degraded=false`, revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`; `/api/auth/me` anonimo 401 JSON atteso. Il Worker ha inoltrato al middleware tracking staging il GET previsto; non è stata interrogata direttamente la tabella `siteVisits`, quindi la persistenza della riga non è attestata. Evidenza sanitizzata: [`STATIC_VISITOR_TRACKING_STAGING.json`](docs/cloudflare-migration/STATIC_VISITOR_TRACKING_STAGING.json).

La verifica pre-cutover del commit candidato, con il preview `workers.dev` appena pubblicato, passa 38/38 su apex, origine Railway e preview; tutte e tre mostrano la revisione backend production `579c84d85a436f3fde485625294560e6be977d8b`. Le differenze automatizzate restano cinque intestazioni statiche `/blog` e `/contact` (MIME/cache); nessuna regressione API, 404 o 500. Evidenza: [`API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md), [`API_BEFORE.json`](docs/cloudflare-migration/API_BEFORE.json) e [`API_PRECUTOVER_COMPARE_20261120.json`](docs/cloudflare-migration/API_PRECUTOVER_COMPARE_20261120.json). PR #15 è stata unita il 20 novembre alle 12:05:21Z (`2d9adeceb35dbc552cfa15b5e1d26a668d7555b5`); il successivo aggiornamento baseline resta da salvare in PR.

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

## Decisione

Il ripristino completo del sito è verificato sul Worker Preview isolato; la migrazione production **non è conclusa**. DNS, sito ufficiale, backend Railway e BikerTest sono rimasti operativi e non modificati da questa attività. Gate 1 è PASS per routing/storage; la Chat SSE live è stata esclusa per i suoi effetti di presenza, con percorso proxy verificato via codice/harness e SSE autenticato rappresentativo PASS. Nessun utente o dato DB/applicativo è stato creato o modificato; l’unico oggetto di test R2 è stato eliminato e verificato assente. Nessun segreto è stato salvato. Non sono stati eseguiti il cutover DNS né Gate 2/3.
