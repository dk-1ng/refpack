// The save rule of ADR-0012, without React and without timers.
export type SaveState = "idle" | "saving" | "saved" | "failed";
export type Saver = {
  // Records the latest text and makes sure it gets sent. Never two sends at once.
  push(text: string): void;
  // Sends what is still unsent (also after a failure), waits until nothing is in flight,
  // and answers whether the latest text is the one the server confirmed.
  flush(): Promise<boolean>;
};
export function createSaver(
  send: (text: string) => Promise<boolean>,
  onState: (state: SaveState) => void,
): Saver {
  let latest: string | null = null; // last text pushed
  let confirmed: string | null = null; // last text the server confirmed
  let running: Promise<void> | null = null;

  async function run(): Promise<void> {
    onState("saving");
    let ok = true;
    while (ok && latest !== confirmed) {
      const text = latest as string;
      ok = await send(text);
      if (ok) confirmed = text;
    }
    running = null;
    onState(ok ? "saved" : "failed");
  }

  function start(): void {
    if (running === null && latest !== confirmed) running = run();
  }

  return {
    push(text) {
      latest = text;
      if (running === null && latest === confirmed) onState("saved");
      start();
    },
    async flush() {
      start();
      while (running !== null) await running;
      return latest === confirmed;
    },
  };
}
