import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { drop, dropPaths, expect, makeImageFile, test } from "./support.ts";

function images(page: Page) {
  return page.getByRole("list").getByRole("img");
}

function gridAlts(page: Page): Promise<string[]> {
  return images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
}

test("CA-1.5 dragging files over the screen shows the invitation to drop until they leave", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const dataTransfer = await page.evaluateHandle(() => {
    const data = new DataTransfer();
    data.items.add(new File(["x"], "a.png", { type: "image/png" }));
    return data;
  });
  await page.locator("main").dispatchEvent("dragenter", { dataTransfer });
  await expect(page.getByText("Drop to add")).toBeVisible();
  await page.locator(".drop-overlay").dispatchEvent("dragleave", { dataTransfer });
  await expect(page.getByText("Drop to add")).toHaveCount(0);
});

test("CA-1.6 dropped files enter the library like chosen ones", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [
    { name: "a.png", content: "image/png" },
    { name: "b.jpg", content: "image/jpeg" },
    { name: "notes.png", content: "text" },
  ]);
  await expect(images(page)).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(["b.jpg", "a.png"]);
  await expect(page.getByRole("alert")).toContainText(
    "notes.png: unsupported type. Use PNG, JPEG or WebP.",
  );
  await expect(page.getByText("Drop to add")).toHaveCount(0);
});

test("CA-4.12 an image dropped before the list loads shows up only once", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [{ name: "b.jpg", content: "image/jpeg" }]);
  await expect(images(page)).toHaveCount(1);
  // The list answer stays on its way, so the next image arrives before the list does.
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/images", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await held;
    await route.continue();
  });
  await page.reload();
  await drop(page, [{ name: "a.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(1);
  release();
  await expect(images(page)).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(["a.png", "b.jpg"]);
});

test("CA-1.8 dropping text shows a notice, keeps nothing and leaves the screen open", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const url = page.url();
  await drop(page, [], "hello");
  await expect(page.getByRole("alert")).toContainText("There was no image to add.");
  await expect(images(page)).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "refpack" })).toBeVisible();
  expect(page.url()).toBe(url);
});

test.describe("real files and folders from disk", () => {
  test.skip(
    ({ browserName }) => browserName !== "chromium",
    "driven through the Chromium protocol (ADR-0010)",
  );

  let workDir = "";

  test.beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "refpack-drop-"));
  });

  test.afterEach(async () => {
    await rm(workDir, { recursive: true, force: true, maxRetries: 5 });
  });

  test("CA-1.6 a real dropped file enters and the original is left untouched", async ({
    page,
    app,
  }) => {
    await page.goto(app.url);
    const a = await makeImageFile(page, workDir, "a.png", "image/png");
    const before = await readFile(a);
    await dropPaths(page, [a]);
    await expect(images(page)).toHaveCount(1);
    expect(await gridAlts(page)).toEqual(["a.png"]);
    expect((await readFile(a)).equals(before)).toBe(true);
  });

  test("CA-1.7 a dropped folder is refused by name and the files dropped with it are kept", async ({
    page,
    app,
  }) => {
    await page.goto(app.url);
    const a = await makeImageFile(page, workDir, "a.png", "image/png");
    const folder = join(workDir, "Pasta de tésté");
    await mkdir(folder);
    await makeImageFile(page, folder, "inner.png", "image/png");
    await dropPaths(page, [a, folder]);
    await expect(page.getByRole("alert")).toContainText(
      "Pasta de tésté: folders are not accepted yet.",
    );
    await expect(images(page)).toHaveCount(1);
    expect(await gridAlts(page)).toEqual(["a.png"]);
  });

  test("CA-1.7 a folder dropped alone adds nothing and shows only the folder notice", async ({
    page,
    app,
  }) => {
    await page.goto(app.url);
    const folder = join(workDir, "Pasta de tésté");
    await mkdir(folder);
    await makeImageFile(page, folder, "inner.png", "image/png");
    await dropPaths(page, [folder]);
    await expect(page.getByRole("alert")).toContainText(
      "Pasta de tésté: folders are not accepted yet.",
    );
    await expect(page.getByRole("alert")).not.toContainText("There was no image to add.");
    await expect(images(page)).toHaveCount(0);
  });
});

test("CA-1.9 an image dragged from the grid and dropped on the screen adds nothing", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [{ name: "a.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(1);
  await images(page)
    .first()
    .dragTo(page.getByRole("heading", { name: "refpack" }));
  await expect(images(page)).toHaveCount(1);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
