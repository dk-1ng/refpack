import { useCallback, useState } from "react";
import { saveMarkComment } from "../api.ts";
import { createSaver, type SaveState } from "../pack/saver.ts";

export type CommentDraft = {
  text: string;
  saveState: SaveState;
  change(text: string): void; // shows the text in the box and pushes it to the saver
  flush(): Promise<boolean>;
};

// `saved` is the comment the server last confirmed; it is read once, when the item mounts.
export function useComment(
  markId: string,
  saved: string,
  onSaved: (markId: string, comment: string) => void,
): CommentDraft {
  const [text, setText] = useState(saved);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // One saver per mount: it holds the order of the sends (ADR-0012).
  const [saver] = useState(() =>
    createSaver(async (next) => {
      const ok = await saveMarkComment(markId, next);
      if (ok) onSaved(markId, next);
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
