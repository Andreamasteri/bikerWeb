# BikerWeb → Cloudflare migration report

**Data verifica:** 19 novembre 2026 (UTC)  
**Esito:** preparazione e audit completati; pubblicazione fermata prima del cambio DNS. Il frontend ufficiale è ancora servito da Railway. Il backend e i database non sono stati modificati.

## Architettura e stato live

| Componente | Stato verificato |
| --- | --- |
| Frontend ufficiale `https://biker-link.net` | Ancora su Railway; risposta 200. Nessuna route Worker o modifica DNS applicata. |
| Backend Railway | Operativo su `bikerlink-production.up.railway.app`; `/api/health` risponde 200 con revisione `aedfb278f487105a10567c9efa4c090705b3d801`. Nessun deploy backend eseguito. |
| DNS apex | CNAME `biker-link.net` → `bikerlink-production.up.railway.app`, `proxied:false`, TTL API `1` (Auto), record ID `f4b67198cdea0c5f2f61d65e53ce6841`. Nessuna modifica ai record email o agli altri hostname. |
| Worker BikerTest | `bikerlink-website-test` esiste e resta separato. Deployment attivo `1ad4855e-c80c-4f1b-9911-726b8b25a4fd`, versione `bf2414b5-9ead-4012-a6cd-99afc5a96498`, quota 100%; `https://bikertest.biker-link.net/` risponde 200. |
| Worker produzione | `bikerlink-website-production` non risulta ancora creato/caricato in Cloudflare; nessun deployment ID. |
| Cloudflare R2 | Bucket dedicato `bikerlink-website-assets`: 49 oggetti, 6.044.133 byte. Dimensioni e MD5 coincidono con il manifest generato dagli asset del commit Railway sorgente. |
| TLS e WebSocket zona | Stato osservato: modalità SSL `Full`, WebSockets `on`. Non sono state cambiate impostazioni della zona. Il Worker candidato usa HTTPS verso l’hostname Railway, non il dominio pubblico, evitando il loop. |

Il Worker candidato è configurato per Workers Static Assets in `workers/bikerlink-website-production/`. La variabile non segreta `RAILWAY_ORIGIN=https://bikerlink-production.up.railway.app` è dichiarata nel file Wrangler e validata prima del proxy. Il binding `SITE_ASSETS` punta al bucket R2 dedicato. Queste impostazioni sono versionate ma non sono ancora state applicate a un Worker Cloudflare remoto.

## Audit e routing candidato

È stata confrontata la sorgente del backend Railway al commit `aedfb278f487105a10567c9efa4c090705b3d801` con il candidate Worker e le pagine approvate di BikerTest. L’audit ha rilevato 33 route GET non-API esplicite/dinamiche; il backend non dichiara route di scrittura pubbliche fuori da `/api/*`.

La precedenza nel candidate è documentata in [`workers/bikerlink-website-production/ROUTES.md`](workers/bikerlink-website-production/ROUTES.md):

1. `/api` e `/api/*`, per tutti i metodi, vengono inoltrati a Railway conservando URL, query, body, headers, cookie e risposta.
2. `GET`/`HEAD /healthz`, i path WebSocket diretti e l’handshake Expo `GET /` restano su Railway.
3. Le pagine applicative legacy e le famiglie `/docs/*`, `/blog/*`, `/matching/*`, `/uploads/*`, `/music/*` e `/assets/*` sono esplicite e instradate secondo il comportamento originario.
4. Le immagini hanno precedenza R2 solo per una normale `GET`; oggetti non presenti ricadono sull’origine.
5. `HEAD`, Range e richieste condizionali `If-*` sulle immagini usano Railway, mantenendo i validator e la semantica originaria. La risposta dell’origine osservata per `bike-road-1.webp` ha ETag weak `W/"25ac4-1a1f090c188"`, mentre l’oggetto R2 ha un ETag derivato dal contenuto: il Worker non li tratta come equivalenti.
6. Le 18 pagine approvate e i file SEO sono serviti da Workers Static Assets. I metodi/path non mappati non ricevono HTML generico e non vengono inoltrati da un catch-all.

`/privacy-policy` è stato tolto dagli Static Assets perché Railway lo reindirizza con 301 a `/privacy`; il candidate ora conserva quel redirect dell’origine. `OPTIONS` e tutti i metodi applicativi sotto `/api/*` mantengono la precedenza sul frontend.

## Backup Forge e rollback

Backup pre-migrazione verificato su Forge:

`/home/andrea/backups/bikerweb/bikerweb-pre-cloudflare-production-20261119.zip`

