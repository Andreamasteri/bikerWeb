import worker from "./worker.js";

const ALLOWED_PATHS = new Set(["/api/chat/stream", "/api/auth/session-events"]);
const DIAGNOSTIC_PATH = "/__diag/chat-sse";

function elapsed(start) {
  return Math.round(performance.now() - start);
}

async function diagnoseChatSse(request, env, ctx) {
  const result = {
    authenticated: false,
    conversations_empty: false,
    fetch_mode: "raw_worker_fetch_to_isolated_railway",
    upstream_status: 0,
    content_type: null,
    content_encoding: null,
    cache_control: null,
    headers_ms: null,
    first_chunk_ms: null,
    connected_event: false,
    error: null,
  };
  const headers = new Headers(request.headers);
  headers.set("accept", "application/json");

  const auth = await worker.fetch(
    new Request(new URL("/api/auth/me", request.url), { headers }),
    env,
    ctx,
  );
  result.authenticated = auth.status === 200 &&
    (auth.headers.get("content-type") || "").includes("application/json");
  await auth.body?.cancel();
  if (!result.authenticated) return Response.json(result, { status: 401 });

  const conversations = await worker.fetch(
    new Request(new URL("/api/chat/conversations?limit=1&offset=0", request.url), { headers }),
    env,
    ctx,
  );
  if (conversations.status === 200 &&
      (conversations.headers.get("content-type") || "").includes("application/json")) {
    try {
      result.conversations_empty = (await conversations.json()).length === 0;
    } catch {
      result.conversations_empty = false;
    }
  } else {
    await conversations.body?.cancel();
  }
  if (!result.conversations_empty) return Response.json(result, { status: 409 });

  let railwayOrigin;
  try {
    railwayOrigin = new URL(env.RAILWAY_ORIGIN);
  } catch {
    result.error = "InvalidIsolatedOrigin";
    return Response.json(result, { status: 503 });
  }
  if (railwayOrigin.origin !== "https://bikerlink-chat-sse-test-backend-gate1-chat-sse-test.up.railway.app") {
    result.error = "UnexpectedIsolatedOrigin";
    return Response.json(result, { status: 503 });
  }

  // Bypass proxyToRailway for one diagnostic request. This isolates Cloudflare's
  // raw outbound fetch from the forwarded metadata and response reconstruction
  // used by the production proxy.
  const streamHeaders = new Headers();
  streamHeaders.set("accept", "text/event-stream");
  streamHeaders.set("accept-encoding", "identity");
  const cookie = request.headers.get("cookie");
  if (cookie) streamHeaders.set("cookie", cookie);
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let streamResponse;
  try {
    streamResponse = await fetch(
      new Request(new URL(ALLOWED_PATH, railwayOrigin), {
        headers: streamHeaders,
        redirect: "manual",
        signal: controller.signal,
      }),
    );
    result.headers_ms = elapsed(started);
    result.upstream_status = streamResponse.status;
    result.content_type = streamResponse.headers.get("content-type");
    result.content_encoding = streamResponse.headers.get("content-encoding");
    result.cache_control = streamResponse.headers.get("cache-control");
    if (!streamResponse.body) return Response.json(result);

    const reader = streamResponse.body.getReader();
    const decoder = new TextDecoder();
    let firstText = "";
    const chunkDeadline = Date.now() + 5_000;
    for (let chunkCount = 0; chunkCount < 8 && Date.now() < chunkDeadline; chunkCount += 1) {
      const chunk = await reader.read();
      if (chunk.done) break;
      firstText += decoder.decode(chunk.value, { stream: true });
      if (firstText.length > 4096) firstText = firstText.slice(-4096);
      if (/event:\s*connected\b/.test(firstText)) {
        result.connected_event = true;
        break;
      }
    }
    result.first_chunk_ms = elapsed(started);
    try { await reader.cancel(); } catch {}
  } catch (error) {
    result.error = error?.name || "StreamReadError";
  } finally {
    clearTimeout(timeout);
    controller.abort();
    try { await streamResponse?.body?.cancel(); } catch {}
  }
  return Response.json(result, { headers: { "cache-control": "no-store" } });
}

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === DIAGNOSTIC_PATH) {
      if (request.method !== "GET") {
        return new Response("Method Not Allowed", {
          status: 405,
          headers: { allow: "GET", "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
        });
      }
      return diagnoseChatSse(request, env, ctx);
    }
    if (!ALLOWED_PATHS.has(url.pathname)) {
      return new Response("Not Found", {
        status: 404,
        headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      });
    }
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET", "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      });
    }
    return worker.fetch(request, env, ctx);
  },
};
