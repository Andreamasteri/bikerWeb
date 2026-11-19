# BikerLink production Worker routing

Order is intentional. API, readiness and persistent connection routes are selected before any static page or image. There is no single page application fallback: an unknown API or URL cannot receive the homepage HTML.

| Priority | Request paths | Destination | Behavior |
| --- | --- | --- | --- |
| 1 | `/api`, `/api/*` | Railway `bikerlink-production.up.railway.app` | All methods and bodies; query strings, `Authorization`, cookies, `Origin`, request/response headers and status pass through. |
| 2 | `/healthz` | Railway | Readiness response remains Railway-owned. |
| 3 | `/ws/admin/notifications`, `/ws/diagnostic*` | Railway | WebSocket upgrade request passes through the Worker fetch proxy. |
| 4 | `GET /` with `expo-platform: ios` or `android` | Railway | Preserves the mobile Expo manifest handshake on the root path. |
| 5 | Legacy and app pages: `/features`, `/motoclub`, `/about`, `/faq`, `/contact`, `/blog`, `/blog/*`, `/matching/*` (except the exact static `/matching` page), `/terms`, `/tos`, `/delete-account`, `/investors`, `/apple-review`, `/registrati`, `/accedi`, `/area-utente`, `/media`, `/admin/media`, `/admin/settings`, `/admin/secrets`, `/admin/diagnostics/live`, `/admin/visitatori`, `/pianifica`, `/docs`, `/docs/*`, `/llms.txt`, `/manifest`, `/roadmap.json`, `/matching-system.pdf`, `/leaflet-map.html`, `/leaflet-mini-map.html`, `/leaflet-tracking-map.html`, `/leaflet-picker-map.html`, `/leaflet-navigation-map.html`, `/leaflet-curvature-map.html`, `/leaflet-route-map.html`, `/uploads/*`, `/music/*`, and remaining `/assets/*` | Railway | Explicitly enumerated app/site families; redirects remain manual and visible to the client. |
| 6 | `/assets/images/*`, `/favicon.png`, `/favicon.ico` | Cloudflare R2 `bikerlink-website-assets` | Original images copied from backend commit `aedfb278f487105a10567c9efa4c090705b3d801`; missing R2 object falls back to the same Railway asset URL. |
| 7 | `/`, `/matching`, `/raduni`, `/community`, `/horus`, `/sos`, `/privacy`, `/ecosistema`, `/download`, `/en` and the corresponding eight English subpages | Workers Static Assets | Exact approved BikerTest pages with production SEO metadata. |
| 8 | `/privacy-policy` | Workers Static Assets | Preserves the current live legal privacy page content at its legacy URL; sets its canonical to `/privacy-policy`. The old origin redirected this URL to `/privacy`, whose approved frontend copy is now served separately. |
| 9 | `/robots.txt`, `/sitemap.xml` | Workers Static Assets | Production SEO files for the approved pages and legal policy. |
| 10 | Other paths | Worker 404 | No generic HTML fallback and no broad origin catch-all. |

The origin is the Railway-generated hostname, not the public site hostname. The Worker sends `X-Forwarded-Host` and `X-Forwarded-Proto` from the incoming request and uses HTTPS to the Railway hostname. It does not rewrite the `Host` header manually, does not redirect to the public domain, and does not attach a Worker route or custom domain to the origin hostname; this avoids a proxy loop. Existing non-apex hostnames and DNS records remain outside this Worker's route.

The Worker source is a candidate for the isolated `workers.dev` hostname first. The apex DNS CNAME and BikerTest Worker are not changed by this package.
