# API_BEFORE — baseline corrente prima del cutover

- Acquisizione: `2026-11-20T12:00:19Z` UTC.
- Revisione backend osservata su apex, Railway e Worker Preview: `579c84d85a436f3fde485625294560e6be977d8b`.
- Evidenza completa: [`API_BEFORE.json`](API_BEFORE.json); probe ripetibile con [`api_probe.py`](../../scripts/cloudflare-migration/api_probe.py).
- Preview isolato: <https://codex-bikerweb-visitor-tracking-pr-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev>, senza dominio custom o trigger apex.
- 38 controlli anonimi per destinazione, solo GET, HEAD, OPTIONS e handshake WebSocket. Tutti i target hanno 38/38 PASS.

| Destinazione | PASS | FAIL | Mediana | Revisione |
| --- | ---: | ---: | ---: | --- |
| Dominio apex | 38/38 | 0 | 144,5 ms | `579c84d85a436f3fde485625294560e6be977d8b` |
| Origine Railway | 38/38 | 0 | 180 ms | `579c84d85a436f3fde485625294560e6be977d8b` |
| Worker Preview | 38/38 | 0 | 189,5 ms | `579c84d85a436f3fde485625294560e6be977d8b` |

## Copertura

- Health e readiness; auth session, profilo, chat, notifiche, AI config, download/config app e statistiche community.
- Pagina BikerBlog `GET /blog`, canonical e hostname Railway.
- Sette CORS preflight (`register`, `login`, SOS, chat, telemetria, foto e upload media).
- Undici HEAD su pagine, redirect e asset; redirect privacy, planner e APK; SSE anonimi e due handshake WebSocket anonimi.
- Immagine R2: risposta 200 con SHA-256; `If-None-Match` e `If-Modified-Since` 304, Range 206 e `If-Range` obsoleto 200.

## Confronto e limiti

Il confronto con la baseline immediatamente precedente al fix `bl_vid` ha rilevato cinque differenze limitate alle risposte statiche `/blog` e `/contact`: `text/html` senza il charset esplicito e le intestazioni cache Static Assets (`public, max-age=0, must-revalidate`). Tutti i 38 controlli hanno comunque status/schema attesi. Non sono emersi nuovi 404 o 500; l’API e i corpi delle risposte restano coerenti. Il confronto e i tempi sono registrati in [`API_PRECUTOVER_COMPARE_20261120.json`](API_PRECUTOVER_COMPARE_20261120.json); i risultati completi sono in `API_BEFORE.json`.

Il preview usa `.workers.dev` e non imposta `bl_vid` né inoltra visite al backend production, così le richieste di verifica non scrivono dati analytics production. Il comportamento cookie e l’inoltro al middleware staging sono stati verificati separatamente sul Worker Gate 1: [`STATIC_VISITOR_TRACKING_STAGING.json`](STATIC_VISITOR_TRACKING_STAGING.json). La risposta pubblica apex, prima del cutover, continua a impostare il cookie come Railway.

La suite anonima non sostituisce la prova autenticata. Le verifiche separate 19/19 del Worker staging, inclusi autenticazione, SSE session-events, WebSocket notifiche e POST invalidate, sono in [`API_GATE1_CURRENT_REPORT.md`](API_GATE1_CURRENT_REPORT.md). La Chat SSE autenticata non è stata aperta live perché il backend può inviare eventi di presenza; la route è verificata nel proxy/harness.

La baseline storica del 19 novembre (`aedfb278f487105a10567c9efa4c090705b3d801`) è conservata in [`API_BEFORE_20261119.json`](API_BEFORE_20261119.json). Gate 2 e Gate 3 restano NOT RUN finché non avviene il cutover.
