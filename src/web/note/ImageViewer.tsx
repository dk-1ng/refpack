import { useLayoutEffect, useRef, useState } from "react";
import {
  type Area,
  type Image,
  MAX_NOTE_LENGTH,
  type Mark,
  type MarkKind,
} from "../../shared/api.ts";
import { createMark } from "../api.ts";
import { useI18n } from "../i18n/index.tsx";
import { cropToPng } from "../marks/crop.ts";
import { ImageStage } from "../marks/ImageStage.tsx";
import { MarkPanel } from "../marks/MarkPanel.tsx";
import { useNote } from "./use-note.ts";

export function ImageViewer({
  image,
  previousId,
  nextId,
  onOpen,
  onClose,
  onSaved,
  onMarks,
}: {
  image: Image;
  previousId: string | null;
  nextId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
  onSaved: (id: string, note: string) => void;
  onMarks: (id: string, change: (marks: Mark[]) => Mark[]) => void;
}) {
  const { t } = useI18n();
  const note = useNote(image.id, image.note, onSaved);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const leaving = useRef(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const [pending, setPending] = useState<Area | null>(null);
  const [failed, setFailed] = useState(false);
  const creating = useRef(false);

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

  // Crops the waiting rectangle and creates the mark; the screen shows it only once the server
  // has it (ADR-0012). A click while a mark is being created is ignored.
  async function choose(kind: MarkKind): Promise<void> {
    const area = pending;
    if (creating.current || area === null) return;
    creating.current = true;
    try {
      const crop = imageRef.current === null ? null : await cropToPng(imageRef.current, area);
      const mark = crop === null ? null : await createMark(image.id, kind, area, crop);
      if (mark === null) {
        setFailed(true);
      } else {
        onMarks(image.id, (marks) => [...marks, mark]);
        setFailed(false);
      }
    } finally {
      creating.current = false;
      // Only this rectangle: one drawn while the mark was being created stays.
      setPending((current) => (current === area ? null : current));
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
      <ImageStage image={image} imageRef={imageRef} pending={pending} onPending={setPending} />
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
        <MarkPanel
          marks={image.marks}
          pending={pending}
          failed={failed}
          onChoose={(kind) => void choose(kind)}
          onCancel={() => setPending(null)}
        />
        <div className="viewer-buttons">
          <button
            type="button"
            disabled={previousId === null}
            onClick={() => previousId !== null && void leave(() => onOpen(previousId))}
          >
            {t("viewer.previous")}
          </button>
          <button
            type="button"
            disabled={nextId === null}
            onClick={() => nextId !== null && void leave(() => onOpen(nextId))}
          >
            {t("viewer.next")}
          </button>
          <button type="button" onClick={() => void leave(onClose)}>
            {t("viewer.close")}
          </button>
        </div>
      </div>
    </dialog>
  );
}
