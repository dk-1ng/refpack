import { useEffect, useRef, useState } from "react";
import { useI18n } from "../i18n/index.tsx";
import { type AddHandlers, addFiles } from "./add-files.ts";
import { readIncoming } from "./incoming.ts";

type Props = AddHandlers & {
  // True while an image is open large: pasting and dropping then add nothing and show nothing.
  paused: boolean;
};

export function IncomingFiles({ onAdded, onRefused, paused }: Props) {
  const { t } = useI18n();
  const [dragging, setDragging] = useState(false);
  // The listeners below outlive renders, so they read the current value from a ref.
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
    if (paused) setDragging(false);
  }, [paused]);

  useEffect(() => {
    // One rule for paste and drop. The data is read before any await: the browser empties it
    // after the handler returns.
    function receive(
      data: DataTransfer | null,
      nothingKey: "error.nothingToPaste" | "error.nothingToAdd",
    ): void {
      const { files, folders } = readIncoming(data);
      for (const name of folders) onRefused({ key: "error.folder", vars: { name } });
      if (files.length === 0 && folders.length === 0) {
        onRefused({ key: nothingKey });
        return;
      }
      if (files.length > 0) void addFiles(files, { onAdded, onRefused });
    }
    function onPaste(event: ClipboardEvent): void {
      if (pausedRef.current) {
        // Text pasted into the note box belongs to the box; anything else is swallowed.
        const { files, folders } = readIncoming(event.clipboardData);
        if (
          event.target instanceof HTMLTextAreaElement &&
          files.length === 0 &&
          folders.length === 0
        ) {
          return;
        }
        event.preventDefault();
        return;
      }
      // Inside the intent box a paste without files is text for the box (CA-2.12); with files,
      // the box must not take their names as text.
      if (event.target instanceof HTMLTextAreaElement) {
        const { files, folders } = readIncoming(event.clipboardData);
        if (files.length === 0 && folders.length === 0) return;
        event.preventDefault();
      }
      receive(event.clipboardData, "error.nothingToPaste");
    }
    function onDragEnter(event: DragEvent): void {
      event.preventDefault();
      if (pausedRef.current) return;
      if (event.dataTransfer?.types.includes("Files")) setDragging(true);
    }
    function onDragOver(event: DragEvent): void {
      // Without this the browser never delivers the drop and may open what was dropped.
      event.preventDefault();
    }
    function onDrop(event: DragEvent): void {
      event.preventDefault();
      if (pausedRef.current) return;
      setDragging(false);
      receive(event.dataTransfer, "error.nothingToAdd");
    }
    window.addEventListener("paste", onPaste);
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onAdded, onRefused]);

  if (!dragging) return null;
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a drag event is not user interaction, the overlay only reacts to the pointer leaving
    <div className="drop-overlay" onDragLeave={() => setDragging(false)}>
      <p>{t("library.dropHere")}</p>
    </div>
  );
}
