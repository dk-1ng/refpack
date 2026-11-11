import { existsSync } from "node:fs";
import type { Page } from "@playwright/test";
import { drop, expect, test } from "./support.ts";

function images(page: Page) {
  return page.getByRole("list").getByRole("img");
}

function intent(page: Page) {
  return page.getByLabel("Project intent");
}

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;

test("CA-2.10 start another pack is disabled while there is nothing to clear", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  const button = page.getByRole("button", { name: "Start another pack" });
  await expect(button).toBeDisabled();
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await expect(button).toBeDisabled();
  await page.getByRole("checkbox", { name: "a.png" }).click();
  await expect(button).toBeEnabled();
  await page.getByRole("checkbox", { name: "a.png" }).click();
  await expect(button).toBeDisabled();
  await intent(page).fill("x");
  await expect(button).toBeEnabled();
});

test("CA-2.10 confirming clears the selection and the intent and keeps images and packs", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await expect(images(page)).toHaveCount(2);
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(page.getByText("2 of 2 selected")).toBeVisible();
  await intent(page).fill("A dashboard");
  await page.getByRole("button", { name: "Generate pack" }).click();
  const code = page.locator("code");
  await expect(code).toBeVisible();
  const path = (await code.textContent()) ?? "";

  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.accept();
  });
  await page.getByRole("button", { name: "Start another pack" }).click();
  await expect(page.getByText("0 of 2 selected")).toBeVisible();
  await expect(intent(page)).toHaveValue("");
  expect(message).toBe("This clears the selection and erases the intent text. Continue?");
  await expect(images(page)).toHaveCount(2);
  expect(existsSync(path)).toBe(true);

  await page.reload();
  await expect(page.getByText("0 of 2 selected")).toBeVisible();
  await expect(intent(page)).toHaveValue("");
});

test("CA-2.10 cancelling the confirmation changes nothing", async ({ page, app }) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await page.getByRole("checkbox", { name: "a.png" }).click();
  await expect(page.getByText("1 de 1 selecionadas")).toBeVisible();
  await page.getByLabel("Intenção do projeto").fill("Um painel");

  let message = "";
  page.once("dialog", (dialog) => {
    message = dialog.message();
    void dialog.dismiss();
  });
  await page.getByRole("button", { name: "Começar outro pacote" }).click();
  await expect.poll(() => message).not.toBe("");
  expect(message).toBe(
    "Isto tira todas as imagens da seleção e apaga o texto da intenção. Continuar?",
  );
  await expect(page.getByText("1 de 1 selecionadas")).toBeVisible();
  await expect(page.getByLabel("Intenção do projeto")).toHaveValue("Um painel");
});
