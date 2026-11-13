import { readFile } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  AreaSchema,
  type ErrorCode,
  type Image,
  IntentSchema,
  MAX_CROP_BYTES,
  MAX_IMAGE_BYTES,
  MarkCommentSchema,
  MarkKindBodySchema,
  MarkKindSchema,
  NoteSchema,
  SelectedBodySchema,
  SelectionBodySchema,
  TagBodySchema,
  TagSchema,
} from "../shared/api.ts";
import { getIntent, setAllSelected, setIntent, setSelected } from "./draft.ts";
import { localOnly } from "./guard.ts";
import {
  addImage,
  findImage,
  type Library,
  listImages,
  type StoredImage,
  setNote,
} from "./library.ts";
import {
  addMark,
  deleteMark,
  listMarks,
  type StoredMark,
  setMarkComment,
  setMarkKind,
} from "./marks.ts";
import { createPack } from "./pack.ts";
import { addTag, listTags, removeTag, type StoredTag } from "./tags.ts";

const MAX_TEXT_REQUEST_BYTES = 128 * 1024;

export type AppDeps = {
  webDir: string;
  library: Library;
  now: () => Date;
};

function errorBody(code: ErrorCode): { error: { code: ErrorCode } } {
  return { error: { code } };
}

function toImage(image: StoredImage, marks: StoredMark[], tags: StoredTag[]): Image {
  return {
    id: image.id,
    originalName: image.originalName,
    url: `/api/images/${image.id}/file`,
    selected: image.selected,
    note: image.note,
    marks: marks.map((mark) => ({
      id: mark.id,
      kind: mark.kind,
      area: mark.area,
      comment: mark.comment,
    })),
    tags: tags.map((tag) => ({ id: tag.id, name: tag.name })),
  };
}

function parseMarkQuery(query: Record<string, string>) {
  const edge = (value: string | undefined): number =>
    value === undefined || value.trim() === "" ? Number.NaN : Number(value);
  const kind = MarkKindSchema.safeParse(query.kind);
  const area = AreaSchema.safeParse({
    left: edge(query.left),
    top: edge(query.top),
    right: edge(query.right),
    bottom: edge(query.bottom),
  });
  return kind.success && area.success ? { kind: kind.data, area: area.data } : null;
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

async function readSelectedBody(request: Request): Promise<boolean | null> {
  try {
    const parsed = SelectedBodySchema.safeParse(await request.json());
    return parsed.success ? parsed.data.selected : null;
  } catch {
    return null;
  }
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

  app.get("/api/images", (c) => {
    const marks = listMarks(library);
    const tags = listTags(library);
    return c.json({
      images: listImages(library).map((image) =>
        toImage(image, marks.get(image.id) ?? [], tags.get(image.id) ?? []),
      ),
    });
  });

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
      return c.json(toImage(result.image, [], []), 201);
    },
  );

  app.get("/api/images/:id/file", async (c) => {
    const image = findImage(library, c.req.param("id"));
    if (image === null) return c.json(errorBody("not-found"), 404);
    const bytes = await readFile(join(library.imagesDir, image.fileName));
    return c.body(new Uint8Array(bytes), 200, { "content-type": image.mimeType });
  });

  app.put("/api/images/:id/selected", async (c) => {
    const selected = await readSelectedBody(c.req.raw);
    if (selected === null) return c.json(errorBody("invalid-request"), 400);
    if (!setSelected(library, c.req.param("id"), selected)) {
      return c.json(errorBody("not-found"), 404);
    }
    return c.body(null, 204);
  });

  app.put(
    "/api/images/:id/note",
    bodyLimit({
      maxSize: MAX_TEXT_REQUEST_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(errorBody("invalid-request"), 400);
      }
      const parsed = NoteSchema.safeParse(body);
      if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
      if (!setNote(library, c.req.param("id"), parsed.data.note)) {
        return c.json(errorBody("not-found"), 404);
      }
      return c.body(null, 204);
    },
  );

  app.post(
    "/api/images/:id/marks",
    bodyLimit({
      maxSize: MAX_CROP_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      const input = parseMarkQuery(c.req.query());
      if (input === null) return c.json(errorBody("invalid-request"), 400);
      const crop = new Uint8Array(await c.req.arrayBuffer());
      const result = addMark(library, c.req.param("id"), { ...input, crop });
      if (!result.ok) {
        return result.code === "not-found"
          ? c.json(errorBody("not-found"), 404)
          : c.json(errorBody("unsupported-type"), 415);
      }
      const { id, kind, area, comment } = result.mark;
      return c.json({ id, kind, area, comment }, 201);
    },
  );

  app.post(
    "/api/images/:id/tags",
    bodyLimit({
      maxSize: MAX_TEXT_REQUEST_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      const parsed = TagBodySchema.safeParse(await readJson(c.req.raw));
      if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
      const result = addTag(library, c.req.param("id"), parsed.data.name);
      if (!result.ok) return c.json(errorBody("not-found"), 404);
      return c.json(TagSchema.parse(result.tag), result.linked ? 201 : 200);
    },
  );

  app.delete("/api/images/:id/tags/:tagId", (c) => {
    if (!removeTag(library, c.req.param("id"), c.req.param("tagId"))) {
      return c.json(errorBody("not-found"), 404);
    }
    return c.body(null, 204);
  });

  app.put(
    "/api/marks/:id/kind",
    bodyLimit({
      maxSize: MAX_TEXT_REQUEST_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      const parsed = MarkKindBodySchema.safeParse(await readJson(c.req.raw));
      if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
      if (!setMarkKind(library, c.req.param("id"), parsed.data.kind)) {
        return c.json(errorBody("not-found"), 404);
      }
      return c.body(null, 204);
    },
  );

  app.put(
    "/api/marks/:id/comment",
    bodyLimit({
      maxSize: MAX_TEXT_REQUEST_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      const parsed = MarkCommentSchema.safeParse(await readJson(c.req.raw));
      if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
      if (!setMarkComment(library, c.req.param("id"), parsed.data.comment)) {
        return c.json(errorBody("not-found"), 404);
      }
      return c.body(null, 204);
    },
  );

  app.delete("/api/marks/:id", (c) => {
    if (!deleteMark(library, c.req.param("id"))) return c.json(errorBody("not-found"), 404);
    return c.body(null, 204);
  });

  app.put("/api/draft/selection", async (c) => {
    const parsed = SelectionBodySchema.safeParse(await readJson(c.req.raw));
    if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
    if (!setAllSelected(library, parsed.data.selected, parsed.data.tagId)) {
      return c.json(errorBody("not-found"), 404);
    }
    return c.body(null, 204);
  });

  app.get("/api/draft", (c) => c.json({ intent: getIntent(library) }));

  app.put(
    "/api/draft/intent",
    bodyLimit({
      maxSize: MAX_TEXT_REQUEST_BYTES,
      onError: (c) => c.json(errorBody("too-large"), 413),
    }),
    async (c) => {
      let body: unknown;
      try {
        body = await c.req.json();
      } catch {
        return c.json(errorBody("invalid-request"), 400);
      }
      const parsed = IntentSchema.safeParse(body);
      if (!parsed.success) return c.json(errorBody("invalid-request"), 400);
      setIntent(library, parsed.data.intent);
      return c.body(null, 204);
    },
  );

  app.post("/api/packs", (c) => {
    const result = createPack(library, deps.now());
    if (!result.ok) return c.json(errorBody("nothing-selected"), 409);
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
