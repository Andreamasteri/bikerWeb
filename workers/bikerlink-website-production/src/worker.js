const STATIC_PAGES = new Map([
  ["/", "/index.html"],
  ["/features", "/features/index.html"],
  ["/matching", "/matching/index.html"],
  ["/matching/come-funziona", "/matching/come-funziona/index.html"],
  ["/matching/tipi-di-match", "/matching/tipi-di-match/index.html"],
  ["/matching/come-impara", "/matching/come-impara/index.html"],
  ["/matching/intelligenza-artificiale", "/matching/intelligenza-artificiale/index.html"],
  ["/matching/privacy", "/matching/privacy/index.html"],
  ["/matching/per-investitori", "/matching/per-investitori/index.html"],
  ["/sos", "/sos/index.html"],
  ["/motoclub", "/motoclub/index.html"],
  ["/community", "/community/index.html"],
  ["/raduni", "/raduni/index.html"],
  ["/horus", "/horus/index.html"],
  ["/download", "/download/index.html"],
  ["/about", "/about/index.html"],
  ["/faq", "/faq/index.html"],
  ["/contact", "/contact/index.html"],
  ["/blog", "/blog/index.html"],
  ["/blog/perche-esiste-bikerlink", "/blog/perche-esiste-bikerlink/index.html"],
  ["/blog/un-giro-comincia-prima-di-partire", "/blog/un-giro-comincia-prima-di-partire/index.html"],
  ["/blog/sos-biker-una-rete-che-risponde", "/blog/sos-biker-una-rete-che-risponde/index.html"],
  ["/privacy", "/privacy/index.html"],
  ["/terms", "/terms/index.html"],
  ["/ecosistema", "/ecosistema/index.html"],
  ["/en", "/en/index.html"],
  ["/en/matching", "/en/matching/index.html"],
  ["/en/raduni", "/en/raduni/index.html"],
  ["/en/community", "/en/community/index.html"],
  ["/en/horus", "/en/horus/index.html"],
  ["/en/sos", "/en/sos/index.html"],
  ["/en/privacy", "/en/privacy/index.html"],
  ["/en/ecosistema", "/en/ecosistema/index.html"],
  ["/en/download", "/en/download/index.html"],
]);

const STATIC_FILES = new Set(["/robots.txt", "/sitemap.xml", "/web-session.js"]);

const BACKEND_PAGES = new Set([
  "/privacy-policy",
  "/matching/pdf",
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

function publicSiteOrigin(env) {
  try {
    const origin = new URL(env.PUBLIC_SITE_ORIGIN);
    if (
      origin.protocol !== "https:" ||
      origin.hostname !== "biker-link.net" ||
      origin.pathname !== "/" ||
      origin.search ||
      origin.hash
    ) return null;
    return origin;
  } catch {
    return null;
  }
}

async function rewritePublicOrigin(response, request, railway, publicOrigin) {
  const headers = new Headers(response.headers);
  let changed = false;
  const location = headers.get("location");
  if (location) {
    try {
      const target = new URL(location);
      if (target.origin === railway.origin) {
        target.protocol = publicOrigin.protocol;
        target.host = publicOrigin.host;
        headers.set("location", target.toString());
        changed = true;
      }
    } catch {
      // Relative and non-URL Location values retain origin behavior.
    }
  }

  const contentType = headers.get("content-type") || "";
  if (
    request.method !== "GET" ||
    !/^text\/html\b/i.test(contentType) ||
    !response.body
  ) {
    if (/^text\/html\b/i.test(contentType) && request.method === "HEAD") {
      // The GET body is rewritten, so the origin's validators/length no longer
      // describe that representation. A bodyless HEAD remains standards-valid
      // without them.
      headers.delete("content-length");
      headers.delete("etag");
      changed = true;
    }
    if (!changed) return response;
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // The origin can gzip/brotli HTML based on Accept-Encoding. The caller asks
  // for identity so the body can be safely rewritten without changing API
  // responses or the origin's dynamic page logic.
  if (headers.has("content-encoding") && headers.get("content-encoding") !== "identity") {
    return new Response("Unable to safely rewrite compressed Railway HTML", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }

  const html = await response.text();
  const rewritten = html.replaceAll(railway.host, publicOrigin.host);
  if (rewritten === html && !changed) {
    // `response.text()` has consumed the upstream stream. Rebuild the response
    // body even when no host rewrite was needed, preserving its original headers.
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  for (const name of ["content-length", "content-encoding", "etag", "content-md5", "digest", "content-digest", "repr-digest"]) {
    headers.delete(name);
  }
  headers.set("content-length", String(new TextEncoder().encode(rewritten).byteLength));
  return new Response(rewritten, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

async function proxyToRailway(request, env, options = {}) {
  const incomingUrl = new URL(request.url);
  const origin = railwayOrigin(env);
  const publicOrigin = options.rewritePublicOrigin ? publicSiteOrigin(env) : null;
  if (!origin || (options.rewritePublicOrigin && !publicOrigin)) {
    return new Response("Railway origin is not configured", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  }
  const upstreamUrl = new URL(incomingUrl.pathname + incomingUrl.search, origin);
  const headers = new Headers(request.headers);

  const rewriteHtml = options.rewritePublicOrigin && request.method === "GET" &&
    (request.headers.get("accept") || "").toLowerCase().includes("text/html");
  if (rewriteHtml) {
    headers.set("accept-encoding", "identity");
    headers.delete("if-none-match");
    headers.delete("if-modified-since");
  }

  // The origin URL stays on Railway to avoid a loop. Railway's edge replaces
  // the Host from the origin URL, so do not forward a caller-supplied Host.
  // Keep forwarded metadata and rewrite Railway's hostname in non-API HTML and
  // absolute redirects below.
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

  // API, SSE, WebSocket, cookie, and error responses are returned unchanged.
  const response = await fetch(new Request(upstreamUrl, init));
  return options.rewritePublicOrigin
    ? rewritePublicOrigin(response, request, origin, publicOrigin)
    : response;
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

    // Public marketing, editorial, and legal pages are served from Workers
    // Static Assets. Exact paths are listed above so application-owned pages
    // such as /delete-account and /docs remain on Railway. API handling above
    // still wins for every method and path in the /api namespace.
    const staticPage = STATIC_PAGES.get(pathname);
    if (staticPage && (method === "GET" || method === "HEAD")) {
      return withSecurityHeaders(await env.ASSETS.fetch(assetRequest(request, staticPage)));
    }

    // These legacy and application pages remain on Railway. This is an
    // explicit route family list; unknown paths never receive frontend HTML.
    if (isBackendPage(pathname) && (method === "GET" || method === "HEAD")) {
      return proxyToRailway(request, env, { rewritePublicOrigin: true });
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

    return notFound();
  },
};
