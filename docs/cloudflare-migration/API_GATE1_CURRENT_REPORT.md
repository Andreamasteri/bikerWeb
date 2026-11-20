# Gate 1 — verifica API aggiornata

Acquisizioni read-only del 19 novembre 2026, tra le 23:29Z e le 23:37Z. Il Worker testato è `bikerlink-website-content-preview`, versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`; non ha trigger o dominio personalizzato.

## Suite anonima su produzione

La suite ha inviato solo GET, HEAD, OPTIONS e handshake WebSocket anonimi. Non ha effettuato login né scritto dati.

| Origine | Esiti | Mediana | Revisione backend |
| --- | ---: | ---: | --- |
| `https://biker-link.net` | 38/38 PASS | 147 ms | `34f03bb77e631907aa6c9ada6846bff064b9f977` |
| Railway diretta | 38/38 PASS | 184 ms | `34f03bb77e631907aa6c9ada6846bff064b9f977` |
| Worker Preview | 38/38 PASS | 183,5 ms | `34f03bb77e631907aa6c9ada6846bff064b9f977` |

Il confronto ripetuto ha rilevato cinque differenze solo nelle risposte HTML statiche di `/blog` e `/contact`: tipo MIME e intestazioni di cache del frontend Cloudflare. Gli endpoint API non sono coinvolti. Nei 22 controlli API, readiness e WebSocket confrontabili status, schema, cookie, redirect e corpi sono coerenti. Per `/api/health` il Worker omette `Content-Length`; la risposta è comunque di 711 byte e ha lo stesso SHA-256 dell’origine. Il confronto dettagliato è in [`API_GATE1_ANON_RECHECK.json`](API_GATE1_ANON_RECHECK.json); la prima acquisizione completa è in [`API_GATE1_ANON_CURRENT.json`](API_GATE1_ANON_CURRENT.json).

Railway ha distribuito autonomamente la revisione `34f03bb77e631907aa6c9ada6846bff064b9f977` alle 23:21Z, commit `docs: enforce single active branch workflow`, deployment `624c7488-3c51-4992-b13a-f6ec08a246d0`. La stessa revisione è stata osservata sull’apex, sull’origine Railway e sul Worker Preview. Non ho avviato né modificato quel deployment.

## Controlli read-only sullo staging

Acquisizione alle 23:37Z su `https://bikerlink-staging-staging.up.railway.app`, revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`:

- `/api/health`: HTTP 200, `ready`, `degraded=false`.
- `/api/auth/me`, `/api/users/me`, `/api/chat/conversations`, `/api/notifications` e `/api/auth/session-events`: HTTP 401 senza sessione, come previsto.
- Preflight login con origine staging: HTTP 200, ACAO staging, credenziali abilitate, POST e header `Content-Type`/`Authorization` consentiti.
- Lo stesso preflight con origine `https://biker-link.net` non restituisce ACAO. È una restrizione dell’origine sullo staging; non è stata osservata sul backend production nel test precedente.

Evidenza: [`API_GATE1_STAGING_READONLY.json`](API_GATE1_STAGING_READONLY.json).

## Prove autenticate e limite attuale

Il 20 novembre 2026 alle 09:45:43Z è stata eseguita una suite browser autenticata in sola lettura sullo staging, revisione backend `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`. **14/14 controlli PASS**: 13 richieste JSON `GET` e l’apertura/chiusura dell’SSE `/api/auth/session-events`. Sono passati autenticazione e profilo, preferenze e matching, letture telemetria, elenco chat, notifiche, stato SOS personale e configurazione AI. Le latenze sono 358–1.350 ms per i GET JSON, mediana 540 ms; SSE 409 ms. Evidenza minimizzata: [`API_GATE1_AUTHENTICATED_READONLY.json`](API_GATE1_AUTHENTICATED_READONLY.json). Non sono stati conservati valori delle risposte, cookie o token.

Questa prova usa il dominio Railway di staging e non dimostra ancora il comportamento autenticato attraverso il Worker Cloudflare o il dominio ufficiale. Il preview candidato inoltra al backend production; il test autenticato di staging non è stato eseguito su quel diverso hostname.

