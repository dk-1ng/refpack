import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import type { Area } from "../src/shared/api.ts";
import { drop, expect, pasteInto, readPng, test } from "./support.ts";

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;

const MARKS_URL = /\/api\/images\/[^/]+\/marks/;

const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const viewer = (page: Page) => page.getByRole("dialog");
const big = (page: Page) => viewer(page).getByRole("img"); // the open image
const box = (page: Page, n: number) => viewer(page).getByTitle(`Mark ${n}`, { exact: true });
const draft = (page: Page) => viewer(page).getByTitle("New mark", { exact: true });
const chooser = (page: Page) => viewer(page).getByRole("group", { name: "New mark" });
const marks = (page: Page) => viewer(page).getByRole("listitem");
const button = (page: Page, name: string) =>
  viewer(page).getByRole("button", { name, exact: true }); // exact: "Dislike" contains "like"
const images = (page: Page) => page.getByRole("list").getByRole("img");

// Waits until the open image has loaded and its frame has the image's proportion: only then
// can a rectangle be drawn.
async function ready(page: Page): Promise<void> {
  await expect(big(page)).toBeVisible();
  await expect
    .poll(() =>
      big(page).evaluate((img) => getComputedStyle(img).getPropertyValue("--ratio").trim()),
    )
    .not.toBe("");
}

// Opens the image by its grid button.
async function open(page: Page, name: string): Promise<void> {
  await item(page, name).getByRole("button", { name: "Annotate" }).click();
  await expect(viewer(page)).toBeVisible();
  await ready(page);
}

async function imageBox(
  page: Page,
): Promise<{ x: number; y: number; width: number; height: number }> {
  const found = await big(page).boundingBox();
  if (found === null) throw new Error("the open image has no box");
  return found;
}

// Drags the mouse over the open image between two points given as fractions of it.
async function drag(page: Page, from: [number, number], to: [number, number]): Promise<void> {
  const image = await imageBox(page);
  await page.mouse.move(image.x + from[0] * image.width, image.y + from[1] * image.height);
  await page.mouse.down();
  await page.mouse.move(image.x + to[0] * image.width, image.y + to[1] * image.height, {
    steps: 5,
  });
  await page.mouse.up();
}

// drag + click on "Like" or "Dislike" + wait for the new item in the list.
async function mark(
  page: Page,
  from: [number, number],
  to: [number, number],
  kind: "Like" | "Dislike",
): Promise<void> {
  const before = await marks(page).count();
  await drag(page, from, to);
  await button(page, kind).click();
  await expect(marks(page)).toHaveCount(before + 1);
}

// Where a locator's box is, as fractions of the open image: { left, top, right, bottom }.
async function placed(page: Page, target: Locator): Promise<Area> {
  const image = await imageBox(page);
  const found = await target.boundingBox();
  if (found === null) throw new Error("the target has no box");
  return {
    left: (found.x - image.x) / image.width,
    top: (found.y - image.y) / image.height,
    right: (found.x + found.width - image.x) / image.width,
    bottom: (found.y + found.height - image.y) / image.height,
  };
}

// Each edge within 0.01 of the fraction used in the drag.
async function expectPlaced(page: Page, target: Locator, area: Area): Promise<void> {
  await expect(target).toBeVisible();
  const where = await placed(page, target);
  for (const edge of ["left", "top", "right", "bottom"] as const) {
    expect(Math.abs(where[edge] - area[edge]), edge).toBeLessThan(0.01);
  }
}

// Closes the image, clicks "Select all" and "Generate pack", returns the pack path.
async function generate(page: Page): Promise<string> {
  if ((await viewer(page).count()) > 0) {
    await button(page, "Close").click();
    await expect(viewer(page)).toHaveCount(0);
  }
  await page.getByRole("button", { name: "Select all" }).click();
  await page.getByRole("button", { name: "Generate pack" }).click();
  const path = page.locator("code");
  await expect(path).toBeVisible();
  return (await path.textContent()) ?? "";
}

