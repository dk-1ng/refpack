import { z } from "zod";
import type { Library } from "./library.ts";

// False when no image has this id; nothing changes then.
export function setSelected(library: Library, id: string, selected: boolean): boolean {
  const result = library.db
    .prepare("UPDATE images SET selected = ? WHERE id = ?")
    .run(selected ? 1 : 0, id);
  return Number(result.changes) > 0;
}

export function setAllSelected(library: Library, selected: boolean): void {
  library.db.prepare("UPDATE images SET selected = ?").run(selected ? 1 : 0);
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
