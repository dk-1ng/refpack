import { randomUUID } from "node:crypto";
import { z } from "zod";
import { findImage, type Library } from "./library.ts";

export type StoredTag = { id: string; name: string };
export type AddTagResult =
  | { ok: true; tag: StoredTag; linked: boolean } // linked: false when the image already had it
  | { ok: false; code: "not-found" };

const TagRowSchema = z.object({ id: z.uuid(), name: z.string() });
const ImageTagRowSchema = z.object({ image_id: z.uuid(), id: z.uuid(), name: z.string() });

// The key two names are compared by: the name in lower case (ADR-0017, item 2).
export function tagKey(name: string): string {
  return name.toLowerCase();
}

// Puts the tag on the image. Reuses the tag whose key matches, keeping its stored name; creates
// one with `name`, stored exactly as given, when none matches. "not-found": no image has this id.
export function addTag(library: Library, imageId: string, name: string): AddTagResult {
  if (findImage(library, imageId) === null) return { ok: false, code: "not-found" };
  const key = tagKey(name);
  const row = library.db.prepare("SELECT id, name FROM tags WHERE key = ?").get(key);
  let tag: StoredTag;
  if (row === undefined) {
    tag = { id: randomUUID(), name };
    library.db
      .prepare("INSERT INTO tags (id, name, key) VALUES (?, ?, ?)")
      .run(tag.id, tag.name, key);
  } else {
    tag = TagRowSchema.parse(row);
  }
  const result = library.db
    .prepare("INSERT OR IGNORE INTO image_tags (image_id, tag_id) VALUES (?, ?)")
    .run(imageId, tag.id);
  return { ok: true, tag, linked: Number(result.changes) > 0 };
}

// Takes the tag off the image and deletes the tag once no image has it. False when the image,
// the tag, or the link does not exist; nothing changes then.
export function removeTag(library: Library, imageId: string, tagId: string): boolean {
  const result = library.db
    .prepare("DELETE FROM image_tags WHERE image_id = ? AND tag_id = ?")
    .run(imageId, tagId);
  if (Number(result.changes) === 0) return false;
  library.db
    .prepare(
      "DELETE FROM tags WHERE id = ? AND NOT EXISTS (SELECT 1 FROM image_tags WHERE tag_id = ?)",
    )
    .run(tagId, tagId);
  return true;
}

// Every image's tags, in the order they were put on. Images without tags have no entry.
export function listTags(library: Library): Map<string, StoredTag[]> {
  const rows = library.db
    .prepare(
      "SELECT image_tags.image_id AS image_id, tags.id AS id, tags.name AS name FROM image_tags JOIN tags ON tags.id = image_tags.tag_id ORDER BY image_tags.seq",
    )
    .all();
  const byImage = new Map<string, StoredTag[]>();
  for (const row of rows) {
    const parsed = ImageTagRowSchema.parse(row);
    const tag = { id: parsed.id, name: parsed.name };
    const list = byImage.get(parsed.image_id);
    if (list === undefined) byImage.set(parsed.image_id, [tag]);
    else list.push(tag);
  }
  return byImage;
}
