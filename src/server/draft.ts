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
