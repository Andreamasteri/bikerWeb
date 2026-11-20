# Gate 1 isolated Chat SSE probe from PowerShell

This probe runs Node directly on the operator's Windows machine. It sends HTTP
requests only to the disposable Worker
`bikerlink-chat-sse-isolation-20261120`; it does not use Chrome, DevTools, or the
Codex web runtime. It does not call staging or production.

The probe creates one random disposable account in the isolated Gate 1 test
database, confirms its authenticated session and zero conversations, and only
then opens `/api/chat/stream`. It logs out afterward. The disposable user row
remains in that isolated test database; do not reuse this probe against another
environment. It prints status, content type, latency, and pass/fail only. It
never prints the generated email, password, session cookie, or response bodies.
If the conversation preflight is not exactly an empty JSON array, it skips SSE.

## Run

Use a regular PowerShell window, in a clean clone of the active branch. Node.js
20.18 or newer is required for safe handling of the session cookie:

```powershell
git switch codex/bikerweb-isolated-chat-sse-gate1-20261120
git pull --ff-only
node --version
node .\scripts\cloudflare-migration\gate1-isolated-sse-node-probe.mjs
```

Send back only the line beginning `GATE1_ISOLATED_CHAT_SSE_RESULT`. If Node
reports a timeout, `403`, or Cloudflare block, stop there. Do not retry with a
spoofed browser identity or otherwise attempt to evade Cloudflare controls.

## Expected passing evidence

`registration.status` is 201, `auth_me.status` is 200, `conversations.count` is
0, and `chat_sse` reports status 200, `text/event-stream`, and
`connected_event: true`. `all_pass` must be true. The Worker root may return
404; that is expected and unrelated because this probe requests API paths.

This is a diagnostic of the isolated Railway-origin stream through the
temporary Cloudflare Worker. It does not itself authorize or perform production
DNS changes.
