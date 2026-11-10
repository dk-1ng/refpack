import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { MAX_IMAGE_BYTES } from "../shared/api.ts";
import {
  addImage,
  closeLibrary,
  type Library,
  listImages,
  openLibrary,
  resolveLibraryRoot,
} from "./library.ts";
import { JPEG_BYTES, PNG_BYTES, tempLibraryRoot, WEBP_BYTES } from "./test-support.ts";

const opened: Library[] = [];
function open(root: string): Library {
  const library = openLibrary(root);
  opened.push(library);
  return library;
}
afterEach(() => {
  for (const library of opened.splice(0)) {
    try {
      closeLibrary(library);
    } catch {
      // already closed by the test
    }
  }
});

test("CA-0.1 opening a library that does not exist creates it empty", () => {
  const root = tempLibraryRoot();
  const library = open(root);
  expect(existsSync(join(root, "library.db"))).toBe(true);
  expect(existsSync(join(root, "images"))).toBe(true);
  expect(listImages(library)).toEqual([]);
});

test("CA-0.6 images are still there, in the same order, after closing and reopening", () => {
  const root = tempLibraryRoot();
  const first = open(root);
  const ids: string[] = [];
  for (const bytes of [PNG_BYTES, JPEG_BYTES, WEBP_BYTES]) {
    const result = addImage(first, { bytes, originalName: "x" });
    if (!result.ok) throw new Error("expected ok");
    ids.push(result.image.id);
  }
  closeLibrary(first);
  const second = open(root);
  expect(listImages(second).map((image) => image.id)).toEqual([ids[2], ids[1], ids[0]]);
});

test("CA-0.5 a file that is not an accepted image is refused and nothing is stored", () => {
  const library = open(tempLibraryRoot());
  const result = addImage(library, {
    bytes: new TextEncoder().encode("hello"),
    originalName: "a.txt",
  });
  expect(result).toEqual({ ok: false, code: "unsupported-type" });
  expect(readdirSync(library.imagesDir)).toEqual([]);
  expect(listImages(library)).toEqual([]);
});

test("CA-0.5 a file over 25 MB is refused and nothing is stored", () => {
  const library = open(tempLibraryRoot());
  const big = new Uint8Array(MAX_IMAGE_BYTES + 1);
  big.set(PNG_BYTES);
  const result = addImage(library, { bytes: big, originalName: "big.png" });
  expect(result).toEqual({ ok: false, code: "too-large" });
  expect(readdirSync(library.imagesDir)).toEqual([]);
  expect(listImages(library)).toEqual([]);
});

test("the original name is kept exactly, with accents, spaces and parentheses", () => {
  const library = open(tempLibraryRoot());
  addImage(library, { bytes: PNG_BYTES, originalName: "ação tela (1).png" });
  expect(listImages(library)[0]?.originalName).toBe("ação tela (1).png");
});

test("the stored file name comes from the generated id, never from the original name", () => {
  const library = open(tempLibraryRoot());
  const result = addImage(library, { bytes: PNG_BYTES, originalName: "../../evil.png" });
  if (!result.ok) throw new Error("expected ok");
  expect(result.image.fileName).toMatch(/^[0-9a-f-]{36}\.png$/);
  expect(result.image.fileName).toBe(`${result.image.id}.png`);
  const stored = readFileSync(join(library.imagesDir, result.image.fileName));
  expect(new Uint8Array(stored)).toEqual(PNG_BYTES);
});

test("resolveLibraryRoot uses REFPACK_LIBRARY when set and the home folder otherwise", () => {
  expect(resolveLibraryRoot({ REFPACK_LIBRARY: "/x/lib" }, "/home/u")).toBe("/x/lib");
  expect(resolveLibraryRoot({}, "/home/u")).toBe(join("/home/u", "refpack-library"));
  expect(resolveLibraryRoot({ REFPACK_LIBRARY: "" }, "/home/u")).toBe(
    join("/home/u", "refpack-library"),
  );
});
