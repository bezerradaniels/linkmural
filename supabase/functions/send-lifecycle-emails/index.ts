// Supabase Edge Function: envia os e-mails automáticos (Fase 4 · F, Fase 7 e Fase 8)
// 1. "Sua página está quase pronta" (1h e 24h após cadastro parado)
// 2. "Coloque seu link na bio" (24h após publicação)
// 3. "Seus primeiros cliques" (Dia 3, só se houver cliques)
// 4. Dica ligada aos links escolhidos (Dia 7)
// 5. "Sua assinatura Pro renova com valor regular" (até 15 dias antes da 1ª cobrança após os 12 meses de lançamento)
//
// Secrets esperados na Edge Function:
// - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (automáticos no Supabase)
// - RESEND_API_KEY
// - EMAIL_FROM (opcional; padrão "Linkmural <oi@linkmural.com>")
// - SITE_URL (opcional; padrão "https://linkmural.com")
// - CRON_SECRET (opcional; se ausente, exige SUPABASE_SERVICE_ROLE_KEY no Bearer)
//
// Teste seguro: chamar com ?dry_run=1 só conta quem receberia cada e-mail, sem
// enviar nada e sem gravar em email_logs. Use antes de agendar o cron.
//
// Publicar com --no-verify-jwt: a autenticação é feita aqui, pelo Bearer acima
// (as chaves novas do Supabase, sb_secret_..., não são JWT).

import { createClient } from "npm:@supabase/supabase-js@2";

type PageEmailKind = "onboarding_1h" | "onboarding_24h" | "put_in_bio";
type EmailKind =
  | PageEmailKind
  | "day3_first_clicks"
  | "day7_tip"
  | "renewal_price_increase";

type ProfileMini = {
  id: string;
  email: string | null;
  full_name: string | null;
  suspended_at: string | null;
};

type CandidateRow = {
  id: string;
  slug: string;
  business_name: string;
  owner_id: string;
  profiles: ProfileMini | null;
};

type RenewalSubRow = {
  id: string;
  user_id: string;
  plan: string;
  billing_interval: string | null;
  created_at: string;
  current_period_end: string | null;
  profiles: ProfileMini | null;
};

const LAUNCH_PROMO_MONTHS = 12;
const PROMO_EDGE_MS = 2 * 24 * 60 * 60 * 1000;
const FIRST_REGULAR_WINDOW_MS = 35 * 24 * 60 * 60 * 1000;
const RENEWAL_NOTICE_DAYS = 15;

function isFirstRegularRenewal(createdAtIso: string, periodEndIso: string): boolean {
  const createdAt = new Date(createdAtIso);
  const periodEnd = new Date(periodEndIso);
  if (Number.isNaN(createdAt.getTime()) || Number.isNaN(periodEnd.getTime())) {
    return false;
  }
  const promoEndsAt = new Date(createdAt);
  promoEndsAt.setUTCMonth(promoEndsAt.getUTCMonth() + LAUNCH_PROMO_MONTHS);
  const diff = periodEnd.getTime() - promoEndsAt.getTime();
  return diff >= -PROMO_EDGE_MS && diff <= FIRST_REGULAR_WINDOW_MS;
}

