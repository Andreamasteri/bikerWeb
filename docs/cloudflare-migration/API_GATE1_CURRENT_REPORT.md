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

Questo chiude la prova di routing autenticato Cloudflare, letture, session SSE, WebSocket notifiche e rifiuto sicuro delle POST invalide. Non prova una mutazione valida: non è stato creato un messaggio/SOS, non è stato caricato un file, né è stata aperta la Chat SSE che può segnalare presenza ad altri partecipanti. La revisione delle route staging non ha trovato webhook HTTP o callback dirette al dominio del sito; l’unico callback OAuth individuato per Last.fm è `bikerlink://lastfm-callback`, un deep link dell’app che non cambia con il dominio BikerWeb. Gate 1 rimane **BLOCKED** finché non si prova l’isolamento R2 e si individua un write end-to-end sicuro con cleanup; la Chat SSE resta non testata per il suo effetto di presenza.

## Isolamento object storage staging — da confermare

Il connettore Railway conferma che `Bikerlink-Staging` e il servizio `Postgres` appartengono all’environment `staging`; il volume PostgreSQL staging è da 500 MB. Non risultano bucket Railway provisionati in staging. Le variabili d’object storage sono collegate al servizio via `R2_*`, ma Railway ha restituito `valuesRedacted=true`. Nell’elenco variabili staging non compare `R2_KEY_PREFIX`; in production la variabile è presente. Il codice applicativo usa stringa vuota se il prefisso manca. Senza bucket, endpoint host e prefissi effettivi non posso escludere scritture nello stesso namespace R2 del servizio production, perciò nessun upload riuscito è stato tentato.

Il test positivo dell’upload AI immagini può essere eseguito solo dopo aver verificato e confrontato i target R2 effettivi di staging e production, così da poter cancellare con certezza il singolo oggetto temporaneo. Per stampare solo host, nomi bucket e prefisso (mai chiavi o segreti), l’operatore può eseguire dalla propria shell Railway:

```powershell
railway run --environment staging --service Bikerlink-Staging node -e 'const e=process.env; console.log(JSON.stringify({endpointHost:e.R2_ENDPOINT?new URL(e.R2_ENDPOINT).hostname:null,privateBucket:e.R2_PRIVATE_BUCKET??null,publicBucket:e.R2_PUBLIC_BUCKET??null,keyPrefix:e.R2_KEY_PREFIX??""}))'
railway run --environment production --service Bikerlink node -e 'const e=process.env; console.log(JSON.stringify({endpointHost:e.R2_ENDPOINT?new URL(e.R2_ENDPOINT).hostname:null,privateBucket:e.R2_PRIVATE_BUCKET??null,publicBucket:e.R2_PUBLIC_BUCKET??null,keyPrefix:e.R2_KEY_PREFIX??""}))'
```

Condividere solo i due oggetti JSON stampati. Non condividere l’intero output di `railway variables` o `process.env`.

La Chat SSE invoca `schedulePushPresence` sia all’apertura sia alla chiusura e può inviare eventi di presenza ai partecipanti delle conversazioni. È quindi lasciata non testata sul profilo reale; non è una connessione persistente priva di effetti. La ricerca sul codice delle route a revisione `cfd0f224…` non trova webhook HTTP; Last.fm usa il callback dell’app `bikerlink://lastfm-callback`, senza dipendenza dal dominio del sito. Questi risultati non richiedono un invio di callback. L’isolamento R2 e la prova di un write sicuro restano bloccanti per il cutover.
