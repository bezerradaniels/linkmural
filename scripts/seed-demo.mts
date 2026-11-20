/*
 * Creates (or refreshes) the demo page linkmural.com/studioforca, owned by a
 * dedicated demo user so it never takes anyone's Free page slot.
 *
 *   npm run seed:demo
 *
 * Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * Safe to run again: it updates the page and replaces its links.
 */
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { DEMO_HOURS, DEMO_LINKS } from "../src/lib/demo-page.ts";

const DEMO_EMAIL = "demo@linkmural.com";
const SLUG = "studioforca";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local.",
  );
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function demoUserId(): Promise<string> {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) throw error;
    const found = data.users.find((u) => u.email === DEMO_EMAIL);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_EMAIL,
    email_confirm: true,
    // Nobody signs in as the demo user; the password is random and discarded.
    password: randomBytes(32).toString("base64url"),
    user_metadata: { full_name: "Demonstração linkmural" },
  });
  if (error) throw error;
  return data.user.id;
}

async function main() {
  const ownerId = await demoUserId();

  const pageRow = {
    owner_id: ownerId,
    slug: SLUG,
    template: "balcao",
    style: "sport",
    theme: {},
    business_name: "Studio Força",
    kind: "Academia · Treino funcional",
    bio: "Treinos em grupo e personal. A primeira aula é por nossa conta.",
    city: "[Bairro, Cidade]",
    whatsapp: "5511999990000",
    email: "contato@[seudominio].com",
    hours: DEMO_HOURS,
    show_branding: true,
    published: true,
    onboarding_step: 8,
  };

  const { data: existing, error: findError } = await admin
    .from("pages")
    .select("id, owner_id")
    .eq("slug", SLUG)
    .maybeSingle();
  if (findError) throw findError;
  if (existing && existing.owner_id !== ownerId) {
    throw new Error(
      `O endereço ${SLUG} já pertence a outra conta; nada foi alterado.`,
    );
  }

  const { data: page, error: pageError } = existing
    ? await admin
        .from("pages")
        .update(pageRow)
        .eq("id", existing.id)
        .select("id")
        .single()
    : await admin.from("pages").insert(pageRow).select("id").single();
  if (pageError) throw pageError;

  const { error: delError } = await admin
    .from("links")
    .delete()
    .eq("page_id", page.id);
  if (delError) throw delError;
  const { error: linkError } = await admin
    .from("links")
    .insert(
      DEMO_LINKS.map((l, position) => ({ ...l, page_id: page.id, position })),
    );
  if (linkError) throw linkError;

  console.log(
    `Página de demonstração pronta: /${SLUG} (${DEMO_LINKS.length} links).`,
  );
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
