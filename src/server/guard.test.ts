import { Hono } from "hono";
import { expect, test } from "vitest";
import { listenLocal } from "./app.ts";
import { localOnly } from "./guard.ts";

function makeApp(): Hono {
  const app = new Hono();
  app.use("*", localOnly());
  app.get("/api/x", (c) => c.json({ ok: true }));
  app.get("/page", (c) => c.text("page"));
  return app;
}

const ok = { host: "127.0.0.1:4747" };

test("CA-0.11 a request with a foreign Host header is refused", async () => {
  const response = await makeApp().request("http://evil.example/api/x", {
    headers: { host: "evil.example" },
  });
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: { code: "forbidden" } });
});

test("CA-0.11 a request with no Host header is refused", async () => {
  const response = await makeApp().request("/page");
  expect(response.status).toBe(403);
});

test("CA-0.11 an API request from another origin is refused", async () => {
  const response = await makeApp().request("http://127.0.0.1:4747/api/x", {
    headers: { ...ok, origin: "http://evil.example" },
  });
  expect(response.status).toBe(403);
});

test("CA-0.11 a cross-site or same-site API request is refused", async () => {
  for (const site of ["cross-site", "same-site"]) {
    const response = await makeApp().request("http://127.0.0.1:4747/api/x", {
      headers: { ...ok, "sec-fetch-site": site },
    });
    expect(response.status).toBe(403);
  }
});

test("CA-0.11 a same-origin request from 127.0.0.1 or localhost passes", async () => {
  const app = makeApp();
  for (const host of ["127.0.0.1:4747", "localhost:4747"]) {
    const plain = await app.request(`http://${host}/api/x`, { headers: { host } });
    expect(plain.status).toBe(200);
    const withOrigin = await app.request(`http://${host}/api/x`, {
      headers: { host, origin: `http://${host}`, "sec-fetch-site": "same-origin" },
    });
    expect(withOrigin.status).toBe(200);
  }
});

test("a page opened from a link on another site still loads", async () => {
  const response = await makeApp().request("http://127.0.0.1:4747/page", {
    headers: { ...ok, "sec-fetch-site": "cross-site" },
  });
  expect(response.status).toBe(200);
});

test("every response carries X-Content-Type-Options: nosniff", async () => {
  const app = makeApp();
  const good = await app.request("http://127.0.0.1:4747/page", { headers: ok });
  const bad = await app.request("http://evil.example/page", { headers: { host: "evil.example" } });
  expect(good.headers.get("x-content-type-options")).toBe("nosniff");
  expect(bad.headers.get("x-content-type-options")).toBe("nosniff");
});

test("CA-0.11 the server listens on 127.0.0.1 only", async () => {
  const server = await listenLocal(makeApp().fetch, 0);
  try {
    expect(server.address).toBe("127.0.0.1");
  } finally {
    await server.close();
  }
});
