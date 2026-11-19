const RAILWAY_ORIGIN = "https://bikerlink-production.up.railway.app";

const STATIC_PAGES = new Set([
  "/",
  "/matching",
  "/raduni",
  "/community",
  "/horus",
  "/sos",
  "/privacy",
  "/privacy-policy",
  "/ecosistema",
  "/download",
  "/en",
  "/en/matching",
  "/en/raduni",
  "/en/community",
  "/en/horus",
  "/en/sos",
  "/en/privacy",
  "/en/ecosistema",
  "/en/download",
]);

const STATIC_FILES = new Set(["/robots.txt", "/sitemap.xml"]);

const BACKEND_PAGES = new Set([
  "/features",
  "/motoclub",
  "/about",
  "/faq",
  "/contact",
  "/blog",
  "/matching/come-funziona",
  "/matching/tipi-di-match",
  "/matching/come-impara",
  "/matching/intelligenza-artificiale",
  "/matching/privacy",
  "/matching/per-investitori",
  "/matching/pdf",
  "/terms",
  "/tos",
  "/delete-account",
  "/investors",
  "/apple-review",
  "/registrati",
  "/accedi",
  "/area-utente",
  "/media",
  "/admin/media",
  "/admin/settings",
  "/admin/secrets",
  "/admin/diagnostics/live",
  "/admin/visitatori",
  "/pianifica",
  "/docs",
  "/llms.txt",
  "/manifest",
  "/roadmap.json",
  "/matching-system.pdf",
  "/leaflet-map.html",
  "/leaflet-mini-map.html",
  "/leaflet-tracking-map.html",
  "/leaflet-picker-map.html",
  "/leaflet-navigation-map.html",
  "/leaflet-curvature-map.html",
  "/leaflet-route-map.html",
]);

function normalizePath(pathname) {
  if (pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

function isApiPath(pathname) {
  const path = pathname.toLowerCase();
  return path === "/api" || path.startsWith("/api/");
}

function isBackendPage(pathname) {
  return (
    BACKEND_PAGES.has(pathname) ||
    pathname.startsWith("/docs/") ||
    pathname.startsWith("/blog/") ||
    pathname.startsWith("/matching/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/music/") ||
    (pathname.startsWith("/assets/") && !pathname.startsWith("/assets/images/"))
  );
}

function isWebSocketPath(pathname) {
  return (
    pathname === "/ws/admin/notifications" ||
    pathname === "/ws/diagnostic" ||
    pathname.startsWith("/ws/diagnostic/")
  );
}

async function proxyToRailway(request) {
  const incomingUrl = new URL(request.url);
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, RAILWAY_ORIGIN);
  const headers = new Headers(request.headers);

  // The connection Host is set from RAILWAY_ORIGIN by fetch. Keep the public
  // host and scheme in the trusted forwarded headers used by the app for
  // redirects, canonical URLs, secure cookies, and origin checks.
  headers.delete("host");
  headers.set("x-forwarded-host", incomingUrl.host);
  headers.set("x-forwarded-proto", incomingUrl.protocol.slice(0, -1));

  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.body;
  }

  // Return the upstream Response unchanged so Set-Cookie, redirects, SSE
  // streams, WebSocket upgrades, status codes, and error bodies pass through.
  return fetch(new Request(upstreamUrl, init));
}

function assetRequest(request, path) {
  return envRequest(request, path);
}

function envRequest(request, path) {
  const url = new URL(request.url);
  url.pathname = path;
  return new Request(url, request);
}

async function serveR2Image(request, env, pathname) {
  const key = pathname.slice(1);
  const object = await env.SITE_ASSETS.get(key);
  if (!object) return null;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/octet-stream");
  }
  if (!headers.has("cache-control")) {
    headers.set("cache-control", "public, max-age=31536000, immutable");
  }
  return new Response(request.method === "HEAD" ? null : object.body, {
    status: 200,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = normalizePath(url.pathname);
    const method = request.method.toUpperCase();

    // The complete API namespace always wins over static assets and the site
    // fallback. Preserve all methods, query strings, headers, cookies, and body.
    if (isApiPath(pathname)) return proxyToRailway(request);

    if (pathname === "/healthz") return proxyToRailway(request);
    if (isWebSocketPath(pathname)) return proxyToRailway(request);

    // The app's Expo manifest handshake uses GET / with expo-platform.
    const expoPlatform = request.headers.get("expo-platform")?.toLowerCase();
    if (
      pathname === "/" &&
      method === "GET" &&
      (expoPlatform === "ios" || expoPlatform === "android")
    ) {
      return proxyToRailway(request);
    }

    // These legacy and application pages remain on Railway. This is an
    // explicit route family list; unknown paths never receive frontend HTML.
    if (isBackendPage(pathname)) return proxyToRailway(request);

    // Preserve the website's current image paths while serving the original
    // image files from the dedicated R2 bucket. A missing object falls through
    // to Railway so an asset omitted from the manifest remains available.
    if (pathname.startsWith("/assets/images/")) {
      if (method !== "GET" && method !== "HEAD") return proxyToRailway(request);
      const image = await serveR2Image(request, env, pathname);
      if (image) return image;
      return proxyToRailway(request);
    }
    if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
      if (method !== "GET" && method !== "HEAD") return proxyToRailway(request);
      const image = await serveR2Image(request, env, "/assets/images/favicon.png");
      if (image) return image;
      return proxyToRailway(request);
    }

    if (STATIC_FILES.has(pathname) && (method === "GET" || method === "HEAD")) {
      const file = pathname;
      return env.ASSETS.fetch(assetRequest(request, file));
    }

    if (STATIC_PAGES.has(pathname) && (method === "GET" || method === "HEAD")) {
      const file = pathname === "/" ? "/index.html" : `${pathname}/index.html`;
      return env.ASSETS.fetch(assetRequest(request, file));
    }

    return new Response("Not Found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  },
};
