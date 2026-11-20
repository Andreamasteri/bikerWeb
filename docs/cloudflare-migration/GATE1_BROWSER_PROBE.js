// Authenticated, read-only + validation-only Gate 1 probe for the isolated
// Cloudflare workers.dev staging Worker. Run only after signing into staging
// through this same hostname. This script never prints response bodies,
// cookies, tokens, profile values, or WebSocket messages.
(async () => {
  const checks = [];

  async function jsonCheck(method, path, expectedStatus = 200, body) {
    const started = performance.now();
    const options = {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    };
    if (body !== undefined) {
      options.headers["Content-Type"] = "application/json";
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(path, options);
      const contentType = response.headers.get("content-type") || "";
      const json = /application\/json\b/i.test(contentType);
      let bodyShape = false;
      let payload;
      if (json) {
        try {
          payload = await response.clone().json();
          bodyShape = payload === null || typeof payload === "object";
        } catch {
          bodyShape = false;
        }
      }
      const pass = response.status === expectedStatus && json && bodyShape;
      checks.push({
        method,
        path,
        status: response.status,
        expected: expectedStatus,
        content_type: contentType,
        pass,
        latency_ms: Math.round(performance.now() - started),
      });
      return { pass, payload, status: response.status };
    } catch (error) {
      checks.push({
        method,
        path,
        status: 0,
        expected: expectedStatus,
        pass: false,
        error: error?.name || "FetchError",
        latency_ms: Math.round(performance.now() - started),
      });
      return { pass: false, payload: null, status: 0 };
    }
  }

  const auth = await jsonCheck("GET", "/api/auth/me");
  if (!auth.pass) {
    console.log("BIKERLINK_GATE1_CLOUDFLARE_RESULT " + JSON.stringify({
      target: location.origin,
      captured_at: new Date().toISOString(),
      authenticated: false,
      checks,
      all_pass: false,
      note: "Sign into this workers.dev staging hostname, then run the probe again.",
    }));
    return;
  }

  const readPaths = [
    "/api/health",
    "/api/users/me",
    "/api/match-preferences",
    "/api/match-preferences/gate",
    "/api/proposals/matches/accepted",
    "/api/telemetry/sensor-settings",
    "/api/telemetry/calibration",
    "/api/telemetry/dr-correction",
    "/api/chat/conversations?limit=1&offset=0",
    "/api/notifications",
    "/api/sos/my",
    "/api/ai/assistant/config?platform=web",
  ];
  let healthPayload = null;
  for (const path of readPaths) {
    const check = await jsonCheck("GET", path);
    if (path === "/api/health") healthPayload = check.payload;
  }

  const streamStarted = performance.now();
  const streamController = new AbortController();
  const streamTimer = setTimeout(() => streamController.abort(), 5000);
  try {
    const response = await fetch("/api/auth/session-events", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "text/event-stream" },
      signal: streamController.signal,
    });
    let connected = false;
    if (response.ok && response.body) {
      const reader = response.body.getReader();
      try {
        const first = await reader.read();
        connected = !!first.value && new TextDecoder().decode(first.value).includes("connected");
      } finally {
        try { await reader.cancel(); } catch {}
      }
    }
    const contentType = response.headers.get("content-type") || "";
    checks.push({
      method: "GET",
      path: "/api/auth/session-events",
      status: response.status,
      expected: 200,
      content_type: contentType,
      connected_event_received: connected,
      pass: response.status === 200 && /text\/event-stream/i.test(contentType) && connected,
      latency_ms: Math.round(performance.now() - streamStarted),
    });
  } catch (error) {
    checks.push({
      method: "GET",
      path: "/api/auth/session-events",
      status: 0,
      expected: 200,
      pass: false,
      error: error?.name || "StreamError",
      latency_ms: Math.round(performance.now() - streamStarted),
    });
  } finally {
    clearTimeout(streamTimer);
    streamController.abort();
  }

  // These payloads deliberately fail validation before persistence, push,
  // uploads, messages, or SOS creation. HTTP 400 JSON proves the API reached
  // Railway rather than being answered by the frontend fallback.
  await jsonCheck("POST", "/api/sos", 400, {});
  await jsonCheck("POST", "/api/chat/conversations", 400, {});
  await jsonCheck(
    "POST",
    "/api/chat/conversations/00000000-0000-0000-0000-000000000000/messages",
    400,
    { messageType: "__gate1_invalid__" },
  );

  const uploadStarted = performance.now();
  try {
    const response = await fetch("/api/ai/assistant/images", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      body: new FormData(),
    });
    const contentType = response.headers.get("content-type") || "";
    checks.push({
      method: "POST",
      path: "/api/ai/assistant/images",
      status: response.status,
      expected: 400,
      content_type: contentType,
      pass: response.status === 400 && /application\/json\b/i.test(contentType),
      latency_ms: Math.round(performance.now() - uploadStarted),
    });
  } catch (error) {
    checks.push({
      method: "POST",
      path: "/api/ai/assistant/images",
      status: 0,
      expected: 400,
      pass: false,
      error: error?.name || "FetchError",
      latency_ms: Math.round(performance.now() - uploadStarted),
    });
  }

  const wsStarted = performance.now();
  const websocket = await new Promise((resolve) => {
    let opened = false;
    let hello = false;
    let settled = false;
    const ws = new WebSocket(`wss://${location.host}/ws/admin/notifications`);
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ opened, hello });
    };
    const timer = setTimeout(() => {
      try { ws.close(1000, "Gate 1 probe complete"); } catch {}
      finish();
    }, 5000);
    ws.onopen = () => { opened = true; };
    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data));
        if (message?.type === "hello") {
          hello = true;
          ws.close(1000, "Gate 1 probe complete");
        }
      } catch {}
    };
    ws.onerror = () => {};
    ws.onclose = finish;
  });
  checks.push({
    method: "WSS",
    path: "/ws/admin/notifications",
    connected: websocket.opened,
    hello_received: websocket.hello,
    pass: websocket.opened && websocket.hello,
    latency_ms: Math.round(performance.now() - wsStarted),
  });

  console.log("BIKERLINK_GATE1_CLOUDFLARE_RESULT " + JSON.stringify({
    target: location.origin,
    captured_at: new Date().toISOString(),
    authenticated: true,
    backend_revision: healthPayload?.revision || null,
    checks,
    pass_count: checks.filter((item) => item.pass).length,
    fail_count: checks.filter((item) => !item.pass).length,
    all_pass: checks.every((item) => item.pass),
  }));
})();
