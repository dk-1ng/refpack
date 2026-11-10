import { expect, test } from "vitest";
import { createSaver, type SaveState } from "./saver.ts";

// A fake send: records each text and returns a promise the test settles by hand.
function setup() {
  const sent: string[] = [];
  const pending: ((ok: boolean) => void)[] = [];
  const states: SaveState[] = [];
  const saver = createSaver(
    (text) => {
      sent.push(text);
      return new Promise<boolean>((resolve) => pending.push(resolve));
    },
    (state) => states.push(state),
  );
  // Settles the oldest send still in flight, then lets the saver react.
  async function answer(ok: boolean): Promise<void> {
    const resolve = pending.shift();
    if (resolve === undefined) throw new Error("no send in flight");
    resolve(ok);
    await new Promise<void>((done) => setImmediate(done));
  }
  return { saver, sent, states, pending, answer };
}

test("ADR-0012 a pushed text is sent and reported as saving, then saved", async () => {
  const { saver, sent, states, answer } = setup();
  saver.push("a");
  expect(sent).toEqual(["a"]);
  expect(states).toEqual(["saving"]);
  await answer(true);
  expect(states).toEqual(["saving", "saved"]);
});

test("ADR-0012 never two sends at once, and only the latest text follows", async () => {
  const { saver, sent, states, pending, answer } = setup();
  saver.push("a");
  saver.push("ab");
  saver.push("abc");
  expect(sent).toEqual(["a"]);
  expect(pending).toHaveLength(1);
  await answer(true);
  expect(sent).toEqual(["a", "abc"]);
  expect(pending).toHaveLength(1);
  await answer(true);
  expect(states.at(-1)).toBe("saved");
  expect(sent).not.toContain("ab");
});

test("ADR-0012 a failed send is reported and flush tries the same text again", async () => {
  const { saver, sent, states, answer } = setup();
  saver.push("a");
  await answer(false);
  expect(states.at(-1)).toBe("failed");
  const done = saver.flush();
  expect(sent).toEqual(["a", "a"]);
  await answer(true);
  expect(await done).toBe(true);
  expect(states.at(-1)).toBe("saved");
});

test("ADR-0012 flush waits for the send in flight", async () => {
  const { saver, answer } = setup();
  saver.push("a");
  let settled = false;
  const done = saver.flush().then((result) => {
    settled = true;
    return result;
  });
  await new Promise<void>((resolve) => setImmediate(resolve));
  expect(settled).toBe(false);
  await answer(true);
  expect(await done).toBe(true);
});

test("ADR-0012 flush answers true when nothing was pushed", async () => {
  const { saver, sent } = setup();
  expect(await saver.flush()).toBe(true);
  expect(sent).toEqual([]);
});

test("ADR-0012 going back to the confirmed text after a failure reports saved without sending", async () => {
  const { saver, sent, states, answer } = setup();
  saver.push("a");
  await answer(true);
  saver.push("ab");
  await answer(false);
  expect(states.at(-1)).toBe("failed");
  saver.push("a");
  expect(states.at(-1)).toBe("saved");
  expect(sent).toEqual(["a", "ab"]);
});
