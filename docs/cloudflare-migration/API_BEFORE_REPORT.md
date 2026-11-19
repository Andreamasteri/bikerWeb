# API_BEFORE — baseline BikerLink prima della pubblicazione

- Acquisizione: `2026-11-19T12:20:56Z` UTC.
- Origini confrontate: `https://biker-link.net` e `https://bikerlink-production.up.railway.app`.
- Revisione attesa e ricevuta: `aedfb278f487105a10567c9efa4c090705b3d801`.
- Suite: [`scripts/cloudflare-migration/api_probe.py`](../../scripts/cloudflare-migration/api_probe.py); supporta output JSON e confronto automatico `--compare` sui codici, schema, headers selezionati, cookie (solo attributi), redirect, hash/dimensione body e revisione; le latenze sono riportate per revisione operativa.
- Solo GET, HEAD, OPTIONS e handshake WebSocket anonimi. Nessun login, scrittura applicativa, upload, SOS, notifica o callback.

## Esito complessivo

| Destinazione | Prove | PASS | FAIL | Latenza mediana | Revisione |
| --- | ---: | ---: | ---: | ---: | --- |
| Dominio pubblico apex | 37 | 37 | 0 | 146 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |
| Hostname origine Railway | 37 | 37 | 0 | 185 ms | `aedfb278f487105a10567c9efa4c090705b3d801` |

### GET — API e servizi applicativi

| Controllo | Path | Atteso | Apex | Railway | Tipo risposta apex | Schema sintetico |
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

### CORS — OPTIONS di preflight

| Controllo | Path | Apex/Railway | Allow-Origin | Credentials | Metodi | Headers richiesti |
| --- | --- | ---: | --- | --- | --- | --- |
| `cors_registration` | `/api/auth/register` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_login` | `/api/auth/login` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_sos` | `/api/sos` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_chat_write` | `/api/chat/conversations` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_telemetry_write` | `/api/telemetry/batch` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_image_upload` | `/api/users/me/photos` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |
| `cors_media_upload` | `/api/admin/media/upload` | 200/200 | `https://biker-link.net` | `true` | `GET, POST, PUT, DELETE, OPTIONS` | `Content-Type, Authorization` |

### HEAD — pagine, redirect e asset

| Controllo | Path | Atteso | Apex/Railway | Location |
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

### Immagine, validator e Range

| Controllo | Stato atteso | Apex/Railway | Dati significativi |
| --- | ---: | ---: | --- |
| `plain_image` | 200 | 200/200 | body_bytes=`337534`; body_sha256=`8de037be4d1c61509a9001fad23fc32b726d793b56d642999ae8b75c3bdf4659`; ETag=`W/"5267e-1a1f090c188"`; Last-Modified=`Wed, 18 Nov 2026 21:29:41 GMT`; Accept-Ranges=`bytes`; Cache-Control=`public, max-age=31536000, immutable` |
| `image_if_none_match` | 304 | 304/304 | ETag=`W/"5267e-1a1f090c188"`; Last-Modified=`Wed, 18 Nov 2026 21:29:41 GMT`; Accept-Ranges=`bytes`; Cache-Control=`public, max-age=31536000, immutable` |
| `image_if_modified_since` | 304 | 304/304 | ETag=`W/"5267e-1a1f090c188"`; Last-Modified=`Wed, 18 Nov 2026 21:29:41 GMT`; Accept-Ranges=`bytes`; Cache-Control=`public, max-age=31536000, immutable` |
| `image_range` | 206 | 206/206 | body_bytes=`16`; body_sha256=`8a6cc95f3f2a214880eb75d8d95420a8815ddb208fb9dfda5c3bbbfd87bcedbe`; ETag=`W/"5267e-1a1f090c188"`; Last-Modified=`Wed, 18 Nov 2026 21:29:41 GMT`; Content-Range=`bytes 0-15/337534`; Accept-Ranges=`bytes`; Cache-Control=`public, max-age=31536000, immutable` |
| `image_if_range_stale` | 200 | 200/200 | body_bytes=`337534`; body_sha256=`8de037be4d1c61509a9001fad23fc32b726d793b56d642999ae8b75c3bdf4659`; ETag=`W/"5267e-1a1f090c188"`; Last-Modified=`Wed, 18 Nov 2026 21:29:41 GMT`; Accept-Ranges=`bytes`; Cache-Control=`public, max-age=31536000, immutable` |

La suite verifica il byte-range `0-15` (HTTP 206, 16 byte, `Content-Range: bytes 0-15/337534`), i due validator condizionali (304) e il fallback completo per `If-Range` obsoleto (200 e hash del file completo). Il sorgente Railway ha ETag weak; il candidate usa R2 solo per GET immagine semplice e inoltra HEAD/Range/If-* all’origine, perché il validator R2 non è equivalente.

### WebSocket anonimi

| Controllo | Atteso | Apex/Railway | Latenza apex/Railway |
| --- | ---: | ---: | ---: |
| `ws_admin_notifications` | 401 | 401/401 | 375/205 ms |
| `ws_diagnostic` | 401 | 401/401 | 163/429 ms |

## Prova dello strumento di confronto

È stata eseguita una comparazione dello stesso sistema live prima del cutover (`API_SELF_COMPARE.json`, acquisita alle `2026-11-19T11:13:12Z`): 37/37 per ciascuna origine, 0 differenze rilevate. È solo un controllo tecnico che verifica il confronto con sé stesso; **non** è Gate 2 né dimostra il comportamento del Worker.

## Limiti e gate

- No authenticated user credentials or session cookie were used.
- No writes, SOS activation, notifications, uploads, or external callbacks were issued.
- SSE endpoints were checked only for their anonymous response; no authenticated stream was opened.
- WebSocket checks were anonymous handshakes expected to be rejected with HTTP 401; they do not validate an authenticated persistent session.

**Gate 1: BLOCKED, non PASS.** La baseline anonima non verifica sessioni e flussi autenticati, né SSE/WebSocket con una sessione valida. Mancano un account/sessione sandbox autorizzati per prove non distruttive di profilo, matching, telemetria, chat/notifiche, media, AI e persistenza. Fino a tali prove il cutover resta vietato.
