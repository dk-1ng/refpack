import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { type ErrorCode, type Image, MAX_IMAGE_BYTES } from "../shared/api.ts";
import { localOnly } from "./guard.ts";
import { addImage, findImage, type Library, listImages, type StoredImage } from "./library.ts";
import { createPack } from "./pack.ts";

export type AppDeps = {
  webDir: string;
  library: Library;
  now: () => Date;
};

function errorBody(code: ErrorCode): { error: { code: ErrorCode } } {
  return { error: { code } };
}

function toImage(image: StoredImage): Image {
  return {
    id: image.id,
    originalName: image.originalName,
    url: `/api/images/${image.id}/file`,
  };
}

function decodeName(header: string | undefined): string {
  if (header === undefined) return "";
  try {
    return decodeURIComponent(header);
  } catch {
    return header;
  }
}

export function createApp(deps: AppDeps): Hono {
  const { library } = deps;
  const app = new Hono();
  app.use("*", localOnly());

  app.get("/api/images", (c) => c.json({ images: listImages(library).map(toImage) }));

  app.post(
    "/api/images",
    bodyLimit({
      maxSize: MAX_IMAGE_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      const bytes = new Uint8Array(await c.req.arrayBuffer());
      const originalName = decodeName(c.req.header("x-original-name"));
      const result = addImage(library, { bytes, originalName });
      if (!result.ok) {
        return result.code === "too-large"
          ? c.json(errorBody("too-large"), 413)
          : c.json(errorBody("unsupported-type"), 415);
      }
      return c.json(toImage(result.image), 201);
    },
  );

  app.get("/api/images/:id/file", async (c) => {
    const image = findImage(library, c.req.param("id"));
    if (image === null) return c.json(errorBody("not-found"), 404);
    const bytes = await readFile(join(library.imagesDir, image.fileName));
    return c.body(new Uint8Array(bytes), 200, { "content-type": image.mimeType });
  });

  app.post("/api/packs", (c) => {
    const result = createPack(library, deps.now());
    if (!result.ok) return c.json(errorBody("empty-library"), 409);
    return c.json({ path: result.path, count: result.count }, 201);
  });

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
