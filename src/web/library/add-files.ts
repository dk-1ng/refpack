import type { Image } from "../../shared/api.ts";
import { MAX_IMAGE_BYTES } from "../../shared/api.ts";
import { uploadImage } from "../api.ts";
import type { Notice } from "../i18n/index.tsx";

export type AddHandlers = { onAdded: (image: Image) => void; onRefused: (notice: Notice) => void };

export async function addFiles(files: File[], handlers: AddHandlers): Promise<void> {
  for (const file of files) {
    const result =
      file.size > MAX_IMAGE_BYTES
        ? ({ ok: false, code: "too-large" } as const)
        : await uploadImage(file);
    if (result.ok) {
      handlers.onAdded(result.image);
    } else if (result.code === "unsupported-type") {
      handlers.onRefused({ key: "error.unsupportedType", vars: { name: file.name } });
    } else if (result.code === "too-large") {
      handlers.onRefused({ key: "error.tooLarge", vars: { name: file.name } });
    } else {
      handlers.onRefused({ key: "error.generic" });
    }
  }
}
