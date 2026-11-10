import {
  ErrorSchema,
  type Image,
  ImageListSchema,
  ImageSchema,
  type PackCreated,
  PackCreatedSchema,
} from "../shared/api.ts";

export async function fetchImages(): Promise<Image[]> {
  const response = await fetch("/api/images");
  if (!response.ok) {
    throw new Error(`GET /api/images failed with status ${response.status}`);
  }
  return ImageListSchema.parse(await response.json()).images;
}

export type UploadResult =
  | { ok: true; image: Image }
  | { ok: false; code: "unsupported-type" | "too-large" | "generic" };

export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    const response = await fetch("/api/images", {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-original-name": encodeURIComponent(file.name),
      },
      body: file,
    });
    const body: unknown = await response.json();
    if (response.ok) {
      const parsed = ImageSchema.safeParse(body);
      return parsed.success ? { ok: true, image: parsed.data } : { ok: false, code: "generic" };
    }
    const error = ErrorSchema.safeParse(body);
    if (error.success) {
      const code = error.data.error.code;
      if (code === "unsupported-type" || code === "too-large") return { ok: false, code };
    }
    return { ok: false, code: "generic" };
  } catch {
    return { ok: false, code: "generic" };
  }
}

export type CreatePackResult =
  | { ok: true; pack: PackCreated }
  | { ok: false; code: "nothing-selected" | "generic" };

export async function createPack(): Promise<CreatePackResult> {
  try {
    const response = await fetch("/api/packs", { method: "POST" });
    const body: unknown = await response.json();
    if (response.ok) {
      const parsed = PackCreatedSchema.safeParse(body);
      return parsed.success ? { ok: true, pack: parsed.data } : { ok: false, code: "generic" };
    }
    const error = ErrorSchema.safeParse(body);
    if (error.success && error.data.error.code === "nothing-selected") {
      return { ok: false, code: "nothing-selected" };
    }
    return { ok: false, code: "generic" };
  } catch {
    return { ok: false, code: "generic" };
  }
}

async function putSelected(path: string, selected: boolean): Promise<boolean> {
  try {
    const response = await fetch(path, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ selected }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export function setImageSelected(id: string, selected: boolean): Promise<boolean> {
  return putSelected(`/api/images/${encodeURIComponent(id)}/selected`, selected);
}

export function setAllSelected(selected: boolean): Promise<boolean> {
  return putSelected("/api/draft/selection", selected);
}
