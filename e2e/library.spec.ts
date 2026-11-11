import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { MAX_IMAGE_BYTES } from "../src/shared/api.ts";
import { expect, makeImageFile, test } from "./support.ts";

let workDir = "";

test.beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "refpack-files-"));
});

test.afterEach(async () => {
  await rm(workDir, { recursive: true, force: true, maxRetries: 5 });
});

async function choose(page: Page, paths: string[]): Promise<void> {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Add images" }).click();
  await (await chooser).setFiles(paths);
}

function gridAlts(page: Page): Promise<string[]> {
  return page
    .getByRole("list")
    .getByRole("img")
    .evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
}

test("CA-0.3 CA-4.14 chosen images appear in the grid, newest first, without reloading", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const files = [
    await makeImageFile(page, workDir, "a.png", "image/png"),
    await makeImageFile(page, workDir, "b.jpg", "image/jpeg"),
    await makeImageFile(page, workDir, "c.webp", "image/webp"),
  ];
  await choose(page, files);
  const images = page.getByRole("list").getByRole("img");
  await expect(images).toHaveCount(3);
  expect(await gridAlts(page)).toEqual(["c.webp", "b.jpg", "a.png"]);
  for (const image of await images.all()) {
    await expect
      .poll(() => image.evaluate((img) => (img as HTMLImageElement).naturalWidth))
      .toBeGreaterThan(0);
  }
  await expect(page.getByText("Your library is empty. Add your first image.")).toHaveCount(0);
});

test("CA-0.4 the original file is left untouched", async ({ page, app }) => {
  await page.goto(app.url);
  const file = await makeImageFile(page, workDir, "a.png", "image/png");
  const before = await readFile(file);
  await choose(page, [file]);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(1);
  expect((await readFile(file)).equals(before)).toBe(true);
});

test("CA-0.5 a file that is not an image is refused with its name and the reason, and the others are kept", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const good = await makeImageFile(page, workDir, "a.png", "image/png");
  const bad = join(workDir, "notes.png");
  await writeFile(bad, "just some text, not an image");
  await choose(page, [good, bad]);
  await expect(page.getByRole("alert")).toContainText(
    "notes.png: unsupported type. Use PNG, JPEG or WebP.",
  );
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(1);
  expect(await gridAlts(page)).toEqual(["a.png"]);
});

test("CA-0.10 a refusal already on screen changes language when the selector changes", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const bad = join(workDir, "notes.png");
  await writeFile(bad, "just some text, not an image");
  await choose(page, [bad]);
  await expect(page.getByRole("alert")).toHaveText(
    "notes.png: unsupported type. Use PNG, JPEG or WebP.",
  );
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(page.getByRole("alert")).toHaveText(
    "notes.png: tipo não aceito. Use PNG, JPEG ou WebP.",
  );
  await expect(page.getByText("unsupported type")).toHaveCount(0);
});

test("CA-0.5 a file over 25 MB is refused with its name and the reason", async ({ page, app }) => {
  await page.goto(app.url);
  const big = join(workDir, "big.png");
  await writeFile(big, Buffer.alloc(MAX_IMAGE_BYTES + 1));
  await choose(page, [big]);
  await expect(page.getByRole("alert")).toContainText("big.png: larger than 25 MB.");
  await expect(page.getByRole("img")).toHaveCount(0);
});

test("CA-0.6 the same images are there, in the same order, after closing and opening again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const files = [
    await makeImageFile(page, workDir, "a.png", "image/png"),
    await makeImageFile(page, workDir, "b.jpg", "image/jpeg"),
  ];
  await choose(page, files);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(2);
  const before = await gridAlts(page);
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(before);
});

test("the same file added twice appears twice", async ({ page, app }) => {
  await page.goto(app.url);
  const file = await makeImageFile(page, workDir, "a.png", "image/png");
  await choose(page, [file]);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(1);
  await choose(page, [file]);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(["a.png", "a.png"]);
});