test("CA-4.1 dragging over the open image draws a rectangle that waits for its kind", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  const image = await imageBox(page);
  await page.mouse.move(image.x + 0.1 * image.width, image.y + 0.1 * image.height);
  await page.mouse.down();
  await page.mouse.move(image.x + 0.4 * image.width, image.y + 0.5 * image.height, { steps: 5 });
  const area = { left: 0.1, top: 0.1, right: 0.4, bottom: 0.5 };
  await expectPlaced(page, draft(page), area);
  await page.mouse.up();
  await expectPlaced(page, draft(page), area);
  await expect(chooser(page)).toBeVisible();
  await expect(chooser(page).getByRole("button", { name: "Like", exact: true })).toBeVisible();
  await expect(chooser(page).getByRole("button", { name: "Dislike", exact: true })).toBeVisible();
  await expect(chooser(page).getByRole("button", { name: "Cancel", exact: true })).toBeVisible();
  await expect(marks(page)).toHaveCount(0);
});

test("CA-4.1 a click or a drag under 10 pixels creates nothing", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  const image = await imageBox(page);
  await page.mouse.click(image.x + 0.5 * image.width, image.y + 0.5 * image.height);
  await expect(draft(page)).toHaveCount(0);
  await expect(chooser(page)).toHaveCount(0);
  await drag(page, [0.3, 0.3], [0.3 + 9 / image.width, 0.3 + 60 / image.height]);
  await expect(draft(page)).toHaveCount(0);
  await drag(page, [0.3, 0.3], [0.3 + 60 / image.width, 0.3 + 9 / image.height]);
  await expect(draft(page)).toHaveCount(0);
  await expect(chooser(page)).toHaveCount(0);
});

test("CA-4.1 a drag that leaves the image stops at its edge, in any direction", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  const image = await imageBox(page);
  const viewport = page.viewportSize();
  if (viewport === null) throw new Error("no viewport");
  // The points 10 pixels beyond the corners are still inside the window.
  expect(image.x - 10).toBeGreaterThan(0);
  expect(image.y - 10).toBeGreaterThan(0);
  expect(image.x + image.width + 10).toBeLessThan(viewport.width);
  expect(image.y + image.height + 10).toBeLessThan(viewport.height);
  await drag(page, [0.5, 0.5], [1 + 10 / image.width, 1 + 10 / image.height]);
  await expectPlaced(page, draft(page), { left: 0.5, top: 0.5, right: 1, bottom: 1 });
  await drag(page, [0.5, 0.5], [-10 / image.width, -10 / image.height]);
  await expectPlaced(page, draft(page), { left: 0, top: 0, right: 0.5, bottom: 0.5 });
});

test("CA-4.1 dragging does not move the image or select it like text", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await expect(big(page)).toHaveAttribute("draggable", "false");
  await expect(big(page)).toHaveCSS("user-select", "none");
});

test("CA-4.2 CA-4.3 choosing Like or Dislike creates the mark, numbered, on the image and in the list", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await button(page, "Like").click();
  await expectPlaced(page, box(page, 1), { left: 0.1, top: 0.1, right: 0.4, bottom: 0.4 });
  await expect(box(page, 1)).toHaveText("1 ✓");
  await expect(marks(page)).toHaveCount(1);
  await expect(marks(page).nth(0)).toContainText("Mark 1");
  await expect(marks(page).nth(0)).toContainText("Like");
  await expect(draft(page)).toHaveCount(0);
  await expect(chooser(page)).toHaveCount(0);
  await drag(page, [0.6, 0.6], [0.9, 0.9]);
  await button(page, "Dislike").click();
  await expectPlaced(page, box(page, 2), { left: 0.6, top: 0.6, right: 0.9, bottom: 0.9 });
  await expect(box(page, 2)).toHaveText("2 ✕");
  await expect(marks(page)).toHaveCount(2);
  await expect(marks(page).nth(1)).toContainText("Mark 2");
  await expect(marks(page).nth(1)).toContainText("Dislike");
  await expect(
    viewer(page).getByText("Drag the mouse over the image to mark a part."),
  ).toBeVisible();
});

