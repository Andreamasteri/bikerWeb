# Gate 1 isolated Chat SSE probe from PowerShell

This probe runs Node directly on the operator's Windows machine. It sends HTTP
requests only to the disposable Worker
`bikerlink-chat-sse-isolation-20261120` and its dedicated Railway backend; it
does not use Chrome, DevTools, or the Codex web runtime. It does not call
staging or production.

The probe creates one random disposable account in the isolated Gate 1 test
database, confirms its authenticated session and zero conversations, and only
then opens `/api/chat/stream`. It logs out afterward. The disposable user row
remains in that isolated test database; do not reuse this probe against another
environment. It prints status, content type, latency, and pass/fail only. It
never prints the generated email, password, session cookie, or response bodies.
If the conversation preflight is not exactly an empty JSON array, it skips SSE.

## Run

Use a regular PowerShell window, in a clean clone of the active branch. Node.js
20.18 or newer is required for safe handling of the session cookie:

```powershell
git switch codex/bikerweb-isolated-chat-sse-gate1-20261120
git pull --ff-only
node --version
node .\scripts\cloudflare-migration\gate1-isolated-sse-node-probe.mjs
```

Send back only the line beginning `GATE1_ISOLATED_CHAT_SSE_RESULT`. If Node
reports a timeout, `403`, or Cloudflare block, stop there. Do not retry with a
spoofed browser identity or otherwise attempt to evade Cloudflare controls.

## Expected passing evidence

`registration.status` is 201, `auth_me.status` is 200, `conversations.count` is
0, and both `chat_sse.direct_railway` and `chat_sse.via_candidate_worker` report status
200, `text/event-stream`, and `connected_event: true`. `all_pass` requires the
isolated candidate Worker's stream to pass. The direct Railway result isolates
any Worker forwarding delay. The candidate Worker is restricted to the
authenticated Chat SSE `GET` path and adds `Cache-Control: no-store,
no-transform` to SSE responses. The Worker root may return 404; that is
expected and unrelated because this probe requests API paths.

This is a diagnostic of the isolated Railway-origin stream through the
temporary Cloudflare Worker. It does not itself authorize or perform production
DNS changes.

## Esito dell'esecuzione Windows del 20 novembre 2026

Con Node `v22.23.1`, il probe ha ricevuto HTTP 403 su `POST /api/auth/register`
e si è fermato prima di autenticazione e Chat SSE. I log HTTP Railway
confermano che la richiesta ha raggiunto il backend isolato; il log applicativo
riporta `Registrazione non consentita` e il blocco della creazione dell'account
smoke. Non è un errore di connessione né una prova sul percorso SSE.

Lo stesso database isolato aveva già accettato un account usa e getta da una
precedente prova browser. La causa del 403 è stata individuata nel probe: usava
il suffisso esadecimale anche nel nickname (`smoke` seguito da lettere e cifre),
mentre il backend alla revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`
richiede per l'identità smoke un nickname `smoke` seguito da almeno sei sole
cifre. La validazione è stata corretta nel probe Node. Non sono stati aggiunti
header `Origin` o identità browser falsificati; il controllo e il token smoke
restano invariati. Produzione e DNS ufficiali non sono stati toccati.

Con il nickname corretto, la prova Windows delle 18:29Z ha superato
registrazione (`201`), autenticazione (`200`), zero conversazioni e logout
(`200`). La Chat SSE via Worker è scaduta dopo 15.004 secondi senza headers.
I log Railway mostrano `/api/chat/stream` HTTP 200 terminata dopo 14.968
secondi, in corrispondenza dell'abort del client. Il probe ora confronta nella
stessa sessione lo stream sul backend Railway isolato diretto (timeout 5 s) e
quello via Worker (timeout 15 s), per localizzare il ritardo senza dati di altri
utenti. Il risultato Windows delle 18:35Z ha confermato Railway diretto PASS
(evento `connected` in 1.108 ms) e il Worker isolato originale FAIL (timeout a
15.008 s). Il risultato delle 18:53Z ha confermato Railway diretto PASS
(1.079 s) e il primo candidato FAIL (timeout 15.009 s); i log Railway mostrano
il `200` via Worker solo alla chiusura del client dopo 14.595 s. La direttiva
solo sulla risposta non ha risolto il ritardo. Il candidato è stato aggiornato
per chiedere `no-transform` anche sulla richiesta upstream SSE; la risposta
mantiene `no-store, no-transform`. Gate 1 resta bloccato in attesa di un nuovo
risultato autenticato.

Il Worker candidato è stato distribuito alle 18:48:55Z come
`bikerlink-chat-sse-gate1-isolated-20261120` (deployment
`e815f74244d740f3b24b5e7d8731b197`) esclusivamente su `workers.dev`. Accetta
solo `GET /api/chat/stream`; il root restituisce 404 e la route senza cookie
restituisce 401. La verifica HTTP non autenticata ha confermato entrambi gli
esiti. Il routing locale passa 94 controlli.

Il backend applica un limite di registrazione di 3 tentativi per ora per
indirizzo client; la prova delle 18:53Z è comunque stata accettata. Se un probe
successivo restituisce HTTP 429, fermarsi e attendere la scadenza del limite
prima di riprovare. Ogni esecuzione valida confronta Railway diretto e il
Worker candidato autenticato; logout viene eseguito alla fine.
