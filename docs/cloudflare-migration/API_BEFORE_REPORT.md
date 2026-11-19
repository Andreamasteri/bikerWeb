# API_BEFORE — baseline BikerLink prima della pubblicazione

- Acquisizione: `2026-11-19T11:00:33Z` UTC.
- Origini confrontate: `https://biker-link.net` e `https://bikerlink-production.up.railway.app`.
- Revisione attesa e ricevuta da entrambe: `aedfb278f487105a10567c9efa4c090705b3d801`.
- Suite ripetibile: [`scripts/cloudflare-migration/api_probe.py`](../../scripts/cloudflare-migration/api_probe.py). Il JSON contiene per ogni richiesta URL completo, metodo, stato atteso/osservato, schema sintetico, headers significativi, cookie e attributi senza valori, redirect e latenza.
- Richieste limitate a GET, HEAD, OPTIONS e handshake WebSocket anonimi. Nessun login, scrittura, upload, SOS, notifica o callback è stato eseguito.

## Esito complessivo

| Destinazione | Prove | PASS | FAIL | Latenza mediana | Revisione |
| --- | ---: | ---: | ---: | ---: | --- |
| Dominio pubblico apex | 32 | 32 | 0 | 137.5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Hostname origine Railway | 32 | 32 | 0 | 183.5 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

Tutti i controlli anonimi sono PASS. Questo non prova i flussi autenticati richiesti dal Gate 1.

## GET — API e servizi applicativi

| Controllo | URL | Atteso | Apex | Railway | Tipo risposta (apex) | Schema sintetico |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `health` | `/api/health` | 200 | 200 | 200 | `application/json; charset=utf-8` | `{"kind":"object","keys":["dbCircuit","degraded","degradedReasons","initializing","redisTunnel","revision","slices","state","status"],"revision":"aedfb278f487105a10567c9efa4c090705b3d801","state":"READY","degraded":false}` |
| `readiness` | `/healthz` | 200 | 200 | 200 | `text/html; charset=utf-8` | `{"kind":"non_json","bytes":2}` |
| `auth_session` | `/api/auth/me` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `profile` | `/api/users/me` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `chat` | `/api/chat/conversations` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `chat_sse` | `/api/chat/stream` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `session_sse` | `/api/auth/session-events` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `notifications` | `/api/notifications` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `ai_config` | `/api/ai/assistant/config` | 401 | 401 | 401 | `application/json; charset=utf-8` | `{"kind":"object","keys":["message","success"]}` |
| `apk_status` | `/api/download/apk/status` | 200 | 200 | 200 | `application/json; charset=utf-8` | `{"kind":"object","keys":["available"]}` |
| `app_config` | `/api/config` | 200 | 200 | 200 | `application/json; charset=utf-8` | `{"kind":"object","keys":["maintenance_enabled","maintenance_message","play_store_url","website_url"]}` |
| `community_stats` | `/api/community/stats` | 200 | 200 | 200 | `application/json; charset=utf-8` | `{"kind":"object","keys":["countries","total"]}` |

## CORS — preflight OPTIONS

| Controllo | URL | Apex/Railway | Allow-Origin | Credentials | Metodi | Headers richiesti |
| --- | --- | ---: | --- | --- | --- | --- |
| `cors_registration` | `/api/auth/register` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_login` | `/api/auth/login` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_sos` | `/api/sos` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_chat_write` | `/api/chat/conversations` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_telemetry_write` | `/api/telemetry/batch` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_image_upload` | `/api/users/me/photos` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_media_upload` | `/api/admin/media/upload` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |

## HEAD — pagine, redirect e asset

| Controllo | URL | Stato atteso | Apex/Railway | Location |
| --- | --- | ---: | ---: | --- |
| `head_blog` | `/blog` | 200 | 200/200 | `` |
| `head_contact` | `/contact` | 200 | 200/200 | `` |
| `head_web_login` | `/accedi` | 200 | 200/200 | `` |
| `head_web_admin_diagnostics` | `/admin/diagnostics/live` | 302 | 302/302 | `/accedi?next=/admin/diagnostics/live` |
| `head_privacy_policy_redirect` | `/privacy-policy` | 301 | 301/301 | `/privacy` |
| `head_planner_redirect` | `/pianifica` | 302 | 302/302 | `/accedi?next=/pianifica` |
| `head_apk_latest_redirect` | `/api/download/apk/latest` | 302 | 302/302 | `https://drive.google.com/uc?export=download&id=15teG0lCIWFi6YuXtcfIMPjuWcctPc5cH` |
| `head_r2_source_image` | `/assets/images/hero-forest.webp` | 200 | 200/200 | `` |
| `head_favicon` | `/favicon.png` | 200 | 200/200 | `` |
| `head_leaflet_html` | `/leaflet-map.html` | 200 | 200/200 | `` |
| `head_roadmap_json` | `/roadmap.json` | 200 | 200/200 | `` |

## WebSocket anonimi

| Controllo | URL | Atteso | Apex/Railway | Latenza apex/Railway |
| --- | --- | ---: | ---: | ---: |
| `ws_admin_notifications` | `/ws/admin/notifications` | 401 | 401/401 | 361/207 ms |
| `ws_diagnostic` | `/ws/diagnostic` | 401 | 401/401 | 151/431 ms |

Entrambi i path rispondono con `401` e chiudono la connessione quando il client non è autenticato. Non è stato stabilito un canale WebSocket autenticato.

## Limiti del Gate 1

- No authenticated user credentials or session cookie were used.
- No writes, SOS activation, notifications, uploads, or external callbacks were issued.
- SSE endpoints were checked only for their anonymous response; no authenticated stream was opened.
- WebSocket checks were anonymous handshakes expected to be rejected with HTTP 401; they do not validate an authenticated persistent session.

**Gate 1: BLOCKED, non PASS.** La baseline anonima non dimostra login, cookie e sessione attiva, operazioni profilo/matching/telemetria, chat/notifiche, media/upload, AI o stream persistenti autenticati. Per rispettare il piano, prima del cutover occorrono test non distruttivi con sessione/account sandbox autorizzati; le azioni SOS reali e le notifiche verso utenti non devono essere usate.
