# Gate 1 isolated Chat SSE probe from PowerShell

This probe runs Node directly on the operator's Windows machine. It sends HTTP
requests only to the disposable Worker
`bikerlink-chat-sse-isolation-20261120` and its dedicated Railway backend; it
does not use Chrome, DevTools, or the Codex web runtime. It does not call
staging or production.

The probe creates one random disposable account in the isolated Gate 1 test
database, confirms its authenticated session and zero conversations, and only
then opens `/api/chat/stream`. Before the public stream check, it asks the
candidate Worker to make an internal authenticated request, confirm zero
conversations, and read only the first SSE chunk. This distinguishes delayed
Railway subrequest headers/chunks from delayed Worker-to-client delivery. It
logs out afterward. The disposable user row
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
0, and both `chat_sse.direct_railway` and `chat_sse.via_candidate_worker` report
status 200, `text/event-stream`, and `connected_event: true`. `all_pass`
requires the isolated candidate Worker's stream to pass. The
`worker_internal_diagnostic` result reports only whether the candidate Worker
received response headers and the first `connected` frame, with timings and
safe response metadata. The candidate Worker is restricted to Chat SSE `GET`
and an authenticated diagnostic path, and adds `Cache-Control: no-store,
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

Alle 18:57:28Z il candidato è stato aggiornato con la direttiva
`Cache-Control: no-transform` anche sulla richiesta upstream SSE, oltre che
sulla risposta; deployment `9f810119140042e3a3d9ba3e752057a1`. La route senza
cookie continua a restituire 401. Il routing locale aggiornato passa 95
controlli; serve un nuovo confronto autenticato per stabilire se il buffering è
risolto.

Il backend applica un limite di registrazione di 3 tentativi per ora per
indirizzo client; la prova delle 18:53Z è comunque stata accettata. Se un probe
successivo restituisce HTTP 429, fermarsi e attendere la scadenza del limite
prima di riprovare. Ogni esecuzione valida confronta Railway diretto e il
Worker candidato autenticato; logout viene eseguito alla fine.

## Diagnostica Worker dopo il risultato delle 19:00Z

La prova del 20 novembre alle 19:00Z ha confermato nuovamente Railway diretto
PASS (SSE in 1.117 ms) e Worker candidato FAIL (abort del client a 15.007 s).
Il log Railway mostra il 200 via Worker solo dopo circa 14.6 s, all'abort del
client. Il candidato isolato è stato aggiornato con una diagnostica
`GET /__diag/chat-sse`: dopo aver verificato autenticazione e zero conversazioni,
esegue una `fetch` Worker diretta e minimale verso Railway (senza il proxy
generale, gli header forwarded o la ricostruzione della Response), misurando
header e primo evento `connected`. Questo separa il comportamento base delle
fetch in Workers dai dettagli del proxy del sito.
La risposta contiene solo status, content type, header cache/encoding, latenze,
booleani ed eventuale classe dell'errore. Il proxy inoltra il segnale di abort
al subrequest per chiudere connessioni interrotte. Non sono stati modificati
DNS, backend Railway o Worker ufficiale. Gate 1 resta bloccato fino al risultato
di questo confronto.

Il primo deployment diagnostico era
`bikerlink-chat-sse-gate1-isolated-20261120`, deployment
`14a1da83-5a97-4c4c-af6c-c27e4f9e63d2`, versione
`4eb850e4-df11-4edf-afb1-343dcc0f6465`; binding confermato verso il solo
backend Railway isolato. La route diagnostica è chiamata direttamente su
questo candidato, non sul Worker usato per creare la sessione di test.

## Risultato delle 19:12Z e prova raw in attesa

Il run delle 19:12:28Z ha superato registrazione (201), auth (200), sessione,
conversazioni vuote e logout (200). Railway diretto ha ricevuto l'evento SSE
`connected` in 1.102 ms. La diagnosi precedente via `worker.fetch` è scaduta
prima degli header dopo 8.550 ms; la chiamata pubblica al candidato è scaduta a
15.009 s. I log HTTP Railway registrano il 200 della diagnosi dopo 7.996 ms e
quello del candidato dopo 14.970 s, in corrispondenza degli abort del client.

La nuova versione diagnostica esegue invece una `fetch` Worker minimale
direttamente all'origine Railway isolata, mantenendo solo cookie, Accept SSE e
Accept-Encoding identity. È stata pubblicata alle 19:20:30Z come deployment
`ccad2b1d-b77e-43d4-b5de-d95afdc803db`, versione
`cc27009f-f9a9-4101-8475-b6832b7238b2`; binding API verificato sul backend usa e
getta. Il source è stato pushato su GitHub, ma il nuovo test autenticato non è
ancora stato eseguito. Gate 1 resta BLOCKED.

Il probe successivo, alle 19:25:07Z, ha ricevuto `POST /api/auth/register`
HTTP 429 e si è fermato prima di creare una sessione o aprire SSE. I log HTTP
Railway in sola lettura confermano 429 alle 19:25:10Z e tre registrazioni
accettate dallo stesso IP: 18:53:34Z, 19:00:03Z e 19:12:32Z. La route
staging applica `max: 3` su `windowMs: 3.600.000`; il quarto tentativo è stato
respinto dal limiter. Nessun altro tentativo è stato eseguito. Non rilanciare
il probe durante questa finestra; il riferimento più sicuro per un'eventuale
prova successiva è dopo le 19:54Z. L'errore è un limite di registrazione
isolato, non un nuovo risultato SSE; il test raw resta in attesa e Gate 1 è
ancora BLOCKED.

## Confronto delle due rotte SSE

Il probe confronta nella stessa sessione usa e getta `/api/chat/stream` e
`/api/auth/session-events`, prima direttamente con il Railway isolato e poi
attraverso il Worker candidato isolato. Prima di aprire Chat SSE verifica che
l’account non abbia conversazioni. Per entrambe le rotte registra status,
header di trasporto selezionati, tempo fino agli header e al primo chunk, e il
nome del primo evento, senza salvare cookie o contenuto degli eventi.

Il Worker candidato accetta soltanto `GET` su queste due rotte SSE. Il test
locale verifica inoltre che gli altri percorsi, inclusa la registrazione,
restino negati dal Worker candidato. Il test online deve essere eseguito solo
contro il backend usa e getta configurato nel binding `RAILWAY_ORIGIN`.

## Diagnosi comparativa SSE — 20 novembre 2026, 20:51 UTC

Il probe Node sul Worker isolato, con una sola sessione autenticata usa e
getta, ha superato registrazione (201), `/api/auth/me` (200), zero conversazioni
e logout (200). La Chat SSE diretta al Railway isolato ha restituito `200`,
`text/event-stream` ed evento `connected` dopo 1.06–1.61 s. La stessa Chat via
Worker è scaduta a 15 s prima degli header; la `fetch` raw dal Worker è scaduta
a 9.27 s senza header. Il controllo raw è stato ripetuto dopo la correzione del
riferimento alla rotta e ha restituito `AbortError`, quindi il risultato non è
un errore della diagnostica.

Nella stessa sessione `/api/auth/session-events` ha restituito `200`,
`text/event-stream` e `connected` sia direttamente (1.14 s) sia tramite Worker
(0.47 s). Il Worker candidato, quindi, riesce a inoltrare una SSE autenticata
verso lo stesso backend isolato.

Le risposte dirette differiscono negli header: Chat ha `Cache-Control: no-cache`
e `Vary: Accept-Encoding`; la SSE di sessione ha `Cache-Control: no-store,
no-transform` e nessun `Vary`. Il sorgente backend alla revisione distribuita
`cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374` mostra middleware globale
`compression()`. La route di sessione commenta che imposta `no-transform` per
saltare compressione e trasformazioni proxy; la route Chat chiama
`flushHeaders()` e scrive `connected`, ma non imposta quella direttiva. Le
prove indicano dunque un problema specifico nella risposta Chat lungo il
percorso origin/proxy, associato al comportamento di compressione/trasformazione;
non un limite del piano Cloudflare né un guasto generale dello streaming Worker.

Non ho modificato backend o database. Per il vincolo operativo del task, il
cutover resta BLOCKED: la correzione da valutare è esclusivamente di trasporto
sulla risposta Chat SSE (allineare le direttive `no-store, no-transform` e
verificare il flush), ma va trattata nel checkout e nel flusso di rilascio del
backend, con test staging prima del nuovo probe. Nessun DNS, Worker production,
BikerTest o servizio Railway è stato modificato. Il Worker di prova rimane
`workers.dev` only e punta al backend usa e getta.

## Risoluzione e probe riuscito — 20 novembre 2026, 22:47 UTC

Dopo il merge del fix backend no-transform, il probe Node è stato eseguito dal runner Forge sul solo ambiente Railway isolato Bikerlink-SSE-Test-20261120, deployment 450b1998-9aef-4b18-9adf-8aabcabe0cb9, revision e8a5f4f24256d9da017e4a3d211a79d5e5725a2b.

Risultato: registrazione 201; /api/auth/me 200; conversazioni 0; Chat SSE diretta Railway 200 e connected al primo chunk in 1.081 ms; diagnostica worker.fetch 200 e connected in 43 ms; percorso pubblico del Worker candidato 200 e connected al primo chunk in 97 ms. Session SSE diretta 200/1.102 ms e via Worker 200/442 ms; logout 200; all_pass=true. L’header diretto era no-cache, no-transform; la risposta del Worker era no-store, no-transform, entrambe senza Content-Encoding. Nessun cookie, token, account, conversazione o corpo applicativo è incluso nel risultato. L’account usa e getta è rimasto solo nel database di test e ha zero conversazioni.

Il probe mostra che il buffering era a monte del Worker, associato alla compressione globale Express: no-transform sulla risposta Chat impedisce che i piccoli frame restino bufferizzati. Il risultato live non supporta un upgrade Cloudflare.

Evidenza JSON: [GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json](GATE1_CHAT_SSE_TRANSPORT_RESULT_20261120.json). Il test è limitato al backend e Worker isolati; non è il rerun completo del Gate 1 sul Worker ufficiale.
