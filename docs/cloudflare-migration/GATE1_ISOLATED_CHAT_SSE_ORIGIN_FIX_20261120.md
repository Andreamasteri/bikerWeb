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
- The authenticated registration and Chat SSE probe must be rerun from Chrome.
  Gate 1 remains blocked until its result reports registration 201, authenticated
  `/api/auth/me` 200, zero conversations, and a successful Chat SSE connection.

Run this in DevTools Console on the isolated Worker page:

```js
fetch("/__probe.js").then(r => r.text()).then(code => eval(code))
```

The probe opens Chat SSE only after it confirms the newly registered test
account has no conversations.
