# Gate 1 authenticated preview probe

This probe checks the Cloudflare routing with the browser's staging session. It uses only the isolated worker below, which forwards to the Railway **staging** service:

<https://bikerlink-website-gate1-staging.andreamasteri-nadir-radio.workers.dev/accedi>

1. Open that URL and sign in with the existing BikerLink staging test account. This hostname has its own browser cookie, so a session opened on the Railway staging hostname is not reused.
2. Open DevTools → Console on that same tab.
3. Copy the contents of [`GATE1_BROWSER_PROBE.js`](GATE1_BROWSER_PROBE.js) into the Console and run it.
4. Return only the line beginning `BIKERLINK_GATE1_CLOUDFLARE_RESULT`. The script omits response values, cookies, tokens, profile data, and WebSocket messages.

The probe makes authenticated GET requests for the previously checked profile, matching, telemetry, chat, notifications, SOS, and AI routes; opens and immediately closes the session SSE and authenticated notifications WebSocket; and submits intentionally invalid SOS/chat payloads plus an empty image form. At the verified staging backend revision, those payloads fail validation or file-presence checks before persistence, notification, or upload. The probe does **not** create a conversation/message/SOS, upload a file, or invoke a callback/webhook.

The production domain, production Worker, BikerTest Worker, DNS, Railway services, and databases are not modified by this probe.
