import { useEffect, useLayoutEffect, useRef } from "react";
import { MAX_COMMENT_LENGTH, type Mark, type MarkKind } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";
import { useComment } from "./use-comment.ts";

export function MarkItem({
  mark,
  number,
  focus,
  onCommentSaved,
  registerFlush,
  onKind,
  onDelete,
}: {
  mark: Mark;
  number: number;
  focus: boolean; // put the cursor in the comment box when the item mounts
  onCommentSaved: (markId: string, comment: string) => void;
  // Gives the viewer this item's flush while it is mounted, and null when it unmounts.
  registerFlush: (markId: string, flush: (() => Promise<boolean>) | null) => void;
  onKind: (markId: string, kind: MarkKind) => void;
  onDelete: (markId: string) => void;
}) {
  const { t } = useI18n();
  const draft = useComment(mark.id, mark.comment, onCommentSaved);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (focus) textareaRef.current?.focus();
  }, [focus]);

  const { flush } = draft;
  useEffect(() => {
    registerFlush(mark.id, flush);
    return () => registerFlush(mark.id, null);
  }, [mark.id, flush, registerFlush]);

  return (
    <li>
      <span className="mark-number">{t("mark.itemLabel", { number: String(number) })}</span>{" "}
      <div role="radiogroup" aria-label={t("mark.itemLabel", { number: String(number) })}>
        {(["like", "dislike"] as const).map((kind) => (
          <label key={kind}>
            <input
              type="radio"
              name={`kind-${mark.id}`}
              checked={mark.kind === kind}
              onChange={() => onKind(mark.id, kind)}
            />
            {t(kind === "like" ? "mark.like" : "mark.dislike")}
          </label>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        aria-label={t("mark.commentLabel", { number: String(number) })}
        placeholder={t("mark.commentPlaceholder")}
        maxLength={MAX_COMMENT_LENGTH}
        value={draft.text}
        onChange={(event) => draft.change(event.target.value)}
      />
      <span role="status" className="viewer-status">
        {draft.saveState === "saved" ? t("intent.saved") : null}
        {draft.saveState === "failed" ? t("error.notSaved") : null}
      </span>
      <button
        type="button"
        onClick={() => {
          if (draft.text.trim() !== "" && !window.confirm(t("mark.confirmDelete"))) return;
          onDelete(mark.id);
        }}
      >
        {t("mark.delete")}
      </button>
    </li>
  );
}
