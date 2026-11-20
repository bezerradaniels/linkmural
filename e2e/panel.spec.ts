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

test.describe("Client dashboard end-to-end", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("manages links, appearance, business info and reflects on public page", async ({
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
    const slug = `painel-${suffix}`;
    const email = `painel-${suffix}@linkmural.test`;
    let userId: string | null = null;

    try {
      // Seed temporary user + published page
      const { data: created, error: createErr } =
        await admin.auth.admin.createUser({ email, email_confirm: true });
      expect(createErr).toBeNull();
      userId = created.user?.id ?? null;
      expect(userId).toBeTruthy();

      const { data: seededPage, error: pageErr } = await admin
        .from("pages")
        .insert({
          owner_id: userId!,
          slug,
          business_name: "Negócio Inicial",
          whatsapp: "5511988887777",
          style: "classic",
          template: "balcao",
          published: true,
          onboarding_step: 8,
        })
        .select("id")
        .single();
      expect(pageErr).toBeNull();

      // The WhatsApp card created during onboarding points to the page number.
      const { data: waLink, error: waErr } = await admin
        .from("links")
        .insert({
          page_id: seededPage!.id,
          kind: "whatsapp",
          title: "WhatsApp",
          url: "https://wa.me/5511988887777?text=Ol%C3%A1",
          icon: "si:whatsapp",
          position: 0,
        })
        .select("id")
        .single();
      expect(waErr).toBeNull();

      const { data: linkData, error: linkErr } =
        await admin.auth.admin.generateLink({ type: "magiclink", email });
      expect(linkErr).toBeNull();
      const tokenHash = linkData.properties?.hashed_token;
      expect(tokenHash).toBeTruthy();

      // Sign in
      await page.goto(
        `/auth/callback?token_hash=${encodeURIComponent(tokenHash!)}&type=magiclink&next=${encodeURIComponent("/app")}`,
      );
      await expect(page).toHaveURL(/\/app$/, { timeout: 15_000 });
      // The address shows in the header and in the page card; check the card.
      await expect(
        page.getByRole("main").getByText(`linkmural.com/${slug}`),
      ).toBeVisible();

      // 1. Página: add, edit and delete a link
      await page.goto("/app/pagina");
      await page.getByRole("button", { name: "Adicionar link" }).click();
      await page
        .getByLabel("Endereço (URL ou chave Pix)")
        .fill("https://instagram.com/painelteste");
      await expect(page.getByLabel("Título", { exact: true })).toHaveValue(
        "Instagram",
      );
      await page.getByRole("button", { name: "Salvar link" }).click();
      // Each link in the editor has one "Excluir <title>" button; the title
      // itself also shows in the live preview and the toast.
      await expect(
        page.getByRole("button", { name: "Excluir Instagram" }),
      ).toBeVisible();

      // Add a second link and delete it
      await page.getByRole("button", { name: "Adicionar link" }).click();
      await page
        .getByLabel("Endereço (URL ou chave Pix)")
        .fill("https://exemplo.com.br");
      await page.getByLabel("Título", { exact: true }).fill("Site temporário");
      await page.getByRole("button", { name: "Salvar link" }).click();
      await expect(
        page.getByRole("button", { name: "Excluir Site temporário" }),
      ).toBeVisible();

      await page
        .getByRole("button", { name: "Excluir Site temporário" })
        .click();
      await page.getByRole("button", { name: "Excluir link" }).click();
      await expect(
        page.getByRole("button", { name: "Excluir Site temporário" }),
      ).toHaveCount(0);

      // 2. Aparência: switch style & template
      await page.goto("/app/aparencia");
      await page.getByRole("button", { name: "Mosaico" }).click();
      await page.getByRole("radio", { name: /Pop/i }).click();
      await page
        .getByRole("button", { name: "Salvar aparência" })
        .first()
        .click();
      await expect(page.getByText("Salvo")).toBeVisible();

      // 3. Informações: edit business name, bio and opening hours
      await page.goto("/app/informacoes");
      const updatedName = "Padaria Painel E2E";
      const updatedBio = "Pães artesanais todos os dias.";
      await page.getByLabel("Nome do negócio *").fill(updatedName);
      await page.getByLabel("Descrição (opcional)").fill(updatedBio);
      await page.getByLabel("Segunda").check();
      await page.getByLabel("WhatsApp", { exact: true }).fill("21 97777-6666");
      await page
        .getByRole("button", { name: "Salvar informações" })
        .first()
        .click();
      await expect(page.getByText("Salvo")).toBeVisible();

      // The WhatsApp card follows the new number and keeps its message
      const { data: waAfter } = await admin
        .from("links")
        .select("url")
        .eq("id", waLink!.id)
        .single();
      expect(waAfter?.url).toBe("https://wa.me/5521977776666?text=Ol%C3%A1");
      const waRedirect = await page.request.get(`/l/${waLink!.id}`, {
        maxRedirects: 0,
        headers: { "user-agent": "Mozilla/5.0 (iPhone; Mobile)" },
      });
      expect(waRedirect.headers()["location"]).toBe(
        "https://wa.me/5521977776666?text=Ol%C3%A1",
      );

      // 4. Verify changes live on public page
      await page.goto(`/${slug}`);
      await expect(
        page.getByRole("heading", { name: updatedName }),
      ).toBeVisible();
      await expect(page.getByText(updatedBio)).toBeVisible();
      await expect(
        page.getByRole("link", { name: /Instagram/ }).first(),
      ).toBeVisible();
    } finally {
      if (userId) {
        await admin.auth.admin.deleteUser(userId);
      }
    }
  });
});
