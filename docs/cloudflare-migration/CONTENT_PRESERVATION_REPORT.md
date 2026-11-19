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

- The new source has not yet been deployed to a Worker preview. The existing preview URL still serves the earlier, shorter candidate.
- A deploy attempt for isolated Worker `bikerlink-website-content-preview` uploaded 37 static asset files, then stopped at Cloudflare's R2 bucket metadata check with `Authentication error 10000`. The authenticated Wrangler OAuth session has `workers_scripts:write` but lacks `workers:write`. Cloudflare's Worker API confirmed no Worker version was created.
- No custom domain, DNS record, production Worker, Railway setting, database, or BikerTest Worker was changed. The official site, `/api/health`, and BikerTest still return HTTP 200.

Manifest: [`LEGACY_CONTENT_MANIFEST.json`](LEGACY_CONTENT_MANIFEST.json).
