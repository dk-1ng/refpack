import { useLayoutEffect, useRef } from "react";
import { type Image, MAX_NOTE_LENGTH } from "../../shared/api.ts";
import { useI18n } from "../i18n/index.tsx";
import { useNote } from "./use-note.ts";

export function ImageViewer({
  image,
  onClose,
  onSaved,
}: {
  image: Image;
  onClose: () => void;
  onSaved: (id: string, note: string) => void;
}) {
  const { t } = useI18n();
  const note = useNote(image.id, image.note, onSaved);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const leaving = useRef(false);

  useLayoutEffect(() => {
    dialogRef.current?.showModal();
    textareaRef.current?.focus();
  }, []);

  // Runs `then` once the note is saved; when it cannot be saved, asks first (CA-3.9).
  // A call made while another one is still running is ignored.
  async function leave(then: () => void): Promise<void> {
    if (leaving.current) return;
    leaving.current = true;
    try {
      if ((await note.flush()) || window.confirm(t("note.confirmLeave"))) then();
    } finally {
      leaving.current = false;
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="viewer"
      aria-label={image.originalName}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          void leave(onClose);
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        void leave(onClose);
      }}
      onClose={onClose}
    >
      <img className="viewer-image" src={image.url} alt={image.originalName} />
      <div className="viewer-side">
        <label htmlFor="note">{t("note.label")}</label>
        <textarea
          id="note"
          ref={textareaRef}
          maxLength={MAX_NOTE_LENGTH}
          placeholder={t("note.placeholder")}
          value={note.text}
          onChange={(event) => note.change(event.target.value)}
        />
        <span role="status" className="viewer-status">
          {note.saveState === "saved" ? t("intent.saved") : null}
          {note.saveState === "failed" ? t("error.notSaved") : null}
        </span>
        <button type="button" onClick={() => void leave(onClose)}>
          {t("viewer.close")}
        </button>
      </div>
    </dialog>
  );
}
