#!/usr/bin/env node
import { randomBytes } from "node:crypto";

const origin = "https://bikerlink-chat-sse-isolation-20261120.andreamasteri-nadir-radio.workers.dev";
const railwayOrigin = "https://bikerlink-chat-sse-test-backend-gate1-chat-sse-test.up.railway.app";
const jsonHeaders = { Accept: "application/json", "Content-Type": "application/json" };
const result = {
  target: origin,
  captured_at: new Date().toISOString(),
  registration: { status: 0, pass: false, session_cookie: false },
  auth_me: { status: 0, pass: false },
  conversations: { status: 0, count: null, pass: false },
  chat_sse: { attempted: false, status: 0, content_type: null, connected_event: false, pass: false },
  logout: { status: 0, pass: false },
  all_pass: false,
};

function elapsed(start) {
  return Math.round(performance.now() - start);
}

function contentType(response) {
  return response.headers.get("content-type") || "";
}

function sessionCookie(response) {
  if (typeof response.headers.getSetCookie !== "function") {
    throw new Error("Node 20.18+ required for safe Set-Cookie handling");
  }
  return response.headers.getSetCookie()
    .map((value) => value.split(";", 1)[0])
    .filter((value) => value.includes("="))
    .join("; ");
}

async function request(path, options = {}, timeoutMs = 15_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(new URL(path, origin), {
      ...options,
      cache: "no-store",
      signal: controller.signal,
      redirect: "manual",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function probeSse(target, cookie, timeoutMs) {
  const result = { status: 0, content_type: null, connected_event: false, pass: false };
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  let reader;
  try {
    response = await fetch(new URL("/api/chat/stream", target), {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Accept-Encoding": "identity",
        Cookie: cookie,
      },
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });
    result.status = response.status;
    result.content_type = contentType(response);
    if (response.ok && result.content_type.includes("text/event-stream") && response.body) {
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      const deadline = Date.now() + timeoutMs - 500;
      while (Date.now() < deadline) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        if (/event:\s*connected\b/.test(buffer)) {
          result.connected_event = true;
          break;
        }
      }
    }
  } catch (error) {
    result.error = error?.name || "ProbeError";
  } finally {
    clearTimeout(timer);
    controller.abort();
    try { await reader?.cancel(); } catch {}
    try { await response?.body?.cancel(); } catch {}
    result.latency_ms = elapsed(started);
  }
  result.pass = result.status === 200 && result.content_type.includes("text/event-stream") && result.connected_event;
  return result;
}

async function main() {
  let cookie = "";
  try {
    if (!globalThis.fetch || typeof AbortController === "undefined") {
      throw new Error("Node 20 or newer is required");
    }

    const suffix = randomBytes(8).toString("hex");
    const nicknameDigits = String(randomBytes(4).readUInt32BE(0) % 1_000_000_000).padStart(9, "0");
    const password = `Aa9!${randomBytes(24).toString("hex")}`;
    const registrationStart = performance.now();
    const registration = await request("/api/auth/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: `smoke+${suffix}@bikerlink.test`,
        nickname: `smoke${nicknameDigits}`,
        password,
        userType: "biker",
        eulaAccepted: true,
      }),
    });
    cookie = sessionCookie(registration);
    result.registration = {
      status: registration.status,
      pass: registration.status === 201 && contentType(registration).includes("application/json"),
      session_cookie: cookie.length > 0,
      latency_ms: elapsed(registrationStart),
    };
    await registration.body?.cancel();

    if (!result.registration.pass || !cookie) {
      result.skip_reason = "registration_or_session_cookie_failed";
      return;
    }

    const authStart = performance.now();
    const auth = await request("/api/auth/me", {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    let authBody = null;
    if (auth.ok && contentType(auth).includes("application/json")) {
      authBody = await auth.json();
    } else {
      await auth.body?.cancel();
    }
    result.auth_me = {
      status: auth.status,
      pass: auth.status === 200 && contentType(auth).includes("application/json") && !!authBody && typeof authBody === "object",
      latency_ms: elapsed(authStart),
    };

    if (!result.auth_me.pass) {
      result.skip_reason = "authenticated_session_check_failed";
      return;
    }

    const conversationsStart = performance.now();
    const conversationsResponse = await request("/api/chat/conversations?limit=1&offset=0", {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    let conversations = null;
    if (conversationsResponse.ok && contentType(conversationsResponse).includes("application/json")) {
      conversations = await conversationsResponse.json();
    } else {
      await conversationsResponse.body?.cancel();
    }
    result.conversations = {
      status: conversationsResponse.status,
      count: Array.isArray(conversations) ? conversations.length : null,
      pass: conversationsResponse.status === 200 && Array.isArray(conversations) && conversations.length === 0,
      latency_ms: elapsed(conversationsStart),
    };

    if (!result.conversations.pass) {
      result.skip_reason = "conversation_preflight_not_empty_or_invalid_sse_not_opened";
      return;
    }

    result.chat_sse.attempted = true;
    // Compare the same authenticated stream at the isolated Railway origin and
    // through Cloudflare to localize where headers/events are delayed.
    result.chat_sse.direct_railway = await probeSse(railwayOrigin, cookie, 5_000);
    await new Promise((resolve) => setTimeout(resolve, 3_200));
    result.chat_sse.via_worker = await probeSse(origin, cookie, 15_000);
    result.chat_sse.pass = result.chat_sse.via_worker.pass;

    // The preflight confirmed zero conversations, so neither connection can
    // emit presence to another participant. Let close-triggered work settle.
    await new Promise((resolve) => setTimeout(resolve, 3_200));
  } catch (error) {
    result.error = error?.name === "AbortError" ? "TimeoutError" : (error?.message || "ProbeError");
  } finally {
    if (cookie) {
      try {
        const logout = await request("/api/auth/logout", {
          method: "POST",
          headers: { Accept: "application/json", Cookie: cookie },
        });
        result.logout = {
          status: logout.status,
          pass: logout.status === 200 || logout.status === 204,
        };
        await logout.body?.cancel();
      } catch (error) {
        result.logout.error = error?.name || "LogoutError";
      }
    }
    result.all_pass = result.registration.pass && result.auth_me.pass &&
      result.conversations.pass && result.chat_sse.pass;
    // Deliberately emit only sanitized fields: never credentials, cookies, or bodies.
    console.log(`GATE1_ISOLATED_CHAT_SSE_RESULT ${JSON.stringify(result)}`);
  }
}

main().catch((error) => {
  result.error = error?.name || "ProbeError";
  result.all_pass = false;
  console.log(`GATE1_ISOLATED_CHAT_SSE_RESULT ${JSON.stringify(result)}`);
  process.exitCode = 1;
});
