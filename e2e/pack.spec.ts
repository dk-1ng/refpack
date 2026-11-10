import { existsSync } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative } from "node:path";
import type { Page } from "@playwright/test";
import { expect, makeImageFile, test } from "./support.ts";

let workDir = "";

test.beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "refpack-files-"));
});

test.afterEach(async () => {
  await rm(workDir, { recursive: true, force: true, maxRetries: 5 });
});

async function addTwoImages(page: Page): Promise<void> {
  const files = [
    await makeImageFile(page, workDir, "a.png", "image/png"),
    await makeImageFile(page, workDir, "b.jpg", "image/jpeg"),
  ];
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Add images" }).click();
  await (await chooser).setFiles(files);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(2);
}

async function generate(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Generate pack" }).click();
  const path = page.locator("code");
  await expect(path).toBeVisible();
  return (await path.textContent()) ?? "";
}

test("CA-0.2 the generate button is disabled with an explanation while the library is empty", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await expect(page.getByRole("button", { name: "Generate pack" })).toBeDisabled();
  await expect(page.getByText("Add at least one image to generate a pack.")).toBeVisible();
});

test("CA-0.7 CA-0.8 generating shows the full path of a folder that holds the pack", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await addTwoImages(page);
  await expect(page.getByText("Add at least one image to generate a pack.")).toHaveCount(0);
  const path = await generate(page);
  await expect(page.getByText("Pack created at:")).toBeVisible();
  expect(isAbsolute(path)).toBe(true);
  expect(existsSync(path)).toBe(true);
  expect(relative(join(app.libraryDir, "packs"), path).startsWith("..")).toBe(false);
  const entries = await readdir(path);
  expect(entries).toContain("README.md");
  expect(entries).toContain(".gitignore");
  const refs = await readdir(join(path, "refs"));
  expect(refs.some((name) => name.startsWith("01."))).toBe(true);
  expect(refs.some((name) => name.startsWith("02."))).toBe(true);
});

test("CA-0.8 the copy button puts the path on the clipboard", async ({ page, app, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(app.url);
  await addTwoImages(page);
  const path = await generate(page);
  await page.getByRole("button", { name: "Copy path" }).click();
  await expect(page.getByRole("button", { name: "Path copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(path);
});

test("CA-0.9 the grid is the same after generating", async ({ page, app }) => {
  await page.goto(app.url);
  await addTwoImages(page);
  const alts = () =>
    page
      .getByRole("list")
      .getByRole("img")
      .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
  const before = await alts();
  await generate(page);
  expect(await alts()).toEqual(before);
  await page.reload();
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(2);
  expect(await alts()).toEqual(before);
});