I `401` osservati nella Console erano della pagina appena aperta, prima del login: `web-session.js` interroga `/api/auth/me` all’avvio e su `pageshow`, e tratta `401` come stato anonimo. L’operatore conferma che il singolo `POST /api/auth/login` con `401` corrisponde a un tentativo con password errata. Dopo il login corretto, `/api/auth/me` ha risposto HTTP 200 e tutti i 14 controlli sono passati. Le righe rosse sono risposte HTTP attese in quella sequenza, non errori JavaScript né regressioni del backend.

Restano da verificare: routing autenticato su hostname Cloudflare/production, upload effettivo isolato, callback/webhook applicabili, Chat SSE e WebSocket autenticati. Chat SSE e WebSocket possono segnalare presenza; le richieste con effetti (upload, invio, SOS) richiedono un test controllato che non coinvolga dati o utenti reali. Nessun DNS, Worker BikerTest, backend, variabile o database è stato modificato da questa acquisizione.

**Stato al 20 novembre 2026, 09:45Z, prima del Worker staging Cloudflare:** Gate 1 era BLOCKED perché mancavano prove sul percorso autenticato Cloudflare e su alcuni percorsi persistenti o con effetti. L’aggiornamento successivo è riportato sotto.

## Nuovo Worker Cloudflare isolato per Gate 1 — 20 novembre 2026

