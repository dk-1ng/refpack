import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { drop, expect, test } from "./support.ts";

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;
const c = { name: "c.webp", content: "image/webp" } as const;

const TEXT = "  # Gosto do espaçamento 🍇\n\n* evitar o `azul` & a sombra  \n";

const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const noteButton = (page: Page, name: string) =>
  item(page, name).getByRole("button", { name: "Note" });
const mark = (page: Page, name: string) => item(page, name).getByTitle("Has a note");
const viewer = (page: Page) => page.getByRole("dialog");
const note = (page: Page) => viewer(page).getByLabel("Note on this image");
const status = (page: Page) => viewer(page).getByRole("status");
const button = (page: Page, name: string) => viewer(page).getByRole("button", { name });
const images = (page: Page) => page.getByRole("list").getByRole("img");

async function open(page: Page, name: string): Promise<void> {
  await noteButton(page, name).click();
  await expect(viewer(page)).toBeVisible();
}

test("CA-3.1 the Note button opens the image large, whole, with the cursor in the note box", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await open(page, "b.jpg");
  await expect(page.getByRole("dialog", { name: "b.jpg" })).toBeVisible();
  const big = viewer(page).getByRole("img", { name: "b.jpg" });
  await expect(big).toBeVisible();
  await expect(big).toHaveCSS("object-fit", "contain");
  await expect(note(page)).toBeFocused();
  await expect(note(page)).toHaveValue("");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByText("0 of 2 selected")).toBeVisible();
});

test("CA-3.2 the note box shows a hint and saves by itself, in both languages", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await open(page, "a.png");
  await expect(note(page)).toHaveAttribute(
    "placeholder",
    "What to take from this image and what to avoid.",
  );
  await expect(note(page)).toHaveAttribute("maxlength", "10000");
  await expect(status(page)).toHaveText("");
  await note(page).fill("Great spacing");
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await item(page, "a.png").getByRole("button", { name: "Nota" }).click();
  const box = viewer(page).getByLabel("Nota desta imagem");
  await expect(box).toHaveValue("Great spacing");
  await expect(box).toHaveAttribute("placeholder", "O que aproveitar e o que evitar nesta imagem.");
  await expect(button(page, "Fechar")).toBeVisible();
});

test("CA-3.2 CA-3.6 the note comes back exactly as typed after closing and opening again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await open(page, "a.png");
  await note(page).fill(TEXT);
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(mark(page, "a.png")).toBeVisible();
  await open(page, "a.png");
  await expect(note(page)).toHaveValue(TEXT);
});

test("CA-3.2 a note typed key by key is saved whole and in order", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await open(page, "a.png");
  await note(page).pressSequentially("hello world");
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  await page.reload();
  await open(page, "a.png");
  await expect(note(page)).toHaveValue("hello world");
});

test("CA-3.1 CA-3.5 two images with the same name keep separate notes", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Note" }).first().click();
  await note(page).fill("first");
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(page.getByTitle("Has a note")).toHaveCount(1);
  await page.getByRole("button", { name: "Note" }).nth(1).click();
  await expect(note(page)).toHaveValue("");
});

