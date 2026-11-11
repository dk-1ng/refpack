import { useCallback, useEffect, useState } from "react";
import { fetchIntent, saveIntent } from "../api.ts";
import { createSaver, type SaveState } from "./saver.ts";

export type IntentDraft = {
  text: string | null; // null until it is loaded from the server
  saveState: SaveState;
  change(text: string): void; // shows the text in the box and pushes it to the saver
  flush(): Promise<boolean>;
};

export function useIntent(): IntentDraft {
  const [text, setText] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // One saver per mount: it holds the order of the sends (ADR-0012).
  const [saver] = useState(() => createSaver(saveIntent, setSaveState));

  useEffect(() => {
    let cancelled = false;
    fetchIntent().then(
      (loaded) => {
        if (!cancelled) {
          setText(loaded);
        }
      },
      () => {
        if (!cancelled) {
          setText(null);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

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
