// Run from the authenticated Gate 1 staging Worker tab's DevTools Console.
// The chat stream opens only when the test account has zero conversations,
// so presence cannot be broadcast to another participant.
(() => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  void (async () => {
    const result = {
      target: location.origin,
      captured_at: new Date().toISOString(),
      conversations: { status: 0, count: null, pass: false },
      chat_sse: { attempted: false, status: 0, content_type: null, connected_event: false, pass: false },
      all_pass: false,
    };

    try {
      const conversationsResponse = await fetch("/api/chat/conversations?limit=1&offset=0", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      result.conversations.status = conversationsResponse.status;
      const conversationsType = conversationsResponse.headers.get("content-type") || "";
      if (!conversationsResponse.ok || !conversationsType.includes("application/json")) {
        result.skip_reason = "conversation_preflight_not_authenticated_json";
      } else {
        const conversations = await conversationsResponse.json();
        if (!Array.isArray(conversations)) {
          result.skip_reason = "conversation_preflight_unexpected_schema";
        } else {
          result.conversations.count = conversations.length;
          result.conversations.pass = true;

          if (conversations.length !== 0) {
            result.skip_reason = "active_conversation_present_presence_probe_skipped";
          } else {
            result.chat_sse.attempted = true;
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            let reader;
            try {
              const response = await fetch("/api/chat/stream", {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store",
                headers: { Accept: "text/event-stream" },
                signal: controller.signal,
              });
              result.chat_sse.status = response.status;
              result.chat_sse.content_type = response.headers.get("content-type");
              if (response.ok && (result.chat_sse.content_type || "").includes("text/event-stream") && response.body) {
                reader = response.body.getReader();
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
            result.all_pass = result.conversations.pass && result.chat_sse.pass;

            // Presence updates are debounced for 3 seconds; wait for the
            // close-triggered check to finish before printing the result.
            await wait(3200);
          }
        }
      }
    } catch (error) {
      result.error = error?.name || "ProbeError";
    }

    console.log("GATE1_CHAT_SSE_SAFE_RESULT " + JSON.stringify(result));
  })();
})();
