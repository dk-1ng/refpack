import { existsSync, mkdirSync, readFileSync } from "node:fs";
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
import {
  addMark,
  cropFileName,
  deleteMark,
  listMarks,
  type StoredMark,
  setMarkComment,
  setMarkKind,
} from "./marks.ts";
import { JPEG_BYTES, PNG_BYTES, tempLibraryRoot } from "./test-support.ts";

const COMMENT = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";
const AREA = { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 };
const CROP = PNG_BYTES;
const UNKNOWN = "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f";

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

function mark(library: Library, imageId: string, kind: "like" | "dislike" = "like"): StoredMark {
  const result = addMark(library, imageId, { kind, area: AREA, crop: CROP });
  if (!result.ok) throw new Error("setup failed");
  return result.mark;
}

test("CA-0.6 CA-4.8 a library created before slice 4 opens with no marks and keeps notes, selection and intent", () => {
  const root = tempLibraryRoot();
  mkdirSync(join(root, "images"), { recursive: true });
  const old = new DatabaseSync(join(root, "library.db"));
  for (const name of [
    "001-images.sql",
    "002-image-selected.sql",
    "003-pack-draft.sql",
    "004-image-note.sql",
  ]) {
    old.exec(readFileSync(join(import.meta.dirname, "migrations", name), "utf8"));
  }
  old.exec("PRAGMA user_version = 4");
  old
    .prepare(
      "INSERT INTO images (id, original_name, mime_type, selected, note) VALUES (?, ?, ?, 1, 'antiga')",
    )
    .run(UNKNOWN, "antiga.png", "image/png");
  old.exec("UPDATE pack_draft SET intent = 'velha'");
  old.close();
  const library = open(root);
  expect(listMarks(library).size).toBe(0);
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
  expect(getIntent(library)).toBe("velha");
});

test("CA-4.2 addMark stores kind, area and crop, and lists the marks of each image in creation order", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const b = imageIn(library, "b.jpg", JPEG_BYTES);
  const m1 = addMark(library, a.id, { kind: "like", area: AREA, crop: CROP });
  const m2 = addMark(library, a.id, {
    kind: "dislike",
    area: { left: 0, top: 0, right: 1, bottom: 1 },
    crop: CROP,
  });
  if (!m1.ok || !m2.ok) throw new Error("expected marks");
  expect(m1.mark).toEqual({
    id: expect.stringMatching(/^[0-9a-f-]{36}$/),
    imageId: a.id,
    kind: "like",
    area: AREA,
    comment: "",
  });
  expect(listMarks(library).get(a.id)).toEqual([m1.mark, m2.mark]);
  expect(listMarks(library).has(b.id)).toBe(false);
  expect(readFileSync(join(library.marksDir, cropFileName(m1.mark.id)))).toEqual(Buffer.from(CROP));
});

test("addMark refuses an unknown image and a crop that is not a PNG, storing nothing", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  expect(addMark(library, UNKNOWN, { kind: "like", area: AREA, crop: CROP })).toEqual({
    ok: false,
    code: "not-found",
  });
  expect(addMark(library, a.id, { kind: "like", area: AREA, crop: JPEG_BYTES })).toEqual({
    ok: false,
    code: "unsupported-type",
  });
  expect(listMarks(library).size).toBe(0);
  expect(existsSync(library.marksDir)).toBe(false);
});

test("CA-4.5 setMarkKind changes only the kind", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const m1 = mark(library, a.id);
  const m2 = mark(library, a.id, "dislike");
  setMarkComment(library, m1.id, COMMENT);
  expect(setMarkKind(library, m1.id, "dislike")).toBe(true);
  expect(listMarks(library).get(a.id)).toEqual([{ ...m1, kind: "dislike", comment: COMMENT }, m2]);
});

test("CA-4.4 setMarkComment stores the text exactly as given", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const m1 = mark(library, a.id);
  expect(setMarkComment(library, m1.id, COMMENT)).toBe(true);
  expect(listMarks(library).get(a.id)?.[0]?.comment).toBe(COMMENT);
});

test("CA-4.6 deleteMark removes the mark and its crop file and keeps the others in order", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const m1 = mark(library, a.id);
  const m2 = mark(library, a.id);
  const m3 = mark(library, a.id);
  setNote(library, a.id, "nota");
  expect(deleteMark(library, m2.id)).toBe(true);
  expect(listMarks(library).get(a.id)).toEqual([m1, m3]);
  expect(existsSync(join(library.marksDir, cropFileName(m2.id)))).toBe(false);
  expect(existsSync(join(library.marksDir, cropFileName(m1.id)))).toBe(true);
  expect(existsSync(join(library.marksDir, cropFileName(m3.id)))).toBe(true);
  expect(findImage(library, a.id)?.note).toBe("nota");
});

test("setMarkKind, setMarkComment and deleteMark answer false for an unknown id and change nothing", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const m1 = mark(library, a.id);
  expect(setMarkKind(library, UNKNOWN, "dislike")).toBe(false);
  expect(setMarkComment(library, UNKNOWN, COMMENT)).toBe(false);
  expect(deleteMark(library, UNKNOWN)).toBe(false);
  expect(listMarks(library).get(a.id)).toEqual([m1]);
  expect(existsSync(join(library.marksDir, cropFileName(m1.id)))).toBe(true);
});

test("CA-4.8 the marks are still there after closing and reopening the library", () => {
  const root = tempLibraryRoot();
  const first = open(root);
  const a = imageIn(first);
  mark(first, a.id);
  const m2 = mark(first, a.id, "dislike");
  setMarkComment(first, m2.id, COMMENT);
  const before = listMarks(first);
  closeLibrary(first);
  const second = open(root);
  expect(listMarks(second)).toEqual(before);
  expect(before.get(a.id)?.length).toBe(2);
});

test("CA-4.10 clearing the selection keeps every mark", () => {
  const library = open(tempLibraryRoot());
  const a = imageIn(library);
  const m1 = mark(library, a.id);
  setMarkComment(library, m1.id, COMMENT);
  const before = listMarks(library);
  setSelected(library, a.id, true);
  setAllSelected(library, false);
  expect(listMarks(library)).toEqual(before);
});
