import type { Page } from "@playwright/test";
import { expect, paste, test } from "./support.ts";

function images(page: Page) {
  return page.getByRole("list").getByRole("img");
}

function gridAlts(page: Page): Promise<string[]> {
  return images(page).evaluateAll((imgs) => imgs.map((i) => i.getAttribute("alt") ?? ""));
}

test("CA-1.1 a hint next to the add button says images can be pasted or dragged", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await expect(
    page.getByText("You can also paste with Ctrl+V or drag files onto this screen."),
  ).toBeVisible();
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(
    page.getByText("Você também pode colar com Ctrl+V ou arrastar arquivos para esta tela."),
  ).toBeVisible();
});

test("CA-1.2 a pasted image enters the library like a chosen one", async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.getByText("Your library is empty. Add your first image.")).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { marker: string }).marker = "same page";
  });
  await paste(page, [{ name: "image.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(1);
  await expect
    .poll(() => images(page).evaluate((img) => (img as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  expect(await gridAlts(page)).toEqual(["image.png"]);
  await expect(page.getByText("Your library is empty. Add your first image.")).toHaveCount(0);
  expect(await page.evaluate(() => (window as unknown as { marker?: string }).marker)).toBe(
    "same page",
  );
});

test("CA-1.3 pasted files enter newest first and a refused one is named with the reason", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await paste(page, [
    { name: "a.png", content: "image/png" },
    { name: "b.jpg", content: "image/jpeg" },
    { name: "notes.png", content: "text" },
  ]);
  await expect(images(page)).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(["b.jpg", "a.png"]);
  await expect(page.getByRole("alert")).toContainText(
    "notes.png: unsupported type. Use PNG, JPEG or WebP.",
  );
});

test("CA-1.4 pasting text shows a notice in the screen language and keeps nothing", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await paste(page, [], "hello");
  await expect(page.getByRole("alert")).toContainText("There was no image to paste.");
  await expect(images(page)).toHaveCount(0);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(page.getByRole("alert")).toContainText("Não havia imagem para colar.");
  await page.reload();
  await expect(
    page.getByText("Sua biblioteca está vazia. Adicione a primeira imagem."),
  ).toBeVisible();
});

test("the same image pasted twice appears twice", async ({ page, app }) => {
  await page.goto(app.url);
  await paste(page, [{ name: "image.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(1);
  await paste(page, [{ name: "image.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(2);
  expect(await gridAlts(page)).toEqual(["image.png", "image.png"]);
});