- Dimensione: **8.598.088 byte**.
- SHA-256: `d129429c1161df1388816c5815f0cac2c219bd8bc454948a757da60ef7f31745`.
- `unzip -t`: PASS; `SHA256SUMS`: PASS; estrazione dei file manifestati: PASS.
- Il bundle annidato `source/bikerlink-origin-aedfb-frontend.tar.gz` ha 112 membri senza percorsi pericolosi; l’estrazione controllata ha ripristinato 102 file tra cui sorgenti TypeScript e pagine HTML. Sono inclusi anche il sorgente BikerTest attivo, il source snapshot GitHub e il candidate precedente.
- `RESTORE.md` documenta il rollback: mantenere Railway operativo, ripristinare il solo CNAME apex in modalità DNS-only, rimuovere solo l’eventuale route/custom domain Worker apex introdotto e attendere/verificare la convergenza DNS, TLS, homepage e API.
- Il backup è un pacchetto di sorgenti e routing frontend, **non** un dump completo del servizio Railway, dei database o dei segreti. Il redeploy di prova del backup non è stato eseguito; il servizio Railway originario è rimasto attivo e costituisce il rollback live immediato finché non avviene un cutover.

La verifica d’integrità e di ripristino dei sorgenti è PASS. Nessuna procedura di rollback DNS è stata eseguita perché non è avvenuto alcun cutover.

## API — Gate 1

La baseline è registrata in [`docs/cloudflare-migration/API_BEFORE.json`](docs/cloudflare-migration/API_BEFORE.json) e [`docs/cloudflare-migration/API_BEFORE_REPORT.md`](docs/cloudflare-migration/API_BEFORE_REPORT.md). È ripetibile con [`scripts/cloudflare-migration/api_probe.py`](scripts/cloudflare-migration/api_probe.py).

- Acquisizione: `2026-11-19T11:00:33Z`.
- Dominio apex: **32/32 PASS**, mediana `137,5 ms`.
- Hostname Railway: **32/32 PASS**, mediana `183,5 ms`.
- Entrambi restituiscono la revisione backend `aedfb278f487105a10567c9efa4c090705b3d801`.
- Sono stati controllati health/readiness, risposte anonime auth/profile/chat/notifications/AI, CORS preflight, redirect, HEAD di pagine/asset, SSE anonimi e handshake WebSocket anonimi. Le API protette hanno restituito i `401` attesi; i due handshake WebSocket anonimi hanno restituito `401`.
- La suite non ha eseguito login, scritture, upload, SOS, notifiche o callback. Non è stata usata una sessione autorizzata: gli endpoint SSE sono stati verificati solo per il rifiuto anonimo e i WebSocket autenticati non sono stati aperti.

**Gate 1: BLOCKED, non PASS.** Mancano prove autenticate non distruttive per sessione/cookie, profilo, matching, telemetria, community, chat, notifiche, media/upload, AI e stream persistenti. In base al piano vincolante non si può pubblicare finché il gate non è PASS.

## Candidate e validazioni

Il candidate è stato validato localmente e isolatamente; questo non sostituisce un test live su Cloudflare:

- Sintassi Worker e configurazione Wrangler: PASS.
- Harness locale delle rotte: **26/26 PASS**; include priorità API, forwarding di headers/cookie/query, path SSE/WebSocket, R2, asset statici, redirect privacy, Range/validator/HEAD verso Railway, rifiuto di path/metodi non mappati e configurazione origin mancante. Non prova il runtime Cloudflare o un canale persistente autenticato.
- Audit SEO statico: 18 pagine, 19 URL in sitemap, zero problemi rilevati per canonical, robots, noindex e hostname BikerTest.
- Non sono stati eseguiti test visuali desktop/Android, né verifiche live di cache, immagini R2, JavaScript e routing sul Worker candidato: non esiste ancora un preview remoto del candidate.
- Wrangler e `cf` non sono installati/disponibili nel workspace. L’API Cloudflare collegata non espone un header personalizzato per completare il bearer JWT richiesto dalla sessione di upload Workers Static Assets. Un precedente tentativo di trasferire la JWT temporanea a Forge è stato bloccato dall’auto-review; non è stato aggirato né il token è stato inoltrato.

Di conseguenza il candidate non è stato deployato su un hostname di verifica; **Gate 2 e Gate 3: NOT RUN**. Non esistono `API_AFTER.json` né risultati post-cutover, perché non c’è stata pubblicazione.

## GitHub e CI

- Repository: `Andreamasteri/bikerWeb`.
- Branch: `codex/bikerweb-cloudflare-production-20261119`.
- Base verificata: `main` a `7827790d7f26c8060319e29772d073160fd23af0`.
- Commit candidato e baseline salvati: `b794c6290a9ae58558789c49d07015555590571c`; push verificato sul branch remoto.
- PR #1: `https://github.com/Andreamasteri/bikerWeb/pull/1`, aperta, draft, non merged.
- Il repository non contiene workflow `.github/workflows`; nessun check CI è stato generato. Nessun commit o deploy backend è stato eseguito.

## Pubblicazione e decisione

Nessun record DNS, Worker, servizio Railway, database, servizio matching/telemetria, email o ambiente BikerTest è stato modificato. Il frontend ufficiale è ancora su Railway e le API sono operative.

Il rilascio è fermo per due prerequisiti verificabili: una sessione/account sandbox autorizzati per completare Gate 1 e un canale autenticato Wrangler/Workers Builds o equivalente che possa caricare e testare Workers Static Assets su hostname isolato. Dopo questi passaggi si potrà eseguire la suite pre/post, la pubblicazione sul dominio e Gate 2/3. Fino ad allora il passaggio DNS del dominio principale non è sicuro e non è stato effettuato.
