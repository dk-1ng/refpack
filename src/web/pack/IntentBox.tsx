import { MAX_INTENT_LENGTH } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";
import type { SaveState } from "./saver.ts";

export function IntentBox({
  text,
  saveState,
  onChange,
}: {
  text: string | null;
  saveState: SaveState;
  onChange: (text: string) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="intent">
      <label htmlFor="intent">{t("intent.label")}</label>
      <textarea
        id="intent"
        rows={5}
        maxLength={MAX_INTENT_LENGTH}
        placeholder={t("intent.placeholder")}
        disabled={text === null}
        value={text ?? ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <span role="status" className="intent-status">
        {saveState === "saved" ? t("intent.saved") : null}
        {saveState === "failed" ? t("error.notSaved") : null}
      </span>
    </div>
  );
}
