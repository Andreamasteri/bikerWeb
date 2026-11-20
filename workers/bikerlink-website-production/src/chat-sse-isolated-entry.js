import worker from "./worker.js";

const ALLOWED_PATH = "/api/chat/stream";

export default {
  fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname !== ALLOWED_PATH) {
      return new Response("Not Found", {
        status: 404,
        headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      });
    }
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { allow: "GET", "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
      });
    }
    return worker.fetch(request, env, ctx);
  },
};