test("CA-4.2 Cancel, another rectangle, closing and moving on drop the rectangle without a kind", async ({
  page,
  app,
}) => {
  let posts = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && MARKS_URL.test(request.url())) posts += 1;
  });
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await open(page, "b.jpg");
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await expect(chooser(page)).toBeVisible();
  await button(page, "Cancel").click();
  await expect(draft(page)).toHaveCount(0);
  await expect(chooser(page)).toHaveCount(0);
  await drag(page, [0.1, 0.1], [0.3, 0.3]);
  await drag(page, [0.5, 0.5], [0.8, 0.8]);
  await expect(draft(page)).toHaveCount(1);
  await expectPlaced(page, draft(page), { left: 0.5, top: 0.5, right: 0.8, bottom: 0.8 });
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await open(page, "b.jpg");
  await expect(draft(page)).toHaveCount(0);
  await expect(marks(page)).toHaveCount(0);
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await expect(draft(page)).toHaveCount(1);
  await button(page, "Next").click();
  await expect(viewer(page).getByRole("img", { name: "a.png" })).toBeVisible();
  await button(page, "Previous").click();
  await expect(viewer(page).getByRole("img", { name: "b.jpg" })).toBeVisible();
  await expect(draft(page)).toHaveCount(0);
  await expect(marks(page)).toHaveCount(0);
  expect(posts).toBe(0);
});

test("CA-4.1 a rectangle can start on top of an existing mark", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.7, 0.7], "Like");
  await drag(page, [0.2, 0.2], [0.5, 0.5]);
  await expectPlaced(page, draft(page), { left: 0.2, top: 0.2, right: 0.5, bottom: 0.5 });
});

test("CA-4.3 CA-4.8 the marks come back in place after restart and stay on the same part when the window changes", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await mark(page, [0.6, 0.2], [0.9, 0.9], "Dislike");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await open(page, "a.png");
  await expect(viewer(page).getByLabel("Note on this image")).toBeFocused();
  const first = { left: 0.1, top: 0.1, right: 0.4, bottom: 0.4 };
  const second = { left: 0.6, top: 0.2, right: 0.9, bottom: 0.9 };
  await expect(box(page, 1)).toHaveText("1 ✓");
  await expect(box(page, 2)).toHaveText("2 ✕");
  await expectPlaced(page, box(page, 1), first);
  await expectPlaced(page, box(page, 2), second);
  await expect(marks(page)).toHaveCount(2);
  await expect(marks(page).nth(0)).toContainText("Mark 1");
  await expect(marks(page).nth(1)).toContainText("Mark 2");
  await page.setViewportSize({ width: 700, height: 900 });
  await expectPlaced(page, box(page, 1), first);
  await expectPlaced(page, box(page, 2), second);
});

test("CA-4.3 the marks follow the screen language", async ({ page, app }) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await drop(page, [a]);
  await item(page, "a.png").getByRole("button", { name: "Anotar" }).click();
  await ready(page);
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  const group = viewer(page).getByRole("group", { name: "Nova marcação" });
  await expect(group).toBeVisible();
  await expect(group.getByRole("button", { name: "Gosto", exact: true })).toBeVisible();
  await expect(group.getByRole("button", { name: "Não gosto", exact: true })).toBeVisible();
  await expect(group.getByRole("button", { name: "Cancelar", exact: true })).toBeVisible();
  await group.getByRole("button", { name: "Não gosto", exact: true }).click();
  await expect(viewer(page).getByTitle("Marcação 1")).toHaveText("1 ✕");
  await expect(marks(page)).toHaveCount(1);
  await expect(marks(page).nth(0)).toContainText("Marcação 1");
  await expect(marks(page).nth(0)).toContainText("Não gosto");
  await expect(
    viewer(page).getByText("Arraste o mouse sobre a imagem para marcar uma parte."),
  ).toBeVisible();
});

