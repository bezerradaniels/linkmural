import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal(): Record<string, string> {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    const out: Record<string, string> = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
      out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

const fileEnv = loadEnvLocal();
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY;

test.describe("Onboarding end-to-end", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("landing → endereço → conta → passos 3 a 7 → página publicada", async ({
    page,
  }) => {
    test.skip(
      !SUPABASE_URL || !SERVICE_KEY,
      "Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );

    const admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const slug = `e2e-${suffix}`;
    const email = `e2e-${suffix}@linkmural.test`;
    const businessName = "Café Teste E2E";
    let userId: string | null = null;

    try {
      // 1. Landing: pick and reserve a free slug
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      const slugInput = page.getByLabel("Escolha seu endereço");
      await slugInput.fill(slug);
      await expect(page.getByText("Endereço livre!")).toBeVisible({
        timeout: 10_000,
      });

      await page.getByRole("button", { name: "Criar minha página" }).click();
      await expect(page).toHaveURL(/\/onboarding\/2$/);

      // 2. Account: create temporary user via Supabase Admin API and sign in with magic link token
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({
          email,
          email_confirm: true,
        });
      expect(createErr).toBeNull();
      userId = created.user?.id ?? null;
      expect(userId).toBeTruthy();

      const { data: linkData, error: linkErr } =
        await admin.auth.admin.generateLink({
          type: "magiclink",
          email,
        });
      expect(linkErr).toBeNull();
      const tokenHash = linkData.properties?.hashed_token;
      expect(tokenHash).toBeTruthy();

      await page.goto(
        `/auth/callback?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=${encodeURIComponent("/onboarding/iniciar")}`,
      );

      // 3. Step 3 · Estilo
      await expect(page).toHaveURL(/\/onboarding\/3$/, { timeout: 15_000 });
      await page.getByRole("radio", { name: /Sport/i }).click();
      await page.getByRole("button", { name: "Continuar" }).click();

      // 4. Step 4 · Dados
      await expect(page).toHaveURL(/\/onboarding\/4$/);
      await page.getByLabel("Nome do negócio *").fill(businessName);
      await page.getByLabel("WhatsApp (opcional)").fill("11999998888");
      await page.getByLabel("Cidade (opcional)").fill("São Paulo, SP");
      await page.getByRole("button", { name: "Continuar" }).click();

      // 5. Step 5 · Primeiros links (WhatsApp, Instagram e Site vêm por padrão)
      await expect(page).toHaveURL(/\/onboarding\/5$/);
      await page
        .getByRole("textbox", { name: "Instagram", exact: true })
        .fill("https://instagram.com/cafetestee2e");
      await expect(page.getByText("2 de 5 no Grátis")).toBeVisible();
      await page.getByRole("button", { name: "Continuar" }).click();

      // 6. Step 6 · Modelo
      await expect(page).toHaveURL(/\/onboarding\/6$/);
      await expect(
        page.getByRole("radio", { name: /Balcão/i }),
      ).toHaveAttribute("aria-checked", "true");
      await page.getByRole("radio", { name: /Mosaico/i }).click();
      await page.getByRole("button", { name: "Continuar" }).click();

      // 7. Step 7 · Publicar
      await expect(page).toHaveURL(/\/onboarding\/7$/);
      await page.getByRole("button", { name: "Publicar minha página" }).click();

      // 8. Success screen
      await expect(page).toHaveURL(/\/onboarding\/pronto$/);
      await expect(
        page.getByRole("heading", { name: "Sua página está no ar!" }),
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Copiar link" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Baixar PNG" }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Baixar SVG" }),
      ).toBeVisible();
      await expect(
        page.getByText("Como colocar na bio do Instagram"),
      ).toBeVisible();

      // 9. Public page is live at /<slug>
      await page.goto(`/${slug}`);
      await expect(
        page.getByRole("heading", { name: businessName }),
      ).toBeVisible();
    } finally {
      // Clean up temporary test data from the shared database
      await admin.from("slug_holds").delete().eq("slug", slug);
      await admin.from("onboarding_events").delete().eq("slug", slug);
      if (userId) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  });
});