Per provare l’autenticazione senza usare la revisione production né cambiare DNS, è stato creato e pubblicato il Worker separato `bikerlink-website-gate1-staging`. Il suo `RAILWAY_ORIGIN` è `https://bikerlink-staging-staging.up.railway.app`; l’health live conferma la revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`, `ready`, `degraded=false`. Il Worker usa solo `workers.dev`, senza route o hostname personalizzati, e non sovrascrive né il Worker BikerTest né il preview dei contenuti.

- Sorgente GitHub verificata: commit `b7a76c3d7a3e2505f259a3ccf3cec5ec00af4c40`, PR [#10](https://github.com/Andreamasteri/bikerWeb/pull/10) unita a `main`.
- Deployment Cloudflare: ID `28a875e9-f5c4-4269-89a7-81bd05c5db00`, versione `b0adebc9-5c8f-4eee-97a7-6be89e83dba7` al 100%.
- `/api/health`: HTTP 200 JSON; `/api/auth/me` senza cookie: 401 JSON; `/accedi`: 200 HTML, `X-Robots-Tag: noindex`, markup decompresso verificato senza hostname Railway.
- `/matching`, `/robots.txt` e `/sitemap.xml`: HTTP 200; pagine Preview noindex.
- L’immagine R2 `assets/images/hero-forest.webp` risponde HTTP 200 (`image/webp`, 337.534 byte); SHA-256 scaricato dal Worker e dall’oggetto remoto R2 identico: `8de037be4d1c61509a9001fad23fc32b726d793b56d642999ae8b75c3bdf4659`.
- POST anonimi a `/api/sos`, `/api/chat/conversations` e `/api/ai/assistant/images` restituiscono tutti 401 JSON, non HTML del frontend. Anche l’handshake WebSocket anonimo raggiunge Railway e viene rifiutato 401.
- Il test locale aggiornato del routing è 85/85 PASS. La configurazione Wrangler di staging ha superato il dry-run e il deploy. Evidenza live sanitizzata: [`API_GATE1_CLOUDFLARE_PREVIEW.json`](API_GATE1_CLOUDFLARE_PREVIEW.json).

Il controllo anonimo dimostra precedenza e instradamento verso l’API, ma non dimostra l’autenticazione con cookie. Per quella verifica il browser deve creare la sessione sullo stesso hostname workers.dev; il cookie del dominio Railway staging è limitato al suo hostname e non è trasferibile. Le istruzioni e lo script che non stampa segreti o dati del profilo sono in [`GATE1_BROWSER_PROBE.md`](GATE1_BROWSER_PROBE.md) e [`GATE1_BROWSER_PROBE.js`](GATE1_BROWSER_PROBE.js).

Il codice Railway staging è stato ispezionato alla revisione sopra indicata: i body invalidi SOS e chat falliscono Zod prima della persistenza; l’enum messaggio invalido fallisce prima delle query DB; la form upload senza file risponde 400 prima di `uploadBuffer`. Lo script invia solo questi payload rifiutati, GET read-only, l’apertura/chiusura dell’SSE e del WebSocket notifiche. Non invia un messaggio, non crea un SOS o una conversazione, non carica file e non invoca webhook. Al primo aggiornamento la suite autenticata sul nuovo hostname era ancora in attesa; l’esito acquisito successivamente è riportato nella sezione seguente.

## Probe autenticato Cloudflare completato — 20 novembre 2026, 10:39:43Z

L’operatore ha eseguito il probe dal browser autenticato sul Worker `bikerlink-website-gate1-staging`. **19/19 PASS, 0 FAIL**, revisione backend `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`:

| Metodo e percorso | Esito | Latenza |
| --- | --- | ---: |
| GET `/api/auth/me` | 200 JSON | 1.590 ms |
| GET `/api/health` | 200 JSON | 434 ms |
| GET `/api/users/me` | 200 JSON | 1.035 ms |
| GET `/api/match-preferences` | 200 JSON | 546 ms |
| GET `/api/match-preferences/gate` | 200 JSON | 529 ms |
| GET `/api/proposals/matches/accepted` | 200 JSON | 369 ms |
| GET `/api/telemetry/sensor-settings` | 200 JSON | 532 ms |
| GET `/api/telemetry/calibration` | 200 JSON | 542 ms |
| GET `/api/telemetry/dr-correction` | 200 JSON | 563 ms |
| GET `/api/chat/conversations?limit=1&offset=0` | 200 JSON | 882 ms |
| GET `/api/notifications` | 200 JSON | 547 ms |
| GET `/api/sos/my` | 200 JSON | 559 ms |
| GET `/api/ai/assistant/config?platform=web` | 200 JSON | 719 ms |
| GET `/api/auth/session-events` | 200 SSE, evento `connected` ricevuto | 399 ms |
| POST `/api/sos` con body `{}` | 400 JSON atteso; validazione prima della scrittura | 389 ms |
| POST `/api/chat/conversations` con body `{}` | 400 JSON atteso; validazione prima della scrittura | 407 ms |
| POST `/api/chat/conversations/:id/messages` con tipo non valido | 400 JSON atteso; validazione prima della scrittura | 402 ms |
| POST `/api/ai/assistant/images` con form vuoto | 400 JSON atteso; nessun file caricato | 588 ms |
| WSS `/ws/admin/notifications` | connessione aperta, `hello` ricevuto, chiusura immediata | 703 ms |

I `400` rossi mostrati in Console sono le risposte attese ai payload di validazione: il JSON finale del probe riporta `all_pass:true`. Le quattro `401` precedenti su `/api/auth/me` non fanno parte di questa acquisizione autenticata; la richiesta corrente di autenticazione ha restituito 200. Nessun body personale, cookie o token è stato registrato. Evidenza sanitizzata completa: [`API_GATE1_CLOUDFLARE_PREVIEW.json`](API_GATE1_CLOUDFLARE_PREVIEW.json).

Questo chiude la prova di routing autenticato Cloudflare, letture, session SSE, WebSocket notifiche, rifiuto sicuro delle POST invalide e upload immagine autenticato con readback/cleanup (evidenza sotto). Non è stato creato un messaggio/SOS, né aperta la Chat SSE, che può segnalare presenza ad altri partecipanti. La revisione delle route staging non ha trovato webhook HTTP o callback dirette al dominio del sito; l’unico callback OAuth individuato per Last.fm è `bikerlink://lastfm-callback`, un deep link dell’app che non cambia con il dominio BikerWeb.

## Isolamento object storage staging — verificato

