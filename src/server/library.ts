import { createHash, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { MAX_IMAGE_BYTES } from "../shared/api.ts";
import { type ImageType, sniffImageType } from "./image-type.ts";

export type Library = {
  root: string;
  imagesDir: string;
  packsDir: string;
  marksDir: string;
  thumbsDir: string;
  db: DatabaseSync;
};
export type StoredImage = {
  id: string;
  originalName: string;
  mimeType: ImageType["mimeType"];
  fileName: string;
  selected: boolean;
  note: string;
  thumbMimeType: ImageType["mimeType"] | null;
};

const migrationsDir = join(import.meta.dirname, "migrations");

const ImageRowSchema = z.object({
  id: z.uuid(),
  original_name: z.string(),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
  selected: z.union([z.literal(0), z.literal(1)]),
  note: z.string(),
  thumb_mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]).nullable(),
});

const extensionByMimeType: Record<ImageType["mimeType"], ImageType["extension"]> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export function resolveLibraryRoot(env: NodeJS.ProcessEnv, homeDir: string): string {
  const configured = env.REFPACK_LIBRARY;
  if (configured !== undefined && configured !== "") {
    return configured;
  }
  return join(homeDir, "refpack-library");
}

function migrate(db: DatabaseSync): void {
  const row = db.prepare("PRAGMA user_version").get();
  const current = z.object({ user_version: z.number().int() }).parse(row).user_version;
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  files.forEach((name, index) => {
    const version = index + 1;
    if (version <= current) return;
    db.exec(readFileSync(join(migrationsDir, name), "utf8"));
    db.exec(`PRAGMA user_version = ${version}`);
  });
}

export function openLibrary(root: string): Library {
  const imagesDir = join(root, "images");
  mkdirSync(imagesDir, { recursive: true });
  const db = new DatabaseSync(join(root, "library.db"));
  migrate(db);
  const library: Library = {
    root,
    imagesDir,
    packsDir: join(root, "packs"),
    marksDir: join(root, "marks"),
    thumbsDir: join(root, "thumbs"),
    db,
  };
  fingerprintExisting(library);
  return library;
}

function contentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

// Gives the content hash to every image that has none and whose file exists.
function fingerprintExisting(library: Library): void {
  const rows = library.db
    .prepare("SELECT id, mime_type FROM images WHERE content_hash IS NULL")
    .all();
  if (rows.length === 0) return;
  const update = library.db.prepare("UPDATE images SET content_hash = ? WHERE id = ?");
  library.db.exec("BEGIN");
  try {
    for (const row of rows) {
      const parsed = z
        .object({ id: z.uuid(), mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]) })
        .parse(row);
      const path = join(library.imagesDir, `${parsed.id}.${extensionByMimeType[parsed.mime_type]}`);
      if (!existsSync(path)) continue;
      update.run(contentHash(readFileSync(path)), parsed.id);
    }
    library.db.exec("COMMIT");
  } catch (error) {
    library.db.exec("ROLLBACK");
    throw error;
  }
}

export function closeLibrary(library: Library): void {
  library.db.close();
}

export type AddImageResult =
  | { ok: true; image: StoredImage }
  | { ok: false; code: "unsupported-type" | "too-large" | "identical" };

function toStoredImage(row: unknown): StoredImage {
  const parsed = ImageRowSchema.parse(row);
  return {
    id: parsed.id,
    originalName: parsed.original_name,
    mimeType: parsed.mime_type,
    fileName: `${parsed.id}.${extensionByMimeType[parsed.mime_type]}`,
    selected: parsed.selected === 1,
    note: parsed.note,
    thumbMimeType: parsed.thumb_mime_type,
  };
}

// Always stores the SHA-256 (hex) of the bytes in content_hash. With skipIdentical, when an image
// with the same content_hash exists, writes nothing and answers "identical". The checks run in
// this order: too-large, unsupported-type, identical.
export function addImage(
  library: Library,
  input: { bytes: Uint8Array; originalName: string; skipIdentical?: boolean },
): AddImageResult {
  if (input.bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, code: "too-large" };
  }
  const type = sniffImageType(input.bytes);
  if (type === null) {
    return { ok: false, code: "unsupported-type" };
  }
  const hash = contentHash(input.bytes);
  if (
    input.skipIdentical === true &&
    library.db.prepare("SELECT 1 FROM images WHERE content_hash = ? LIMIT 1").get(hash) !==
      undefined
  ) {
    return { ok: false, code: "identical" };
  }
  const id = randomUUID();
  const fileName = `${id}.${type.extension}`;
  writeFileSync(join(library.imagesDir, fileName), input.bytes);
  library.db
    .prepare("INSERT INTO images (id, original_name, mime_type, content_hash) VALUES (?, ?, ?, ?)")
    .run(id, input.originalName, type.mimeType, hash);
  return {
    ok: true,
    image: {
      id,
      originalName: input.originalName,
      mimeType: type.mimeType,
      fileName,
      selected: false,
      note: "",
      thumbMimeType: null,
    },
  };
}

export function listImages(library: Library): StoredImage[] {
  const rows = library.db
    .prepare(
      "SELECT id, original_name, mime_type, selected, note, thumb_mime_type FROM images ORDER BY seq DESC",
    )
    .all();
  return rows.map(toStoredImage);
}

export function findImage(library: Library, id: string): StoredImage | null {
  const row = library.db
    .prepare(
      "SELECT id, original_name, mime_type, selected, note, thumb_mime_type FROM images WHERE id = ?",
    )
    .get(id);
  return row === undefined ? null : toStoredImage(row);
}

// False when no image has this id; nothing changes then.
// The text is stored exactly as given: no trimming, no normalization.
export function setNote(library: Library, id: string, note: string): boolean {
  const result = library.db.prepare("UPDATE images SET note = ? WHERE id = ?").run(note, id);
  return Number(result.changes) > 0;
}

// The name of the image's thumbnail inside thumbsDir (`<id>.<extension>`), null without one.
export function thumbFileName(image: StoredImage): string | null {
  return image.thumbMimeType === null
    ? null
    : `${image.id}.${extensionByMimeType[image.thumbMimeType]}`;
}

export type SetThumbnailResult =
  | { ok: true }
  | { ok: false; code: "not-found" | "unsupported-type" };

// Checks the type by content, writes thumbsDir/<id>.<extension> (creating the folder), deletes the
// image's previous thumbnail file when its extension differs, and stores thumb_mime_type.
export function setThumbnail(library: Library, id: string, bytes: Uint8Array): SetThumbnailResult {
  const image = findImage(library, id);
  if (image === null) return { ok: false, code: "not-found" };
  const type = sniffImageType(bytes);
  if (type === null) return { ok: false, code: "unsupported-type" };
  mkdirSync(library.thumbsDir, { recursive: true });
  const previous = thumbFileName(image);
  writeFileSync(join(library.thumbsDir, `${id}.${type.extension}`), bytes);
  if (previous !== null && previous !== `${id}.${type.extension}`) {
    rmSync(join(library.thumbsDir, previous), { force: true });
  }
  library.db.prepare("UPDATE images SET thumb_mime_type = ? WHERE id = ?").run(type.mimeType, id);
  return { ok: true };
}
