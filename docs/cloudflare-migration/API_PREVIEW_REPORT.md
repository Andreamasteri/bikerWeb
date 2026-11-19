# Verifica del Worker Preview Cloudflare

- Preview URL: <https://codex-bikerweb-cloudflare-producti-bikerlink-website-production.andreamasteri-nadir-radio.workers.dev>
- Preview ID: `fa7a694ccc584f439a2cef32f65be791`.
- Deployment verificato: `bf714146-cf10-4b69-8b4a-b254ca82303b` (versione 2, 2026-11-19 12:20:45 UTC).
- Sorgente: branch `codex/bikerweb-cloudflare-production-20261119`; nessun custom domain, route apex o deployment production creato.
- Origine API: Railway production `bikerlink-production.up.railway.app`, revisione `aedfb278f487105a10567c9efa4c090705b3d801`. Le verifiche hanno eseguito solo GET, HEAD, OPTIONS e handshake WebSocket anonimi.
- JSON dettagliato: [`API_PREVIEW.json`](API_PREVIEW.json); baseline pre-cutover: [`API_BEFORE.json`](API_BEFORE.json).

## Suite API e confronto

Acquisizione `API_PREVIEW.json`: `2026-11-19T12:21:09Z`.

| Target | Prove | PASS | FAIL | Mediana | Revisione backend |
| --- | ---: | ---: | ---: | ---: | --- |
| Preview Cloudflare | 37 | 37 | 0 | 178 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Dominio apex pre-cutover | 37 | 37 | 0 | 134 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Origine Railway | 37 | 37 | 0 | 187 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

Il confronto automatico Preview → baseline pubblico ha rilevato **0 differenze** nei percorsi API, CORS, redirect applicativi, immagini e handshake WebSocket. Il confronto esclude le sei HEAD delle pagine statiche (`/blog`, `/contact`, `/accedi`, favicon, Leaflet e roadmap) perché quelle risorse passano deliberatamente a Workers Static Assets; le rispettive risposte mantengono comunque i codici attesi nella suite. Il confronto ignora `Content-Length` solo quando dimensione e SHA-256 del body sono identici. Per la sola GET immagine semplice ignora ETag e Last-Modified perché R2 genera validator propri; HEAD, Range e `If-*` restano inoltrati a Railway e confrontati.

La suite copre health/readiness, rifiuto anonimo di API protette, risposte di configurazione/community, CORS preflight, redirect, asset, hash completo dell’immagine, `If-None-Match`/`If-Modified-Since` (304), Range (206/16 byte), `If-Range` obsoleto (200) e due handshake WebSocket anonimi (401). Nessun login, scrittura, upload, SOS, notifica o callback è stato eseguito. I WebSocket/SSE autenticati non sono provati.

## Smoke test browser

Playwright con Chromium ha caricato la homepage del Preview sia a 1365×900 desktop sia in emulazione Pixel 7 a 412 px:

- HTTP 200; titolo `BikerLink Motorcycle Magazine`; canonical `https://biker-link.net/`; meta robots `index,follow`. La risposta del Preview porta inoltre `X-Robots-Tag: noindex` per non indicizzare l’hostname temporaneo.
- Nessun overflow orizzontale: larghezza contenuto 1365/1365 desktop e 412/412 mobile.
- Tutte le 13 istanze immagine della homepage hanno caricato con larghezza naturale positiva; nessun errore JavaScript/console.
- Menu mobile `details/summary` aperto e link Matching attivato; `/matching` ha restituito 200. `/blog` ha restituito 200 con titolo `Blog BikerLink — Strade, community e vita in moto`.
- Il browser ha consentito solo GET/HEAD/OPTIONS; zero metodi di scrittura sono stati tentati.

Il controllo mobile è emulazione Pixel 7, non un dispositivo Android fisico. Non sono state provate autenticazione, cookie/sessioni, streaming autenticati, form o operazioni di scrittura.

## Esito dei gate

Questo Preview dimostra rendering, asset R2 e routing anonimo sul runtime Cloudflare. **Non sblocca Gate 1**: manca un backend/account sandbox isolato per le verifiche autenticate non distruttive. L’origine attuale è Railway production e non sono state eseguite scritture sul suo database. Gate 2 e Gate 3 restano **NOT RUN**; il dominio ufficiale non è stato pubblicato sul Worker.

Durante la prima sonda il filtro Cloudflare dei Workers.dev ha risposto con errore 1010 al User-Agent predefinito di Python. Il probe ripetuto con User-Agent `curl/8.0` e il browser Chromium hanno raggiunto il Preview correttamente; i risultati registrati nel JSON sono quelli della ripetizione riuscita.
