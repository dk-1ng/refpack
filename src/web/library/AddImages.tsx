import { useRef } from "react";
import type { Image } from "../../shared/api.ts";
import { MAX_IMAGE_BYTES } from "../../shared/api.ts";
import { uploadImage } from "../api.ts";
import { useI18n } from "../i18n/index.tsx";

export function AddImages({
  onAdded,
  onRefused,
}: {
  onAdded: (image: Image) => void;
  onRefused: (message: string) => void;
}) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);

  async function handleFiles(files: File[]): Promise<void> {
    for (const file of files) {
      const result =
        file.size > MAX_IMAGE_BYTES
          ? ({ ok: false, code: "too-large" } as const)
          : await uploadImage(file);
      if (result.ok) {
        onAdded(result.image);
      } else if (result.code === "unsupported-type") {
        onRefused(t("error.unsupportedType", { name: file.name }));
      } else if (result.code === "too-large") {
        onRefused(t("error.tooLarge", { name: file.name }));
      } else {
        onRefused(t("error.generic"));
      }
    }
  }

  return (
    <>
      <button type="button" onClick={() => input.current?.click()}>
        {t("library.add")}
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void handleFiles(files);
        }}
      />
    </>
  );
}