Il 20 novembre l’operatore ha eseguito i controlli Railway senza esporre chiavi o segreti. `Bikerlink-Staging` e `Bikerlink` usano lo stesso endpoint R2 EU e gli stessi bucket (`bikerlink-private` e `bikerlink-public`), ma `R2_KEY_PREFIX` è vuoto in staging e `production` in produzione. Wrangler ha confermato che entrambi i bucket esistono nella giurisdizione EU. Il codice storage applica il prefisso alla chiave: il percorso AI immagini `private/assistant-images/<filename>` resta nella radice staging e diventa `production/private/assistant-images/<filename>` in produzione. Gli hash SHA-256 del file `server/objectStorage.ts` nelle revisioni backend staging e production coincidono: `1278815eb6293f79deb9f94818d6e32642ce07c7641fede740ada55681a49606`.

È stata eseguita anche una prova diretta e indipendente sull’R2 remoto EU: oggetto univoco di 70 byte nel bucket `bikerlink-private`, download byte-per-byte con SHA-256 `4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5`, cancellazione dell’esatta chiave `__codex_gate1_probe/5db3e28fde944f589449f08ad201a8f0.png` e successivo GET con esito “key does not exist”. La chiave temporanea è stata rimossa.

Il 20 novembre 2026 il browser autenticato sul Worker staging ha caricato il PNG sintetico 1×1 con POST `/api/ai/assistant/images`: HTTP 200; GET autenticato dello stesso URL: HTTP 200, `image/png`, 70 byte, SHA-256 `4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5`. L’oggetto R2 `private/assistant-images/1795174467908-fyid2e3tfet.png` nel bucket `bikerlink-private` (EU) è stato letto direttamente con Wrangler e ha gli stessi byte/hash, poi eliminato puntualmente. Un GET R2 successivo fallisce con `The specified key does not exist`. Non è stato scritto alcun dato DB o profilo. Esecuzione sanitizzata: [`GATE1_STAGING_R2_UPLOAD_PROBE.md`](GATE1_STAGING_R2_UPLOAD_PROBE.md).

La Chat SSE invoca `schedulePushPresence` sia all’apertura sia alla chiusura e può inviare eventi di presenza ai partecipanti delle conversazioni; per questo non è stata aperta sul profilo reale. La verifica statica del Worker conferma che `/api/chat/stream` rientra nel ramo generale `/api/*`, inoltra richiesta/risposta a Railway senza trasformarle, e il test locale include `/api/chat/stream?room=demo`; sullo stesso Worker il flusso autenticato `/api/auth/session-events` ha ricevuto l’evento `connected`. La connessione Chat SSE live resta non eseguita per evitare eventi di presenza, ma non emerge un rischio specifico introdotto dal proxy. Gate 1 è **PASS per routing e storage**: 19/19 probe autenticati più upload/readback/cleanup. Nessun webhook HTTP o callback al dominio del sito; Last.fm usa `bikerlink://lastfm-callback`.

## Follow-up pre-cutover: cookie e contatore visite delle pagine statiche

Il confronto candidato/apex del 20 novembre ha mostrato che le copie HTML statiche non emettevano `bl_vid`, cookie usato dal backend per il contatore visite e per collegare una visita anonima a un successivo login/registrazione. La correzione è solo nel Worker: contenuto HTML da Static Assets; il GET di tracciamento usa il middleware già esistente su Railway in `ctx.waitUntil`; l’origine è vincolata al dominio production ufficiale o, esclusivamente nel Worker Gate 1 dedicato, alla Railway staging esatta. Il preview production su `workers.dev` non inoltra visite né scrive su production. Nessuna API, schema DB o logica backend è stata modificata.

