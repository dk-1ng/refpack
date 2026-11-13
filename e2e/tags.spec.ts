import type { Page } from "@playwright/test";
import { drop, expect, test } from "./support.ts";

const a = { name: "a.png", content: "image/png" } as const;
const b = { name: "b.jpg", content: "image/jpeg" } as const;

const FANCY = 'Dashboard "escuro" \\ ✨';
const TAGS_POST = /\/api\/images\/[^/]+\/tags$/;

const item = (page: Page, name: string) =>
  page.getByRole("listitem").filter({ has: page.getByAltText(name) });
const viewer = (page: Page) => page.getByRole("dialog");
const tagList = (page: Page) => viewer(page).getByRole("list", { name: "Tags on this image" });
const tagNames = (page: Page) => tagList(page).locator("li > span");
const tagInput = (page: Page) => viewer(page).getByLabel("New tag");
const addButton = (page: Page) => viewer(page).getByRole("button", { name: "Add", exact: true });
const removeButton = (page: Page, name: string) =>
  viewer(page).getByRole("button", { name: `Remove tag ${name}`, exact: true });
const suggestions = (page: Page) =>
  viewer(page).getByRole("list", { name: "Suggestions" }).getByRole("button");
const tagsAlert = (page: Page) => viewer(page).locator(".tags").getByRole("alert");
const chips = (page: Page, name: string) => item(page, name).locator(".tag-chip");

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

// Opens the image, adds each tag, closes the image.
async function tagImage(page: Page, image: string, names: string[]): Promise<void> {
  await open(page, image);
  for (const name of names) await addTag(page, name);
  await viewer(page).getByRole("button", { name: "Close" }).click();
  await expect(viewer(page)).toHaveCount(0);
}

async function close(page: Page): Promise<void> {
  await viewer(page).getByRole("button", { name: "Close" }).click();
  await expect(viewer(page)).toHaveCount(0);
}

function countPosts(page: Page): { count: () => number } {
  let n = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && TAGS_POST.test(request.url())) n++;
  });
  return { count: () => n };
}

test("CA-5.1 the open image shows its tags and a box that adds one on Enter or with the Add button", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await expect(tagList(page)).toHaveCount(0);
  await expect(tagInput(page)).toBeVisible();
  await expect(tagInput(page)).toHaveAttribute("placeholder", "Tag (Enter to add)");
  await expect(tagInput(page)).toHaveAttribute("maxlength", "60");
  await expect(addButton(page)).toBeVisible();
  await expect(viewer(page).getByLabel("Note on this image")).toBeFocused();

  await tagInput(page).fill("dashboard");
  await tagInput(page).press("Enter");
  await expect(tagNames(page)).toHaveText(["dashboard"]);
  await expect(tagInput(page)).toHaveValue("");
  await expect(tagInput(page)).toBeFocused();

  await tagInput(page).fill("tabela");
  await addButton(page).click();
  await expect(tagNames(page)).toHaveText(["dashboard", "tabela"]);
  await expect(tagInput(page)).toHaveValue("");
  await expect(tagInput(page)).toBeFocused();
  await expect(removeButton(page, "dashboard")).toBeVisible();
  await expect(removeButton(page, "tabela")).toBeVisible();
});

test("CA-5.1 an empty or blank tag adds nothing and sends nothing", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  const posts = countPosts(page);
  await open(page, "a.png");
  await tagInput(page).press("Enter");
  await tagInput(page).fill("   ");
  await tagInput(page).press("Enter");
  await addButton(page).click();
  await expect(tagList(page)).toHaveCount(0);
  expect(posts.count()).toBe(0);
});

test("CA-5.1 CA-5.10 spaces at the ends are dropped, the rest is kept exactly, and the tags come back after restart", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await tagInput(page).fill(`  ${FANCY}  `);
  await tagInput(page).press("Enter");
  await expect(tagNames(page)).toHaveText([FANCY]);
  await addTag(page, "tabela");
  await close(page);
  await expect(chips(page, "a.png")).toHaveText([FANCY, "tabela"]);

  const restarted = await app.restart();
  await page.goto(restarted.url);
  await expect(chips(page, "a.png")).toHaveText([FANCY, "tabela"]);
  await open(page, "a.png");
  await expect(tagNames(page)).toHaveText([FANCY, "tabela"]);
});

test("CA-5.2 a tag that differs only by case is the same tag, shown as first written, and adding one the image has changes nothing", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await tagImage(page, "a.png", ["Dashboard"]);
  await open(page, "b.jpg");
  await tagInput(page).fill("dashboard");
  await tagInput(page).press("Enter");
  await expect(tagNames(page)).toHaveText(["Dashboard"]);
  const posts = countPosts(page);
  await tagInput(page).fill("DASHBOARD");
  await tagInput(page).press("Enter");
  await expect(tagNames(page)).toHaveText(["Dashboard"]);
  await expect(tagInput(page)).toHaveValue("");
  expect(posts.count()).toBe(0);
  await close(page);
  await expect(chips(page, "a.png")).toHaveText(["Dashboard"]);
  await expect(chips(page, "b.jpg")).toHaveText(["Dashboard"]);
});

