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

**Gate 1 resta BLOCKED.** La baseline anonima e la copertura autenticata read-only staging passano; mancano prove sul percorso autenticato Cloudflare e alcuni percorsi persistenti o con effetti. Non eseguire il cutover prima di chiudere questi punti.
