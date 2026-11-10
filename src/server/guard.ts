import type { MiddlewareHandler } from "hono";
import type { ErrorCode } from "../shared/api.ts";

const LOCAL_HOST = /^(127\.0\.0\.1|localhost):\d+$/;

export function localOnly(): MiddlewareHandler {
  return async (c, next) => {
    c.header("X-Content-Type-Options", "nosniff");
    const host = c.req.header("host");
    let allowed = host !== undefined && LOCAL_HOST.test(host);
    if (allowed && c.req.path.startsWith("/api/")) {
      const origin = c.req.header("origin");
      const site = c.req.header("sec-fetch-site");
      if (origin !== undefined && origin !== `http://${host}`) allowed = false;
      if (site !== undefined && site !== "same-origin" && site !== "none") allowed = false;
    }
    if (!allowed) {
      const code: ErrorCode = "forbidden";
      return c.json({ error: { code } }, 403);
    }
    await next();
  };
}
