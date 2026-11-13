import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";
import { afterEach, expect, test } from "vitest";
import {
  ErrorSchema,
  ImageListSchema,
  ImageSchema,
  IntentSchema,
  MAX_COMMENT_LENGTH,
  MAX_IMAGE_BYTES,
  MAX_INTENT_LENGTH,
  MAX_NOTE_LENGTH,
  MarkSchema,
  PackCreatedSchema,
  TagSchema,
} from "../shared/api.ts";
import { createApp } from "./app.ts";
import { closeLibrary, type Library, openLibrary } from "./library.ts";
import { JPEG_BYTES, localRequest, PNG_BYTES, tempLibraryRoot } from "./test-support.ts";

const libraries: Library[] = [];
function makeApp() {
  const library = openLibrary(tempLibraryRoot());
  libraries.push(library);
  return createApp({ webDir: "dist/web", library, now: () => new Date(2026, 10, 9, 14, 5, 9) });
}
afterEach(() => {
  for (const library of libraries.splice(0)) closeLibrary(library);
});

function upload(app: ReturnType<typeof makeApp>, bytes: Uint8Array, name = "ação (1).png") {
  return localRequest(app, "/api/images", {
    method: "POST",
    headers: { "x-original-name": encodeURIComponent(name) },
    body: new Uint8Array(bytes),
  });
}

test("CA-0.3 POST /api/images stores the image and GET /api/images lists it first", async () => {
  const app = makeApp();
  const created = await upload(app, PNG_BYTES);
  expect(created.status).toBe(201);
  const image = ImageSchema.parse(await created.json());
  expect(image.originalName).toBe("ação (1).png");
  const listed = await localRequest(app, "/api/images");
  expect(listed.status).toBe(200);
  const list = ImageListSchema.parse(await listed.json());
  expect(list.images[0]).toEqual(image);
  expect(image.url).toBe(`/api/images/${image.id}/file`);
});

test("CA-0.5 POST /api/images answers 415 unsupported-type for a text file", async () => {
  const response = await upload(makeApp(), new TextEncoder().encode("hello"), "a.txt");
  expect(response.status).toBe(415);
  expect(await response.json()).toEqual({ error: { code: "unsupported-type" } });
});

test("CA-0.5 POST /api/images answers 413 too-large over 25 MB", async () => {
  const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
  big.set(PNG_BYTES);
  const response = await upload(makeApp(), big);
  expect(response.status).toBe(413);
  expect(await response.json()).toEqual({ error: { code: "too-large" } });
});

test("GET /api/images/:id/file returns the same bytes with the image content type", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  const response = await localRequest(app, image.url);
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toBe("image/png");
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(PNG_BYTES);
});

test("GET /api/images/:id/file answers 404 not-found for an unknown or malformed id", async () => {
  const app = makeApp();
  for (const id of ["3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", "not-a-uuid"]) {
    const response = await localRequest(app, `/api/images/${id}/file`);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
});

test("CA-0.11 the API is behind the local-only guard", async () => {
  const response = await makeApp().request("http://evil.example/api/images", {
    headers: { host: "evil.example" },
  });
  expect(response.status).toBe(403);
});

test("CA-0.7 POST /api/packs answers 201 with the absolute path and the count", async () => {
  const app = makeApp();
  await upload(app, PNG_BYTES);
  await upload(app, PNG_BYTES, "b.png");
  expect((await put(app, "/api/draft/selection", '{"selected":true}')).status).toBe(204);
  const response = await localRequest(app, "/api/packs", { method: "POST" });
  expect(response.status).toBe(201);
  const pack = PackCreatedSchema.parse(await response.json());
  expect(pack.count).toBe(2);
  expect(isAbsolute(pack.path)).toBe(true);
  expect(pack.path.endsWith("pack-20261109-140509")).toBe(true);
  expect(existsSync(pack.path)).toBe(true);
});

test("CA-2.8 POST /api/packs answers 409 nothing-selected when there are no images", async () => {
  const response = await localRequest(makeApp(), "/api/packs", { method: "POST" });
  expect(response.status).toBe(409);
  expect(ErrorSchema.parse(await response.json()).error.code).toBe("nothing-selected");
});

test("CA-2.8 POST /api/packs answers 409 nothing-selected when no image is selected", async () => {
  const app = makeApp();
  await upload(app, PNG_BYTES);
  const response = await localRequest(app, "/api/packs", { method: "POST" });
  expect(response.status).toBe(409);
  expect(ErrorSchema.parse(await response.json()).error.code).toBe("nothing-selected");
});

const UNKNOWN_ID = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";

function put(app: ReturnType<typeof makeApp>, path: string, body: string) {
  return localRequest(app, path, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body,
  });
}

