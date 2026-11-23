# API after cutover — 23 November 2026

## Result

The production apex now routes through Cloudflare Worker `bikerlink-website-production`. The bounded HTTP smoke suite passed **13/13** at `2026-11-23T15:12:31.239Z`; it was followed by 5/5 checks after the independently triggered Railway deployment, and an **8/8** read-only apex-to-Railway recheck at `2026-11-23T15:33:24.690Z`. See [`API_AFTER.json`](API_AFTER.json), [`API_AFTER_RECHECK.json`](API_AFTER_RECHECK.json), and [`API_AFTER_FINAL_RECHECK.json`](API_AFTER_FINAL_RECHECK.json).

The backend remains Railway at `https://bikerlink-production.up.railway.app`. It reported revision `1114ec588d19332e1393d7eba9d3bae89fb45a3d` during the first smoke. At `15:13:39Z`, Railway independently deployed PR #483 (`7c3ae1137dc56ec3110a6a755660f11f744882ff`, AI Selection); we did not trigger or modify that backend deployment. The `15:25:07Z` recheck passed 5/5 core checks. The latest recorded checks at `15:33:24Z` (8/8) and `15:42:54Z` (7/7) passed against this same `READY` origin revision; health was byte-for-byte identical through Worker and Railway. Details: [`API_AFTER_RECHECK.json`](API_AFTER_RECHECK.json), [`API_AFTER_FINAL_RECHECK.json`](API_AFTER_FINAL_RECHECK.json), and [`API_AFTER_LIVE_RECHECK_20261123.json`](API_AFTER_LIVE_RECHECK_20261123.json).

## Checks that passed

- Anonymous `/api/auth/me` and `/api/chat/stream` returned the same expected JSON `401` as direct Railway; neither returned frontend HTML.
- `OPTIONS /api/auth/login` matched Railway status, body hash, allowed origin and credentials headers.
- `/`, `/features`, `/accedi`, and `/area-utente` returned HTTP 200 through Cloudflare (the first two checked with `HEAD`).
- `/ecosistema`, `/robots.txt`, and `/sitemap.xml` returned HTTP 200 through Cloudflare.
- `/assets/images/hero-forest.webp` returned HTTP 200 from the Worker/R2 path with the previously verified SHA-256.
- Cloudflare response headers (`server: cloudflare` and `CF-Ray`) confirmed that the apex request traversed Cloudflare.

## Gate status

**Gate 2 is incomplete.** The anonymous HTTP subset passed 13/13 initially, 5/5 after the concurrent Railway deploy, and 8/8 on the latest recheck. The full authenticated production suite was not repeated because this Codex web runtime cannot access the user’s browser session. A same-origin, read-only probe is prepared at [`GATE2_PRODUCTION_AUTH_READONLY_PROBE.md`](GATE2_PRODUCTION_AUTH_READONLY_PROBE.md); it needs to be run in the already authenticated Chrome tab on `biker-link.net`. It sends only GET requests and opens/closes session SSE and notification WSS; no credential needs to be shared.

**Gate 3 passed.** Cloudflare Browser Rendering captured desktop, iPhone viewport, Android viewport, and an opened mobile menu on the exact deployed Worker; all 34 static routes, 22 homepage image files, and BikerBlog returned HTTP 200. Browser console capture found four anonymous `GET /api/auth/me` JSON 401 responses (expected session checks) and zero JavaScript page exceptions; no other 4xx/5xx occurred. The user also confirmed the live homepage and matching page on physical Android Chrome and supplied screenshots in the conversation. See [`GATE3_PUBLIC_BROWSER_RENDERING_20261123.json`](GATE3_PUBLIC_BROWSER_RENDERING_20261123.json). BikerTest remained separate and its HTTP check passed.

The production route remains active because all executed post-cutover checks passed, including the recheck after the independently triggered Railway deployment. The /matching/come-funziona page returned HTTP 200 from the apex and its HTML matched the production Worker byte-for-byte; see docs/cloudflare-migration/API_AFTER_MATCHING_ROUTE_RECHECK_20261123.json. The migration remains partial only until the authenticated production API replay is recorded; the physical Android check and browser-console capture are now complete.

## Cutover and rollback evidence

- Worker deployment: `ac1d844e-74d1-4a0b-83e7-71df81065f99`, version `105b9fa8-a12c-485d-ab8b-1947f174b2cd`.
- Cloudflare route: ID `ca3e4114a545455695000bb164fdf63a`, pattern `biker-link.net/*`, script `bikerlink-website-production`.
- DNS record: ID `f4b67198cdea0c5f2f61d65e53ce6841`, CNAME target remains `bikerlink-production.up.railway.app`; only `proxied` changed from `false` to `true`.
- Rollback: delete only Worker route `ca3e4114a545455695000bb164fdf63a`, patch DNS record `f4b67198cdea0c5f2f61d65e53ce6841` to `proxied:false`, then verify the apex is served directly by Railway (`server: railway-hikari`, no `CF-Ray`) and compare health/home/API responses. Railway remains running, so no backend restore is needed.
- MX, TXT, email records, BikerTest, Railway service, database, matching, and telemetry were not changed.
