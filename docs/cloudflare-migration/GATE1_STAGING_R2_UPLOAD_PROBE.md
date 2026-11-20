# Gate 1 staging R2 upload probe

The operator has confirmed the Railway staging and production object-storage targets without exposing credentials:

| Environment | R2 endpoint account | Private bucket | Public bucket | `R2_KEY_PREFIX` |
| --- | --- | --- | --- | --- |
| staging / `Bikerlink-Staging` | same EU R2 account | `bikerlink-private` | `bikerlink-public` | empty |
| production / `Bikerlink` | same EU R2 account | `bikerlink-private` | `bikerlink-public` | `production` |

The backend storage helper prepends `R2_KEY_PREFIX` to object keys. The AI image route stores files under `private/assistant-images/<filename>`, so staging writes at that path and production writes under `production/private/assistant-images/<filename>`. The backend staging and production `server/objectStorage.ts` source hashes were compared and match: `1278815eb6293f79deb9f94818d6e32642ce07c7641fede740ada55681a49606`. This establishes separate namespaces despite the shared EU buckets.

An independent Cloudflare R2 control probe in the EU private bucket passed: a 70-byte 1×1 PNG was uploaded under a unique `__codex_gate1_probe/` key, downloaded with matching SHA-256 `4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5`, deleted by exact key, and verified absent afterward. The object has been removed. This proves R2 read/write and exact-key cleanup; it does not replace the application upload test.

## Authenticated application probe and cleanup — PASS

The operator ran the one-line browser probe on the authenticated staging Worker on 20 November 2026:

- POST `/api/ai/assistant/images`: HTTP 200.
- Authenticated GET of the returned image path: HTTP 200, `image/png`, 70 bytes.
- Browser SHA-256: `4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5` (matches the expected synthetic PNG).
- Exact staging R2 key: `private/assistant-images/1795174467908-fyid2e3tfet.png` in `bikerlink-private` (EU).
- Wrangler readback from R2 matched size and SHA-256. The exact key was deleted; a subsequent GET returned `The specified key does not exist`.

No database or profile data was written. The probe created only the temporary image object, which has been removed. Its source remains in [`GATE1_STAGING_R2_UPLOAD_PROBE.js`](GATE1_STAGING_R2_UPLOAD_PROBE.js) for traceability.

## Current boundary

The authenticated read/API routing probe is 19/19 PASS, and the application upload/readback/exact-key cleanup is PASS. Chat SSE is not opened because its connect/disconnect path can broadcast presence; the Worker route and local harness confirm `/api/chat/stream` uses the same unmodified `/api/*` Railway pass-through, while authenticated session SSE and notifications WSS passed live. Gate 1 is PASS for Cloudflare routing/storage. Production DNS and the production Worker have not been changed.
