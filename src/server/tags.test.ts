import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { afterEach, expect, test } from "vitest";
import { getIntent, setAllSelected, setSelected } from "./draft.ts";
import {
  addImage,
  closeLibrary,
  findImage,
  type Library,
  listImages,
  openLibrary,
  setNote,
} from "./library.ts";
import { listMarks } from "./marks.ts";
import { addTag, listTags, removeTag, type StoredTag } from "./tags.ts";
import { JPEG_BYTES, PNG_BYTES, tempLibraryRoot } from "./test-support.ts";

const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";
const FANCY = 'Dashboard "escuro" \\ ✨';

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

function imageIn(library: Library, name = "a.png", bytes = PNG_BYTES) {
  const result = addImage(library, { bytes, originalName: name });
  if (!result.ok) throw new Error("setup failed");
  return result.image;
}

function tag(library: Library, imageId: string, name: string): StoredTag {
  const result = addTag(library, imageId, name);
  if (!result.ok) throw new Error("setup failed");
  return result.tag;
}

test("CA-5.10 a library created before slice 5 opens with no tags and keeps notes, marks, selection and intent", () => {
  const root = tempLibraryRoot();
  mkdirSync(join(root, "images"), { recursive: true });
  const old = new DatabaseSync(join(root, "library.db"));
  for (const name of [
    "001-images.sql",
    "002-image-selected.sql",
    "003-pack-draft.sql",
    "004-image-note.sql",
    "005-marks.sql",
  ]) {
    old.exec(readFileSync(join(import.meta.dirname, "migrations", name), "utf8"));
  }
  old.exec("PRAGMA user_version = 5");
  old
    .prepare(
      "INSERT INTO images (id, original_name, mime_type, selected, note) VALUES (?, ?, ?, 1, 'antiga')",
    )
    .run(UNKNOWN, "antiga.png", "image/png");
  old
    .prepare(
      "INSERT INTO marks (id, image_id, kind, area_left, area_top, area_right, area_bottom, comment) VALUES (?, ?, 'like', 0.1, 0.2, 0.4, 0.9, 'c')",
    )
    .run("7c9e6679-7425-40de-944b-e07fc1f90ae7", UNKNOWN);
  old.exec("UPDATE pack_draft SET intent = 'velha'");
  old.close();
  const library = open(root);
  expect(listTags(library).size).toBe(0);
  expect(listImages(library)).toEqual([
    {
      id: UNKNOWN,
      originalName: "antiga.png",
      mimeType: "image/png",
      fileName: `${UNKNOWN}.png`,
      selected: true,
      note: "antiga",
    },
  ]);
  const marks = listMarks(library).get(UNKNOWN);
  expect(marks).toHaveLength(1);
  expect(marks?.[0]?.comment).toBe("c");
  expect(getIntent(library)).toBe("velha");
});

test("CA-5.1 addTag puts a new tag on the image and lists each image's tags in the order they were put", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const b = imageIn(library, "b.jpg", JPEG_BYTES);
  const t1 = addTag(library, a.id, "dashboard");
  const t2 = addTag(library, a.id, FANCY);
  expect(t1).toEqual({
    ok: true,
    linked: true,
    tag: { id: expect.stringMatching(/^[0-9a-f-]{36}$/), name: "dashboard" },
  });
  if (!t1.ok || !t2.ok) throw new Error("expected tags");
  expect(t2.tag.name).toBe(FANCY);
  expect(listTags(library).get(a.id)).toEqual([t1.tag, t2.tag]);
  expect(listTags(library).has(b.id)).toBe(false);
});

test("CA-5.2 addTag reuses a tag that differs only by case and keeps the first spelling", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const b = imageIn(library, "b.jpg", JPEG_BYTES);
  const t1 = addTag(library, a.id, "Dashboard");
  const t2 = addTag(library, b.id, "dashboard");
  const t3 = addTag(library, b.id, "DASHBOARD");
  if (!t1.ok) throw new Error("expected tag");
  expect(t2).toEqual({ ok: true, linked: true, tag: t1.tag });
  expect(t3).toEqual({ ok: true, linked: false, tag: t1.tag });
  expect(listTags(library).get(a.id)).toEqual([t1.tag]);
  expect(listTags(library).get(b.id)).toEqual([t1.tag]);
  const i1 = addTag(library, a.id, "Ícone");
  const i2 = addTag(library, b.id, "ícone");
  if (!i1.ok || !i2.ok) throw new Error("expected tags");
  expect(i2.tag).toEqual(i1.tag);
  expect(i1.tag.name).toBe("Ícone");
  const plain = addTag(library, a.id, "icone");
  if (!plain.ok) throw new Error("expected tag");
  expect(plain.tag.id).not.toBe(i1.tag.id);
  expect(plain.tag.name).toBe("icone");
});

test("addTag stores the name exactly as given and answers not-found for an unknown image", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  expect(tag(library, a.id, "  dois  espaços  ").name).toBe("  dois  espaços  ");
  expect(addTag(library, UNKNOWN, "x")).toEqual({ ok: false, code: "not-found" });
  expect(listTags(library).has(UNKNOWN)).toBe(false);
});

test("CA-5.4 removeTag takes the tag off the image and deletes the tag once no image has it", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const b = imageIn(library, "b.jpg", JPEG_BYTES);
  const t = tag(library, a.id, "x");
  addTag(library, b.id, "x");
  const y = tag(library, a.id, "y");
  setNote(library, a.id, "nota");
  setSelected(library, a.id, true);
  expect(removeTag(library, a.id, t.id)).toBe(true);
  expect(listTags(library).get(a.id)).toEqual([y]);
  expect(listTags(library).get(b.id)).toEqual([t]);
  expect(removeTag(library, b.id, t.id)).toBe(true);
  expect(listTags(library).has(b.id)).toBe(false);
  const again = tag(library, b.id, "X");
  expect(again.id).not.toBe(t.id);
  expect(again.name).toBe("X");
  expect(findImage(library, a.id)).toMatchObject({ note: "nota", selected: true });
});

test("removeTag answers false for an unknown image, an unknown tag, or a tag the image does not have", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const b = imageIn(library, "b.jpg", JPEG_BYTES);
  const t = tag(library, a.id, "x");
  expect(removeTag(library, UNKNOWN, t.id)).toBe(false);
  expect(removeTag(library, a.id, UNKNOWN)).toBe(false);
  expect(removeTag(library, b.id, t.id)).toBe(false);
  expect(listTags(library).get(a.id)).toEqual([t]);
});

test("CA-5.10 the tags are still there after closing and reopening the library", () => {
  const root = tempLibraryRoot();
  const first = open(root);
  const a = imageIn(first);
  const b = imageIn(first, "b.jpg", JPEG_BYTES);
  tag(first, a.id, "um");
  tag(first, a.id, "dois");
  tag(first, b.id, "um");
  const before = listTags(first);
  closeLibrary(first);
  expect(listTags(open(root))).toEqual(before);
});

test("CA-5.12 clearing the selection keeps every tag", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  tag(library, a.id, "x");
  const before = listTags(library);
  setSelected(library, a.id, true);
  setAllSelected(library, false);
  expect(listTags(library)).toEqual(before);
});