async function selectedFlags(app: ReturnType<typeof makeApp>): Promise<boolean[]> {
  const listed = ImageListSchema.parse(await (await localRequest(app, "/api/images")).json());
  return listed.images.map((image) => image.selected);
}

test("CA-2.1 PUT /api/images/:id/selected stores the choice and GET /api/images shows it", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  expect(image.selected).toBe(false);
  const response = await put(app, `/api/images/${image.id}/selected`, '{"selected":true}');
  expect(response.status).toBe(204);
  expect(await selectedFlags(app)).toEqual([true]);
});

test("PUT /api/images/:id/selected answers 404 not-found for an unknown or malformed id", async () => {
  const app = makeApp();
  for (const id of [UNKNOWN_ID, "not-a-uuid"]) {
    const response = await put(app, `/api/images/${id}/selected`, '{"selected":true}');
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
});

test("PUT /api/images/:id/selected answers 400 invalid-request for a wrong body", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  for (const body of ["{}", '{"selected":"yes"}', "not json"]) {
    const response = await put(app, `/api/images/${image.id}/selected`, body);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid-request" } });
  }
  expect(await selectedFlags(app)).toEqual([false]);
});

test("CA-2.2 PUT /api/draft/selection selects every image, then none", async () => {
  const app = makeApp();
  await upload(app, PNG_BYTES);
  await upload(app, PNG_BYTES);
  expect((await put(app, "/api/draft/selection", '{"selected":true}')).status).toBe(204);
  expect(await selectedFlags(app)).toEqual([true, true]);
  expect((await put(app, "/api/draft/selection", '{"selected":false}')).status).toBe(204);
  expect(await selectedFlags(app)).toEqual([false, false]);
});

test("CA-0.11 the selection routes are behind the local-only guard", async () => {
  const response = await makeApp().request("http://evil.example/api/draft/selection", {
    method: "PUT",
    headers: { host: "evil.example", "content-type": "application/json" },
    body: '{"selected":true}',
  });
  expect(response.status).toBe(403);
});

const INTENT = "  # Painel de açaí 🍇\n\n\t* Para quem vende na feira.\n`rápido` & simples  \n";

async function readIntent(app: ReturnType<typeof makeApp>): Promise<string> {
  const response = await localRequest(app, "/api/draft");
  expect(response.status).toBe(200);
  return IntentSchema.parse(await response.json()).intent;
}

test("CA-2.4 PUT /api/draft/intent stores the text and GET /api/draft returns it unchanged", async () => {
  const app = makeApp();
  expect(await readIntent(app)).toBe("");
  const response = await put(app, "/api/draft/intent", JSON.stringify({ intent: INTENT }));
  expect(response.status).toBe(204);
  expect(await readIntent(app)).toBe(INTENT);
});

test("PUT /api/draft/intent takes 10 000 characters and refuses 10 001", async () => {
  const app = makeApp();
  const ok = "x".repeat(MAX_INTENT_LENGTH);
  expect((await put(app, "/api/draft/intent", JSON.stringify({ intent: ok }))).status).toBe(204);
  const refused = await put(
    app,
    "/api/draft/intent",
    JSON.stringify({ intent: "x".repeat(MAX_INTENT_LENGTH + 1) }),
  );
  expect(refused.status).toBe(400);
  expect(ErrorSchema.parse(await refused.json()).error.code).toBe("invalid-request");
  expect(await readIntent(app)).toBe(ok);
});

