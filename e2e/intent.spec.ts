import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Page } from "@playwright/test";
import { drop, expect, paste, pasteInto, test } from "./support.ts";

function images(page: Page) {
  return page.getByRole("list").getByRole("img");
}

function intent(page: Page) {
  return page.getByLabel("Project intent");
}

function status(page: Page) {
  return page.getByRole("status");
}

const a = { name: "a.png", content: "image/png" } as const;

const TEXT = "  # Painel de açaí 🍇\n\n* Para quem vende na feira.\n`rápido` & simples  \n";

async function selectOneImage(page: Page): Promise<void> {
  await drop(page, [a]);
  await expect(images(page)).toHaveCount(1);
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(page.getByText("1 of 1 selected")).toBeVisible();
}

async function generate(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Generate pack" }).click();
  const path = page.locator("code");
  await expect(path).toBeVisible();
  return (await path.textContent()) ?? "";
}

test("CA-2.4 the intent box shows a hint and saves by itself", async ({ page, app }) => {
  await page.goto(app.url);
  await expect(intent(page)).toHaveAttribute(
    "placeholder",
    "What it is, who it is for and what the person needs to be able to do.",
  );
  await expect(status(page)).toHaveText("");
  await intent(page).fill("A dashboard");
  await expect(status(page)).toHaveText("Saved");
  await page.getByLabel("Language").selectOption({ label: "Português" });
  const box = page.getByLabel("Intenção do projeto");
  await expect(box).toBeVisible();
  await expect(box).toHaveAttribute(
    "placeholder",
    "O que é, para quem é e o que a pessoa precisa conseguir fazer.",
  );
  await expect(status(page)).toHaveText("Salvo");
});

test("CA-2.4 the box takes at most 10 000 characters", async ({ page, app }) => {
  await page.goto(app.url);
  await expect(intent(page)).toHaveAttribute("maxlength", "10000");
});

test("CA-2.4 CA-2.5 the intent comes back exactly as typed after closing and opening again", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await intent(page).fill(TEXT);
  await expect(status(page)).toHaveText("Saved");
  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(intent(page)).toHaveValue(TEXT);
});

test("CA-2.4 CA-4.16 text typed key by key is saved whole and in order", async ({ page, app }) => {
  await page.goto(app.url);
  // The box stays disabled until the saved intent has loaded, and pressing keys does not
  // wait for that the way fill does: keys typed earlier land nowhere.
  await expect(intent(page)).toBeEnabled();
  await intent(page).pressSequentially("hello world");
  await expect(status(page)).toHaveText("Saved");
  await page.reload();
  await expect(intent(page)).toHaveValue("hello world");
});

test("CA-2.6 CA-2.7 text typed right before generating is in the pack", async ({ page, app }) => {
  // The save stays on its way until after the click, so the pack only has the text if
  // generating waits for it.
  let release = (): void => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/draft/intent", async (route) => {
    await held;
    await route.continue();
  });
  await page.goto(app.url);
  await selectOneImage(page);
  await intent(page).fill(TEXT);
  await page.getByRole("button", { name: "Generate pack" }).click();
  release();
  const code = page.locator("code");
  await expect(code).toBeVisible();
  const path = (await code.textContent()) ?? "";
  expect(await readFile(join(path, "INTENT.md"), "utf8")).toBe(TEXT);
  expect(await readFile(join(path, "README.md"), "utf8")).toContain("Read `INTENT.md`");
});

test("CA-2.7 with an empty intent the pack has no INTENT.md", async ({ page, app }) => {
  await page.goto(app.url);
  await selectOneImage(page);
  const path = await generate(page);
  expect(await readdir(path)).not.toContain("INTENT.md");
});

test("CA-2.9 the intent is the same after generating", async ({ page, app }) => {
  await page.goto(app.url);
  await selectOneImage(page);
  await intent(page).fill(TEXT);
  await generate(page);
  await expect(intent(page)).toHaveValue(TEXT);
  await page.reload();
  await expect(intent(page)).toHaveValue(TEXT);
});

test("CA-2.11 text that cannot be saved stays in the box with a warning instead of Saved", async ({
  page,
  app,
}) => {
  await page.route("**/api/draft/intent", (route) => route.abort("connectionrefused"));
  await page.goto(app.url);
  await intent(page).fill("abc");
  await expect(status(page)).toHaveText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  await expect(page.getByText("Saved", { exact: true })).toHaveCount(0);
  await expect(intent(page)).toHaveValue("abc");
});

test("CA-2.12 text pasted into the intent box shows no notice", async ({ page, app }) => {
  await page.goto(app.url);
  await expect(intent(page)).toBeEnabled();
  await pasteInto(intent(page), [], "hello");
  await paste(page, [], "x");
  await expect(page.getByRole("alert").locator("li")).toHaveCount(1);
});

test("CA-2.12 an image pasted into the intent box enters the library and the text stays", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await intent(page).fill("abc");
  await expect(status(page)).toHaveText("Saved");
  await pasteInto(intent(page), [{ name: "image.png", content: "image/png" }]);
  await expect(images(page)).toHaveCount(1);
  await expect(intent(page)).toHaveValue("abc");
  await expect(page.getByRole("alert")).toHaveCount(0);
});
