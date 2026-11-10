import { useRef } from "react";
import { useI18n } from "../i18n/index.tsx";
import { type AddHandlers, addFiles } from "./add-files.ts";

export function AddImages(handlers: AddHandlers) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);

  return (
    <>
      <button type="button" onClick={() => input.current?.click()}>
        {t("library.add")}
      </button>
      <span className="add-hint">{t("library.hint")}</span>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept=".png,.jpg,.jpeg,.webp"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          void addFiles(files, handlers);
        }}
      />
    </>
  );
}
