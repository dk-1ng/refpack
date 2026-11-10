import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";
import { MAX_IMAGE_BYTES } from "../shared/api.ts";
import { type ImageType, sniffImageType } from "./image-type.ts";

export type Library = { root: string; imagesDir: string; packsDir: string; db: DatabaseSync };
export type StoredImage = {
  id: string;
  originalName: string;
  mimeType: ImageType["mimeType"];
  fileName: string;
};

const migrationsDir = join(import.meta.dirname, "migrations");

const ImageRowSchema = z.object({
  id: z.uuid(),
  original_name: z.string(),
  mime_type: z.enum(["image/png", "image/jpeg", "image/webp"]),
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
  return { root, imagesDir, packsDir: join(root, "packs"), db };
}

export function closeLibrary(library: Library): void {
  library.db.close();
}

export type AddImageResult =
  | { ok: true; image: StoredImage }
  | { ok: false; code: "unsupported-type" | "too-large" };

function toStoredImage(row: unknown): StoredImage {
  const parsed = ImageRowSchema.parse(row);
  return {
    id: parsed.id,
    originalName: parsed.original_name,
    mimeType: parsed.mime_type,
    fileName: `${parsed.id}.${extensionByMimeType[parsed.mime_type]}`,
  };
}

export function addImage(
  library: Library,
  input: { bytes: Uint8Array; originalName: string },
): AddImageResult {
  if (input.bytes.byteLength > MAX_IMAGE_BYTES) {
    return { ok: false, code: "too-large" };
  }
  const type = sniffImageType(input.bytes);
  if (type === null) {
    return { ok: false, code: "unsupported-type" };
  }
  const id = randomUUID();
  const fileName = `${id}.${type.extension}`;
  writeFileSync(join(library.imagesDir, fileName), input.bytes);
  library.db
    .prepare("INSERT INTO images (id, original_name, mime_type) VALUES (?, ?, ?)")
    .run(id, input.originalName, type.mimeType);
  return {
    ok: true,
    image: { id, originalName: input.originalName, mimeType: type.mimeType, fileName },
  };
}

export function listImages(library: Library): StoredImage[] {
  const rows = library.db
    .prepare("SELECT id, original_name, mime_type FROM images ORDER BY seq DESC")
    .all();
  return rows.map(toStoredImage);
}

export function findImage(library: Library, id: string): StoredImage | null {
  const row = library.db
    .prepare("SELECT id, original_name, mime_type FROM images WHERE id = ?")
    .get(id);
  return row === undefined ? null : toStoredImage(row);
}