test("CA-4.9 the pack carries the crop of each mark, cut from the original image", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await mark(page, [0.6, 0.6], [0.9, 0.9], "Dislike");
  const path = await generate(page);
  expect((await readdir(join(path, "marks"))).sort()).toEqual(["01-1.png", "01-2.png"]);
  expect(
    await readPng(page, join(path, "marks", "01-1.png"), [
      [0, 0],
      [3, 3],
    ]),
  ).toEqual({ width: 4, height: 4, colors: ["#ffcc00", "#ffcc00"] });
  expect(
    await readPng(page, join(path, "marks", "01-2.png"), [
      [0, 0],
      [3, 3],
    ]),
  ).toEqual({ width: 4, height: 4, colors: ["#3366cc", "#3366cc"] });
  const readme = await readFile(join(path, "README.md"), "utf8");
  expect(readme).toContain("   - Mark 1 (like): `marks/01-1.png` — area: x 10%–40%, y 10%–40%");
  expect(readme).toContain("   - Mark 2 (dislike): `marks/01-2.png` — area: x 60%–90%, y 60%–90%");
});

test("CA-4.9 the crop comes from the right place on a wide and on a tall image", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [{ name: "wide.png", content: "image/png", width: 16, height: 8 }]);
  await open(page, "wide.png");
  let image = await imageBox(page);
  expect(image.width / image.height).toBeGreaterThanOrEqual(1.98);
  expect(image.width / image.height).toBeLessThanOrEqual(2.02);
  await mark(page, [0.05, 0.1], [0.45, 0.4], "Like");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await drop(page, [{ name: "tall.png", content: "image/png", width: 8, height: 16 }]);
  await open(page, "tall.png");
  image = await imageBox(page);
  expect(image.height / image.width).toBeGreaterThanOrEqual(1.98);
  expect(image.height / image.width).toBeLessThanOrEqual(2.02);
  await mark(page, [0.1, 0.05], [0.4, 0.45], "Like");
  const path = await generate(page);
  expect(
    await readPng(page, join(path, "marks", "01-1.png"), [
      [0, 0],
      [3, 7],
    ]),
  ).toEqual({ width: 4, height: 8, colors: ["#ffcc00", "#ffcc00"] });
  expect(
    await readPng(page, join(path, "marks", "02-1.png"), [
      [0, 0],
      [7, 3],
    ]),
  ).toEqual({ width: 8, height: 4, colors: ["#ffcc00", "#ffcc00"] });
});

test("CA-4.9 the crop of a JPEG image is a PNG", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [b]);
  await open(page, "b.jpg");
  await mark(page, [0.1, 0.1], [0.9, 0.9], "Like");
  const path = await generate(page);
  expect(await readdir(join(path, "marks"))).toEqual(["01-1.png"]);
  const crop = await readPng(page, join(path, "marks", "01-1.png"), []);
  expect(crop.width).toBe(8);
  expect(crop.height).toBe(8);
});

test("CA-4.11 with refpack stopped, a new mark is not created and the screen says so", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  const refuse = (route: { abort(code: string): Promise<void> }) =>
    route.abort("connectionrefused");
  await page.route(MARKS_URL, refuse);
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await button(page, "Like").click();
  await expect(viewer(page).getByRole("alert")).toHaveText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  await expect(marks(page)).toHaveCount(0);
  await expect(box(page, 1)).toHaveCount(0);
  await expect(draft(page)).toHaveCount(0);
  await page.unroute(MARKS_URL, refuse);
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await expect(viewer(page).getByRole("alert")).toHaveCount(0);
  await expect(marks(page)).toHaveCount(1);
});

