import { useCallback, useState } from "react";
import { saveNote } from "../api.ts";
import { createSaver, type SaveState } from "../pack/saver.ts";

export type NoteDraft = {
  text: string;
  saveState: SaveState;
  change(text: string): void; // shows the text in the box and pushes it to the saver
  flush(): Promise<boolean>;
};

// `saved` is the note the server last confirmed; it is read once, when the image opens.
export function useNote(
  id: string,
  saved: string,
  onSaved: (id: string, note: string) => void,
): NoteDraft {
  const [text, setText] = useState(saved);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // One saver per mount: it holds the order of the sends (ADR-0012).
  const [saver] = useState(() =>
    createSaver(async (next) => {
      const ok = await saveNote(id, next);
      if (ok) onSaved(id, next);
      return ok;
    }, setSaveState),
  );

  const change = useCallback(
    (next: string) => {
      setText(next);
      saver.push(next);
    },
    [saver],
  );
  const flush = useCallback(() => saver.flush(), [saver]);

  return { text, saveState, change, flush };
}
