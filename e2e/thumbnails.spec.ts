import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { drop, expect, readPng, test } from "./support.ts";

const thumbPath = /\/api\/images\/[^/]+\/thumb$/;
const filePath = /\/api\/images\/[^/]+\/file$/;

const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const images = (page: Page) => page.getByRole("list").getByRole("img");
const gridAlts = (page: Page) =>
  images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
const gridSrc = (page: Page, name: string) =>
  item(page, name)
    .getByRole("img")
    .evaluate((img) => img.getAttribute("src") ?? "");
const loaded = (page: Page, name: string) =>
  item(page, name)
    .getByRole("img")
    .evaluate((img) => (img as HTMLImageElement).naturalWidth);

function countPuts(page: Page): { count: () => number } {
  let puts = 0;
  page.on("request", (request) => {
    if (request.method() === "PUT" && thumbPath.test(request.url())) puts += 1;
  });
  return { count: () => puts };
}

test("CA-6.12 a new image gets a thumbnail of its centre square, and the open image and the pack keep the original", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [{ name: "wide.png", content: "image/png", width: 1200, height: 800 }]);
  await expect.poll(() => gridSrc(page, "wide.png")).toMatch(thumbPath);

  const src = await gridSrc(page, "wide.png");
  const probe = await page.evaluate(async (url) => {
    const blob = await (await fetch(url)).blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("no 2d context");
    context.drawImage(bitmap, 0, 0);
    const at = (x: number, y: number) => Array.from(context.getImageData(x, y, 1, 1).data);
    return {
      width: bitmap.width,
      height: bitmap.height,
      topLeft: at(10, 10),
      bottomRight: at(370, 370),
    };
  }, src);
  expect(probe.width).toBe(384);
  expect(probe.height).toBe(384);
  const [r1 = 0, g1 = 0, b1 = 255] = probe.topLeft;
  expect(r1).toBeGreaterThan(200);
  expect(g1).toBeGreaterThan(150);
  expect(b1).toBeLessThan(100);
  const [r2 = 255, , b2 = 0] = probe.bottomRight;
  expect(b2).toBeGreaterThan(150);
  expect(r2).toBeLessThan(100);

  expect(await readdir(join(app.libraryDir, "thumbs"))).toHaveLength(1);

  await item(page, "wide.png").getByRole("button", { name: "Annotate" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  expect(await dialog.getByRole("img", { name: "wide.png" }).getAttribute("src")).toMatch(filePath);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(dialog).toHaveCount(0);

  await page.getByRole("button", { name: "Select all" }).click();
  await expect(page.getByText("1 of 1 selected")).toBeVisible();
  await page.getByRole("button", { name: "Generate pack" }).click();
  const packPath = (await page.locator("code").textContent()) ?? "";
  const original = await readPng(page, join(packPath, "refs", "01.png"), []);
  expect(original.width).toBe(1200);
  expect(original.height).toBe(800);
});

test("CA-6.12 an image whose thumbnail could not be made shows the original, and gets one by itself after a reload", async ({
  page,
  app,
}) => {
  const puts = countPuts(page);
  await page.route(thumbPath, (route) =>
    route.request().method() === "PUT" ? route.abort("connectionrefused") : route.continue(),
  );
  await page.goto(app.url);
  await drop(page, [{ name: "a.png", content: "image/png" }]);
  await expect.poll(() => puts.count()).toBe(1);
  expect(await gridSrc(page, "a.png")).toMatch(filePath);
  await expect.poll(() => loaded(page, "a.png")).toBeGreaterThan(0);
  await expect(page.getByRole("alert")).toHaveCount(0);

  await page.unroute(thumbPath);
  await page.reload();
  await expect.poll(() => gridSrc(page, "a.png")).toMatch(thumbPath);
});

test("CA-6.14 the thumbnails come back after a restart and are not made again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [
    { name: "a.png", content: "image/png" },
    { name: "b.jpg", content: "image/jpeg" },
  ]);
  await expect.poll(() => gridSrc(page, "a.png")).toMatch(thumbPath);
  await expect.poll(() => gridSrc(page, "b.jpg")).toMatch(thumbPath);

  await app.restart();
  const puts = countPuts(page);
  await page.goto(app.url);
  await expect.poll(() => gridSrc(page, "a.png")).toMatch(thumbPath);
  await expect.poll(() => gridSrc(page, "b.jpg")).toMatch(thumbPath);
  expect(await gridAlts(page)).toEqual(["b.jpg", "a.png"]);
  await expect.poll(() => loaded(page, "a.png")).toBeGreaterThan(0);
  await expect.poll(() => loaded(page, "b.jpg")).toBeGreaterThan(0);
  expect(puts.count()).toBe(0);
});
