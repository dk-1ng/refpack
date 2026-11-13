import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getIntent } from "./draft.ts";
import { type Library, listImages } from "./library.ts";
import { cropFileName, listMarks, type StoredMark } from "./marks.ts";
import { listTags } from "./tags.ts";

function two(value: number): string {
  return String(value).padStart(2, "0");
}

function datePart(now: Date): string {
  return `${now.getFullYear()}${two(now.getMonth() + 1)}${two(now.getDate())}`;
}

function timePart(now: Date): string {
  return `${two(now.getHours())}${two(now.getMinutes())}${two(now.getSeconds())}`;
}

export function packFolderName(now: Date): string {
  return `pack-${datePart(now)}-${timePart(now)}`;
}

export function refNumber(index: number, count: number): string {
  const width = Math.max(2, String(count).length);
  return String(index).padStart(width, "0");
}

const MARKS_PARAGRAPH =
  "Some references have marks: parts of the image the owner pointed at, listed under the image below. Each mark has a crop of that part in `marks/`. `like` means the owner wants this taken as a quality to reproduce; `dislike` means avoid it. A mark may also have a comment file, in the owner's own words and possibly in a language other than English. `area` says where the part is in the full image, as percentages of its width (x, from the left) and of its height (y, from the top).";

const TAGS_PARAGRAPH =
  "Some references have tags: short labels the owner put on the image, listed after `tags:` on its line below, each in double quotes. They are in the owner's own words and may be in a language other than English. References that share a tag have that kind or quality in common.";

function percent(fraction: number): number {
  return Math.round(fraction * 100);
}

function markLine(mark: StoredMark, position: number, number: string): string {
  const base = `${number}-${position}`;
  const comment = mark.comment.trim() === "" ? "" : ` — comment: \`marks/${base}.md\``;
  const { left, top, right, bottom } = mark.area;
  const area = `x ${percent(left)}%–${percent(right)}%, y ${percent(top)}%–${percent(bottom)}%`;
  return `   - Mark ${position} (${mark.kind}): \`marks/${base}.png\`${comment} — area: ${area}`;
}

export type PackResult =
  | { ok: true; path: string; count: number }
  | { ok: false; code: "nothing-selected" };

function createFreshFolder(packsDir: string, baseName: string): string {
  for (let attempt = 1; ; attempt++) {
    const path = join(packsDir, attempt === 1 ? baseName : `${baseName}-${attempt}`);
    try {
      mkdirSync(path);
      return path;
    } catch (error) {
      if (!(error instanceof Error) || (error as NodeJS.ErrnoException).code !== "EEXIST") {
        throw error;
      }
    }
  }
}

export function createPack(library: Library, now: Date): PackResult {
  const images = listImages(library).filter((image) => image.selected);
  if (images.length === 0) {
    return { ok: false, code: "nothing-selected" };
  }
  mkdirSync(library.packsDir, { recursive: true });
  const path = createFreshFolder(resolve(library.packsDir), packFolderName(now));
  mkdirSync(join(path, "refs"));
  const refNames = images.map((image, index) => {
    const extension = image.fileName.slice(image.fileName.lastIndexOf(".") + 1);
    const refName = `${refNumber(index + 1, images.length)}.${extension}`;
    copyFileSync(join(library.imagesDir, image.fileName), join(path, "refs", refName));
    return refName;
  });
  const notedImages = images.filter((image) => image.note.trim() !== "");
  if (notedImages.length > 0) {
    mkdirSync(join(path, "notes"));
    for (const image of notedImages) {
      const number = refNames[images.indexOf(image)]?.split(".")[0] ?? "";
      writeFileSync(join(path, "notes", `${number}.md`), image.note);
    }
  }
  const allMarks = listMarks(library);
  const marksOf = images.map((image) => allMarks.get(image.id) ?? []);
  const hasMarks = marksOf.some((list) => list.length > 0);
  const markLines = marksOf.map((list, index) => {
    const number = refNames[index]?.split(".")[0] ?? "";
    return list.map((mark, position) => markLine(mark, position + 1, number));
  });
  const allTags = listTags(library);
  const tagsOf = images.map((image) => allTags.get(image.id) ?? []);
  const hasTags = tagsOf.some((list) => list.length > 0);
  if (hasMarks) {
    mkdirSync(join(path, "marks"));
    marksOf.forEach((list, index) => {
      const number = refNames[index]?.split(".")[0] ?? "";
      list.forEach((mark, position) => {
        const base = `${number}-${position + 1}`;
        copyFileSync(
          join(library.marksDir, cropFileName(mark.id)),
          join(path, "marks", `${base}.png`),
        );
        if (mark.comment.trim() !== "") {
          writeFileSync(join(path, "marks", `${base}.md`), mark.comment);
        }
      });
    });
  }
  writeFileSync(join(path, ".gitignore"), "*\n");
  const created = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}:${two(now.getMinutes())}:${two(now.getSeconds())}`;
  const intent = getIntent(library);
  const hasIntent = intent.trim() !== "";
  if (hasIntent) writeFileSync(join(path, "INTENT.md"), intent);
  const readme = [
    "# Reference pack",
    "",
    "This folder is a set of design references exported from refpack.",
    "Use the images in `refs/` as visual references for the interface you are asked to build.",
    ...(hasIntent
      ? [
          "",
          "Read `INTENT.md` before you look at the references. It says what is being built, for whom, and what they need to be able to do. It is in the owner's own words and may be in a language other than English.",
        ]
      : []),
    ...(notedImages.length > 0
      ? [
          "",
          "Some references have a note from the owner, shown next to the image in the list below. Read each note together with its image: it says what to take from that reference and what to avoid. The notes are in the owner's own words and may be in a language other than English.",
        ]
      : []),
    ...(hasMarks ? ["", MARKS_PARAGRAPH] : []),
    ...(hasTags ? ["", TAGS_PARAGRAPH] : []),
    "",
    `- Created: ${created}`,
    `- References: ${images.length}`,
    "",
    "## References",
    "",
    ...refNames
      .map((name, index) => {
        const line = `${index + 1}. \`refs/${name}\``;
        const withNote =
          images[index]?.note.trim() === ""
            ? line
            : `${line} — note: \`notes/${name.split(".")[0]}.md\``;
        const tags = tagsOf[index] ?? [];
        const withTags =
          tags.length === 0
            ? withNote
            : `${withNote} — tags: ${tags.map((tag) => JSON.stringify(tag.name)).join(", ")}`;
        return [withTags, ...(markLines[index] ?? [])];
      })
      .flat(),
    "",
  ].join("\n");
  writeFileSync(join(path, "README.md"), readme);
  return { ok: true, path, count: images.length };
}