test("PUT /api/draft/intent answers 400 invalid-request for a wrong body", async () => {
  const app = makeApp();
  for (const body of ["{}", '{"intent":5}', "not json"]) {
    const response = await put(app, "/api/draft/intent", body);
    expect(response.status).toBe(400);
    expect(ErrorSchema.parse(await response.json()).error.code).toBe("invalid-request");
  }
  expect(await readIntent(app)).toBe("");
});

test("PUT /api/draft/intent answers 413 too-large above 128 KiB", async () => {
  const app = makeApp();
  const response = await put(app, "/api/draft/intent", "x".repeat(128 * 1024 + 1));
  expect(response.status).toBe(413);
  expect(ErrorSchema.parse(await response.json()).error.code).toBe("too-large");
});

test("CA-0.11 the intent routes are behind the local-only guard", async () => {
  const app = makeApp();
  const get = await app.request("http://evil.example/api/draft", {
    headers: { host: "evil.example" },
  });
  expect(get.status).toBe(403);
  const response = await app.request("http://evil.example/api/draft/intent", {
    method: "PUT",
    headers: { host: "evil.example", "content-type": "application/json" },
    body: '{"intent":"x"}',
  });
  expect(response.status).toBe(403);
});

const NOTE = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";

async function notes(app: ReturnType<typeof makeApp>): Promise<string[]> {
  const listed = ImageListSchema.parse(await (await localRequest(app, "/api/images")).json());
  return listed.images.map((image) => image.note);
}

test("CA-3.2 PUT /api/images/:id/note stores the text and GET /api/images returns it unchanged", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  expect(image.note).toBe("");
  const response = await put(app, `/api/images/${image.id}/note`, JSON.stringify({ note: NOTE }));
  expect(response.status).toBe(204);
  expect(await notes(app)).toEqual([NOTE]);
});

test("PUT /api/images/:id/note takes 10 000 characters and refuses 10 001", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  const path = `/api/images/${image.id}/note`;
  const ok = "x".repeat(MAX_NOTE_LENGTH);
  expect((await put(app, path, JSON.stringify({ note: ok }))).status).toBe(204);
  const refused = await put(app, path, JSON.stringify({ note: `${ok}x` }));
  expect(refused.status).toBe(400);
  expect(ErrorSchema.parse(await refused.json()).error.code).toBe("invalid-request");
  expect(await notes(app)).toEqual([ok]);
});

