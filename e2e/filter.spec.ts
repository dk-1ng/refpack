import { readdir } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { drop, expect, paste, test } from "./support.ts";

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;
const c = { name: "c.webp", content: "image/webp" } as const;

const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const images = (page: Page) => page.getByRole("list").getByRole("img");
const gridAlts = (page: Page) =>
  images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
const viewer = (page: Page) => page.getByRole("dialog");
const tagList = (page: Page) => viewer(page).getByRole("list", { name: "Tags on this image" });
const tagNames = (page: Page) => tagList(page).locator("li > span");
const tagInput = (page: Page) => viewer(page).getByLabel("New tag");
const removeButton = (page: Page, name: string) =>
  viewer(page).getByRole("button", { name: `Remove tag ${name}`, exact: true });
const filter = (page: Page) => page.getByLabel("Filter by tag");
const box = (page: Page, name: string) => page.getByRole("checkbox", { name });

// Clicks "Annotate" on the image and waits for the dialog.
async function open(page: Page, name: string): Promise<void> {
  await item(page, name).getByRole("button", { name: "Annotate" }).click();
  await expect(viewer(page)).toBeVisible();
}

// Types the tag in the box, presses Enter and waits for it in the list of the open image.
async function addTag(page: Page, name: string): Promise<void> {
  await tagInput(page).fill(name);
  await tagInput(page).press("Enter");
  await expect(tagNames(page).filter({ hasText: name }).first()).toBeVisible();
}

async function close(page: Page): Promise<void> {
  await viewer(page).getByRole("button", { name: "Close" }).click();
  await expect(viewer(page)).toHaveCount(0);
}

// Opens the image, adds each tag, closes the image.
async function tagImage(page: Page, image: string, names: string[]): Promise<void> {
  await open(page, image);
  for (const name of names) await addTag(page, name);
  await close(page);
}

test("CA-5.6 the filter lists the tags alphabetically and shows only the images with the chosen one", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await expect(filter(page)).toHaveCount(0);
  await tagImage(page, "c.webp", ["ui"]);
  await tagImage(page, "a.png", ["zebra", "ui"]);
  await tagImage(page, "b.jpg", ["dark"]);
  await expect(filter(page)).toBeVisible();
  await expect(filter(page).locator("option")).toHaveText(["All images", "dark", "ui", "zebra"]);
  await expect(filter(page)).toHaveValue("");
  await expect(page.getByText(/^Showing /)).toHaveCount(0);

  await filter(page).selectOption({ label: "ui" });
  await expect.poll(() => gridAlts(page)).toEqual(["c.webp", "a.png"]);
  await expect(page.getByText("Showing 2 of 3 images")).toBeVisible();
  await filter(page).selectOption({ label: "dark" });
  await expect.poll(() => gridAlts(page)).toEqual(["b.jpg"]);
  await expect(page.getByText("Showing 1 of 3 images")).toBeVisible();
  await filter(page).selectOption({ label: "All images" });
  await expect.poll(() => gridAlts(page)).toEqual(["c.webp", "b.jpg", "a.png"]);
  await expect(page.getByText(/^Showing /)).toHaveCount(0);
});

test("CA-5.6 CA-5.8 when the filter's tag ceases to exist the grid shows all again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await tagImage(page, "a.png", ["solo"]);
  await filter(page).selectOption({ label: "solo" });
  await expect.poll(() => gridAlts(page)).toEqual(["a.png"]);
  await open(page, "a.png");
  await removeButton(page, "solo").click();
  await expect(tagList(page)).toHaveCount(0);
  await expect(viewer(page)).toBeVisible();
  await close(page);
  await expect.poll(() => gridAlts(page)).toEqual(["b.jpg", "a.png"]);
  await expect(filter(page)).toHaveCount(0);
  await expect(page.getByText(/^Showing /)).toHaveCount(0);
});

