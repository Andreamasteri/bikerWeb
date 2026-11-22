# API_BEFORE — baseline corrente pre-cutover

- Acquisizione: 2026-11-22T15:28:51Z UTC.
- Revisione backend: 6ad354ff2af155929549c6d15ddc6c100f6a740b sia sull’apice sia sull’origine Railway; /api/health è READY e degraded=false.
- Il record apex è ancora DNS-only verso Railway. Questi risultati sono la baseline prima dell’attivazione del Worker production.
- Evidenza completa: API_BEFORE.json. Probe: scripts/cloudflare-migration/api_probe.py.

| Destinazione | PASS | FAIL | Mediana | Revisione |
| --- | ---: | ---: | ---: | --- |
| https://biker-link.net | 38/38 | 0 | 72 ms | 6ad354ff2af155929549c6d15ddc6c100f6a740b |
| https://bikerlink-production.up.railway.app | 38/38 | 0 | 1099.5 ms | 6ad354ff2af155929549c6d15ddc6c100f6a740b |

## Perimetro ed esito

Sono stati eseguiti 76 controlli in sola lettura: GET, HEAD, OPTIONS e handshake WebSocket anonimi. Comprendono health/readiness, sessione e profilo non autenticati, chat e Chat SSE anonime, session SSE anonima, notifiche, configurazione AI/app, community, redirect e pagine web, CORS preflight per endpoint critici, HEAD/range/validator delle immagini R2 e handshake WebSocket. I codici 401 sui percorsi autenticati sono attesi in assenza di sessione. Non sono stati inviati login, registrazioni, upload, messaggi, SOS, notifiche o callback.

Tutti i controlli correnti sono PASS: nessun 404/500 o risposta HTML al posto di JSON sulle API controllate. La latenza differisce perché l’apice e Railway sono stati sondati da Forge in condizioni diverse; i due target restituiscono la stessa revision e gli stessi contratti API. La pagina /blog mostra canonical coerente con il dominio richiesto sull’apice (https://biker-link.net/blog) e canonical Railway quando interrogata direttamente sull’hostname Railway; questa differenza host-specifica è attesa.

Il confronto storico allegato in API_BEFORE.json usa API_BEFORE_20261119.json (revision aedfb278f487105a10567c9efa4c090705b3d801). Ha registrato 26 variazioni di campo: 2 sullo schema health (solo la revision), 20 sugli header, 2 sugli hash del body health e 2 sulla revision backend. Sono variazioni rispetto a quel rilascio precedente, incluse la revision/risposta health, i validator e gli ETag delle risorse R2 aggiornate e l’header Connection degli handshake; non sono errori dei 76 controlli attuali né regressioni introdotte dal cutover, che non è ancora avvenuto.

La baseline è anonima. Non prova sessioni autenticate o Chat SSE autenticata sul Worker Gate 1 corrente: queste verifiche sono riportate separatamente in API_GATE1_CURRENT_REPORT.md e devono essere ripetute prima del cutover.
