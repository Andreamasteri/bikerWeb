# Gate 1 isolated Chat SSE origin fix

On 20 November 2026, the disposable Cloudflare Worker
`bikerlink-chat-sse-isolation-20261120` forwarded the staging Workers.dev
hostname in the `Origin` header while sending the request to the isolated
Railway backend. The backend's origin guard rejected the registration with
HTTP 403 (`Richiesta non autorizzata`) before creating an account.

The temporary Worker now rewrites only `Origin` to the isolated Railway
backend origin, matching the production Worker proxy's Railway-origin
handling. It still forwards traffic only to the isolated test backend; neither
the staging Worker, staging backend, production backend, nor DNS was changed.
The Worker module update succeeded through the Cloudflare API at 14:04:59 UTC
and returned deployment ID `97f0332076c841abb8c527d5274da37a`.

## Verification state

- Direct isolated Railway `/api/health`: HTTP 200, revision
  `cfd0f224d2718eb1a4ae95d4c8910c3b31bfc374`, DB circuit closed. The health
  payload reports `degraded` due to existing watchdog observations.
- After the Worker update, the execution environment's unauthenticated request
  to the Worker was blocked with HTTP 403 before reaching the Worker. This
  environment therefore cannot verify the updated browser-origin request.
- The authenticated registration and Chat SSE probe must be rerun from Chrome.
  Gate 1 remains blocked until its result reports registration 201, authenticated
  `/api/auth/me` 200, zero conversations, and a successful Chat SSE connection.

Run this in DevTools Console on the isolated Worker page:

```js
fetch("/__probe.js").then(r => r.text()).then(code => eval(code))
```

The probe opens Chat SSE only after it confirms the newly registered test
account has no conversations.
