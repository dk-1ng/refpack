import { expect, test } from "./support.ts";

test("CA-0.12 the app serves its screen from a library path with accents and spaces", async ({
  page,
  app,
}) => {
  expect(app.libraryDir).toContain("Bibliotéca de tésté");
  await page.goto(app.url);
  await expect(page.getByRole("heading", { level: 1, name: "refpack" })).toBeVisible();
});

test("CA-0.2 an empty library shows the invitation to add the first image", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await expect(page.getByText("Your library is empty. Add your first image.")).toBeVisible();
});

test("CA-0.10 switching the language changes every text at once and is remembered", async ({
  page,
  app,
}) => {
  await page.goto(app.url);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(
    page.getByText("Sua biblioteca está vazia. Adicione a primeira imagem."),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  await page.reload();
  await expect(
    page.getByText("Sua biblioteca está vazia. Adicione a primeira imagem."),
  ).toBeVisible();
});

test.describe("browser in Portuguese", () => {
  test.use({ locale: "pt-BR" });

  test("CA-0.10 the first visit follows the browser language", async ({ page, app }) => {
    await page.goto(app.url);
    await expect(
      page.getByText("Sua biblioteca está vazia. Adicione a primeira imagem."),
    ).toBeVisible();
  });
});
