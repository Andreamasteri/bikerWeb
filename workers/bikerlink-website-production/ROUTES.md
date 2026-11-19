# BikerLink production Worker routing

Route precedence protects the backend first, then serves the complete public marketing site from Workers Static Assets. There is no general frontend fallback: unknown paths do not receive homepage HTML.

| Priority | Request paths | Destination | Behavior |
| --- | --- | --- | --- |
| 1 | `/api`, `/api/*` | Railway `bikerlink-production.up.railway.app` | All methods, query strings, bodies, cookies, authorization, origin and response headers/status pass through. |
| 2 | `GET`/`HEAD /healthz` | Railway | Readiness remains Railway-owned. |
| 3 | `/ws/admin/notifications`, `/ws/diagnostic*` | Railway | Persistent WebSocket routes pass through. |
| 4 | `GET /` with `expo-platform: ios` or `android` | Railway | Preserves the mobile Expo manifest handshake before the homepage route. |
| 5 | Exact public marketing and legal pages listed below | Workers Static Assets | Original BikerLink page content is served from the Cloudflare Worker. API requests made by those pages still match priority 1. |
| 6 | Application and operational pages, including `/delete-account`, `/docs*`, `/accedi`, `/registrati`, `/area-utente`, `/pianifica`, admin pages, `/investors`, and non-image `/assets/*` | Railway | Authentication, account actions, protected docs, and app behavior remain backend-owned. Unlisted backend paths and resources in `BACKEND_PAGES` retain their existing explicit handling. |
| 7 | `GET /assets/images/*`, `/favicon.png`, `/favicon.ico` | Cloudflare R2 `bikerlink-website-assets` | Serves the existing bucket objects. Missing objects fall back to Railway. `HEAD`, range, and conditional requests remain origin-authoritative. |
| 8 | `/robots.txt`, `/sitemap.xml`, `/web-session.js` | Workers Static Assets | SEO and session bootstrap files are hosted with the site. Session API calls still go through priority 1. |
| 9 | Any other path or unsupported method | Worker 404 | No catch-all can turn a missing API/page into homepage HTML. |

Static marketing and legal routes:

- Home and feature hub: `/`, `/features`
- Riding and safety: `/matching`, `/matching/come-funziona`, `/matching/tipi-di-match`, `/matching/come-impara`, `/matching/intelligenza-artificiale`, `/matching/privacy`, `/matching/per-investitori`, `/sos`, `/motoclub`, `/community`
- Editorial and company: `/blog`, `/blog/perche-esiste-bikerlink`, `/blog/un-giro-comincia-prima-di-partire`, `/blog/sos-biker-una-rete-che-risponde`, `/about`, `/contact`, `/faq`, `/download`
- Legal: `/privacy`, `/terms`
- Existing BikerTest additions retained: `/raduni`, `/horus`, `/ecosistema`, `/en` and the eight `/en/*` pages.

The public HTML pages were captured from the still-live original site on 19 November 2026 and copied into the matching Static Assets paths. The homepage retains all 18 original image placements, its full 21-row comparison table, copy, metadata, and link destinations. Across the captured marketing/legal pages, all 8 original tables are retained. All 11 distinct image files referenced by those pages are present in the existing R2 manifest; no image objects were duplicated.

The API namespace and WebSocket selection remain ahead of static routing. `/download` links to the existing `/api/download/*` endpoints, which therefore continue to reach Railway. `/delete-account` is deliberately not a static marketing page because its account deletion flow remains application-owned on Railway. The `/docs` routes remain backend-owned because their current output is an authenticated application screen.

The origin URL is the Railway-generated hostname, so TLS connects directly to Railway and cannot loop through the public site. The Worker sets `X-Forwarded-Host` and `X-Forwarded-Proto` from the original request. Existing API JSON, cookies, media, SSE, and WebSocket responses are not rewritten. Non-API Railway HTML redirects retain the current public-host rewrite behavior. Existing DNS records and the BikerTest Worker are outside this change.

The candidate is still isolated on `workers.dev`; the apex DNS and official domain have not been changed by this content restoration.
