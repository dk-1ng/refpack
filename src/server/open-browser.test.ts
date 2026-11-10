import { expect, test } from "vitest";
import { browserCommand } from "./open-browser.ts";

const url = "http://127.0.0.1:4747";

test("CA-0.1 browserCommand picks the opener of each system", () => {
  expect(browserCommand("linux", url)).toEqual({ command: "xdg-open", args: [url] });
  expect(browserCommand("darwin", url)).toEqual({ command: "open", args: [url] });
  expect(browserCommand("win32", url)).toEqual({
    command: "cmd",
    args: ["/c", "start", "", url],
  });
  expect(browserCommand("freebsd", url)).toEqual({ command: "xdg-open", args: [url] });
});
