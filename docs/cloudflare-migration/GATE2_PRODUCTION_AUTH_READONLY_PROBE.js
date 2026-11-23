// Read-only authenticated smoke for the official Cloudflare-routed production site.
// Run only while signed in on https://biker-link.net. It prints no cookies,
// tokens, response values, profile data, or WebSocket messages. No POST is sent.
(async () => {
  const expectedOrigin = "https://biker-link.net";
  const checks = [];
  const result = {
    target: location.origin,
    captured_at: new Date().toISOString(),
    authenticated: false,
    checks,
    all_pass: false,
  };
  if (location.origin !== expectedOrigin) {
    result.error = "wrong_origin_open_the_official_production_site";
    console.log("BIKERLINK_GATE2_PRODUCTION_READONLY_RESULT " + JSON.stringify(result));
    return;
  }

  async function jsonCheck(path, expectedStatus = 200) {
    const started = performance.now();
    try {
      const response = await fetch(path, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const contentType = response.headers.get("content-type") || "";
      let validJson = false;
      let payload;
      if (/application\/json\b/i.test(contentType)) {
        try {
          payload = await response.clone().json();
          validJson = payload === null || typeof payload === "object";
        } catch {}
      }
      const check = {
        method: "GET",
        path,
        status: response.status,
        expected: expectedStatus,
        content_type: contentType,
        pass: response.status === expectedStatus && validJson,
        latency_ms: Math.round(performance.now() - started),
      };
      if (path === "/api/health") {
        check.backend_revision = typeof payload?.revision === "string" ? payload.revision : null;
        check.state = payload?.state ?? null;
        check.degraded = payload?.degraded ?? null;
        check.pass = check.pass && check.state === "READY" && check.degraded === false;
      }
      checks.push(check);
      return { ...check, payload };
    } catch (error) {
      const check = {
        method: "GET",
        path,
        status: 0,
        expected: expectedStatus,
        pass: false,
        error: error?.name || "FetchError",
        latency_ms: Math.round(performance.now() - started),
      };
      checks.push(check);
      return check;
    }
  }

  const auth = await jsonCheck("/api/auth/me");
  result.authenticated = auth?.pass === true;
  if (!result.authenticated) {
    result.all_pass = false;
    result.note = "Sign into the official production site, then run this probe again.";
    console.log("BIKERLINK_GATE2_PRODUCTION_READONLY_RESULT " + JSON.stringify(result));
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
  for (const path of readPaths) await jsonCheck(path);

  const sseStarted = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("/api/auth/session-events", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "text/event-stream" },
      signal: controller.signal,
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
      latency_ms: Math.round(performance.now() - sseStarted),
    });
  } catch (error) {
    checks.push({
      method: "GET",
      path: "/api/auth/session-events",
      status: 0,
      expected: 200,
      pass: false,
      error: error?.name || "SSEError",
      latency_ms: Math.round(performance.now() - sseStarted),
    });
  } finally {
    clearTimeout(timer);
    controller.abort();
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
      try { ws.close(1000, "Gate 2 probe complete"); } catch {}
      finish();
    }, 5000);
    ws.onopen = () => { opened = true; };
    ws.onmessage = (event) => {
      try {
        if (JSON.parse(String(event.data))?.type === "hello") {
          hello = true;
          ws.close(1000, "Gate 2 probe complete");
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

  result.backend_revision = checks.find((item) => item.path === "/api/health")?.backend_revision || null;
  result.pass_count = checks.filter((item) => item.pass).length;
  result.fail_count = checks.filter((item) => !item.pass).length;
  result.all_pass = checks.every((item) => item.pass);
  result.scope = "same-origin authenticated GETs, session SSE, and notifications WSS only; no POST or application-data writes";
  console.log("BIKERLINK_GATE2_PRODUCTION_READONLY_RESULT " + JSON.stringify(result));
})();
