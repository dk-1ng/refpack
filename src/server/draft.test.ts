import { afterEach, expect, test } from "vitest";
import { getIntent, setAllSelected, setIntent, setSelected } from "./draft.ts";
import {
  addImage,
  closeLibrary,
  type Library,
  listImages,
  openLibrary,
  type StoredImage,
} from "./library.ts";
import { addTag } from "./tags.ts";
import { JPEG_BYTES, PNG_BYTES, tempLibraryRoot, WEBP_BYTES } from "./test-support.ts";

const libraries: Library[] = [];
function makeLibrary(root = tempLibraryRoot()): Library {
  const library = openLibrary(root);
  libraries.push(library);
  return library;
}
afterEach(() => {
  for (const library of libraries.splice(0)) {
    try {
      closeLibrary(library);
    } catch {
      // already closed by the test
    }
  }
});

function add(library: Library, bytes: Uint8Array, name: string): StoredImage {
  const result = addImage(library, { bytes, originalName: name });
  if (!result.ok) throw new Error("expected ok");
  return result.image;
}

function flags(library: Library): boolean[] {
  return listImages(library).map((image) => image.selected);
}

function twoImages() {
  const library = makeLibrary();
  const a = add(library, PNG_BYTES, "a.png");
  const b = add(library, JPEG_BYTES, "b.jpg");
  return { library, a, b };
}

test("CA-2.1 an image is selected and unselected by its id", () => {
  const { library, b } = twoImages();
  expect(setSelected(library, b.id, true)).toBe(true);
  expect(flags(library)).toEqual([true, false]);
  expect(setSelected(library, b.id, false)).toBe(true);
  expect(flags(library)).toEqual([false, false]);
});

test("setSelected answers false for an unknown id and changes nothing", () => {
  const { library } = twoImages();
  expect(setSelected(library, "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f", true)).toBe(false);
  expect(flags(library)).toEqual([false, false]);
});

test("CA-2.2 setAllSelected selects every image, then none", () => {
  const { library } = twoImages();
  setAllSelected(library, true);
  expect(flags(library)).toEqual([true, true]);
  setAllSelected(library, false);
  expect(flags(library)).toEqual([false, false]);
});

test("CA-2.3 a new image enters unselected and the others keep their selection", () => {
  const { library, a } = twoImages();
  setSelected(library, a.id, true);
  add(library, WEBP_BYTES, "c.webp");
  expect(flags(library)).toEqual([false, false, true]);
});

test("CA-2.5 the selection is still there after closing and reopening the library", () => {
  const root = tempLibraryRoot();
  const first = makeLibrary(root);
  add(first, PNG_BYTES, "a.png");
  const b = add(first, JPEG_BYTES, "b.jpg");
  setSelected(first, b.id, true);
  closeLibrary(first);
  expect(flags(makeLibrary(root))).toEqual([true, false]);
});

const INTENT = "  # Painel de açaí 🍇\n\n\t* Para quem vende na feira.\n`rápido` & simples  \n";

test("CA-2.4 the intent starts empty and comes back exactly as stored", () => {
  const library = makeLibrary();
  expect(getIntent(library)).toBe("");
  setIntent(library, INTENT);
  expect(getIntent(library)).toBe(INTENT);
});

test("CA-2.5 the intent is still there after closing and reopening the library", () => {
  const root = tempLibraryRoot();
  const first = makeLibrary(root);
  setIntent(first, INTENT);
  closeLibrary(first);
  expect(getIntent(makeLibrary(root))).toBe(INTENT);
});

test("CA-5.7 setAllSelected with a tag changes only the images that have it, and answers false for an unknown tag", () => {
  const library = makeLibrary();
  const a = add(library, PNG_BYTES, "a.png");
  const b = add(library, JPEG_BYTES, "b.jpg");
  const c = add(library, WEBP_BYTES, "c.webp");
  const added = addTag(library, a.id, "ui");
  if (!added.ok) throw new Error("expected tag");
  addTag(library, c.id, "ui");
  setSelected(library, b.id, true);
  expect(setAllSelected(library, true, added.tag.id)).toBe(true);
  expect(flags(library)).toEqual([true, true, true]);
  expect(setAllSelected(library, false, added.tag.id)).toBe(true);
  expect(flags(library)).toEqual([false, true, false]);
  expect(setAllSelected(library, true, "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f")).toBe(false);
  expect(flags(library)).toEqual([false, true, false]);
  expect(setAllSelected(library, false)).toBe(true);
  expect(flags(library)).toEqual([false, false, false]);
});
