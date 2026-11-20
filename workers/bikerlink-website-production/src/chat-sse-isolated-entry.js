import worker from "./worker.js";

const ALLOWED_PATH = "/api/chat/stream";
const DIAGNOSTIC_PATH = "/__diag/chat-sse";

function elapsed(start) {
  return Math.round(performance.now() - start);
}

async function diagnoseChatSse(request, env, ctx) {
  const result = {
    authenticated: false,
    conversations_empty: false,
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

  const streamHeaders = new Headers(request.headers);
  streamHeaders.set("accept", "text/event-stream");
  streamHeaders.set("accept-encoding", "identity");
  streamHeaders.set("cache-control", "no-transform");
  const started = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let streamResponse;
  try {
    streamResponse = await worker.fetch(
      new Request(new URL(ALLOWED_PATH, request.url), {
        headers: streamHeaders,
        signal: controller.signal,
      }),
      env,
      ctx,
    );
    result.headers_ms = elapsed(started);
    result.upstream_status = streamResponse.status;
    result.content_type = streamResponse.headers.get("content-type");
    result.content_encoding = streamResponse.headers.get("content-encoding");
    result.cache_control = streamResponse.headers.get("cache-control");
    if (!streamResponse.body) return Response.json(result);

    const reader = streamResponse.body.getReader();
    const firstChunk = await reader.read();
    result.first_chunk_ms = elapsed(started);
    if (!firstChunk.done) {
      const firstText = new TextDecoder().decode(firstChunk.value);
      result.connected_event = /event:\s*connected\b/.test(firstText);
    }
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
    if (url.pathname !== ALLOWED_PATH) {
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