test("PUT /api/images/:id/note answers 404 not-found for an unknown or malformed id", async () => {
  const app = makeApp();
  for (const id of [UNKNOWN_ID, "not-a-uuid"]) {
    const response = await put(app, `/api/images/${id}/note`, JSON.stringify({ note: "x" }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
});

test("PUT /api/images/:id/note answers 400 invalid-request for a wrong body", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  for (const body of ["{}", '{"note":5}', "not json"]) {
    const response = await put(app, `/api/images/${image.id}/note`, body);
    expect(response.status).toBe(400);
    expect(ErrorSchema.parse(await response.json()).error.code).toBe("invalid-request");
  }
  expect(await notes(app)).toEqual([""]);
});

test("PUT /api/images/:id/note answers 413 too-large above 128 KiB", async () => {
  const app = makeApp();
  const image = ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
  const response = await put(app, `/api/images/${image.id}/note`, "x".repeat(128 * 1024 + 1));
  expect(response.status).toBe(413);
  expect(ErrorSchema.parse(await response.json()).error.code).toBe("too-large");
});

test("CA-0.11 the note route is behind the local-only guard", async () => {
  const response = await makeApp().request(`http://evil.example/api/images/${UNKNOWN_ID}/note`, {
    method: "PUT",
    headers: { host: "evil.example", "content-type": "application/json" },
    body: '{"note":"x"}',
  });
  expect(response.status).toBe(403);
});

const COMMENT = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";
const AREA = { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 };
const CROP = PNG_BYTES;
const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";
const MARK_QUERY = "kind=like&left=0.1&top=0.2&right=0.4&bottom=0.9";

function postMark(
  app: ReturnType<typeof makeApp>,
  imageId: string,
  query = MARK_QUERY,
  body: Uint8Array = CROP,
) {
  return localRequest(app, `/api/images/${imageId}/marks?${query}`, {
    method: "POST",
    body: new Uint8Array(body),
  });
}

async function listedMarks(app: ReturnType<typeof makeApp>) {
  const listed = ImageListSchema.parse(await (await localRequest(app, "/api/images")).json());
  return listed.images[0]?.marks;
}

async function uploaded(app: ReturnType<typeof makeApp>) {
  return ImageSchema.parse(await (await upload(app, PNG_BYTES)).json());
}

test("CA-4.2 POST /api/images/:id/marks creates a mark and GET /api/images returns it", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  expect(image.marks).toEqual([]);
  const response = await postMark(app, image.id);
  expect(response.status).toBe(201);
  const created = MarkSchema.parse(await response.json());
  expect(created).toEqual({ id: created.id, kind: "like", area: AREA, comment: "" });
  expect(await listedMarks(app)).toEqual([created]);
});

test("POST /api/images/:id/marks answers 400 invalid-request for a wrong kind or area", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const queries = [
    "left=0.1&top=0.2&right=0.4&bottom=0.9",
    "kind=love&left=0.1&top=0.2&right=0.4&bottom=0.9",
    "kind=like&left=abc&top=0.2&right=0.4&bottom=0.9",
    "kind=like&left=0.1&top=0.2&right=0.4",
    "kind=like&left=0.5&top=0.2&right=0.5&bottom=0.9",
    "kind=like&left=0.6&top=0.2&right=0.4&bottom=0.9",
    "kind=like&left=0.1&top=0.2&right=1.2&bottom=0.9",
    "kind=like&left=0.1&top=-0.1&right=0.4&bottom=0.9",
  ];
  for (const query of queries) {
    const response = await postMark(app, image.id, query);
    expect(response.status, query).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid-request" } });
  }
  expect(await listedMarks(app)).toEqual([]);
});

test("POST /api/images/:id/marks answers 404 for an unknown or malformed image id and 415 for a crop that is not a PNG", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  for (const id of [UNKNOWN, "not-a-uuid"]) {
    const response = await postMark(app, id);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
  const jpeg = await postMark(app, image.id, MARK_QUERY, JPEG_BYTES);
  expect(jpeg.status).toBe(415);
  expect(await jpeg.json()).toEqual({ error: { code: "unsupported-type" } });
  expect(await listedMarks(app)).toEqual([]);
});

test("CA-4.4 CA-4.5 PUT /api/marks/:id/comment and /kind store the change and GET /api/images returns it", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = MarkSchema.parse(await (await postMark(app, image.id)).json());
  const comment = await put(
    app,
    `/api/marks/${created.id}/comment`,
    JSON.stringify({ comment: COMMENT }),
  );
  expect(comment.status).toBe(204);
  const kind = await put(app, `/api/marks/${created.id}/kind`, '{"kind":"dislike"}');
  expect(kind.status).toBe(204);
  expect(await listedMarks(app)).toEqual([
    { id: created.id, kind: "dislike", area: AREA, comment: COMMENT },
  ]);
});

test("PUT /api/marks/:id/comment takes 2 000 characters and refuses 2 001", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = MarkSchema.parse(await (await postMark(app, image.id)).json());
  const ok = "x".repeat(MAX_COMMENT_LENGTH);
  expect(
    (await put(app, `/api/marks/${created.id}/comment`, JSON.stringify({ comment: ok }))).status,
  ).toBe(204);
  const tooLong = await put(
    app,
    `/api/marks/${created.id}/comment`,
    JSON.stringify({ comment: `${ok}x` }),
  );
  expect(tooLong.status).toBe(400);
  expect(await tooLong.json()).toEqual({ error: { code: "invalid-request" } });
  expect((await listedMarks(app))?.[0]?.comment).toBe(ok);
});