function formatDatePtBr(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

function buildRenewalEmail(
  row: RenewalSubRow,
  siteUrl: string,
): { subject: string; html: string } {
  const firstName = row.profiles?.full_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
  const isYearly = row.billing_interval === "year";
  const newPrice = isYearly ? "R$ 60,00 por ano" : "R$ 9,98 por mês";
  const renewalDate = row.current_period_end
    ? formatDatePtBr(row.current_period_end)
    : "em breve";
  const planUrl = `${siteUrl}/app/plano`;

  return {
    subject: "Aviso: sua assinatura Linkmural Pro renova com o valor regular",
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#6B6B66;">
            O seu desconto de lançamento de 50% (12 meses) está chegando ao fim. Por transparência, queremos avisar antes da próxima cobrança:
          </p>
          <div style="background:#F4F4EF;border-radius:12px;padding:16px;margin-bottom:20px;font-size:14px;line-height:1.6;">
            <div><strong>Data da renovação:</strong> ${escapeHtml(renewalDate)}</div>
            <div><strong>Novo valor:</strong> ${escapeHtml(newPrice)}</div>
          </div>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#6B6B66;">
            Se quiser continuar no Pro, não precisa fazer nada. Se preferir cancelar antes da cobrança, basta acessar a tela de plano no painel.
          </p>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${escapeHtml(planUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
              Gerenciar minha assinatura
            </a>
          </p>
        </div>
      </div>
    `.trim(),
  };
}

function buildDay3ClicksEmail(
  row: CandidateRow,
  clickCount: number,
  siteUrl: string,
): { subject: string; html: string } {
  const firstName = row.profiles?.full_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
  const business = escapeHtml(row.business_name.trim() || row.slug);
  const metricsUrl = `${siteUrl}/app/metricas`;
  const clicksLabel =
    clickCount === 1 ? "1 clique" : `${clickCount} cliques`;

  return {
    subject: `Seus primeiros cliques chegaram no Linkmural (${clicksLabel})`,
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#6B6B66;">
            A página de <strong style="color:#0E0E0E;">${business}</strong> já recebeu <strong style="color:#0E0E0E;">${escapeHtml(clicksLabel)}</strong> nos seus primeiros dias no ar!
          </p>
          <p style="margin:0 0 20px;font-size:14px;line-height:1.5;color:#6B6B66;">
            Acompanhe quantas pessoas visitam sua página e clicam nos seus links direto pelo painel.
          </p>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${escapeHtml(metricsUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
              Ver minhas métricas
            </a>
          </p>
        </div>
      </div>
    `.trim(),
  };
}

function buildDay7TipEmail(
  row: CandidateRow,
  links: { kind: string; featured: boolean; active: boolean }[],
  siteUrl: string,
): { subject: string; html: string } {
  const firstName = row.profiles?.full_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
  const activeLinks = links.filter((l) => l.active);
  const hasWhatsapp = activeLinks.some((l) => l.kind === "whatsapp");
  const hasFeatured = activeLinks.some((l) => l.featured);

  let subject: string;
  let tipTitle: string;
  let tipBody: string;
  let ctaLabel: string;
  let ctaUrl: string;

  if (!hasWhatsapp) {
    subject = "Dica rápida: facilite o contato pelo WhatsApp";
    tipTitle = "Adicione seu WhatsApp na página";
    tipBody =
      "Negócios que deixam o botão de WhatsApp visível recebem muito mais mensagens. Você pode adicionar seu número em menos de 1 minuto nas Informações da página.";
    ctaLabel = "Adicionar WhatsApp";
    ctaUrl = `${siteUrl}/app/informacoes`;
  } else if (!hasFeatured && activeLinks.length >= 2) {
    subject = "Dica rápida: destaque seu link mais importante";
    tipTitle = "Use o alfinete no link principal";
    tipBody =
      "Você já tem vários links ativos! Marcar o principal como destaque (ex.: agendamento, cardápio ou WhatsApp) chama atenção logo no topo da página.";
    ctaLabel = "Destacar um link";
    ctaUrl = `${siteUrl}/app/pagina`;
  } else {
    subject = "Dica rápida: leve seu Linkmural para fora da internet";
    tipTitle = "Imprima o QR code da sua página";
    tipBody =
      "Sua página já está bem completa! Baixe o QR code pronto no painel e coloque no balcão, embalagem ou cartão de visita para transformar clientes presenciais em seguidores e contatos.";
    ctaLabel = "Baixar meu QR code";
    ctaUrl = `${siteUrl}/app`;
  }

  return {
    subject,
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural · dica da semana</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
          <h2 style="margin:0 0 10px;font-size:16px;line-height:1.35;color:#0E0E0E;">${escapeHtml(tipTitle)}</h2>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#6B6B66;">
            ${escapeHtml(tipBody)}
          </p>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
              ${escapeHtml(ctaLabel)}
            </a>
          </p>
        </div>
      </div>
    `.trim(),
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildEmail(
  kind: PageEmailKind,
  row: CandidateRow,
  siteUrl: string,
): { subject: string; html: string } {
  const firstName = row.profiles?.full_name?.trim().split(/\s+/)[0];
  const greeting = firstName ? `Olá, ${escapeHtml(firstName)}!` : "Olá!";
  const pageUrl = `${siteUrl}/${row.slug}`;
  const onboardingUrl = `${siteUrl}/onboarding`;
  const panelUrl = `${siteUrl}/app`;
  const business = escapeHtml(row.business_name.trim() || row.slug);

  if (kind === "onboarding_1h") {
    return {
      subject: "Sua página no Linkmural está quase pronta",
      html: `
        <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
          <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#6B6B66;">
              Você já garantiu o endereço <strong style="color:#0E0E0E;">linkmural.com/${escapeHtml(row.slug)}</strong>, mas ainda não publicou sua página. Leva menos de 2 minutos para colocar no ar.
            </p>
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${escapeHtml(onboardingUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
                Continuar minha página
              </a>
            </p>
          </div>
        </div>
      `.trim(),
    };
  }

  if (kind === "onboarding_24h") {
    return {
      subject: "Falta pouco para colocar seu negócio no ar",
      html: `
        <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
          <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
            <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#6B6B66;">
              Seu endereço <strong style="color:#0E0E0E;">linkmural.com/${escapeHtml(row.slug)}</strong> ainda está guardado esperando você publicar. Adicione seu WhatsApp e seus links principais para seus clientes encontrarem tudo em um lugar só.
            </p>
            <p style="margin:24px 0 0;text-align:center;">
              <a href="${escapeHtml(onboardingUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
                Publicar minha página agora
              </a>
            </p>
          </div>
        </div>
      `.trim(),
    };
  }

  return {
    subject: "Coloque seu link na bio do Instagram e WhatsApp",
    html: `
      <div style="font-family:Inter,system-ui,-apple-system,sans-serif;background:#F4F4EF;padding:32px 16px;color:#0E0E0E;">
        <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:24px;padding:32px;border:1px solid #E2E2DC;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#6B6B66;">linkmural</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;">${greeting}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.5;color:#6B6B66;">
            A página de <strong style="color:#0E0E0E;">${business}</strong> já está no ar! Agora é só colocar o link onde seus clientes já falam com você:
          </p>
          <div style="background:#F4F4EF;border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:14px;font-weight:600;word-break:break-all;">
            <a href="${escapeHtml(pageUrl)}" style="color:#0E0E0E;text-decoration:none;">${escapeHtml(pageUrl)}</a>
          </div>
          <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.6;color:#0E0E0E;">
            <li><strong>Instagram:</strong> Editar perfil → Links → Adicionar link externo.</li>
            <li><strong>WhatsApp Business:</strong> Ferramentas comerciais → Perfil → Site.</li>
          </ul>
          <p style="margin:24px 0 0;text-align:center;">
            <a href="${escapeHtml(panelUrl)}" style="display:inline-block;background:#CDF54A;color:#0E0E0E;font-weight:700;font-size:15px;padding:13px 24px;border-radius:999px;text-decoration:none;">
              Abrir meu painel
            </a>
          </p>
        </div>
      </div>
    `.trim(),
  };
}

async function sendViaResend(params: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });
  if (!res.ok) {
    console.error("[lifecycle] Resend error:", res.status, await res.text());
    return false;
  }
  return true;
}

Deno.serve(async (req) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const expectedSecret = Deno.env.get("CRON_SECRET")?.trim() || serviceKey;

  const auth = req.headers.get("authorization") ?? "";
  if (!expectedSecret || auth !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

  const resendKey = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!resendKey && !dryRun) {
    return new Response(
      JSON.stringify({ ok: false, reason: "Missing RESEND_API_KEY" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const from =
    Deno.env.get("EMAIL_FROM")?.trim() || "Linkmural <oi@linkmural.com>";
  const siteUrl = (
    Deno.env.get("SITE_URL")?.trim() || "https://linkmural.com"
  ).replace(/\/+$/, "");

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const now = Date.now();
  const isoAgo = (hours: number) =>
    new Date(now - hours * 3_600_000).toISOString();

  // Fetch already-sent logs (last 16 days for lifecycle + all renewal notices).
  const { data: recentLogs } = await supabase
    .from("email_logs")
    .select("user_id, kind")
    .or(`sent_at.gte.${isoAgo(24 * 16)},kind.eq.renewal_price_increase`);

  const sentSet = new Set(
    (recentLogs ?? []).map((l) => `${l.user_id}:${l.kind}`),
  );

  const batches: { kind: PageEmailKind; rows: CandidateRow[] }[] = [];
  const nowIso = new Date(now).toISOString();
  const in15DaysIso = new Date(
    now + RENEWAL_NOTICE_DAYS * 24 * 3_600_000,
  ).toISOString();

  const [res1h, res24h, resBio, resDay3, resDay7, resRenewals] = await Promise.all([
    supabase
      .from("pages")
      .select(
        "id, slug, business_name, owner_id, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("published", false)
      .is("blocked_at", null)
      .lte("created_at", isoAgo(1))
      .gte("created_at", isoAgo(24))
      .limit(50),
    supabase
      .from("pages")
      .select(
        "id, slug, business_name, owner_id, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("published", false)
      .is("blocked_at", null)
      .lte("created_at", isoAgo(24))
      .gte("created_at", isoAgo(24 * 7))
      .limit(50),
    supabase
      .from("pages")
      .select(
        "id, slug, business_name, owner_id, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("published", true)
      .is("blocked_at", null)
      .not("published_at", "is", null)
      .lte("published_at", isoAgo(24))
      .gte("published_at", isoAgo(24 * 7))
      .limit(50),
    supabase
      .from("pages")
      .select(
        "id, slug, business_name, owner_id, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("published", true)
      .is("blocked_at", null)
      .not("published_at", "is", null)
      .lte("published_at", isoAgo(24 * 3))
      .gte("published_at", isoAgo(24 * 10))
      .limit(50),
    supabase
      .from("pages")
      .select(
        "id, slug, business_name, owner_id, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("published", true)
      .is("blocked_at", null)
      .not("published_at", "is", null)
      .lte("published_at", isoAgo(24 * 7))
      .gte("published_at", isoAgo(24 * 14))
      .limit(50),
    supabase
      .from("subscriptions")
      .select(
        "id, user_id, plan, billing_interval, created_at, current_period_end, profiles!inner(id, email, full_name, suspended_at)",
      )
      .eq("plan", "pro")
      .eq("status", "active")
      .eq("cancel_at_period_end", false)
      .gte("current_period_end", nowIso)
      .lte("current_period_end", in15DaysIso)
      .limit(50),
  ]);

  batches.push(
    { kind: "onboarding_1h", rows: (res1h.data ?? []) as unknown as CandidateRow[] },
    { kind: "onboarding_24h", rows: (res24h.data ?? []) as unknown as CandidateRow[] },
    { kind: "put_in_bio", rows: (resBio.data ?? []) as unknown as CandidateRow[] },
  );

  const counts: Record<EmailKind, number> = {
    onboarding_1h: 0,
    onboarding_24h: 0,
    put_in_bio: 0,
    day3_first_clicks: 0,
    day7_tip: 0,
    renewal_price_increase: 0,
  };

  for (const batch of batches) {
    for (const row of batch.rows) {
      const profile = row.profiles;
      if (!profile?.email || profile.suspended_at) continue;
      if (sentSet.has(`${profile.id}:${batch.kind}`)) continue;

      // Dry run: count who would receive it, send and record nothing.
      if (dryRun) {
        counts[batch.kind] += 1;
        continue;
      }

      // Reserve the log row first (unique constraint prevents concurrent duplicates).
      const { error: logErr } = await supabase.from("email_logs").insert({
        user_id: profile.id,
        page_id: row.id,
        kind: batch.kind,
      });
      if (logErr) continue;

      const { subject, html } = buildEmail(batch.kind, row, siteUrl);
      const sent = await sendViaResend({
        apiKey: resendKey!,
        from,
        to: profile.email,
        subject,
        html,
      });
      if (sent) {
        sentSet.add(`${profile.id}:${batch.kind}`);
        counts[batch.kind] += 1;
      } else {
        await supabase
          .from("email_logs")
          .delete()
          .eq("user_id", profile.id)
          .eq("kind", batch.kind);
      }
    }
  }

  // Day 3: "Seus primeiros cliques" (only when the page actually got clicks).
  const day3Rows = (resDay3.data ?? []) as unknown as CandidateRow[];
  for (const row of day3Rows) {
    const profile = row.profiles;
    if (!profile?.email || profile.suspended_at) continue;
    if (sentSet.has(`${profile.id}:day3_first_clicks`)) continue;

    const { count: clickCount } = await supabase
      .from("click_events")
      .select("id", { count: "exact", head: true })
      .eq("page_id", row.id)
      .neq("event", "view");

    if (!clickCount || clickCount < 1) continue;

    if (dryRun) {
      counts.day3_first_clicks += 1;
      continue;
    }

    const { error: logErr } = await supabase.from("email_logs").insert({
      user_id: profile.id,
      page_id: row.id,
      kind: "day3_first_clicks",
    });
    if (logErr) continue;

    const { subject, html } = buildDay3ClicksEmail(row, clickCount, siteUrl);
    const sent = await sendViaResend({
      apiKey: resendKey!,
      from,
      to: profile.email,
      subject,
      html,
    });
    if (sent) {
      sentSet.add(`${profile.id}:day3_first_clicks`);
      counts.day3_first_clicks += 1;
    } else {
      await supabase
        .from("email_logs")
        .delete()
        .eq("user_id", profile.id)
        .eq("kind", "day3_first_clicks");
    }
  }

  // Day 7: contextual tip based on the page's active links.
  const day7Rows = (resDay7.data ?? []) as unknown as CandidateRow[];
  for (const row of day7Rows) {
    const profile = row.profiles;
    if (!profile?.email || profile.suspended_at) continue;
    if (sentSet.has(`${profile.id}:day7_tip`)) continue;

    if (dryRun) {
      counts.day7_tip += 1;
      continue;
    }

    const { data: pageLinks } = await supabase
      .from("links")
      .select("kind, featured, active")
      .eq("page_id", row.id);

    const { error: logErr } = await supabase.from("email_logs").insert({
      user_id: profile.id,
      page_id: row.id,
      kind: "day7_tip",
    });
    if (logErr) continue;

    const { subject, html } = buildDay7TipEmail(row, pageLinks ?? [], siteUrl);
    const sent = await sendViaResend({
      apiKey: resendKey!,
      from,
      to: profile.email,
      subject,
      html,
    });
    if (sent) {
      sentSet.add(`${profile.id}:day7_tip`);
      counts.day7_tip += 1;
    } else {
      await supabase
        .from("email_logs")
        .delete()
        .eq("user_id", profile.id)
        .eq("kind", "day7_tip");
    }
  }

  // Renewal price-increase notice (up to 15 days before first regular-price renewal).
  const renewalRows = (resRenewals.data ?? []) as unknown as RenewalSubRow[];
  for (const row of renewalRows) {
    const profile = row.profiles;
    if (!profile?.email || profile.suspended_at) continue;
    if (!row.current_period_end) continue;
    if (!isFirstRegularRenewal(row.created_at, row.current_period_end)) continue;
    if (sentSet.has(`${profile.id}:renewal_price_increase`)) continue;

    if (dryRun) {
      counts.renewal_price_increase += 1;
      continue;
    }

    const { error: logErr } = await supabase.from("email_logs").insert({
      user_id: profile.id,
      page_id: null,
      kind: "renewal_price_increase",
    });
    if (logErr) continue;

    const { subject, html } = buildRenewalEmail(row, siteUrl);
    const sent = await sendViaResend({
      apiKey: resendKey!,
      from,
      to: profile.email,
      subject,
      html,
    });
    if (sent) {
      sentSet.add(`${profile.id}:renewal_price_increase`);
      counts.renewal_price_increase += 1;
    } else {
      await supabase
        .from("email_logs")
        .delete()
        .eq("user_id", profile.id)
        .eq("kind", "renewal_price_increase");
    }
  }

  return new Response(JSON.stringify({ ok: true, dry_run: dryRun, sent: counts }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
