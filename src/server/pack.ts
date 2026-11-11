import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { getIntent } from "./draft.ts";
import { type Library, listImages } from "./library.ts";

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
    "",
    `- Created: ${created}`,
    `- References: ${images.length}`,
    "",
    "## References",
    "",
    ...refNames.map((name, index) => `${index + 1}. \`refs/${name}\``),
    "",
  ].join("\n");
  writeFileSync(join(path, "README.md"), readme);
  return { ok: true, path, count: images.length };
}
