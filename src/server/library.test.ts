import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, test } from "vitest";
import { MAX_IMAGE_BYTES } from "../shared/api.ts";
import { getIntent, setAllSelected, setSelected } from "./draft.ts";
import {
  addImage,
  closeLibrary,
  findImage,
  type Library,
  listImages,
  openLibrary,
  resolveLibraryRoot,
  setNote,
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

test("CA-0.6 a library created before slice 2 opens with every image unselected", () => {
  const root = tempLibraryRoot();
  mkdirSync(join(root, "images"), { recursive: true });
  const old = new DatabaseSync(join(root, "library.db"));
  old.exec(readFileSync(join(import.meta.dirname, "migrations", "001-images.sql"), "utf8"));
  old.exec("PRAGMA user_version = 1");
  old
    .prepare("INSERT INTO images (id, original_name, mime_type) VALUES (?, ?, ?)")
    .run("3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", "antiga.png", "image/png");
  old.close();
  const library = open(root);
  expect(listImages(library)).toEqual([
    {
      id: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f",
      originalName: "antiga.png",
      mimeType: "image/png",
      fileName: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f.png",
      selected: false,
      note: "",
    },
  ]);
  expect(getIntent(library)).toBe("");
});

const NOTE = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";

function twoImages(library: Library) {
  const a = addImage(library, { bytes: PNG_BYTES, originalName: "a.png" });
  const b = addImage(library, { bytes: JPEG_BYTES, originalName: "b.jpg" });
  if (!a.ok || !b.ok) throw new Error("setup failed");
  return { a: a.image, b: b.image };
}

test("CA-0.6 a library created before slice 3 opens with empty notes and keeps selection and intent", () => {
  const root = tempLibraryRoot();
  mkdirSync(join(root, "images"), { recursive: true });
  const old = new DatabaseSync(join(root, "library.db"));
  for (const name of ["001-images.sql", "002-image-selected.sql", "003-pack-draft.sql"]) {
    old.exec(readFileSync(join(import.meta.dirname, "migrations", name), "utf8"));
  }
  old.exec("PRAGMA user_version = 3");
  old
    .prepare("INSERT INTO images (id, original_name, mime_type, selected) VALUES (?, ?, ?, 1)")
    .run("3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", "antiga.png", "image/png");
  old.exec("UPDATE pack_draft SET intent = 'antiga'");
  old.close();
  const library = open(root);
  expect(listImages(library)).toEqual([
    {
      id: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f",
      originalName: "antiga.png",
      mimeType: "image/png",
      fileName: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f.png",
      selected: true,
      note: "",
    },
  ]);
  expect(getIntent(library)).toBe("antiga");
});

test("CA-3.2 setNote stores the text exactly as given", () => {
  const library = open(tempLibraryRoot());
  const { b } = twoImages(library);
  expect(setNote(library, b.id, NOTE)).toBe(true);
  expect(listImages(library).map((image) => image.note)).toEqual([NOTE, ""]);
  expect(findImage(library, b.id)?.note).toBe(NOTE);
});

test("setNote answers false for an unknown id and changes nothing", () => {
  const library = open(tempLibraryRoot());
  twoImages(library);
  expect(setNote(library, "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", NOTE)).toBe(false);
  expect(listImages(library).map((image) => image.note)).toEqual(["", ""]);
});

test("CA-3.6 the notes are still there after closing and reopening the library", () => {
  const root = tempLibraryRoot();
  const first = open(root);
  const { b } = twoImages(first);
  setNote(first, b.id, NOTE);
  closeLibrary(first);
  const second = open(root);
  expect(listImages(second).map((image) => image.note)).toEqual([NOTE, ""]);
});

test("CA-3.8 clearing the selection keeps every note", () => {
  const library = open(tempLibraryRoot());
  const { a } = twoImages(library);
  setNote(library, a.id, NOTE);
  setSelected(library, a.id, true);
  setAllSelected(library, false);
  expect(findImage(library, a.id)?.note).toBe(NOTE);
});
