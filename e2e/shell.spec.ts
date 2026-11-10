import { expect, test } from "./support.ts";

test("CA-0.12 the app serves its screen from a library path with accents and spaces", async ({
  page,
  app,
}) => {
  expect(app.libraryDir).toContain("Bibliotéca de tésté");
  await page.goto(app.url);
  await expect(page.getByRole("heading", { level: 1, name: "refpack" })).toBeVisible();
});
