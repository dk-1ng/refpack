import { existsSync } from "node:fs";
import { isAbsolute } from "node:path";
import { afterEach, expect, test } from "vitest";
import {
  ErrorSchema,
  ImageListSchema,
  ImageSchema,
  MAX_IMAGE_BYTES,
  PackCreatedSchema,
} from "../shared/api.ts";
import { createApp } from "./app.ts";
import { closeLibrary, type Library, openLibrary } from "./library.ts";
import { localRequest, PNG_BYTES, tempLibraryRoot } from "./test-support.ts";

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
  const response = await localRequest(app, "/api/packs", { method: "POST" });
  expect(response.status).toBe(201);
  const pack = PackCreatedSchema.parse(await response.json());
  expect(pack.count).toBe(2);
  expect(isAbsolute(pack.path)).toBe(true);
  expect(pack.path.endsWith("pack-20261109-140509")).toBe(true);
  expect(existsSync(pack.path)).toBe(true);
});

test("POST /api/packs answers 409 empty-library when there are no images", async () => {
  const response = await localRequest(makeApp(), "/api/packs", { method: "POST" });
  expect(response.status).toBe(409);
  expect(ErrorSchema.parse(await response.json()).error.code).toBe("empty-library");
});
