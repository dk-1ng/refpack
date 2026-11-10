import { access } from "node:fs/promises";
import { join } from "node:path";
import { expect, runStart, test } from "./support.ts";

test("CA-0.1 starting prints the local address and creates the library", async ({ app }) => {
  expect(app.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);
  await access(join(app.libraryDir, "library.db"));
});

test("CA-0.14 starting again while it is open says so in both languages and starts nothing", async ({
  app,
}) => {
  const port = new URL(app.url).port;
  const secondLibrary = join(app.libraryDir, "..", "Outra bibliotéca");
  const result = await runStart({ REFPACK_PORT: port, REFPACK_LIBRARY: secondLibrary });

  expect(result.code).toBe(1);
  expect(result.stderr).toContain(`refpack já está aberto em ${app.url}`);
  expect(result.stderr).toContain(`refpack is already open at ${app.url}`);
  await expect(access(secondLibrary)).rejects.toThrow();
  const response = await fetch(app.url);
  expect(response.ok).toBe(true);
});
