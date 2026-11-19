# BikerWeb → Cloudflare migration report

**Data verifica:** 19 novembre 2026 (UTC)  
**Esito:** candidate e Preview Cloudflare creati e verificati; pubblicazione del dominio fermata perché Gate 1 resta bloccato. Il frontend ufficiale è ancora servito da Railway. Il backend e i database non sono stati modificati.

## Architettura e stato live

| Componente | Stato verificato |
| --- | --- |
| Frontend ufficiale `https://biker-link.net` | Ancora su Railway; risposta 200. Nessuna route Worker o modifica DNS applicata. |
| Backend Railway | Operativo su `bikerlink-production.up.railway.app`; `/api/health` risponde 200 con revisione `aedfb278f487105a10567c9efa4c090705b3d801`. Nessun deploy backend eseguito. |
| DNS apex | CNAME `biker-link.net` → `bikerlink-production.up.railway.app`, `proxied:false`, TTL API `1` (Auto), record ID `f4b67198cdea0c5f2f61d65e53ce6841`. Nessuna modifica ai record email o agli altri hostname. |
| Worker BikerTest | `bikerlink-website-test` esiste e resta separato. Deployment attivo `1ad4855e-c80c-4f1b-9911-726b8b25a4fd`, versione `bf2414b5-9ead-4012-a6cd-99afc5a96498`, quota 100%; `https://bikertest.biker-link.net/` risponde 200. |
| Worker/Preview candidato | Preview Cloudflare separato disponibile su `https://codex-bikerweb-cloudflare-producti-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev`; Preview ID `fa7a694ccc584f439a2cef32f65be791`, deployment verificato `bf714146-cf10-4b69-8b4a-b254ca82303b`. Nessun deployment production o custom domain apex creato. |
| Cloudflare R2 | Bucket dedicato `bikerlink-website-assets`: 49 oggetti, 6.044.133 byte. Dimensioni e MD5 coincidono con il manifest generato dagli asset del commit Railway sorgente. |
| TLS e WebSocket zona | Stato osservato: modalità SSL `Full`, WebSockets `on`. Non sono state cambiate impostazioni della zona. Il Worker candidato usa HTTPS verso l’hostname Railway, non il dominio pubblico, evitando il loop. |

Il Worker candidato è configurato per Workers Static Assets in `workers/bikerlink-website-production/`. La variabile non segreta `RAILWAY_ORIGIN=https://bikerlink-production.up.railway.app` è dichiarata nel file Wrangler e validata prima del proxy. Il binding `SITE_ASSETS` punta al bucket R2 dedicato. Le impostazioni sono state applicate soltanto al Preview Cloudflare del branch; nessun Worker production o route del dominio ufficiale è stato creato.

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

- Acquisizione aggiornata prima del Preview: `2026-11-19T12:20:56Z`.
- Dominio apex: **37/37 PASS**, mediana `146 ms`.
- Hostname Railway: **37/37 PASS**, mediana `185 ms`.
- Entrambi restituiscono la revisione backend `aedfb278f487105a10567c9efa4c090705b3d801`.
- Sono stati controllati health/readiness, risposte anonime auth/profile/chat/notifications/AI, CORS preflight, redirect, HEAD di pagine/asset, SSE anonimi e handshake WebSocket anonimi. Include hash e dimensione immagine, `If-None-Match`/`If-Modified-Since` (304), Range (206) e fallback `If-Range` stale (200). Le API protette hanno restituito i `401` attesi; i due handshake WebSocket anonimi hanno restituito `401`.
- La suite non ha eseguito login, scritture, upload, SOS, notifiche o callback. Non è stata usata una sessione autorizzata: gli endpoint SSE sono stati verificati solo per il rifiuto anonimo e i WebSocket autenticati non sono stati aperti.

**Gate 1: BLOCKED, non PASS.** Mancano prove autenticate non distruttive per sessione/cookie, profilo, matching, telemetria, community, chat, notifiche, media/upload, AI e stream persistenti. Il confronto reale del Preview con la baseline del dominio, acquisito alle `2026-11-19T12:21:09Z`, ha dato zero differenze nei controlli anonimi confrontabili; restano esclusi i flussi autenticati. L’autocomparazione sul solo servizio pre-cutover alle `2026-11-19T11:13:12Z` era una verifica del comparatore, non un gate. In base al piano vincolante non si può pubblicare finché il Gate 1 non è PASS.

