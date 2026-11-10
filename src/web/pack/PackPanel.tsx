import { useState } from "react";
import { createPack } from "../api.ts";
import { type Notice, useI18n } from "../i18n/index.tsx";

export function PackPanel({
  imageCount,
  selectedCount,
  beforeGenerate,
  onFailed,
}: {
  imageCount: number;
  selectedCount: number;
  beforeGenerate: () => Promise<boolean>;
  onFailed: (notice: Notice) => void;
}) {
  const { t } = useI18n();
  const [path, setPath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generate(): Promise<void> {
    if (!(await beforeGenerate())) {
      onFailed({ key: "error.notSaved" });
      return;
    }
    const result = await createPack();
    if (result.ok) {
      setPath(result.pack.path);
      setCopied(false);
    } else {
      onFailed({ key: "error.generic" });
    }
  }

  async function copy(): Promise<void> {
    if (path === null) return;
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
    } catch {
      onFailed({ key: "error.generic" });
    }
  }

  return (
    <section className="pack-panel">
      <button type="button" disabled={selectedCount === 0} onClick={() => void generate()}>
        {t("pack.generate")}
      </button>
      {imageCount === 0 ? <span className="pack-hint">{t("pack.disabledHint")}</span> : null}
      {imageCount > 0 && selectedCount === 0 ? (
        <span className="pack-hint">{t("pack.selectHint")}</span>
      ) : null}
      {path !== null ? (
        <p className="pack-result">
          {t("pack.created")} <code>{path}</code>{" "}
          <button type="button" onClick={() => void copy()}>
            {copied ? t("pack.copied") : t("pack.copy")}
          </button>
        </p>
      ) : null}
    </section>
  );
}
