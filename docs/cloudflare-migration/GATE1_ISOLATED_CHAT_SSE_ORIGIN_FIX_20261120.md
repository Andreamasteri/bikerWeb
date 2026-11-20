# Gate 1 isolated Chat SSE origin fix

On 20 November 2026, the disposable Cloudflare Worker
`bikerlink-chat-sse-isolation-20261120` forwarded registration requests to the
isolated Railway backend. The backend's origin guard returned HTTP 403
(`Richiesta non autorizzata`) before creating an account.

The exact backend source at revision `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`
shows `enforceOrigin` accepts only `https://${EXPO_PUBLIC_DOMAIN}` (or local
development origins); when `Origin` is absent it explicitly allows API clients.
The isolated backend has no `EXPO_PUBLIC_DOMAIN` configured. Rewriting Origin
to the Railway hostname therefore still failed, as confirmed by the user's
second Chrome run and Railway HTTP logs at 14:06:29 UTC.

The temporary Worker now removes `Origin` only for the token-gated POST to
`/api/auth/register`. Other requests retain their headers. This follows the
backend's existing API-client behavior without adding or widening an origin
allowlist. The Worker continues to forward only to the isolated test backend;
neither staging nor production services or DNS were changed. The latest
Cloudflare module update succeeded at 14:08:34 UTC and returned deployment ID
`34cfd2f3ca4347f9a5aa76a138b67bd2`.

## Verification state

- Direct isolated Railway `/api/health`: HTTP 200, revision
  `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`, DB circuit closed. The health
  payload reports `degraded` due to existing watchdog observations.
- The first Worker update did not pass; Chrome and Railway logs confirmed the
  origin guard remained the source of the 403.
- The second Worker update must still be verified by rerunning the browser
  probe. The execution environment cannot verify the registration request from
  Chrome.
- The browser probe then confirmed registration `201`, authenticated
  `/api/auth/me` `200`, and zero conversations. Its Chat SSE request was
  aborted after five seconds before the browser received response headers.
  Railway logs show `/api/chat/stream` completed with HTTP `200` at 5008 ms;
  the pinned backend route calls `flushHeaders()` and writes `event: connected`
  immediately. This points to buffering or delayed delivery along the proxy
  path, rather than an absent endpoint or failed authentication.
- For the next isolated check, the test Worker sends `Accept-Encoding: identity`
  for `Accept: text/event-stream` requests and the probe allows up to 15 seconds
  for the response (12 seconds to read the initial event). The production Worker
  candidate has the same SSE encoding behavior in source. This candidate change
  passed the local route harness; it has not been published to the official
  domain. The isolated Worker update completed at 17:02:05 UTC with deployment
  ID `223c2c4a43aa4696893a7af589a21400`.
- The following browser run again passed registration (`201`), `/api/auth/me`
  (`200`), and the empty-conversation check. The Worker client aborted after 15
  seconds; Railway logged `/api/chat/stream` as HTTP `200` with a 14,981 ms
  duration. The isolated Worker now also exposes `/__sse-selftest`, a synthetic
  stream that emits `event: connected` immediately, to separate generic Worker
  streaming from the Railway upstream path. This diagnostic route was added
  only to the temporary Worker (deployment `63ae9e8fbd914ef59269c88c1878bb60`,
  17:08:41 UTC).
- The authenticated registration and Chat SSE probe must be rerun from Chrome.
  Gate 1 remains blocked until its result reports registration 201, authenticated
  `/api/auth/me` 200, zero conversations, and a successful Chat SSE connection.

Run this in DevTools Console on the isolated Worker page:

```js
fetch("/__probe.js").then(r => r.text()).then(code => eval(code))
```

The probe opens Chat SSE only after it confirms the newly registered test
account has no conversations.

Before repeating that probe, check the Worker streaming path without touching
Railway or the database:

```js
(async()=>{const c=new AbortController();const t=setTimeout(()=>c.abort(),5000);try{const r=await fetch("/__sse-selftest",{signal:c.signal});const rd=r.body.getReader();const x=await rd.read();console.log("GATE1_SSE_SELFTEST",JSON.stringify({status:r.status,type:r.headers.get("content-type"),first_chunk:new TextDecoder().decode(x.value)}));await rd.cancel()}catch(e){console.log("GATE1_SSE_SELFTEST",JSON.stringify({error:e.name}))}finally{clearTimeout(t)}})()
```

Expected: HTTP `200`, `text/event-stream`, and an `event: connected` first
chunk. If that passes, rerun the authenticated `/api/chat/stream` probe; if it
fails, stop and keep the production deployment blocked.