Verifica: `npm run test:routing` 91/91 PASS, entrambi i dry-run Wrangler PASS, deployment Gate 1 `f8f61d8d-5704-432e-8e02-994113dd666c`. La richiesta live staging `GET /blog` è 200 HTML, 201.679 byte, `X-Robots-Tag: noindex` e `Set-Cookie: bl_vid` con `Path=/`, `Max-Age=31536000`, `HttpOnly`, `SameSite=Lax`, `Secure`. `/api/health` staging resta 200 `READY`, revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`; `/api/auth/me` anonimo resta 401 JSON. La richiesta di tracking è stata inoltrata al middleware staging; non è stata fatta una query diretta alla tabella `siteVisits`, quindi la persistenza della singola riga non è attestata. Evidenza: [`STATIC_VISITOR_TRACKING_STAGING.json`](STATIC_VISITOR_TRACKING_STAGING.json).

Il codice è nel branch `codex/bikerweb-visitor-tracking-preservation-20261120`, commit push verificato `f4c3ebac97d36ffa58691d238878f5e0dd905dfd`; PR [#15](https://github.com/Andreamasteri/bikerWeb/pull/15) è stata unita il 20 novembre alle 12:05:21Z, merge commit `2d9adeceb35dbc552cfa15b5e1d26a668d7555b5`. Il Worker production e il DNS non sono cambiati; Gate 2 e Gate 3 restano NOT RUN.

## Esito Gate 1 corrente — 20 novembre 2026

Routing API autenticato, letture, upload R2, cookie/tracciamento visite, SSE sessione, WebSocket notifiche e rifiuto delle POST invalide sono verificati. La baseline anonima corrente è 38/38 su apex, Railway e preview alla revisione `579c84d85a436f3fde485625294560e6be977d8b`; gli artefatti sono [`API_BEFORE.json`](API_BEFORE.json) e [`API_PRECUTOVER_COMPARE_20261120.json`](API_PRECUTOVER_COMPARE_20261120.json). PR #16 ha aggiornato la baseline ed è stata unita alle 12:07:07Z, merge `26718382d563baf1944775bbd8c50786aa777bb7`.

**Gate 1 completo e cutover: BLOCKED solo sulla connessione Chat SSE autenticata live.** Il relativo handler pianifica `schedulePushPresence` a connect/close e può inviare eventi agli altri partecipanti; il runtime di browser condiviso non è accessibile da Codex web. Probe sicuro pronto: [`GATE1_CHAT_SSE_SAFE_PROBE.js`](GATE1_CHAT_SSE_SAFE_PROBE.js). Prima legge `GET /api/chat/conversations?limit=1&offset=0`; apre lo stream solo se il risultato è un array vuoto, quindi non esistono altri partecipanti da notificare. Con conversazioni presenti o sessione non valida salta il test e non apre SSE. L’output non contiene ID, messaggi, cookie o token. Una volta eseguito dalla scheda autenticata Gate 1 staging, se il probe passa, si può rivalutare l’avvio di Gate 2. Nessun Worker production o record DNS è stato pubblicato.

## Esito preflight Chat SSE — 20 novembre 2026, 12:20:32Z

Il probe browser autenticato ha ottenuto `GET /api/chat/conversations?limit=1&offset=0` HTTP 200 e ha contato una conversazione. Per la regola di sicurezza non ha chiamato `/api/chat/stream`: `attempted=false`, `all_pass=false`, skip reason `active_conversation_present_presence_probe_skipped`. Non è stata aperta alcuna connessione SSE e non sono partiti eventi di presenza. Dato che il runtime CUA del browser condiviso è indisponibile, il risultato è stato acquisito dall’operatore e passato qui come JSON sanitizzato. Evidenza: [`GATE1_CHAT_SSE_PREFLIGHT_20261120.json`](GATE1_CHAT_SSE_PREFLIGHT_20261120.json).

Ho verificato il percorso di registrazione: gli utenti standard staging ricevono una conversazione di benvenuto e una notifica email; il login staging è riservato agli admin. Creare un utente ordinario non produrrebbe quindi un account di test utilizzabile senza conversazioni, mentre forzare un account admin richiederebbe modifiche DB. Non ho creato account, aperto stream, né modificato dati o schema.

**Stato gate:** gli altri controlli Gate 1 (19/19 HTTP autenticati, R2 upload/readback/cleanup, SSE sessione, WebSocket notifiche e visitor cookie) restano PASS. **Gate 1 completo e cutover rimangono BLOCKED** finché non si autentica un account admin staging già esistente e autorizzato con zero conversazioni. Nessun Worker production o DNS è stato pubblicato.
