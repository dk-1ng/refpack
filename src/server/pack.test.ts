import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { addImage, closeLibrary, type Library, listImages, openLibrary } from "./library.ts";
import { createPack, packFolderName, refNumber } from "./pack.ts";
import { JPEG_BYTES, PNG_BYTES, tempLibraryRoot, WEBP_BYTES } from "./test-support.ts";

const libraries: Library[] = [];
function makeLibrary(): Library {
  const library = openLibrary(tempLibraryRoot());
  libraries.push(library);
  return library;
}
afterEach(() => {
  for (const library of libraries.splice(0)) closeLibrary(library);
});

const now = new Date(2026, 10, 9, 14, 5, 9);

function fillLibrary(library: Library): void {
  addImage(library, { bytes: PNG_BYTES, originalName: "a.png" });
  addImage(library, { bytes: JPEG_BYTES, originalName: "b.jpg" });
  addImage(library, { bytes: WEBP_BYTES, originalName: "c.webp" });
}

test("packFolderName formats the local date and time", () => {
  expect(packFolderName(now)).toBe("pack-20261109-140509");
});

test("refNumber pads to two digits, or more when the pack needs it", () => {
  expect(refNumber(1, 3)).toBe("01");
  expect(refNumber(12, 12)).toBe("12");
  expect(refNumber(7, 120)).toBe("007");
});

test("CA-0.7 creates the pack folder with numbered refs, README and .gitignore", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const result = createPack(library, now);
  expect(result).toEqual({
    ok: true,
    path: join(library.packsDir, "pack-20261109-140509"),
    count: 3,
  });
  if (!result.ok) return;
  expect(readFileSync(join(result.path, "refs", "01.webp"))).toEqual(Buffer.from(WEBP_BYTES));
  expect(readFileSync(join(result.path, "refs", "02.jpg"))).toEqual(Buffer.from(JPEG_BYTES));
  expect(readFileSync(join(result.path, "refs", "03.png"))).toEqual(Buffer.from(PNG_BYTES));
  expect(readFileSync(join(result.path, ".gitignore"), "utf8")).toBe("*\n");
  expect(readFileSync(join(result.path, "README.md"), "utf8")).toBe(
    [
      "# Reference pack",
      "",
      "This folder is a set of design references exported from refpack.",
      "Use the images in `refs/` as visual references for the interface you are asked to build.",
      "",
      "- Created: 2026-11-09 14:05:09",
      "- References: 3",
      "",
      "## References",
      "",
      "1. `refs/01.webp`",
      "2. `refs/02.jpg`",
      "3. `refs/03.png`",
      "",
    ].join("\n"),
  );
});

test("CA-0.9 generating twice in the same second creates two different folders", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const first = createPack(library, now);
  const second = createPack(library, now);
  expect(first.ok && second.ok).toBe(true);
  if (!first.ok || !second.ok) return;
  expect(second.path).not.toBe(first.path);
  expect(second.path.endsWith("pack-20261109-140509-2")).toBe(true);
  expect(existsSync(first.path)).toBe(true);
  expect(existsSync(second.path)).toBe(true);
});

test("CA-0.9 generating a pack leaves the library unchanged", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const before = { images: listImages(library), files: readdirSync(library.imagesDir).sort() };
  createPack(library, now);
  expect(listImages(library)).toEqual(before.images);
  expect(readdirSync(library.imagesDir).sort()).toEqual(before.files);
});

test("an empty library creates nothing and answers empty-library", () => {
  const library = makeLibrary();
  expect(createPack(library, now)).toEqual({ ok: false, code: "empty-library" });
  expect(existsSync(library.packsDir)).toBe(false);
});
