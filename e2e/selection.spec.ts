import type { Page } from "@playwright/test";
import { drop, expect, test } from "./support.ts";

function images(page: Page) {
  return page.getByRole("list").getByRole("img");
}

function box(page: Page, name: string) {
  return page.getByRole("checkbox", { name });
}

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;
const c = { name: "c.webp", content: "image/webp" } as const;

test("CA-2.1 clicking an image selects it and clicking it again takes it out", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await expect(page.getByText("0 of 3 selected")).toBeVisible();
  await page.getByAltText("b.jpg").click();
  await expect(box(page, "b.jpg")).toBeChecked();
  await expect(box(page, "a.png")).not.toBeChecked();
  await expect(box(page, "c.webp")).not.toBeChecked();
  await expect(page.getByText("1 of 3 selected")).toBeVisible();
  await page.getByAltText("b.jpg").click();
  await expect(box(page, "b.jpg")).not.toBeChecked();
  await expect(page.getByText("0 of 3 selected")).toBeVisible();
});

test("CA-2.1 two images with the same name are selected one at a time", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(2);
  await images(page).first().click();
  await expect(box(page, "a.png").nth(0)).toBeChecked();
  await expect(box(page, "a.png").nth(1)).not.toBeChecked();
  await expect(page.getByText("1 of 2 selected")).toBeVisible();
});

test("CA-2.1 the grid cannot be selected like text", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await expect(page.getByRole("list")).toHaveCSS("user-select", "none");
});

test("CA-2.2 select all and clear selection", async ({ page, app }) => {
  await page.goto(app.url);
  await expect(page.getByRole("button", { name: "Select all" })).toHaveCount(0);
  await drop(page, [a, b, c]);
  await expect(images(page)).toHaveCount(3);
  await page.getByRole("button", { name: "Select all" }).click();
  for (const name of ["a.png", "b.jpg", "c.webp"]) {
    await expect(box(page, name)).toBeChecked();
  }
  await expect(page.getByText("3 of 3 selected")).toBeVisible();
  await page.getByRole("button", { name: "Clear selection" }).click();
  for (const name of ["a.png", "b.jpg", "c.webp"]) {
    await expect(box(page, name)).not.toBeChecked();
  }
  await expect(page.getByText("0 of 3 selected")).toBeVisible();
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(page.getByText("0 de 3 selecionadas")).toBeVisible();
  await expect(page.getByRole("button", { name: "Selecionar todas" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Limpar seleção" })).toBeVisible();
});

test("CA-2.3 a new image enters unselected and the selection stays", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await page.getByAltText("a.png").click();
  await expect(box(page, "a.png")).toBeChecked();
  await drop(page, [c]);
  await expect(images(page)).toHaveCount(3);
  await expect(box(page, "c.webp")).not.toBeChecked();
  await expect(box(page, "a.png")).toBeChecked();
  await expect(page.getByText("1 of 3 selected")).toBeVisible();
});

test("CA-2.5 the same images are selected after closing and opening again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await page.getByAltText("b.jpg").click();
  await expect(box(page, "b.jpg")).toBeChecked();
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(images(page)).toHaveCount(2);
  await expect(box(page, "b.jpg")).toBeChecked();
  await expect(box(page, "a.png")).not.toBeChecked();
  await expect(page.getByText("1 of 2 selected")).toBeVisible();
});

test("CA-2.11 a click that cannot be saved warns and leaves the image unselected", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await page.route("**/api/**", (route) => route.abort("connectionrefused"));
  await page.getByAltText("a.png").click();
  await expect(page.getByRole("alert")).toContainText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  await expect(box(page, "a.png")).not.toBeChecked();
  await expect(page.getByText("0 of 1 selected")).toBeVisible();
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(page.getByRole("alert")).toContainText(
    "Não foi possível salvar. Confira se o refpack ainda está rodando no terminal.",
  );
});
