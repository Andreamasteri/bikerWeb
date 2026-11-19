# API_BEFORE — baseline BikerLink prima del cutover

- Acquisizione: `2026-11-19T13:03:15Z` UTC.
- Origini: `https://biker-link.net` e `https://bikerlink-production.up.railway.app`.
- Revisione backend su entrambe: `aedfb278f487105a10567c9efa4c090705b3d801`.
- Evidenza completa: [`API_BEFORE.json`](API_BEFORE.json); probe ripetibile con [`api_probe.py`](../../scripts/cloudflare-migration/api_probe.py).
- 38 controlli per destinazione, solo GET, HEAD, OPTIONS e handshake WebSocket anonimi. Nessun login, POST applicativo, upload, SOS, notifica o callback.

| Destinazione | PASS | FAIL | Mediana |
| --- | ---: | ---: | ---: |
| Dominio apex | 38/38 | 0 | 148 ms |
| Origine Railway | 38/38 | 0 | 182,5 ms |

## Copertura

- Health e readiness; auth session, profilo, chat, notifiche, AI config, download/config app e statistiche community.
- Pagina BikerBlog `GET /blog`, inclusi canonical e presenza dell'hostname Railway.
- Sette CORS preflight (`register`, `login`, SOS, chat, telemetria, foto e upload media): 200, `Access-Control-Allow-Origin: https://biker-link.net`, credenziali abilitate e header/metodi attesi.
- Undici HEAD su pagine, redirect e asset; redirect privacy, planner e APK; due handshake WebSocket anonimi (401); SSE anonimi (401).
- Immagine R2: risposta completa 200, 337.534 byte, hash SHA-256 registrato nel JSON; `If-None-Match` e `If-Modified-Since` 304, Range 206 di 16 byte e `If-Range` obsoleto 200.

Il canonical di `/blog` sul dominio apex è `https://biker-link.net/blog`; sull’hostname Railway diretto è `https://bikerlink-production.up.railway.app/blog`. Questa differenza è attesa prima del cutover e va corretta nel proxy HTML, senza riscrivere API o JSON.

## Limiti e gate

Le API protette hanno restituito i 401 anonimi attesi; non è stato usato un cookie di sessione valido. Gli stream SSE/WebSocket sono stati verificati solo nella risposta anonima. I preflight CORS non equivalgono a prove di upload o di scrittura.

**Gate 1: BLOCKED, non PASS.** Mancano prove con un’identità di test autorizzata per sessioni/cookie, matching, telemetria autenticata, chat/notifiche, media, AI e stream persistenti. Non sono state eseguite scritture su database; il cutover resta vietato finché non si chiude questo gate.
