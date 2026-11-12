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
import { addMark, deleteMark, listMarks, setMarkComment } from "./marks.ts";
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
  const bId = listImages(library)[1]?.id ?? "";
  setNote(library, bId, "a note on b");
  const added = addMark(library, bId, {
    kind: "like",
    area: { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 },
    crop: new Uint8Array([...PNG_BYTES, 1]),
  });
  if (!added.ok) throw new Error("expected ok");
  setMarkComment(library, added.mark.id, "a comment on a mark");
  const before = {
    images: listImages(library),
    marks: listMarks(library),
    files: readdirSync(library.imagesDir).sort(),
    crops: readdirSync(library.marksDir).sort(),
  };
  createPack(library, now);
  expect(listImages(library)).toEqual(before.images);
  expect(listMarks(library)).toEqual(before.marks);
  expect(readdirSync(library.marksDir).sort()).toEqual(before.crops);
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

const COMMENT = "  # Gosto do espaçamento 🍇\n\n\t* evitar o `azul` & a sombra  \n";
const MARKS_LINE =
  "Some references have marks: parts of the image the owner pointed at, listed under the image below. Each mark has a crop of that part in `marks/`. `like` means the owner wants this taken as a quality to reproduce; `dislike` means avoid it. A mark may also have a comment file, in the owner's own words and possibly in a language other than English. `area` says where the part is in the full image, as percentages of its width (x, from the left) and of its height (y, from the top).";

function crop(n: number): Uint8Array {
  return new Uint8Array([...PNG_BYTES, n]);
}

function mark(library: Library, imageId: string, kind: "like" | "dislike", n: number) {
  const result = addMark(library, imageId, {
    kind,
    area: { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 },
    crop: crop(n),
  });
  if (!result.ok) throw new Error("expected ok");
  return result.mark;
}

test("CA-4.9 each mark of a selected image gets its crop and its comment in marks/, and the README lists them", () => {
  const library = makeLibrary();
  fillLibrary(library);
  setAllSelected(library, true);
  setIntent(library, INTENT);
  const b = listImages(library)[1];
  setNote(library, b?.id ?? "", NOTE);
  const m1 = addMark(library, b?.id ?? "", {
    kind: "like",
    area: { left: 0.1, top: 0.2, right: 0.4, bottom: 0.9 },
    crop: crop(1),
  });
  const m2 = addMark(library, b?.id ?? "", {
    kind: "dislike",
    area: { left: 0.604, top: 0, right: 1, bottom: 0.338 },
    crop: crop(2),
  });
  if (!m1.ok || !m2.ok) throw new Error("expected ok");
  setMarkComment(library, m1.mark.id, COMMENT);
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(readdirSync(join(result.path, "marks")).sort()).toEqual([
    "02-1.md",
    "02-1.png",
    "02-2.png",
  ]);
  expect(readFileSync(join(result.path, "marks", "02-1.png"))).toEqual(Buffer.from(crop(1)));
  expect(readFileSync(join(result.path, "marks", "02-2.png"))).toEqual(Buffer.from(crop(2)));
  expect(readFileSync(join(result.path, "marks", "02-1.md"))).toEqual(Buffer.from(COMMENT, "utf8"));
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
      MARKS_LINE,
      "",
      "- Created: 2026-11-09 14:05:09",
      "- References: 3",
      "",
      "## References",
      "",
      "1. `refs/01.webp`",
      "2. `refs/02.jpg` — note: `notes/02.md`",
      "   - Mark 1 (like): `marks/02-1.png` — comment: `marks/02-1.md` — area: x 10%–40%, y 20%–90%",
      "   - Mark 2 (dislike): `marks/02-2.png` — area: x 60%–100%, y 0%–34%",
      "3. `refs/03.png`",
      "",
    ].join("\n"),
  );
});

test("CA-4.6 CA-4.9 the files take the image's number in this pack and the mark's number after a delete, and unselected marks stay out", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const byName = new Map(listImages(library).map((image) => [image.originalName, image.id]));
  const a = byName.get("a.png") ?? "";
  setSelected(library, a, true);
  setSelected(library, byName.get("c.webp") ?? "", true);
  const first = mark(library, a, "like", 1);
  mark(library, a, "like", 2);
  mark(library, a, "like", 3);
  deleteMark(library, first.id);
  mark(library, byName.get("b.jpg") ?? "", "like", 4);
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(readdirSync(join(result.path, "marks")).sort()).toEqual(["02-1.png", "02-2.png"]);
  expect(readFileSync(join(result.path, "marks", "02-1.png"))).toEqual(Buffer.from(crop(2)));
  expect(readFileSync(join(result.path, "marks", "02-2.png"))).toEqual(Buffer.from(crop(3)));
  const readme = readFileSync(join(result.path, "README.md"), "utf8");
  expect(readme).toContain("2. `refs/02.png`\n   - Mark 1 (like): `marks/02-1.png` — area:");
  expect(readme).not.toContain("marks/01-");
});

test("CA-4.9 a mark with an empty or blank comment has only its crop", () => {
  for (const blank of ["", " \n\t "]) {
    const library = makeLibrary();
    fillLibrary(library);
    const m = mark(library, listImages(library)[1]?.id ?? "", "like", 1);
    setMarkComment(library, m.id, blank);
    setAllSelected(library, true);
    const result = createPack(library, now);
    if (!result.ok) throw new Error("expected ok");
    expect(readdirSync(join(result.path, "marks"))).toEqual(["02-1.png"]);
    expect(readFileSync(join(result.path, "README.md"), "utf8")).not.toContain("comment:");
  }
});

test("CA-4.9 without marks on the selected images the pack has no marks folder and no mention", () => {
  const library = makeLibrary();
  fillLibrary(library);
  const byName = new Map(listImages(library).map((image) => [image.originalName, image.id]));
  setSelected(library, byName.get("a.png") ?? "", true);
  mark(library, byName.get("b.jpg") ?? "", "like", 1);
  const result = createPack(library, now);
  if (!result.ok) throw new Error("expected ok");
  expect(existsSync(join(result.path, "marks"))).toBe(false);
  expect(readFileSync(join(result.path, "README.md"), "utf8")).not.toContain("mark");
});