const comment = (page: Page, n: number) => viewer(page).getByLabel(`Comment on mark ${n}`);
const saved = (page: Page, n: number) =>
  marks(page)
    .nth(n - 1)
    .getByRole("status");
const TEXT = "  # Gosto do espaçamento 🍇\n\n* evitar o `azul` & a sombra  \n";
const NOT_SAVED = "Could not save. Check that refpack is still running in the terminal.";
const refuse = (route: { abort(code: string): Promise<void> }) => route.abort("connectionrefused");

test("CA-4.2 after choosing the kind the cursor is in the new mark's comment box", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await expect(comment(page, 1)).toBeFocused();
  await expect(comment(page, 1)).toHaveValue("");
  await expect(comment(page, 1)).toHaveAttribute("placeholder", "Comment (optional)");
  await expect(comment(page, 1)).toHaveAttribute("maxlength", "2000");
  await mark(page, [0.5, 0.5], [0.9, 0.9], "Dislike");
  await expect(comment(page, 2)).toBeFocused();
});

test("CA-4.4 CA-4.8 a comment saves by itself and comes back exactly as typed", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await expect(saved(page, 1)).toHaveText("");
  await comment(page, 1).fill(TEXT);
  await expect(saved(page, 1)).toHaveText("Saved");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await open(page, "a.png");
  await expect(comment(page, 1)).toHaveValue(TEXT);
  await expect(viewer(page).getByLabel("Note on this image")).toBeFocused();
});

test("CA-4.4 each mark keeps its own comment, and moving on saves what was typed", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await open(page, "b.jpg");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await mark(page, [0.5, 0.5], [0.9, 0.9], "Dislike");
  await comment(page, 1).fill("one");
  await expect(comment(page, 2)).toBeEnabled();
  await comment(page, 2).pressSequentially("two");
  await button(page, "Next").click();
  await expect(page.getByRole("dialog", { name: "a.png" })).toBeVisible();
  await button(page, "Previous").click();
  await expect(page.getByRole("dialog", { name: "b.jpg" })).toBeVisible();
  await expect(comment(page, 1)).toHaveValue("one");
  await expect(comment(page, 2)).toHaveValue("two");
  await page.reload();
  await open(page, "b.jpg");
  await expect(comment(page, 1)).toHaveValue("one");
  await expect(comment(page, 2)).toHaveValue("two");
});