## Candidate e validazioni

Il candidate è stato validato localmente e isolatamente; questo non sostituisce un test live su Cloudflare:

- Sintassi Worker e configurazione Wrangler: PASS.
- Harness locale delle rotte: **30/30 PASS**; include priorità API, forwarding di headers/cookie/query, path SSE/WebSocket, R2, asset statici, header di sicurezza, Range/validator/HEAD verso Railway, rifiuto di path/metodi non mappati e configurazione origin mancante. È versionato e ripetibile con `npm run test:routing` dalla directory del Worker.
- Audit SEO statico: 18 pagine, 19 URL in sitemap, zero problemi rilevati per canonical, robots, noindex e hostname BikerTest.
- Preview remoto verificato: [`API_PREVIEW_REPORT.md`](docs/cloudflare-migration/API_PREVIEW_REPORT.md) e [`API_PREVIEW.json`](docs/cloudflare-migration/API_PREVIEW.json). La suite ha dato 37/37 PASS sul Preview e il confronto automatico con la baseline pre-cutover ha rilevato zero differenze nei test confrontabili.
- Smoke test Playwright desktop 1365×900 e Pixel 7 emulato 412 px: homepage, navigazione Matching/Blog, immagini R2 13/13, menu mobile, canonical/robots e zero errori console; nessun metodo di scrittura eseguito. Non è stato usato un dispositivo Android fisico.
- Preparazione del deploy nell’ambiente attivato il 19 novembre 2026: Wrangler `4.165.0` installato e fissato come dipendenza dev con lockfile in `workers/bikerlink-website-production/`; `npm run dry-run` PASS, legge 37 file statici e risolve i binding `SITE_ASSETS`, `ASSETS` e `RAILWAY_ORIGIN`. La procedura Preview è documentata in [`workers/bikerlink-website-production/DEPLOYMENT.md`](workers/bikerlink-website-production/DEPLOYMENT.md).
- Wrangler `4.165.0` è autenticato tramite OAuth Device con scope limitati (`account:read`, `user:read`, `workers_scripts:write`, `workers_routes:write`, `zone:read`); il token resta fuori dal repository. Non è stato necessario usare Workers Builds o trasferire JWT al connettore Cloudflare.

La route di verifica è un Preview Workers separato su `workers.dev`; il Worker candidate non è stato promosso a production. **Gate 2 e Gate 3: NOT RUN** e non esistono `API_AFTER.json` o risultati post-cutover, perché non c’è stata pubblicazione.

## GitHub e CI

- Repository: `Andreamasteri/bikerWeb`.
- Branch: `codex/bikerweb-cloudflare-production-20261119`.
- Base verificata: `main` a `7827790d7f26c8060319e29772d073160fd23af0`.
- Commit del branch salvati: `5566301` (preparazione Worker), `b794c62` (routing), `8c8a95d` (report e gate) e `cabd098` (baseline API estesa a 37 prove); push verificato sul branch remoto alla verifica conclusiva.
- PR #1: `https://github.com/Andreamasteri/bikerWeb/pull/1`, aperta, draft, non merged. Il commit puntato dal branch remoto è verificato nel riepilogo finale e nella PR.
- Il repository non contiene workflow `.github/workflows`; nessun check CI è stato generato. Nessun commit o deploy backend è stato eseguito.

## Pubblicazione e decisione

Nessun record DNS, Worker BikerTest, servizio Railway, database, servizio matching/telemetria o email è stato modificato. È stato creato soltanto il Preview del branch su `workers.dev`, senza route apex; il frontend ufficiale è ancora su Railway e le API sono operative.

Il Preview anonimo è pronto e verificato. Per Gate 1 serve ancora un backend/account sandbox isolato per i flussi autenticati non distruttivi (l’origine attuale è Railway production; non effettuerò scritture sul database live). Il cambio DNS e il deploy production restano bloccati finché quei controlli non sono PASS. Nessuna credenziale deve essere inviata in chat.