test("CA-5.3 the suggestions list the library's other tags alphabetically, narrow as I type, and add on click", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await tagImage(page, "a.png", ["zebra", "Ícone", "abacaxi", "dashboard"]);
  await open(page, "b.jpg");
  await expect(suggestions(page)).toHaveText(["abacaxi", "dashboard", "Ícone", "zebra"]);
  await tagInput(page).fill("DASH");
  await expect(suggestions(page)).toHaveText(["dashboard"]);
  await suggestions(page).first().click();
  await expect(tagNames(page)).toHaveText(["dashboard"]);
  await expect(tagInput(page)).toHaveValue("");
  await expect(suggestions(page)).toHaveText(["abacaxi", "Ícone", "zebra"]);
  await expect(tagInput(page)).toBeFocused();
  await tagInput(page).fill("a");
  await expect(suggestions(page)).toHaveText(["abacaxi", "zebra"]);
  await suggestions(page).filter({ hasText: "zebra" }).click();
  await expect(tagNames(page)).toHaveText(["dashboard", "zebra"]);
  await suggestions(page).filter({ hasText: "abacaxi" }).click();
  await expect(tagNames(page)).toHaveText(["dashboard", "zebra", "abacaxi"]);
  await tagInput(page).fill("");
  await suggestions(page).filter({ hasText: "Ícone" }).click();
  await expect(tagNames(page)).toHaveText(["dashboard", "zebra", "abacaxi", "Ícone"]);
  await expect(viewer(page).getByRole("list", { name: "Suggestions" })).toHaveCount(0);
});

test("CA-5.3 without tags to suggest the list is not there", async ({ page, app }) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await expect(viewer(page).getByRole("list", { name: "Suggestions" })).toHaveCount(0);
  await addTag(page, "x");
  await expect(viewer(page).getByRole("list", { name: "Suggestions" })).toHaveCount(0);
});

test("CA-5.4 CA-5.5 Remove takes the tag off without asking, the grid follows, and a tag no image has is gone", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a, b]);
  await tagImage(page, "a.png", ["x", "y"]);
  await tagImage(page, "b.jpg", ["x"]);
  await expect(chips(page, "a.png")).toHaveText(["x", "y"]);
  await expect(chips(page, "b.jpg")).toHaveText(["x"]);
  let dialogs = 0;
  page.on("dialog", () => {
    dialogs++;
  });
  await open(page, "a.png");
  const note = viewer(page).getByLabel("Note on this image");
  await note.fill("n");
  await removeButton(page, "y").click();
  await expect(tagNames(page)).toHaveText(["x"]);
  expect(dialogs).toBe(0);
  await expect(suggestions(page)).toHaveCount(0);
  await expect(note).toHaveValue("n");
  await close(page);
  await expect(chips(page, "a.png")).toHaveText(["x"]);
  await expect(page.getByText("0 of 2 selected")).toBeVisible();

  await open(page, "b.jpg");
  await removeButton(page, "x").click();
  await expect(tagList(page)).toHaveCount(0);
  await expect(suggestions(page)).toHaveText(["x"]);
  await close(page);
  await expect(chips(page, "b.jpg")).toHaveCount(0);

  await open(page, "a.png");
  await removeButton(page, "x").click();
  await expect(tagList(page)).toHaveCount(0);
  await expect(viewer(page).getByRole("list", { name: "Suggestions" })).toHaveCount(0);
  await close(page);
  await expect(chips(page, "a.png")).toHaveCount(0);
  await expect(page.getByTitle("Has a note")).toHaveCount(1);
  await expect(page.getByTitle(/^Marks: /)).toHaveCount(0);
});

test("CA-5.13 with refpack stopped, adding or removing a tag changes nothing and the screen says so", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await drop(page, [a]);
  await open(page, "a.png");
  await addTag(page, "x");
  const url = /\/api\/images\/[^/]+\/tags/;
  await page.route(url, (route) => route.abort("connectionrefused"));
  await tagInput(page).fill("y");
  await tagInput(page).press("Enter");
  await expect(tagsAlert(page)).toHaveText(
    "Could not save. Check that refpack is still running in the terminal.",
  );
  await expect(tagNames(page)).toHaveText(["x"]);
  await expect(tagInput(page)).toHaveValue("y");
  await removeButton(page, "x").click();
  await expect(tagNames(page)).toHaveText(["x"]);
  await expect(tagsAlert(page)).toBeVisible();
  await page.unroute(url);
  await tagInput(page).press("Enter");
  await expect(tagNames(page)).toHaveText(["x", "y"]);
  await expect(tagsAlert(page)).toHaveCount(0);
});

test("CA-5.1 the tags follow the screen language", async ({ page, app }) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await drop(page, [a]);
  await item(page, "a.png").getByRole("button", { name: "Anotar" }).click();
  const input = viewer(page).getByLabel("Nova etiqueta");
  await expect(input).toHaveAttribute("placeholder", "Etiqueta (Enter para adicionar)");
  await expect(viewer(page).getByRole("button", { name: "Adicionar", exact: true })).toBeVisible();
  await input.fill("x");
  await input.press("Enter");
  await expect(viewer(page).getByRole("list", { name: "Etiquetas desta imagem" })).toBeVisible();
  await expect(
    viewer(page).getByRole("button", { name: "Remover etiqueta x", exact: true }),
  ).toBeVisible();
  await viewer(page).getByRole("button", { name: "Fechar" }).click();
  await expect(viewer(page)).toHaveCount(0);
  await drop(page, [b]);
  await item(page, "b.jpg").getByRole("button", { name: "Anotar" }).click();
  await expect(
    viewer(page).getByRole("list", { name: "Sugestões" }).getByRole("button", { name: "x" }),
  ).toBeVisible();
});
