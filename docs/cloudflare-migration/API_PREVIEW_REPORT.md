# Verifica Cloudflare Preview — deployment 9

> Questo report conserva le prove API anonime del deployment 9, acquisito alle 13:14Z. Il nuovo Worker separato con i contenuti storici ripristinati è `bikerlink-website-content-preview` (versione `3f5a2d95-20e4-4c61-a3be-d676ea24dca2`); la verifica limitata del suo routing API è registrata in [`CONTENT_PREVIEW_VERIFICATION.json`](CONTENT_PREVIEW_VERIFICATION.json). Il controllo aggiornato ha confrontato `/api/health` sul preview, su Railway e sull’apex: tutti HTTP 200 e revisione live `72c7508644b86f268765e2873310dcf45aa0ffb9`. `/api/auth/me` anonimo restituisce l’HTTP 401 previsto. Non è stata ripetuta la suite completa né la suite autenticata: Gate 1 resta BLOCKED.

- Preview alias: https://codex-bikerweb-cloudflare-producti-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev
- URL immutabile del deployment verificato: https://3c35e4a7-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev
- Preview ID fa7a694ccc584f439a2cef32f65be791; deployment 3c35e4a7-8080-41ef-a23a-71d07f37e30d, versione 9, creato 2026-11-19T13:14:24Z.
- Variabili Preview: RAILWAY_ORIGIN=https://bikerlink-production.up.railway.app, PUBLIC_SITE_ORIGIN=https://biker-link.net; binding Static Assets ASSETS e R2 SITE_ASSETS → bikerlink-website-assets.
- Nessun custom domain, route apex o deployment production creato. BikerTest non è stato modificato.
- Backend Railway: revisione aedfb278f487105a10567c9efa4c090705b3d801 su tutte le origini.
- Acquisizione API: 2026-11-19T13:14:29Z; evidenza per singola richiesta in API_PREVIEW.json, confronto con API_BEFORE.json.

## Gate anonimo e confronto

| Target | Controlli | PASS | FAIL | Mediana | Revisione |
| --- | ---: | ---: | ---: | ---: | --- |
| Preview Cloudflare | 38 | 38 | 0 | 192,5 ms | aedfb278f487105a10567c9efa4c090705b3d801 |
| Dominio apex pre-cutover | 38 | 38 | 0 | 148 ms | aedfb278f487105a10567c9efa4c090705b3d801 |
| Origine Railway | 38 | 38 | 0 | 186 ms | aedfb278f487105a10567c9efa4c090705b3d801 |

Confronto automatico Preview → baseline apex: 0 differenze. Sono confrontati anche status e headers delle prove HEAD; per le sole HEAD HTML sono ignorati Content-Length ed ETag perché l’HTML viene riscritto e quei valori dell’origine non descrivono la rappresentazione pubblica. Per blog_page sono confrontati status, content type, canonical e assenza dell’hostname Railway; il body dinamico completo non è usato come hash stabile. Per la sola GET immagine semplice si ignorano ETag/Last-Modified R2 se il body è identico; HEAD, Range e If-* restano instradati a Railway e confrontati.

Copertura: health/readiness, API protette anonime, config/community, CORS preflight, pagina BikerBlog, redirect, HEAD di pagine/asset, immagine completa con hash, validator condizionali 304, Range 206 (16 byte), If-Range stale 200, SSE anonimi e handshake WebSocket anonimi 401. Il probe usa solo GET, HEAD e OPTIONS; i WebSocket sono handshake anonimi senza sessione.

La pagina /blog sul Preview dichiara canonical https://biker-link.net/blog e non contiene l’hostname Railway. Il controllo aveva trovato una differenza effettiva: Railway generava canonical/OG/JSON-LD sull’hostname *.up.railway.app quando riceveva il proxy. Il Worker riscrive il solo hostname nelle sole risposte HTML non-API e negli eventuali redirect assoluti; le API, JSON, cookie, media, SSE e WebSocket non vengono trasformati. /web-session.js è servito come asset statico JS identico alla sorgente versionata del commit backend aedfb278f487105a10567c9efa4c090705b3d801; le sue chiamate /api/auth/* arrivano ancora a Railway. Il proxy elimina l’header Host fornito dal chiamante, lasciando a fetch l’hostname Railway corretto.

## Smoke browser

Evidenza aggiornata in BROWSER_PREVIEW.json, acquisita 2026-11-19T13:19:08Z su deployment 9 con Playwright e Chromium di sistema. Desktop 1365×900 e viewport mobile 412×915; pagine /, /blog, /matching, /community:

- 8/8 navigazioni HTTP 200; nessun overflow orizzontale.
- Homepage canonical https://biker-link.net/, meta robots index,follow; tutte le 13 immagini R2 caricate su entrambi i viewport dopo scorrimento progressivo.
- /blog canonical https://biker-link.net/blog; nessun hostname Railway nel markup.
- /web-session.js: 200, text/javascript, 4.827 byte; menu mobile aperto con 10 link.
- Nessuna eccezione JavaScript, richiesta fallita o metodo di scrittura. Le richieste anonime /api/auth/me ricevono il 401 previsto.
- Preview X-Robots-Tag noindex; le pagine conservano canonical e meta robots pubblici.
- Test su Android fisico non eseguito.

## Verifica anonima Railway staging

Suite read-only acquisita il 2026-11-19T17:31:27Z su https://bikerlink-staging-staging.up.railway.app, revisione cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374. Evidenza completa in API_STAGING_ANON.json: 31/38 PASS, mediana 184,5 ms. I 7 FAIL sono tutti CORS preflight con Origin https://biker-link.net; l’origine non riceve Access-Control-Allow-Origin, anche se OPTIONS restituisce HTTP 200. Verifica separata: 2/2 preflight (login e register) dall’origine staging https://bikerlink-staging-staging.up.railway.app restituiscono ACAO corretto, credenziali abilitate, POST e header content-type/authorization. L’origine bikertest.biker-link.net non viene autorizzata dallo staging.

Queste prove non usano cookie né credenziali e non generano scritture. Non indicano un regressione production: gli stessi test CORS con origine production sul candidate Preview verso il backend production passano 7/7. Non sono però una verifica autenticata dello staging.

## Limiti e gate

Le righe seguenti descrivono ciò che era noto durante l’acquisizione Preview v9 e sono state superate dalle prove successive: il controllo dell’host `DATABASE_URL_CANDIDATE` nello staging e il flusso admin login/session/logout sono documentati in [`API_AUTH_STAGING_REPORT.md`](API_AUTH_STAGING_REPORT.md). La copertura autenticata degli altri endpoint critici resta incompleta; Gate 1 è ancora BLOCKED.

Questo controllo dimostra l’instradamento anonimo sul candidato v9, non l’autenticazione con sessione valida. Non ha eseguito login, modifiche account, matching autenticato, scritture telemetria, upload, SOS, notifiche, webhook o callback. Gli stream SSE/WebSocket con cookie valido non sono stati aperti. Nessun database è stato scritto.

Il codice esatto del branch staging seleziona DATABASE_URL_CANDIDATE; Railway espone un Postgres separato nello stesso environment. L’host del valore DATABASE_URL_CANDIDATE resta però non verificato perché Railway OAuth oscura i valori. Non è stato possibile reperire una sessione utente autorizzata; la patch staged nello staging non è stata toccata.

Gate 1: BLOCKED, non PASS. Non c’è stata prova autenticata sicura su un account esistente di test né prova dell’host DB staging. Il cambio DNS e il deploy production restano vietati dai gate del piano. Gate 2 e Gate 3: NOT RUN perché non è avvenuta la pubblicazione.
