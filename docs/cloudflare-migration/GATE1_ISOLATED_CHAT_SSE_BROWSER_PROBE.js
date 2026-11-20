// Paste into the DevTools Console while the isolated test Worker is open.
// The Worker injects its smoke-registration token server-side. This probe
// creates a disposable account and only opens Chat SSE after confirming that
// the new account has no conversations.
(() => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const suffix = Array.from(crypto.getRandomValues(new Uint8Array(6)), (x) => x.toString(16).padStart(2, "0")).join("");
  const passwordBytes = crypto.getRandomValues(new Uint8Array(16));
  const password = `Aa9!${Array.from(passwordBytes, (x) => x.toString(16).padStart(2, "0")).join("")}`;
  const credentials = {
    email: `smoke+${suffix}@bikerlink.test`,
    nickname: `smoke${suffix}`,
    password,
    userType: "biker",
    eulaAccepted: true,
  };

  void (async () => {
    const result = {
      target: location.origin,
      captured_at: new Date().toISOString(),
      registration: { status: 0, pass: false, session_cookie: false },
      auth_me: { status: 0, pass: false },
      conversations: { status: 0, count: null, pass: false },
      chat_sse: { attempted: false, status: 0, content_type: null, connected_event: false, pass: false },
      all_pass: false,
    };

    try {
      const registration = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      result.registration.status = registration.status;
      result.registration.content_type = registration.headers.get("content-type");
      result.registration.session_cookie = false;
      if (!registration.ok || !(result.registration.content_type || "").includes("application/json")) {
        result.skip_reason = "registration_not_json_success";
      } else {
        await registration.json();
        result.registration.pass = registration.status === 201;

        const auth = await fetch("/api/auth/me", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        result.auth_me.status = auth.status;
        result.auth_me.content_type = auth.headers.get("content-type");
        const authBody = auth.ok ? await auth.json() : null;
        result.auth_me.pass = auth.status === 200 && (result.auth_me.content_type || "").includes("application/json") && !!authBody;
        result.registration.session_cookie = result.auth_me.pass;

        const conversationsResponse = await fetch("/api/chat/conversations?limit=1&offset=0", {
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        result.conversations.status = conversationsResponse.status;
        result.conversations.content_type = conversationsResponse.headers.get("content-type");
        const conversations = conversationsResponse.ok ? await conversationsResponse.json() : null;
        if (Array.isArray(conversations)) {
          result.conversations.count = conversations.length;
          result.conversations.pass = conversationsResponse.status === 200 && conversations.length === 0;
        }

        if (result.conversations.pass) {
          result.chat_sse.attempted = true;
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 5000);
          let reader;
          try {
            const stream = await fetch("/api/chat/stream", {
              method: "GET",
              credentials: "same-origin",
              cache: "no-store",
              headers: { Accept: "text/event-stream" },
              signal: controller.signal,
            });
            result.chat_sse.status = stream.status;
            result.chat_sse.content_type = stream.headers.get("content-type");
            if (stream.ok && (result.chat_sse.content_type || "").includes("text/event-stream") && stream.body) {
              reader = stream.body.getReader();
              const decoder = new TextDecoder();
              let buffer = "";
              const deadline = Date.now() + 4000;
              while (Date.now() < deadline) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                if (/event:\s*connected\b/.test(buffer)) {
                  result.chat_sse.connected_event = true;
                  break;
                }
              }
            }
          } finally {
            clearTimeout(timer);
            controller.abort();
            try { await reader?.cancel(); } catch {}
          }
          result.chat_sse.pass =
            result.chat_sse.status === 200 &&
            (result.chat_sse.content_type || "").includes("text/event-stream") &&
            result.chat_sse.connected_event;

          // The backend debounces close-triggered presence checks; the account
          // has zero conversations, so this cannot notify another participant.
          await wait(3200);
        } else {
          result.skip_reason = "conversation_preflight_not_empty_or_invalid";
        }

        const logout = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        result.logout = { status: logout.status, pass: logout.status === 200 || logout.status === 204 };
        result.all_pass = result.registration.pass && result.auth_me.pass && result.conversations.pass && result.chat_sse.pass;
      }
    } catch (error) {
      result.error = error?.name || "ProbeError";
    }

    console.log("GATE1_ISOLATED_CHAT_SSE_RESULT " + JSON.stringify(result));
  })();
})();