test("the mark routes answer 400 for a wrong body, 404 for an unknown or malformed id, and 413 above 128 KiB", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = MarkSchema.parse(await (await postMark(app, image.id)).json());
  for (const body of ["{}", '{"kind":"love"}', "not json"]) {
    const response = await put(app, `/api/marks/${created.id}/kind`, body);
    expect(response.status, body).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid-request" } });
  }
  for (const body of ["{}", '{"comment":5}', "not json"]) {
    const response = await put(app, `/api/marks/${created.id}/comment`, body);
    expect(response.status, body).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid-request" } });
  }
  for (const id of [UNKNOWN, "not-a-uuid"]) {
    const responses = [
      await put(app, `/api/marks/${id}/kind`, '{"kind":"like"}'),
      await put(app, `/api/marks/${id}/comment`, '{"comment":"x"}'),
      await localRequest(app, `/api/marks/${id}`, { method: "DELETE" }),
    ];
    for (const response of responses) {
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: { code: "not-found" } });
    }
  }
  const big = await put(app, `/api/marks/${created.id}/comment`, "x".repeat(128 * 1024 + 1));
  expect(big.status).toBe(413);
  expect(await big.json()).toEqual({ error: { code: "too-large" } });
});

test("CA-4.6 DELETE /api/marks/:id removes the mark", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const first = MarkSchema.parse(await (await postMark(app, image.id)).json());
  const second = MarkSchema.parse(await (await postMark(app, image.id)).json());
  const removed = await localRequest(app, `/api/marks/${first.id}`, { method: "DELETE" });
  expect(removed.status).toBe(204);
  expect(await listedMarks(app)).toEqual([second]);
  const again = await localRequest(app, `/api/marks/${first.id}`, { method: "DELETE" });
  expect(again.status).toBe(404);
});

test("CA-0.11 the mark routes are behind the local-only guard", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = MarkSchema.parse(await (await postMark(app, image.id)).json());
  const requests: [string, string, BodyInit | undefined][] = [
    ["POST", `/api/images/${image.id}/marks?${MARK_QUERY}`, new Uint8Array(CROP)],
    ["PUT", `/api/marks/${created.id}/kind`, '{"kind":"dislike"}'],
    ["PUT", `/api/marks/${created.id}/comment`, '{"comment":"x"}'],
    ["DELETE", `/api/marks/${created.id}`, undefined],
  ];
  for (const [method, path, body] of requests) {
    const response = await app.request(`http://evil.example${path}`, {
      method,
      headers: { host: "evil.example", "content-type": "application/json" },
      body,
    });
    expect(response.status, `${method} ${path}`).toBe(403);
  }
  expect(await listedMarks(app)).toEqual([created]);
});

const FANCY = 'Dashboard "escuro" \\ ✨';
const tagsOf = (id: string) => `/api/images/${id}/tags`;

