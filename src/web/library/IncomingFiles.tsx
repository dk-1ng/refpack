import { useEffect } from "react";
import { type AddHandlers, addFiles } from "./add-files.ts";
import { readIncoming } from "./incoming.ts";

export function IncomingFiles({ onAdded, onRefused }: AddHandlers) {
  useEffect(() => {
    function onPaste(event: ClipboardEvent): void {
      // The clipboard is emptied after the handler returns, so read it before any await.
      const files = readIncoming(event.clipboardData);
      if (files.length === 0) {
        onRefused({ key: "error.nothingToPaste" });
        return;
      }
      void addFiles(files, { onAdded, onRefused });
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onAdded, onRefused]);

  return null;
}
