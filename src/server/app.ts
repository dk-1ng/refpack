import type { AddressInfo } from "node:net";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

export type AppDeps = {
  webDir: string;
};

export function createApp(deps: AppDeps): Hono {
  const app = new Hono();
  app.use("*", serveStatic({ root: deps.webDir }));
  return app;
}

export type LocalServer = {
  address: string;
  port: number;
  close(): Promise<void>;
};

export function listenLocal(
  fetch: (request: Request) => Response | Promise<Response>,
  port: number,
): Promise<LocalServer> {
  return new Promise((resolveServer, reject) => {
    const server = serve({ fetch, port, hostname: "127.0.0.1" }, (info: AddressInfo) => {
      server.off("error", reject);
      resolveServer({
        address: info.address,
        port: info.port,
        close: () =>
          new Promise<void>((resolveClose, rejectClose) => {
            server.close((error) => (error ? rejectClose(error) : resolveClose()));
          }),
      });
    });
    server.once("error", reject);
  });
}