test("CA-4.4 CA-4.9 a comment typed right before closing and generating is in the pack", async ({
  page,
  app,
}) => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/marks/*/comment", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await comment(page, 1).fill(TEXT);
  await button(page, "Close").click();
  await expect(viewer(page)).toBeVisible();
  release();
  await expect(viewer(page)).toHaveCount(0);
  const path = await generate(page);
  expect(await readFile(join(path, "marks", "01-1.md"), "utf8")).toBe(TEXT);
  expect(await readFile(join(path, "README.md"), "utf8")).toContain(
    "   - Mark 1 (like): `marks/01-1.png` — comment: `marks/01-1.md` — area: x 10%–40%, y 10%–40%",
  );
});

test("CA-4.11 a comment that cannot be saved stays in the box with a warning, and leaving asks first", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await open(page, "b.jpg");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await page.route("**/api/marks/*/comment", refuse);
  await expect(comment(page, 1)).toBeEnabled();
  await comment(page, 1).pressSequentially("abc");
  await expect(saved(page, 1)).toHaveText(NOT_SAVED);
  await expect(comment(page, 1)).toHaveValue("abc");
  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await button(page, "Close").click();
  await expect.poll(() => message).toBe("A comment was not saved. Leave anyway?");
  await expect(viewer(page)).toBeVisible();
  await expect(comment(page, 1)).toHaveValue("abc");
  page.once("dialog", (dialog) => void dialog.accept());
  await button(page, "Next").click();
  await expect(page.getByRole("dialog", { name: "a.png" })).toBeVisible();
});

test("CA-3.9 CA-4.11 with the note and a comment unsaved, the screen asks once, about the note", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await page.route("**/api/images/*/note", refuse);
  await page.route("**/api/marks/*/comment", refuse);
  const note = viewer(page).getByLabel("Note on this image");
  await note.fill("a note");
  await comment(page, 1).fill("a comment");
  await expect(saved(page, 1)).toHaveText(NOT_SAVED);
  const messages: string[] = [];
  page.on("dialog", (dialog) => {
    messages.push(dialog.message());
    void dialog.dismiss();
  });
  await button(page, "Close").click();
  await expect.poll(() => messages.length).toBe(1);
  await expect(viewer(page)).toBeVisible();
  expect(messages).toEqual(["This note was not saved. Leave anyway?"]);
});

test("CA-3.10 text pasted into a comment box shows no notice, and a pasted image adds nothing", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await pasteInto(comment(page, 1), [], "hello");
  await pasteInto(comment(page, 1), [{ name: "p.png", content: "image/png" }]);
  await expect(comment(page, 1)).toHaveValue("");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(images(page)).toHaveCount(1);
});

test("CA-4.4 the comment box follows the screen language", async ({ page, app }) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await drop(page, [a]);
  await item(page, "a.png").getByRole("button", { name: "Anotar" }).click();
  await ready(page);
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await viewer(page).getByRole("button", { name: "Gosto", exact: true }).click();
  const box1 = viewer(page).getByLabel("Comentário da marcação 1");
  await expect(box1).toBeFocused();
  await expect(box1).toHaveAttribute("placeholder", "Comentário (opcional)");
});

const kind = (page: Page, n: number, name: "Like" | "Dislike") =>
  marks(page)
    .nth(n - 1)
    .getByRole("radio", { name, exact: true });
const del = (page: Page, n: number) =>
  marks(page)
    .nth(n - 1)
    .getByRole("button", { name: "Delete" });

test("CA-4.5 changing the kind saves by itself and shows on the list and on the rectangle", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await expect(comment(page, 1)).toBeEnabled();
  await comment(page, 1).fill("keep");
  await expect(saved(page, 1)).toHaveText("Saved");
  await expect(kind(page, 1, "Like")).toBeChecked();
  await kind(page, 1, "Dislike").click();
  await expect(kind(page, 1, "Dislike")).toBeChecked();
  await expect(box(page, 1)).toHaveText("1 ✕");
  await expectPlaced(page, box(page, 1), { left: 0.1, top: 0.1, right: 0.4, bottom: 0.4 });
  await expect(comment(page, 1)).toHaveValue("keep");
  await page.reload();
  await open(page, "a.png");
  await expect(kind(page, 1, "Dislike")).toBeChecked();
  await expect(box(page, 1)).toHaveText("1 ✕");
});

test("CA-4.6 Delete removes the mark and the next ones move up one number", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await viewer(page).getByLabel("Note on this image").fill("note");
  await mark(page, [0.05, 0.05], [0.25, 0.25], "Like");
  await mark(page, [0.3, 0.3], [0.5, 0.5], "Dislike");
  await mark(page, [0.6, 0.6], [0.9, 0.9], "Like");
  let dialogs = 0;
  page.on("dialog", (dialog) => {
    dialogs += 1;
    void dialog.dismiss();
  });
  await del(page, 2).click();
  await expect(marks(page)).toHaveCount(2);
  await expect(box(page, 3)).toHaveCount(0);
  await expect(box(page, 2)).toHaveText("2 ✓");
  await expectPlaced(page, box(page, 2), { left: 0.6, top: 0.6, right: 0.9, bottom: 0.9 });
  await expect(box(page, 1)).toHaveText("1 ✓");
  await expectPlaced(page, box(page, 1), { left: 0.05, top: 0.05, right: 0.25, bottom: 0.25 });
  await expect(viewer(page).getByLabel("Note on this image")).toHaveValue("note");
  expect(dialogs).toBe(0);
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByText("0 of 1 selected")).toBeVisible();
  await page.reload();
  await open(page, "a.png");
  await expect(marks(page)).toHaveCount(2);
});

test("CA-4.6 deleting a mark that has a comment asks first", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await expect(comment(page, 1)).toBeEnabled();
  await comment(page, 1).fill("why");
  await expect(saved(page, 1)).toHaveText("Saved");
  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await del(page, 1).click();
  await expect
    .poll(() => message)
    .toBe("This mark has a comment, which will be deleted with it. Delete?");
  await expect(marks(page)).toHaveCount(1);
  page.once("dialog", (dialog) => void dialog.accept());
  await del(page, 1).click();
  await expect(marks(page)).toHaveCount(0);
  await expect(box(page, 1)).toHaveCount(0);
});

test("CA-4.6 CA-4.9 the pack uses the numbers the screen shows after a delete", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await mark(page, [0.6, 0.6], [0.9, 0.9], "Dislike");
  await del(page, 1).click();
  await expect(marks(page)).toHaveCount(1);
  const path = await generate(page);
  expect(await readdir(join(path, "marks"))).toEqual(["01-1.png"]);
  expect((await readPng(page, join(path, "marks", "01-1.png"), [[0, 0]])).colors).toEqual([
    "#3366cc",
  ]);
  const readme = await readFile(join(path, "README.md"), "utf8");
  expect(readme).toContain("   - Mark 1 (dislike): `marks/01-1.png`");
});

test("CA-4.7 the grid shows how many marks each image has, without reloading", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(page.getByTitle(/^Marks: /)).toHaveCount(0);
  await open(page, "b.jpg");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await mark(page, [0.6, 0.6], [0.9, 0.9], "Dislike");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(item(page, "b.jpg").getByTitle("Marks: 2")).toBeVisible();
  await expect(item(page, "b.jpg").getByTitle("Marks: 2")).toHaveText("2");
  await expect(page.getByTitle(/^Marks: /)).toHaveCount(1);
  await expect(page.getByTitle("Has a note")).toHaveCount(0);
  await open(page, "b.jpg");
  await del(page, 1).click();
  await expect(marks(page)).toHaveCount(1);
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(item(page, "b.jpg").getByTitle("Marks: 1")).toBeVisible();
  await open(page, "b.jpg");
  await del(page, 1).click();
  await expect(marks(page)).toHaveCount(0);
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByTitle(/^Marks: /)).toHaveCount(0);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await item(page, "b.jpg").getByRole("button", { name: "Anotar" }).click();
  await expect(viewer(page)).toBeVisible();
  await ready(page);
  await drag(page, [0.1, 0.1], [0.4, 0.4]);
  await button(page, "Gosto").click();
  await expect(marks(page)).toHaveCount(1);
  await button(page, "Fechar").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByTitle("Marcações: 1")).toBeVisible();
});

test("CA-4.11 with refpack stopped, changing the kind or deleting changes nothing and the screen says so", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await mark(page, [0.1, 0.1], [0.4, 0.4], "Like");
  await page.route("**/api/marks/**", refuse);
  await kind(page, 1, "Dislike").click();
  await expect(viewer(page).getByRole("alert")).toHaveText(NOT_SAVED);
  await expect(kind(page, 1, "Like")).toBeChecked();
  await expect(box(page, 1)).toHaveText("1 ✓");
  await del(page, 1).click();
  await expect(viewer(page).getByRole("alert")).toHaveText(NOT_SAVED);
  await expect(marks(page)).toHaveCount(1);
  await expect(box(page, 1)).toBeVisible();
  await page.unroute("**/api/marks/**", refuse);
  await kind(page, 1, "Dislike").click();
  await expect(kind(page, 1, "Dislike")).toBeChecked();
  await expect(viewer(page).getByRole("alert")).toHaveCount(0);
});
