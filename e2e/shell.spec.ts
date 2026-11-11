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

test("CA-4.13 a screen newer than the running refpack says so, in both languages", async ({
  page,
  app,
}) => {
  await page.route("**/api/images", async (route) => {
    if (route.request().method() !== "GET") {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        images: [
          {
            id: "3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f",
            originalName: "a.png",
            url: "/api/images/3f2b8a52-6c1e-4b0f-9a4d-1d2c3b4a5e6f/file",
            selected: false,
          },
        ],
      }),
    });
  });
  await page.goto(app.url);
  await expect(page.getByRole("alert")).toHaveText(
    "This screen and refpack are on different versions. Stop refpack in the terminal and run pnpm start again.",
  );
  await expect(page.getByText("Your library is empty. Add your first image.")).toHaveCount(0);
  await expect(page.getByRole("list").getByRole("img")).toHaveCount(0);
  await page.getByLabel("Language").selectOption({ label: "Português" });
  await expect(page.getByRole("alert")).toHaveText(
    "A tela e o refpack estão em versões diferentes. Pare o refpack no terminal e rode pnpm start de novo.",
  );
});
