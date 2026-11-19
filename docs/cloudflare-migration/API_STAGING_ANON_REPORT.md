# Smoke anonimo Railway staging

Acquisito il 19 novembre 2026 alle 17:31:27Z contro https://bikerlink-staging-staging.up.railway.app. Revisione backend cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374.

- Suite da 38 controlli read-only: 31 PASS, 7 FAIL; mediana 184,5 ms.
- Health e readiness: HTTP 200. Le API protette rifiutano correttamente le richieste anonime; handshake SSE/WebSocket senza sessione.
- I 7 FAIL sono tutti preflight CORS: OPTIONS HTTP 200 ma senza ACAO/credentials per Origin https://biker-link.net. Una matrice aggiuntiva ha confermato che lo staging non autorizza neanche https://bikertest.biker-link.net.
- Due preflight separati (login/register) con Origin https://bikerlink-staging-staging.up.railway.app hanno restituito ACAO esatto, allow-credentials=true, metodi GET/POST/PUT/DELETE/OPTIONS e header Content-Type/Authorization.
- Non sono state inviate credenziali, richieste applicative write, upload, SOS o notifiche. Nessun DB è stato letto o scritto direttamente.

Il codice del commit staging seleziona DATABASE_URL_CANDIDATE per BIKERLINK_DEPLOY_ENV=staging. Railway ha un servizio Postgres separato nell’environment staging, con volume 500 MB; i valori Railway non sono leggibili via OAuth MCP, quindi il fatto che il candidato punti proprio a quel DB isolato non è provato.

Questa suite non completa Gate 1: manca una sessione autorizzata e la verifica del target DB. I 7 preflight staging non sono confrontabili con la baseline production, che ammette l’origine production e ha passato 7/7 test CORS nella suite API_PREVIEW.
