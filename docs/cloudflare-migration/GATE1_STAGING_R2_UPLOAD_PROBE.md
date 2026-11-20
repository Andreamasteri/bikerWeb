# Gate 1 staging R2 upload probe

The operator has confirmed the Railway staging and production object-storage targets without exposing credentials:

| Environment | R2 endpoint account | Private bucket | Public bucket | `R2_KEY_PREFIX` |
| --- | --- | --- | --- | --- |
| staging / `Bikerlink-Staging` | same EU R2 account | `bikerlink-private` | `bikerlink-public` | empty |
| production / `Bikerlink` | same EU R2 account | `bikerlink-private` | `bikerlink-public` | `production` |

The backend storage helper prepends `R2_KEY_PREFIX` to object keys. The AI image route stores files under `private/assistant-images/<filename>`, so staging writes at that path and production writes under `production/private/assistant-images/<filename>`. The backend staging and production `server/objectStorage.ts` source hashes were compared and match: `1278815eb6293f79deb9f94818d6e32642ce07c7641fede740ada55681a49606`. This establishes separate namespaces despite the shared EU buckets.

An independent Cloudflare R2 control probe in the EU private bucket passed: a 70-byte 1×1 PNG was uploaded under a unique `__codex_gate1_probe/` key, downloaded with matching SHA-256 `4ff6ab670a58c14270e034e2090d9a432caa263a14e0a25785386b0c12f880b5`, deleted by exact key, and verified absent afterward. The object has been removed. This proves R2 read/write and exact-key cleanup; it does not replace the application upload test.

## Run the authenticated application probe

1. Open the authenticated Gate 1 staging Worker tab: <https://bikerlink-website-gate1-staging.andreamasteri-nadir-radio.workers.dev/area-utente>.
2. Open DevTools → Console on that same tab and paste the **entire one-line contents** of [`GATE1_STAGING_R2_UPLOAD_PROBE.js`](GATE1_STAGING_R2_UPLOAD_PROBE.js).
3. Return only the line beginning `GATE1_STAGING_R2_UPLOAD_RESULT`.

The script refuses to run on any other hostname. It uploads only a synthetic 1×1 PNG through the authenticated `/api/ai/assistant/images` endpoint using the route's `image` multipart field; then it reads the new image back through the same authenticated Worker, checking MIME, 70-byte size and SHA-256. It prints only status, the random object key and integrity result. It does not print cookies, tokens, response bodies, or profile data, and it does not touch the database or send a message/SOS/notification. Once the output is returned, delete only that reported key from `bikerlink-private` in the EU jurisdiction and verify it is absent.

If the output has `pass:false`, do not retry repeatedly. Record the HTTP status and reported key, if any; clean up that exact key before diagnosing the cause.

## Current boundary

The authenticated read/API routing probe remains 19/19 PASS. The independent R2 control probe is PASS and makes a controlled app upload safe to test. Gate 1 remains blocked until the authenticated app upload is read back and cleaned up, and until Chat SSE is reviewed or safely tested without sending presence to unrelated participants. Production DNS and the production Worker have not been changed.
