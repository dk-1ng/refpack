import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { expect, makeImageFile, seedLibrary, startApp, test } from "./support.ts";

const thumbPath = /\/api\/images\/[^/]+\/thumb$/;
const filePath = /\/api\/images\/[^/]+\/file$/;

// With 10,000 items the role- and text-based locators of the other specs take far too long, so
// this spec uses plain CSS locators while the whole grid is on the page.
const item = (page: Page, name: string) => page.locator(`.image-grid > li:has(img[alt="${name}"])`);
const images = (page: Page) => page.locator(".image-grid img");
const selectionBar = (page: Page) => page.locator(".selection-bar");
const gridAlts = (page: Page) =>
  images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
const loaded = (page: Page, name: string) =>
  page
    .locator(`.image-grid img[alt="${name}"]`)
    .evaluate((img) => (img as HTMLImageElement).naturalWidth);

test("CA-6.13 with 10,000 images the grid opens, fetches only what is near the screen, scrolls to the end, and selecting, filtering and opening work", async ({
  page,
}) => {
  test.setTimeout(300_000);
  const root = await mkdtemp(join(tmpdir(), "refpack-volume-"));
  const libraryDir = join(root, "Bibliotéca de volume");
  let app: Awaited<ReturnType<typeof startApp>> | undefined;
  try {
    await page.goto("about:blank");
    const png = await readFile(await makeImageFile(page, root, "seed.png", "image/png"));
    seedLibrary(libraryDir, 10_000, png, 10);
    app = await startApp({ libraryDir });

    let thumbs = 0;
    let files = 0;
    page.on("request", (request) => {
      if (thumbPath.test(request.url())) thumbs += 1;
      if (filePath.test(request.url())) files += 1;
    });

    await page.goto(app.url);
    // Firefox answers a first-match assertion only after the grid is on the page, so wait on a count.
    await expect.poll(() => images(page).count()).toBeGreaterThan(0);
    await expect(images(page).first()).toHaveAttribute("alt", "img-09999.png");
    await expect.poll(() => loaded(page, "img-09999.png")).toBeGreaterThan(0);
    await expect(selectionBar(page)).toContainText("0 of 10000 selected");
    expect(files).toBe(0);
    expect(thumbs).toBeLessThan(500);

    await item(page, "img-00000.png").scrollIntoViewIfNeeded();
    await expect.poll(() => loaded(page, "img-00000.png")).toBeGreaterThan(0);

    await item(page, "img-00000.png").locator("input").click();
    await expect(selectionBar(page)).toContainText("1 of 10000 selected");

    await page.getByLabel("Filter by tag").selectOption({ label: "ui" });
    await expect(images(page)).toHaveCount(10);
    const alts = await gridAlts(page);
    expect(alts[0]).toBe("img-00009.png");
    expect(alts[9]).toBe("img-00000.png");
    await expect(page.getByText("Showing 10 of 10000 images")).toBeVisible();

    await item(page, "img-00005.png").getByRole("button", { name: "Annotate" }).click();
    await expect(page.getByRole("dialog", { name: "img-00005.png" })).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  } finally {
    await app?.stop();
    await rm(root, { recursive: true, force: true, maxRetries: 5 });
  }
});