test("CA-3.3 Close and Esc go back to the grid at the same point", async ({ page, app }) => {
  await page.setViewportSize({ width: 800, height: 400 });
  await page.goto(app.url);
  const files = ["1", "2", "3", "4", "5", "6"].map((n) => ({
    name: `${n}.png`,
    content: "image/png" as const,
  }));
  await drop(page, files);
  await expect(images(page)).toHaveCount(6);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const y = await page.evaluate(() => window.scrollY);
  expect(y).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Note" }).last().click();
  await expect(viewer(page)).toBeVisible();
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
  await page.getByRole("button", { name: "Note" }).last().click();
  await expect(viewer(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(viewer(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.scrollY)).toBe(y);
});

test("CA-3.3 CA-3.7 a note typed right before closing and generating is in the pack", async ({
  page,
  app,
}) => {
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/images/*/note", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(page.getByText("1 of 1 selected")).toBeVisible();
  await open(page, "a.png");
  await note(page).fill(TEXT);
  await button(page, "Close").click();
  await expect(viewer(page)).toBeVisible();
  release();
  await expect(viewer(page)).toHaveCount(0);
  await page.getByRole("button", { name: "Generate pack" }).click();
  const code = page.locator("code");
  await expect(code).toBeVisible();
  const path = (await code.textContent()) ?? "";
  expect(await readFile(join(path, "notes", "01.md"), "utf8")).toBe(TEXT);
  expect(await readFile(join(path, "README.md"), "utf8")).toContain(
    "1. `refs/01.png` — note: `notes/01.md`",
  );
});

test("CA-3.5 the grid marks the images that have a note, without reloading", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await expect(page.getByTitle("Has a note")).toHaveCount(0);
  await open(page, "b.jpg");
  await note(page).fill("x");
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  await expect(mark(page, "b.jpg")).toBeVisible();
  await expect(mark(page, "a.png")).toHaveCount(0);
  await open(page, "b.jpg");
  await note(page).fill("  \n ");
  await expect(status(page)).toHaveText("Saved");
  await button(page, "Close").click();
  await expect(mark(page, "b.jpg")).toHaveCount(0);
});

test("CA-3.9 a note that cannot be saved stays in the box with a warning, and closing asks first", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await open(page, "a.png");
  await page.route("**/api/images/*/note", (route) => route.abort("connectionrefused"));
  await note(page).pressSequentially("abc");
  await expect(status(page)).toHaveText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  await expect(viewer(page).getByText("Saved", { exact: true })).toHaveCount(0);
  await expect(note(page)).toHaveValue("abc");

  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await button(page, "Close").click();
  await expect.poll(() => message).toBe("This note was not saved. Leave anyway?");
  await expect(viewer(page)).toBeVisible();
  await expect(note(page)).toHaveValue("abc");

  message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await page.keyboard.press("Escape");
  await expect.poll(() => message).toBe("This note was not saved. Leave anyway?");
  await expect(viewer(page)).toBeVisible();
  await expect(note(page)).toHaveValue("abc");

  page.once("dialog", (dialog) => void dialog.accept());
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(mark(page, "a.png")).toHaveCount(0);
});

const dialogNamed = (page: Page, name: string) => page.getByRole("dialog", { name });

test("CA-3.4 Next and Previous walk the grid order, each image with its own note", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await open(page, "c.webp");
  await expect(button(page, "Previous")).toBeDisabled();
  await expect(button(page, "Next")).toBeEnabled();
  await note(page).fill("on c");
  await button(page, "Next").click();
  await expect(dialogNamed(page, "b.jpg")).toBeVisible();
  await expect(note(page)).toBeFocused();
  await expect(note(page)).toHaveValue("");
  await note(page).fill("on b");
  await button(page, "Next").click();
  await expect(dialogNamed(page, "a.png")).toBeVisible();
  await expect(button(page, "Next")).toBeDisabled();
  await button(page, "Previous").click();
  await expect(dialogNamed(page, "b.jpg")).toBeVisible();
  await expect(note(page)).toHaveValue("on b");
  await button(page, "Previous").click();
  await expect(dialogNamed(page, "c.webp")).toBeVisible();
  await expect(note(page)).toHaveValue("on c");
  await button(page, "Close").click();
  await expect(viewer(page)).toHaveCount(0);
  await expect(mark(page, "c.webp")).toBeVisible();
  await expect(mark(page, "b.jpg")).toBeVisible();
  await expect(mark(page, "a.png")).toHaveCount(0);
  await page.reload();
  await open(page, "c.webp");
  await expect(note(page)).toHaveValue("on c");
});

test("CA-3.4 the buttons follow the screen language", async ({ page, app }) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await item(page, "b.jpg").getByRole("button", { name: "Nota" }).click();
  await expect(viewer(page)).toBeVisible();
  await expect(button(page, "Anterior")).toBeDisabled();
  await expect(button(page, "Próxima")).toBeEnabled();
});

test("CA-3.9 moving to another image with an unsaved note asks first", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await open(page, "b.jpg");
  await page.route("**/api/images/*/note", (route) => route.abort("connectionrefused"));
  await note(page).pressSequentially("abc");
  await expect(status(page)).toHaveText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await button(page, "Next").click();
  await expect.poll(() => message).toBe("This note was not saved. Leave anyway?");
  await expect(dialogNamed(page, "b.jpg")).toBeVisible();
  await expect(note(page)).toHaveValue("abc");

  page.once("dialog", (dialog) => void dialog.accept());
  await button(page, "Next").click();
  await expect(dialogNamed(page, "a.png")).toBeVisible();
  await expect(note(page)).toHaveValue("");
});
