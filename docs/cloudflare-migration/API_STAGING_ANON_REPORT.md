# Smoke anonimo Railway staging

Acquisito il 19 novembre 2026 alle 17:31:27Z contro https://bikerlink-staging-staging.up.railway.app. Revisione backend cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374.

- Suite da 38 controlli read-only: 31 PASS, 7 FAIL; mediana 184,5 ms.
- Health e readiness: HTTP 200. Le API protette rifiutano correttamente le richieste anonime; handshake SSE/WebSocket senza sessione.
- I 7 FAIL sono tutti preflight CORS: OPTIONS HTTP 200 ma senza ACAO/credentials per Origin https://biker-link.net. Una matrice aggiuntiva ha confermato che lo staging non autorizza neanche https://bikertest.biker-link.net.
- Due preflight separati (login/register) con Origin https://bikerlink-staging-staging.up.railway.app hanno restituito ACAO esatto, allow-credentials=true, metodi GET/POST/PUT/DELETE/OPTIONS e header Content-Type/Authorization.
- Non sono state inviate credenziali, richieste applicative write, upload, SOS o notifiche. Nessun DB è stato letto o scritto direttamente.

Al momento di questa acquisizione il target DB non era ancora confermato dall’operatore. In seguito, il comando Railway eseguito con `--environment staging --service Bikerlink-Staging` ha mostrato l’host `postgres.railway.internal`, corrispondente al Postgres dello stesso environment. Il flusso admin staging login/session/logout è documentato in [`API_AUTH_STAGING_REPORT.md`](API_AUTH_STAGING_REPORT.md).

Questa suite non completa Gate 1: i 7 preflight con origine production sono rifiutati dalla policy CORS dello staging e non sono una verifica autenticata. I controlli CORS production passati e le acquisizioni API aggiornate sono documentati in [`API_PREVIEW_REPORT.md`](API_PREVIEW_REPORT.md) e [`API_GATE1_CURRENT_REPORT.md`](API_GATE1_CURRENT_REPORT.md).
