const STATIC_PAGES = new Set([
  "/",
  "/matching",
  "/raduni",
  "/community",
  "/horus",
  "/sos",
  "/privacy",
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
  "/privacy-policy",
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

function railwayOrigin(env) {
  try {
    const origin = new URL(env.RAILWAY_ORIGIN);
    if (
      origin.protocol !== "https:" ||
      !origin.hostname.endsWith(".up.railway.app") ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    ) return null;
    return origin;
  } catch {
    return null;
  }
}

async function proxyToRailway(request, env) {
  const incomingUrl = new URL(request.url);
  const origin = railwayOrigin(env);
  if (!origin) {
    return new Response("Railway origin is not configured", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, origin);
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

function withSecurityHeaders(response) {
  const headers = new Headers(response.headers);
  if (!headers.has("x-content-type-options")) headers.set("x-content-type-options", "nosniff");
  if (!headers.has("referrer-policy")) headers.set("referrer-policy", "strict-origin-when-cross-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function notFound() {
  return withSecurityHeaders(new Response("Not Found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  }));
}

async function proxyImageToRailway(request, env) {
  const response = await proxyToRailway(request, env);
  const headers = new Headers(response.headers);
  if ([200, 206, 304, 412, 416].includes(response.status) && !headers.has("accept-ranges")) {
    headers.set("accept-ranges", "bytes");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function serveR2Image(request, env, pathname) {
  // Keep the live origin's validators and range semantics authoritative. R2's
  // validators are not guaranteed to match Railway's weak ETag and Last-Modified,
  // so conditional, ranged, and HEAD requests must use the origin.
  if (
    request.method !== "GET" ||
    ["if-match", "if-none-match", "if-modified-since", "if-unmodified-since", "if-range", "range"]
      .some((name) => request.headers.has(name))
  ) return null;

  const key = pathname.slice(1);
  const object = await env.SITE_ASSETS.get(key);
  if (!object) return null;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/octet-stream");
  }
  headers.set("content-length", String(object.size));
  if (!headers.has("cache-control")) {
    headers.set(
      "cache-control",
      pathname === "/assets/images/favicon.png" || pathname === "/favicon.png" || pathname === "/favicon.ico"
        ? "public, max-age=604800"
        : "public, max-age=31536000, immutable",
    );
  }
  return new Response(object.body, {
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
    if (isApiPath(pathname)) return proxyToRailway(request, env);

    if (pathname === "/healthz" && (method === "GET" || method === "HEAD")) {
      return proxyToRailway(request, env);
    }
    if (isWebSocketPath(pathname)) return proxyToRailway(request, env);

    // The app's Expo manifest handshake uses GET / with expo-platform.
    const expoPlatform = request.headers.get("expo-platform")?.toLowerCase();
    if (
      pathname === "/" &&
      method === "GET" &&
      (expoPlatform === "ios" || expoPlatform === "android")
    ) {
      return proxyToRailway(request, env);
    }

    // These legacy and application pages remain on Railway. This is an
    // explicit route family list; unknown paths never receive frontend HTML.
    if (isBackendPage(pathname) && (method === "GET" || method === "HEAD")) {
      return proxyToRailway(request, env);
    }

    // Preserve the website's current image paths while serving the original
    // image files from the dedicated R2 bucket. A missing object falls through
    // to Railway so an asset omitted from the manifest remains available.
    if (pathname.startsWith("/assets/images/")) {
      if (method !== "GET" && method !== "HEAD") return notFound();
      const image = await serveR2Image(request, env, pathname);
      if (image) return image;
      return proxyImageToRailway(request, env);
    }
    if (pathname === "/favicon.png" || pathname === "/favicon.ico") {
      if (method !== "GET" && method !== "HEAD") return notFound();
      const image = await serveR2Image(request, env, "/assets/images/favicon.png");
      if (image) return image;
      return proxyImageToRailway(request, env);
    }

    if (STATIC_FILES.has(pathname) && (method === "GET" || method === "HEAD")) {
      const file = pathname;
      return withSecurityHeaders(await env.ASSETS.fetch(assetRequest(request, file)));
    }

    if (STATIC_PAGES.has(pathname) && (method === "GET" || method === "HEAD")) {
      const file = pathname === "/" ? "/index.html" : `${pathname}/index.html`;
      return withSecurityHeaders(await env.ASSETS.fetch(assetRequest(request, file)));
    }

    return notFound();
  },
};
