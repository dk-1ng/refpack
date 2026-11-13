import { z } from "zod";
import type { Library } from "./library.ts";

// False when no image has this id; nothing changes then.
export function setSelected(library: Library, id: string, selected: boolean): boolean {
  const result = library.db
    .prepare("UPDATE images SET selected = ? WHERE id = ?")
    .run(selected ? 1 : 0, id);
  return Number(result.changes) > 0;
}

// Selects or unselects every image, or only the images with the tag when `tagId` is given.
// False only when `tagId` is given and no tag has that id; nothing changes then.
export function setAllSelected(library: Library, selected: boolean, tagId?: string): boolean {
  const value = selected ? 1 : 0;
  if (tagId === undefined) {
    library.db.prepare("UPDATE images SET selected = ?").run(value);
    return true;
  }
  if (library.db.prepare("SELECT 1 FROM tags WHERE id = ?").get(tagId) === undefined) return false;
  library.db
    .prepare(
      "UPDATE images SET selected = ? WHERE id IN (SELECT image_id FROM image_tags WHERE tag_id = ?)",
    )
    .run(value, tagId);
  return true;
}

const IntentRowSchema = z.object({ intent: z.string() });

export function getIntent(library: Library): string {
  const row = library.db.prepare("SELECT intent FROM pack_draft WHERE id = 1").get();
  return IntentRowSchema.parse(row).intent;
}

// The text is stored exactly as given: no trimming, no normalization.
export function setIntent(library: Library, intent: string): void {
  library.db.prepare("UPDATE pack_draft SET intent = ? WHERE id = 1").run(intent);
}
