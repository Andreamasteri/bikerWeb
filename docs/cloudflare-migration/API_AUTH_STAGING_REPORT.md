# Autenticazione BikerLink staging

Acquisito il 19 novembre 2026 contro `https://bikerlink-staging-staging.up.railway.app`, deployment Railway `cb72516b-3224-4dbf-a103-28bb5ed06063`, revisione `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`.

## Esito

- La CLI dell’operatore, eseguita con `--environment staging --service Bikerlink-Staging`, ha mostrato l’host effettivo di `DATABASE_URL_CANDIDATE`: `postgres.railway.internal`. Railway conferma un servizio `Postgres` nello stesso environment staging con volume da 500 MB. La rete privata Railway è isolata per progetto e environment. L’host DB candidato è quindi verificato come staging.
- La credenziale admin corrente, letta dal vault sicuro senza registrare il valore, ha superato il verificatore production `POST /api/auth/staging-admin-verify` con HTTP 204.
- Con quella credenziale il login reale sul servizio staging ha risposto HTTP 200 (`role=admin`); la richiesta autenticata `GET /api/auth/me` ha risposto 200 e `POST /api/auth/logout` 200.
- Nessun account è stato creato. La sessione staging è stata subito distrutta. Il normale login ha eseguito il proprio bookkeeping sull’account staging; non sono state scritte credenziali, token o cookie in questo report. Il verificatore production è read-only e non ha scritto sul database production.
- Il codice staging autentica l’admin delegando la verifica delle credenziali a production; gli account ordinari non possono completare il login staging. Per questo preflight e smoke test devono usare la credenziale admin autorizzata, senza crearne una nuova.

## Causa del 401 del preflight

Nei log Railway, il preflight ha ottenuto 401 dal verificatore production e dal login staging; la richiesta a `/api/admin/infrastructure-health` ha ricevuto `401 reason=no-session`. Nello stesso intervallo, la credenziale admin canonica ha ottenuto 204 dal verificatore e il normale flusso staging ha creato una sessione valida.

Il preflight fisso invia quindi un identificativo o una password diversa dalla coppia BikerLink accettata; il runner non espone i campi inviati, perciò non è possibile distinguere quale dei due differisca. È un falso negativo del consumer di preflight, non un guasto del login/sessione BikerLink.

## Stato Gate 1

La verifica DB e il percorso login/sessione sono ora confermati. Gate 1 resta **BLOCKED** finché non viene ripetuta la copertura autenticata richiesta per i percorsi critici (matching, telemetria, chat/notifiche, upload, SSE/WebSocket e gli altri endpoint applicabili). Questo report non equivale a un PASS complessivo del Gate 1.
