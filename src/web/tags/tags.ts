import type { Image, Tag } from "../../shared/api.ts";

const collator = new Intl.Collator("en");

// Every tag any image has, once each, sorted by name.
export function libraryTags(images: Image[]): Tag[] {
  const byId = new Map<string, Tag>();
  for (const image of images) {
    for (const tag of image.tags) byId.set(tag.id, tag);
  }
  return [...byId.values()].sort((x, y) => collator.compare(x.name, y.name));
}

// True when the two names are the same tag: equal after toLowerCase().
export function sameTag(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

// The tags of `all` the image does not have whose name contains `typed` (trimmed, case
// ignored). `all` is already sorted; the order is kept.
export function suggest(all: Tag[], own: Tag[], typed: string): Tag[] {
  const needle = typed.trim().toLowerCase();
  const owned = new Set(own.map((tag) => tag.id));
  return all.filter((tag) => !owned.has(tag.id) && tag.name.toLowerCase().includes(needle));
}