test("CA-5.7 with the filter on, Select all and Clear selection act only on the shown images, and the pack takes every selected image", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await tagImage(page, "a.png", ["ui"]);
  await tagImage(page, "c.webp", ["ui"]);
  await box(page, "b.jpg").click();
  await expect(page.getByText("1 of 3 selected")).toBeVisible();

  await filter(page).selectOption({ label: "ui" });
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(box(page, "a.png")).toBeChecked();
  await expect(box(page, "c.webp")).toBeChecked();
  await expect(page.getByText("3 of 3 selected")).toBeVisible();
  await page.getByRole("button", { name: "Clear selection" }).click();
  await expect(box(page, "a.png")).not.toBeChecked();
  await expect(box(page, "c.webp")).not.toBeChecked();
  await expect(page.getByText("1 of 3 selected")).toBeVisible();
  await filter(page).selectOption({ label: "All images" });
  await expect(box(page, "b.jpg")).toBeChecked();
  await expect(page.getByText("1 of 3 selected")).toBeVisible();

  await filter(page).selectOption({ label: "ui" });
  await page.getByRole("button", { name: "Select all" }).click();
  await page.getByRole("button", { name: "Generate pack" }).click();
  const path = page.locator("code");
  await expect(path).toBeVisible();
  expect(await readdir(join((await path.textContent()) ?? "", "refs"))).toHaveLength(3);
});

test("CA-5.8 with the filter on, Previous and Next walk only the shown images", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await tagImage(page, "a.png", ["ui"]);
  await tagImage(page, "c.webp", ["ui"]);
  await filter(page).selectOption({ label: "ui" });
  await open(page, "c.webp");
  await expect(viewer(page).getByRole("button", { name: "Previous" })).toBeDisabled();
  await viewer(page).getByRole("button", { name: "Next" }).click();
  await expect(page.getByRole("dialog", { name: "a.png" })).toBeVisible();
  await expect(viewer(page).getByRole("button", { name: "Next" })).toBeDisabled();

  await removeButton(page, "ui").click();
  await expect(tagList(page)).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "a.png" })).toBeVisible();
  await viewer(page).getByRole("button", { name: "Previous" }).click();
  await expect(page.getByRole("dialog", { name: "c.webp" })).toBeVisible();
  await expect(viewer(page).getByRole("button", { name: "Next" })).toBeDisabled();
  await close(page);
  await expect.poll(() => gridAlts(page)).toEqual(["c.webp"]);
  await expect(page.getByText("Showing 1 of 3 images")).toBeVisible();
});

test("CA-5.9 adding an image with the filter on turns the filter off", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await tagImage(page, "a.png", ["ui"]);
  await filter(page).selectOption({ label: "ui" });
  await expect.poll(() => gridAlts(page)).toEqual(["a.png"]);
  await drop(page, [c]);
  await expect.poll(() => gridAlts(page)).toEqual(["c.webp", "b.jpg", "a.png"]);
  await expect(filter(page)).toHaveValue("");
  await expect(page.getByText(/^Showing /)).toHaveCount(0);

  await filter(page).selectOption({ label: "ui" });
  await expect.poll(() => gridAlts(page)).toEqual(["a.png"]);
  await paste(page, [{ name: "d.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(4);
  expect((await gridAlts(page))[0]).toBe("d.png");
  await expect(filter(page)).toHaveValue("");
});

test("CA-5.10 CA-5.12 the filter is All images after reopening, and Start another pack keeps it", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await tagImage(page, "a.png", ["ui"]);
  await filter(page).selectOption({ label: "ui" });
  await box(page, "a.png").click();
  await expect(page.getByText("1 of 2 selected")).toBeVisible();
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Start another pack" }).click();
  await expect(page.getByText("0 of 2 selected")).toBeVisible();
  await expect.poll(() => gridAlts(page)).toEqual(["a.png"]);
  await expect(page.getByText("Showing 1 of 2 images")).toBeVisible();

  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(filter(page)).toHaveValue("");
  await expect.poll(() => gridAlts(page)).toEqual(["b.jpg", "a.png"]);
});

test("CA-5.6 the filter follows the screen language", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await item(page, "a.png").getByRole("button", { name: "Anotar" }).click();
  await expect(viewer(page)).toBeVisible();
  await viewer(page).getByLabel("Nova etiqueta").fill("ui");
  await viewer(page).getByLabel("Nova etiqueta").press("Enter");
  await expect(
    viewer(page).getByRole("list", { name: "Etiquetas desta imagem" }).getByText("ui"),
  ).toBeVisible();
  await viewer(page).getByRole("button", { name: "Fechar" }).click();
  await expect(viewer(page)).toHaveCount(0);
  const select = page.getByLabel("Filtrar por etiqueta");
  await expect(select.locator("option")).toHaveText(["Todas as imagens", "ui"]);
  await select.selectOption({ label: "ui" });
  await expect(page.getByText("Mostrando 1 de 1 imagens")).toBeVisible();
});
