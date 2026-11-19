# Legacy content restoration report

Captured from the live original site on 19 November 2026. This report describes the content restored in the Cloudflare Worker source; it does not describe a production DNS cutover.

## Preserved material

- All 30 URLs from the original sitemap are accounted for: 22 public marketing/editorial/legal pages have their original content on the Worker; the 8 account/documentation pages remain application-owned on Railway.
- The homepage retains the original descriptions and all 18 image placements, the full comparison table with 21 rows and 7 columns, SEO metadata, and source links. Only trailing whitespace was removed.
- The 22 static copies contain 25 original image placements and 22 distinct original image files across `src` and `srcset`. Every one is present in the existing R2 bucket manifest. No image objects were duplicated.
- All 8 original tables across the 22 pages are retained with their source markup and text; the per-page row/cell counts and SHA-256 values are in `LEGACY_CONTENT_MANIFEST.json`.
- The candidate-only `/raduni`, `/horus`, `/ecosistema`, and English pages remain in place.

## Page organization

The restored navigation groups the existing information around the product and riding journey: the feature hub, matching explanations and technical details, SOS and MotoClub, the live community, editorial stories, company/support pages, and legal documents. The public content formerly proxied from Railway now has explicit Worker Static Assets routes. `/delete-account` and `/docs*` remain on Railway because they are application-owned flows/screens.

## Routing and backend

The Worker checks the full `/api` namespace, readiness, WebSockets, and the Expo root handshake before static content. Static routing is exact-path only. The existing `/download` actions still call `/api/download/*`, which remains proxied to Railway. Account deletion and protected documentation remain on Railway. BikerTest and the official domain were not changed.

## Verification

- Each restored page preserves the captured source markup and text. Trailing whitespace was removed from seven files only; the manifest records source and output SHA-256 values for every page.
- All source and `srcset` image variants referenced by these pages are present in the existing R2 manifest.
- The local route harness is updated to assert Cloudflare delivery for the restored pages and Railway delivery for account deletion and unlisted backend routes.
- PR [#4](https://github.com/Andreamasteri/bikerWeb/pull/4) merged into `main` on 19 November 2026. Source commit `ac5a9d64c5c8eeb97be35ab7a05c273f69646c29`; merge commit `83bc454193abe18f678541b02e4e4c49a641c3ac`.
- `npm run test:routing`: 76/76 PASS. `npm run dry-run`: PASS, 70 Static Assets files and the expected R2, assets, and Railway bindings.

## Preview and production status

- The restored source is deployed on isolated Worker `bikerlink-website-content-preview` at <https://bikerlink-website-content-preview.andreamasteri-nadir-radio.workers.dev>, version `3f5a2d95-20e4-4c61-a3be-d676ea24dca2` (19 November 2026, 22:57:37 UTC). Wrangler reports zero triggers; no custom domain or route is attached. The deployed source was saved immediately after validation as branch `codex/bikerweb-preview-noindex-20261119`, commit `b14897b945861fff019595e95636bb85505b79c3`.
- Live verification: 22/22 legacy pages match their committed source SHA-256 exactly; all 34 explicit static routes return HTTP 200. The homepage retains 18 images and its 21-row, 147-cell comparison table. All 18 homepage images loaded in Chromium at desktop and mobile widths; the mobile document has no horizontal overflow and the menu opens with 10 visible links. No JavaScript exceptions or failed browser requests were observed.
- All 24 image URLs found in the legacy page source return HTTP 200 through the Worker; the manifest records all 22 original image files/variants in the existing R2 bucket. The preview sends `X-Robots-Tag: noindex`; its canonical still points to `https://biker-link.net/`, whose response remains indexable.
- `/api/health` through the preview, direct Railway origin, and the official domain returns HTTP 200 with the same ready backend revision `72c7508644b86f268765e2873310dcf45aa0ffb9`. Anonymous `/api/auth/me` continues to return the expected HTTP 401. This is a read-only smoke check, not the complete authenticated API Gate 1 suite.
- The earlier failed Wrangler attempt occurred before device authentication and did not create a Worker version. The subsequent authenticated deployment created the isolated preview version above.
- No custom domain, production DNS record, production Worker, Railway setting, database, or BikerTest Worker was changed. The official site and BikerTest homepage still return HTTP 200; the official domain has not been cut over.

Detailed live evidence: [`CONTENT_PREVIEW_VERIFICATION.json`](CONTENT_PREVIEW_VERIFICATION.json).

Manifest: [`LEGACY_CONTENT_MANIFEST.json`](LEGACY_CONTENT_MANIFEST.json).
