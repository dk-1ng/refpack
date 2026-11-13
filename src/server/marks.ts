import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import { type Area, type MarkKind, MarkKindSchema } from "../shared/api.ts";
import { sniffImageType } from "./image-type.ts";
import { findImage, type Library } from "./library.ts";

export type StoredMark = {
  id: string;
  imageId: string;
  kind: MarkKind;
  area: Area;
  comment: string;
};
export type AddMarkResult =
  | { ok: true; mark: StoredMark }
  | { ok: false; code: "not-found" | "unsupported-type" };

const MarkRowSchema = z.object({
  id: z.uuid(),
  image_id: z.uuid(),
  kind: MarkKindSchema,
  area_left: z.number(),
  area_top: z.number(),
  area_right: z.number(),
  area_bottom: z.number(),
  comment: z.string(),
});

// The name of a mark's crop inside library.marksDir.
export function cropFileName(markId: string): string {
  return `${markId}.png`;
}

function toStoredMark(row: unknown): StoredMark {
  const parsed = MarkRowSchema.parse(row);
  return {
    id: parsed.id,
    imageId: parsed.image_id,
    kind: parsed.kind,
    area: {
      left: parsed.area_left,
      top: parsed.area_top,
      right: parsed.area_right,
      bottom: parsed.area_bottom,
    },
    comment: parsed.comment,
  };
}

// Stores the mark and writes the crop to marksDir/<mark id>.png (the folder is created when needed).
// "not-found": no image has this id. "unsupported-type": the crop is not a PNG, by its content.
// Nothing is stored in either case. The new mark has an empty comment.
export function addMark(
  library: Library,
  imageId: string,
  input: { kind: MarkKind; area: Area; crop: Uint8Array },
): AddMarkResult {
  if (findImage(library, imageId) === null) return { ok: false, code: "not-found" };
  if (sniffImageType(input.crop)?.mimeType !== "image/png") {
    return { ok: false, code: "unsupported-type" };
  }
  const id = randomUUID();
  mkdirSync(library.marksDir, { recursive: true });
  const cropPath = join(library.marksDir, cropFileName(id));
  writeFileSync(cropPath, input.crop);
  try {
    library.db
      .prepare(
        "INSERT INTO marks (id, image_id, kind, area_left, area_top, area_right, area_bottom) VALUES (?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        id,
        imageId,
        input.kind,
        input.area.left,
        input.area.top,
        input.area.right,
        input.area.bottom,
      );
  } catch (error) {
    rmSync(cropPath, { force: true });
    throw error;
  }
  return { ok: true, mark: { id, imageId, kind: input.kind, area: input.area, comment: "" } };
}

// Every mark, grouped by image id; each list in creation order. Images without marks have no entry.
export function listMarks(library: Library): Map<string, StoredMark[]> {
  const rows = library.db
    .prepare(
      "SELECT id, image_id, kind, area_left, area_top, area_right, area_bottom, comment FROM marks ORDER BY seq",
    )
    .all();
  const byImage = new Map<string, StoredMark[]>();
  for (const row of rows) {
    const mark = toStoredMark(row);
    const list = byImage.get(mark.imageId);
    if (list === undefined) byImage.set(mark.imageId, [mark]);
    else list.push(mark);
  }
  return byImage;
}

// The three below answer false when no mark has this id; nothing changes then.
export function setMarkKind(library: Library, markId: string, kind: MarkKind): boolean {
  const result = library.db.prepare("UPDATE marks SET kind = ? WHERE id = ?").run(kind, markId);
  return Number(result.changes) > 0;
}

// The text is stored exactly as given: no trimming, no normalization.
export function setMarkComment(library: Library, markId: string, comment: string): boolean {
  const result = library.db
    .prepare("UPDATE marks SET comment = ? WHERE id = ?")
    .run(comment, markId);
  return Number(result.changes) > 0;
}

// Removes the mark and its crop file.
export function deleteMark(library: Library, markId: string): boolean {
  const result = library.db.prepare("DELETE FROM marks WHERE id = ?").run(markId);
  if (Number(result.changes) === 0) return false;
  rmSync(join(library.marksDir, cropFileName(markId)), { force: true });
  return true;
}
