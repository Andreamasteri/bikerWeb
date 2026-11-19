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

Il login admin, `GET /api/auth/me` e logout sullo staging sono stati verificati in precedenza; la sessione è stata distrutta e l’host del database candidato è stato attestato come staging. I dettagli sono in [`API_AUTH_STAGING_REPORT.md`](API_AUTH_STAGING_REPORT.md). Questo prova il flusso di sessione, non tutti gli endpoint autenticati.

Non ho potuto ripetere i controlli autenticati in questa sessione: il connettore vault ha rifiutato i selettori esatti (`vault_selector_rejected`); la successiva richiesta di lettura senza selettore è stata respinta dal controllo automatico perché avrebbe lasciato indefinito l’ambito dei dati. Nessun segreto è stato restituito o registrato e non ho usato altri strumenti per recuperarlo.

Restano da verificare con una sessione staging autorizzata i percorsi autenticati di matching, telemetria, chat/notifiche, upload, SOS e SSE/WebSocket. Per gli endpoint con effetti va usata solo la modalità smoke controllata prevista dal backend; niente SOS reali, notifiche o comunicazioni esterne.

**Gate 1 resta BLOCKED.** Le 38 prove anonime passano e non mostrano regressioni API, ma non sostituiscono la suite autenticata. Nessun DNS, Worker BikerTest, backend, variabile o database è stato modificato durante queste acquisizioni.
