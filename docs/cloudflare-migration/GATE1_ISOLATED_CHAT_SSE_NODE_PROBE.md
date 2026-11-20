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
