import { expect, test } from "@playwright/test";

test("protected routes send visitors to /entrar with next", async ({
  page,
}) => {
  await page.goto("/app");
  await expect(page).toHaveURL(/\/entrar\?next=%2Fapp$/);
  await expect(page.getByRole("heading", { name: "Entrar" })).toBeVisible();
});

test("invalid email shows a friendly error", async ({ page }) => {
  await page.goto("/entrar");
  await page.getByLabel("E-mail").fill("nao-e-email");
  await page.getByRole("button", { name: "Enviar link de acesso" }).click();
  await expect(page.getByText("Confira o e-mail")).toBeVisible();
});

test("a bad callback link explains what happened", async ({ page }) => {
  await page.goto("/auth/callback?code=invalido");
  await expect(page).toHaveURL(/\/entrar\?erro=link$/);
  await expect(
    page.getByText("Esse link expirou ou já foi usado"),
  ).toBeVisible();
});
