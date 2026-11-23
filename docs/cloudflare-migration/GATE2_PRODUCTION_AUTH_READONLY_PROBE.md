# Gate 2: authenticated production read-only probe

This probe checks the authenticated API path on the official domain after the Cloudflare cutover. It uses the browser's existing BikerLink session and reports only statuses, response types, timing, and the backend revision. It never prints or sends credentials to another origin. It sends no POST requests and does not create messages, chats, SOS events, uploads, or notifications.

1. In Chrome, open `https://biker-link.net/area-utente` and sign in normally if needed.
2. On that same `biker-link.net` tab, open DevTools → Console.
3. Copy the complete contents of [`GATE2_PRODUCTION_AUTH_READONLY_PROBE.js`](GATE2_PRODUCTION_AUTH_READONLY_PROBE.js) into the console and run it.
4. Return only the line beginning `BIKERLINK_GATE2_PRODUCTION_READONLY_RESULT`. Do not copy request headers, cookies, tokens, or full response bodies.

The probe covers `/api/auth/me`, profile, matching preferences, accepted matches, telemetry, conversations count, notifications, SOS read, AI config, authenticated session SSE and the notification WebSocket hello handshake. It deliberately does not open Chat SSE on production: that stream can update presence for other conversation participants. Chat SSE transport passed the isolated Worker test before cutover. The probe closes SSE and WebSocket immediately after the initial connected/hello signal.