function postTag(app: ReturnType<typeof makeApp>, imageId: string, body: unknown) {
  return localRequest(app, tagsOf(imageId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function listedImages(app: ReturnType<typeof makeApp>) {
  return ImageListSchema.parse(await (await localRequest(app, "/api/images")).json()).images;
}

test("CA-5.1 POST /api/images/:id/tags puts the tag on the image and GET /api/images returns it", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  expect(image.tags).toEqual([]);
  const response = await postTag(app, image.id, { name: FANCY });
  expect(response.status).toBe(201);
  const created = TagSchema.parse(await response.json());
  expect(created.name).toBe(FANCY);
  expect((await listedImages(app))[0]?.tags).toEqual([created]);
});

test("CA-5.2 POST /api/images/:id/tags drops the spaces at the ends, reuses a tag by case, and answers 200 when the image already has it", async () => {
  const app = makeApp();
  const a = await uploaded(app);
  const b = ImageSchema.parse(await (await upload(app, JPEG_BYTES, "b.jpg")).json());
  const first = await postTag(app, a.id, { name: "  dashboard " });
  expect(first.status).toBe(201);
  const created = TagSchema.parse(await first.json());
  expect(created.name).toBe("dashboard");
  const second = await postTag(app, b.id, { name: "Dashboard" });
  expect(second.status).toBe(201);
  expect(await second.json()).toEqual(created);
  const third = await postTag(app, b.id, { name: "DASHBOARD" });
  expect(third.status).toBe(200);
  expect(await third.json()).toEqual(created);
  const images = await listedImages(app);
  expect(images[0]?.tags).toEqual([created]);
  expect(images[1]?.tags).toEqual([created]);
});

test("POST /api/images/:id/tags answers 400 for a wrong body, 404 for an unknown or malformed image, and 413 above 128 KiB", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  for (const body of [
    "{}",
    '{"name":""}',
    '{"name":"   "}',
    '{"name":5}',
    "not json",
    { name: "x".repeat(61) },
  ]) {
    const response = await postTag(app, image.id, body);
    expect(response.status, JSON.stringify(body)).toBe(400);
    expect(await response.json()).toEqual({ error: { code: "invalid-request" } });
  }
  expect((await postTag(app, image.id, { name: "x".repeat(60) })).status).toBe(201);
  expect((await postTag(app, image.id, { name: ` ${"y".repeat(60)} ` })).status).toBe(201);
  for (const id of [UNKNOWN, "not-a-uuid"]) {
    const response = await postTag(app, id, { name: "ok" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
  const big = await postTag(app, image.id, "x".repeat(128 * 1024 + 1));
  expect(big.status).toBe(413);
  expect(await big.json()).toEqual({ error: { code: "too-large" } });
});

test("CA-5.4 DELETE /api/images/:id/tags/:tagId takes the tag off the image", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = TagSchema.parse(await (await postTag(app, image.id, { name: "x" })).json());
  const path = `${tagsOf(image.id)}/${created.id}`;
  expect((await localRequest(app, path, { method: "DELETE" })).status).toBe(204);
  expect((await listedImages(app))[0]?.tags).toEqual([]);
  expect((await localRequest(app, path, { method: "DELETE" })).status).toBe(404);
  for (const bad of [`${tagsOf(UNKNOWN)}/${created.id}`, `${tagsOf(image.id)}/not-a-uuid`]) {
    const response = await localRequest(app, bad, { method: "DELETE" });
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: { code: "not-found" } });
  }
});

test("CA-5.7 PUT /api/draft/selection with a tagId selects only the images with that tag", async () => {
  const app = makeApp();
  const a = await uploaded(app);
  await upload(app, JPEG_BYTES, "b.jpg");
  const c = await uploaded(app);
  const ui = TagSchema.parse(await (await postTag(app, a.id, { name: "ui" })).json());
  await postTag(app, c.id, { name: "ui" });
  const putSelection = (body: string) => put(app, "/api/draft/selection", body);
  expect((await putSelection(JSON.stringify({ selected: true, tagId: ui.id }))).status).toBe(204);
  expect(await selectedFlags(app)).toEqual([true, false, true]);
  expect((await putSelection(JSON.stringify({ selected: false, tagId: ui.id }))).status).toBe(204);
  expect(await selectedFlags(app)).toEqual([false, false, false]);
  const unknown = await putSelection(JSON.stringify({ selected: true, tagId: UNKNOWN }));
  expect(unknown.status).toBe(404);
  expect(await unknown.json()).toEqual({ error: { code: "not-found" } });
  const bad = await putSelection(JSON.stringify({ selected: true, tagId: "x" }));
  expect(bad.status).toBe(400);
  expect(await selectedFlags(app)).toEqual([false, false, false]);
  expect((await putSelection('{"selected":true}')).status).toBe(204);
  expect(await selectedFlags(app)).toEqual([true, true, true]);
});

test("CA-0.11 the tag routes are behind the local-only guard", async () => {
  const app = makeApp();
  const image = await uploaded(app);
  const created = TagSchema.parse(await (await postTag(app, image.id, { name: "x" })).json());
  const requests: [string, string, BodyInit | undefined][] = [
    ["POST", tagsOf(image.id), '{"name":"y"}'],
    ["DELETE", `${tagsOf(image.id)}/${created.id}`, undefined],
  ];
  for (const [method, path, body] of requests) {
    const response = await app.request(`http://evil.example${path}`, {
      method,
      headers: { host: "evil.example", "content-type": "application/json" },
      body,
    });
    expect(response.status, `${method} ${path}`).toBe(403);
  }
  expect((await listedImages(app))[0]?.tags).toEqual([created]);
});
