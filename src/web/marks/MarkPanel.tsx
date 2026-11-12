import type { Area, Mark, MarkKind } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";

export function MarkPanel({
  marks,
  pending,
  failed,
  onChoose,
  onCancel,
}: {
  marks: Mark[];
  pending: Area | null;
  failed: boolean; // the last change to the marks could not be saved
  onChoose: (kind: MarkKind) => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  return (
    <section className="marks" aria-label={t("mark.listLabel")}>
      <p>{t("mark.hint")}</p>
      {pending !== null ? (
        // biome-ignore lint/a11y/useSemanticElements: a row of buttons, not a form field set
        <div role="group" aria-label={t("mark.newLabel")} className="mark-choice">
          <button type="button" onClick={() => onChoose("like")}>
            {t("mark.like")}
          </button>
          <button type="button" onClick={() => onChoose("dislike")}>
            {t("mark.dislike")}
          </button>
          <button type="button" onClick={onCancel}>
            {t("mark.cancel")}
          </button>
        </div>
      ) : null}
      {failed ? <p role="alert">{t("error.notSaved")}</p> : null}
      {marks.length > 0 ? (
        <ol>
          {marks.map((mark, index) => (
            <li key={mark.id}>
              <span className="mark-number">
                {t("mark.itemLabel", { number: String(index + 1) })}
              </span>{" "}
              {t(mark.kind === "like" ? "mark.like" : "mark.dislike")}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
