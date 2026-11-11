import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, expect, test } from "vitest";
import { getIntent, setAllSelected, setIntent, setSelected } from "./draft.ts";
import {
  addImage,
  closeLibrary,
  type Library,
  listImages,
  openLibrary,
  setNote,
} from "./library.ts";
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
  setAllSelected(library, true);
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
  setAllSelected(library, true);
  const first = createPack(library, now);
  const second = createPack(library, now);
  expect(first.ok && second.ok).toBe(true);
  if (!first.ok || !second.ok) return;
  expect(second.path).not.toBe(first.path);
  expect(second.path.endsWith("pack-20261109-140509-2")).toBe(true);
  expect(existsSync(first.path)).toBe(true);
  expect(existsSync(second.path)).toBe(true);
});

test("CA-0.9 CA-2.9 generating a pack leaves the library unchanged", () => {
  const library = makeLibrary();
  fillLibrary(library);
  setAllSelected(library, true);
  setNote(library, listImages(library)[1]?.id ?? "", "a note on b");
  const before = { images: listImages(library), files: readdirSync(library.imagesDir).sort() };
  createPack(library, now);
  expect(listImages(library)).toEqual(before.images);
  expect(readdirSync(library.imagesDir).sort()).toEqual(before.files);
});

test("an empty library creates nothing and answers nothing-selected", () => {
  const library = makeLibrary();
  expect(createPack(library, now)).toEqual({ ok: false, code: "nothing-selected" });
  expect(existsSync(library.packsDir)).toBe(false);
});

test("CA-2.6 only the selected images enter the pack, numbered in grid order", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const byName = new Map(listImages(library).map((image) => [image.originalName, image.id]));
  setSelected(library, byName.get("a.png") ?? "", true);
  setSelected(library, byName.get("c.webp") ?? "", true);
  const result = createPack(library, now);
  expect(result.ok && result.count).toBe(2);
  if (!result.ok) return;
  expect(readdirSync(join(result.path, "refs")).sort()).toEqual(["01.webp", "02.png"]);
  const readme = readFileSync(join(result.path, "README.md"), "utf8");
  expect(readme).toContain("- References: 2");
  expect(readme).toContain("1. `refs/01.webp`");
  expect(readme).toContain("2. `refs/02.png`");
  expect(readme).not.toContain("03");
});

test("CA-2.8 images with none selected create nothing and answer nothing-selected", () => {
  const library = makeLibrary();
  fillLibrary(library);
  expect(createPack(library, now)).toEqual({ ok: false, code: "nothing-selected" });
  expect(existsSync(library.packsDir)).toBe(false);
});

const INTENT = "  # Painel de açaí 🍇\n\n\t* Para quem vende na feira.\n`rápido` & simples  \n";
const INTENT_LINE =
  "Read `INTENT.md` before you look at the references. It says what is being built, for whom, and what they need to be able to do. It is in the owner's own words and may be in a language other than English.";

function expectedReadme(withIntent: boolean): string {
  return [
    "# Reference pack",
    "",
    "This folder is a set of design references exported from refpack.",
    "Use the images in `refs/` as visual references for the interface you are asked to build.",
    ...(withIntent ? ["", INTENT_LINE] : []),
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
  ].join("\n");
}

test("CA-2.7 a pack with an intent carries INTENT.md with exactly the text, and the README points to it", () => {
  const library = makeLibrary();
  fillLibrary(library);
  setAllSelected(library, true);
  setIntent(library, INTENT);
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(readFileSync(join(result.path, "INTENT.md"))).toEqual(Buffer.from(INTENT, "utf8"));
  expect(readFileSync(join(result.path, "README.md"), "utf8")).toBe(expectedReadme(true));
});

test("CA-2.7 an empty or blank intent leaves no INTENT.md and no mention of it", () => {
  for (const blank of ["", " \n\t "]) {
    const library = makeLibrary();
    fillLibrary(library);
    setAllSelected(library, true);
    setIntent(library, blank);
    const result = createPack(library, now);
    if (!result.ok) throw new Error("expected ok");
    expect(existsSync(join(result.path, "INTENT.md"))).toBe(false);
    expect(readFileSync(join(result.path, "README.md"), "utf8")).toBe(expectedReadme(false));
  }
});

test("CA-2.9 generating a pack leaves the intent unchanged", () => {
  const library = makeLibrary();
  fillLibrary(library);
  setAllSelected(library, true);
  setIntent(library, INTENT);
  createPack(library, now);
  expect(getIntent(library)).toBe(INTENT);
});

const NOTE = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";
const NOTES_LINE =
  "Some references have a note from the owner, shown next to the image in the list below. Read each note together with its image: it says what to take from that reference and what to avoid. The notes are in the owner's own words and may be in a language other than English.";

test("CA-3.7 a selected image with a note gets notes/NN.md with exactly the text, and the README points to it", () => {
  const library = makeLibrary();
  fillLibrary(library);
  setAllSelected(library, true);
  setIntent(library, INTENT);
  const b = listImages(library)[1];
  setNote(library, b?.id ?? "", NOTE);
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(readdirSync(join(result.path, "notes"))).toEqual(["02.md"]);
  expect(readFileSync(join(result.path, "notes", "02.md"))).toEqual(Buffer.from(NOTE, "utf8"));
  expect(readFileSync(join(result.path, "README.md"), "utf8")).toBe(
    [
      "# Reference pack",
      "",
      "This folder is a set of design references exported from refpack.",
      "Use the images in `refs/` as visual references for the interface you are asked to build.",
      "",
      INTENT_LINE,
      "",
      NOTES_LINE,
      "",
      "- Created: 2026-11-09 14:05:09",
      "- References: 3",
      "",
      "## References",
      "",
      "1. `refs/01.webp`",
      "2. `refs/02.jpg` — note: `notes/02.md`",
      "3. `refs/03.png`",
      "",
    ].join("\n"),
  );
});

test("CA-3.7 the note file takes the number the image has in this pack, and unselected notes stay out", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const byName = new Map(listImages(library).map((image) => [image.originalName, image.id]));
  setSelected(library, byName.get("a.png") ?? "", true);
  setSelected(library, byName.get("c.webp") ?? "", true);
  setNote(library, byName.get("a.png") ?? "", "on a");
  setNote(library, byName.get("b.jpg") ?? "", "on b");
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(readdirSync(join(result.path, "refs")).sort()).toEqual(["01.webp", "02.png"]);
  expect(readdirSync(join(result.path, "notes"))).toEqual(["02.md"]);
  expect(readFileSync(join(result.path, "notes", "02.md"), "utf8")).toBe("on a");
  const readme = readFileSync(join(result.path, "README.md"), "utf8");
  expect(readme).toContain("2. `refs/02.png` — note: `notes/02.md`");
  expect(readme).toContain("1. `refs/01.webp`\n");
});

test("CA-3.7 an empty or blank note leaves no file, no folder and no mention", () => {
  for (const blank of ["", " \n\t "]) {
    const library = makeLibrary();
    fillLibrary(library);
    setAllSelected(library, true);
    setNote(library, listImages(library)[1]?.id ?? "", blank);
    const result = createPack(library, now);
    if (!result.ok) throw new Error("expected ok");
    expect(existsSync(join(result.path, "notes"))).toBe(false);
    expect(readFileSync(join(result.path, "README.md"), "utf8")).toBe(expectedReadme(false));
  }
});
