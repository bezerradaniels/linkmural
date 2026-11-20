-- Linkmural · migração inicial
-- Tabelas, regras de acesso (RLS), limites dos planos e armazenamento de imagens.
-- Aplicar com: supabase db push   (ou colar no SQL Editor do projeto)

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
create type public.plan_tier     as enum ('free', 'pro', 'business');
create type public.page_template as enum ('balcao', 'mosaico', 'cartao');
create type public.page_style    as enum ('sport', 'calm', 'classic', 'pop', 'bold', 'fresh', 'zen', 'dark');
create type public.link_kind     as enum ('link', 'whatsapp', 'contact', 'pix', 'email', 'phone', 'map');
create type public.sub_status    as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid', 'paused');

-- ---------------------------------------------------------------------------
-- Utilitários
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles: dono da conta (1:1 com auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  full_name          text,
  email              text,
  role               text not null default 'user' check (role in ('user', 'admin')),
  plan               public.plan_tier not null default 'free',
  stripe_customer_id text unique,
  suspended_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria o profile quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.plan_of(uid uuid)
returns public.plan_tier language sql stable security definer set search_path = public as $$
  select coalesce((select plan from public.profiles where id = uid), 'free'::public.plan_tier);
$$;

-- ---------------------------------------------------------------------------
-- Endereços reservados (sistema e marcas) e reserva temporária da landing
-- ---------------------------------------------------------------------------
create table public.reserved_slugs (
  slug   text primary key,
  reason text not null default 'system'
);
insert into public.reserved_slugs (slug) values
  ('admin'), ('painel'), ('app'), ('login'), ('entrar'), ('cadastro'), ('sair'), ('api'), ('ajuda'),
  ('suporte'), ('planos'), ('precos'), ('blog'), ('termos'), ('privacidade'), ('contato'), ('sobre'),
  ('onboarding'), ('conta'), ('configuracoes'), ('checkout'), ('webhooks'), ('static'), ('assets'),
  ('_next'), ('l'), ('r'), ('go'), ('qr'), ('www'), ('mail'), ('linkmural'), ('status'), ('dev'), ('teste');
insert into public.reserved_slugs (slug, reason) values
  ('instagram', 'brand'), ('whatsapp', 'brand'), ('facebook', 'brand'), ('tiktok', 'brand'), ('youtube', 'brand'),
  ('google', 'brand'), ('nubank', 'brand'), ('itau', 'brand'), ('bradesco', 'brand'), ('santander', 'brand'),
  ('caixa', 'brand'), ('bancodobrasil', 'brand'), ('mercadopago', 'brand'), ('mercadolivre', 'brand'),
  ('picpay', 'brand'), ('pix', 'brand'), ('ifood', 'brand'), ('shopee', 'brand'), ('amazon', 'brand'),
  ('magalu', 'brand'), ('correios', 'brand'), ('gov', 'brand'), ('receita', 'brand');

-- Reserva de 30 min feita na landing, antes de existir conta (só o servidor usa: sem políticas)
create table public.slug_holds (
  slug       text primary key,
  token      uuid not null,
  expires_at timestamptz not null default now() + interval '30 minutes'
);

-- ---------------------------------------------------------------------------
-- pages: a página pública linkmural.com/<slug>
-- ---------------------------------------------------------------------------
create table public.pages (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.profiles (id) on delete cascade,
  slug            text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' and slug !~ '--'),
  template        public.page_template not null default 'balcao',
  style           public.page_style not null default 'classic',
  -- Ajustes do visual (ver docs/HANDOFF.md §7.3). No Grátis, o servidor ignora os campos pagos ao renderizar.
  theme           jsonb not null default '{}'::jsonb,
  business_name   text not null default '' check (char_length(business_name) <= 60),
  kind            text check (char_length(kind) <= 60),          -- ex.: "Academia · Treino funcional"
  bio             text check (char_length(bio) <= 160),
  city            text check (char_length(city) <= 60),
  address         text check (char_length(address) <= 160),
  whatsapp        text check (whatsapp ~ '^\+?[0-9]{10,15}$'),     -- só dígitos, com DDI
  email           text,
  avatar_path     text,                                          -- caminho no bucket media
  cover_path      text,
  hours           jsonb,                                         -- {"mon":[["08:00","18:00"]], ...}
  status_text     text check (char_length(status_text) <= 40),   -- ex.: "Aberto agora · até 22h"
  show_branding   boolean not null default true,                 -- "Feito com linkmural"
  published       boolean not null default false,
  published_at    timestamptz,
  onboarding_step smallint not null default 3 check (onboarding_step between 1 and 8), -- 8 = concluído
  blocked_at      timestamptz,                                   -- moderação
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index pages_owner_idx on public.pages (owner_id);
create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

-- Bloqueia endereços reservados, limita páginas por plano e mantém a marca no Grátis
create or replace function public.pages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p public.plan_tier := public.plan_of(new.owner_id);
  max_pages int := case p when 'business' then 3 else 1 end;
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'slug_reserved' using errcode = 'P0001';
  end if;
  if tg_op = 'INSERT' and (select count(*) from public.pages where owner_id = new.owner_id) >= max_pages then
    raise exception 'plan_limit_pages' using errcode = 'P0001';
  end if;
  if p = 'free' then
    new.show_branding := true;
  end if;
  if new.published and (tg_op = 'INSERT' or not old.published) then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger pages_guard before insert or update on public.pages
  for each row execute function public.pages_guard();

-- Endereço livre? (usado na landing, inclusive sem login)
create or replace function public.is_slug_available(p_slug text)
returns boolean language sql stable security definer set search_path = public as $$
  select p_slug ~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
     and p_slug !~ '--'
     and not exists (select 1 from public.reserved_slugs where slug = p_slug)
     and not exists (select 1 from public.pages where slug = p_slug)
     and not exists (select 1 from public.slug_holds where slug = p_slug and expires_at > now());
$$;
grant execute on function public.is_slug_available(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- links: os cards da página
-- ---------------------------------------------------------------------------
create table public.links (
  id         uuid primary key default gen_random_uuid(),
  page_id    uuid not null references public.pages (id) on delete cascade,
  kind       public.link_kind not null default 'link',
  title      text not null check (char_length(title) between 1 and 80),
  subtitle   text check (char_length(subtitle) <= 120),
  url        text not null check (char_length(url) <= 2048),
  -- ícone: 'si:<slug>' (Simple Icons, ex.: si:instagram) ou 'lm:<nome>' (traço da marca, ex.: lm:calendar)
  icon       text check (icon ~ '^(si|lm):[a-z0-9-]+$'),
  featured   boolean not null default false,                     -- card em destaque, com alfinete
  position   integer not null default 0,
  active     boolean not null default true,
  flagged_at timestamptz,                                        -- link marcado como perigoso
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index links_page_pos_idx on public.links (page_id, position);
create trigger links_updated_at before update on public.links
  for each row execute function public.set_updated_at();

-- Limite de 5 links no Grátis, conferido no banco
create or replace function public.links_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  owner uuid;
begin
  select owner_id into owner from public.pages where id = new.page_id;
  if public.plan_of(owner) = 'free'
     and (select count(*) from public.links where page_id = new.page_id) >= 5 then
    raise exception 'plan_limit_links' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger links_limit before insert on public.links
  for each row execute function public.links_limit();

-- ---------------------------------------------------------------------------
-- subscriptions: espelho do Stripe (escrito só pelo webhook, com a service role)
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id                   text primary key,                         -- sub_...
  user_id              uuid not null references public.profiles (id) on delete cascade,
  stripe_customer_id   text not null,
  price_id             text not null,
  plan                 public.plan_tier not null,
  billing_interval     text check (billing_interval in ('month', 'year')),
  status               public.sub_status not null,
  current_period_end   timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index subscriptions_user_idx on public.subscriptions (user_id);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- Recalcula profiles.plan a partir das assinaturas ativas
create or replace function public.sync_profile_plan()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  uid uuid := coalesce(new.user_id, old.user_id);
  best public.plan_tier;
begin
  select plan into best from public.subscriptions
   where user_id = uid and status in ('active', 'trialing', 'past_due')
   order by case plan when 'business' then 2 when 'pro' then 1 else 0 end desc
   limit 1;
  update public.profiles set plan = coalesce(best, 'free') where id = uid;
  return null;
end $$;
create trigger subscriptions_sync after insert or update or delete on public.subscriptions
  for each row execute function public.sync_profile_plan();

-- ---------------------------------------------------------------------------
-- click_events: visitas e cliques, sem dados pessoais (sem IP, sem user agent completo)
-- ---------------------------------------------------------------------------
create table public.click_events (
  id            bigint generated always as identity primary key,
  page_id       uuid not null references public.pages (id) on delete cascade,
  link_id       uuid references public.links (id) on delete set null,
  event         text not null default 'click' check (event in ('view', 'click', 'whatsapp', 'contact', 'qr')),
  occurred_at   timestamptz not null default now(),
  referrer_host text,                                            -- ex.: instagram.com
  utm_source    text,
  country       char(2),
  device        text check (device in ('mobile', 'desktop', 'tablet', 'other'))
);
create index click_events_page_time_idx on public.click_events (page_id, occurred_at desc);
create index click_events_link_time_idx on public.click_events (link_id, occurred_at desc);

-- Série diária para o painel (respeita o RLS de quem chama)
create or replace function public.page_stats_daily(p_page uuid, p_from date, p_to date)
returns table (day date, views bigint, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select d::date as day,
         count(e.*) filter (where e.event = 'view')  as views,
         count(e.*) filter (where e.event <> 'view') as clicks
    from generate_series(p_from, p_to, interval '1 day') d
    left join public.click_events e
      on e.page_id = p_page
     and e.occurred_at >= d and e.occurred_at < d + interval '1 day'
   group by d
   order by d;
$$;

-- ---------------------------------------------------------------------------
-- domains: domínio próprio (plano Negócios), via Cloudflare for SaaS
-- ---------------------------------------------------------------------------
create table public.domains (
  id             uuid primary key default gen_random_uuid(),
  page_id        uuid not null unique references public.pages (id) on delete cascade,
  hostname       text not null unique check (hostname ~ '^([a-z0-9-]+\.)+[a-z]{2,}$'),
  status         text not null default 'pending' check (status in ('pending', 'active', 'failed')),
  cf_hostname_id text,
  verified_at    timestamptz,
  created_at     timestamptz not null default now()
);

-- Usado pelo middleware para resolver domínio próprio → slug (sem login)
create or replace function public.page_slug_for_host(p_host text)
returns text language sql stable security definer set search_path = public as $$
  select p.slug from public.domains d join public.pages p on p.id = d.page_id
   where d.hostname = lower(p_host) and d.status = 'active' and p.published and p.blocked_at is null;
$$;
grant execute on function public.page_slug_for_host(text) to anon, authenticated;

create or replace function public.domains_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.plan_of((select owner_id from public.pages where id = new.page_id)) <> 'business' then
    raise exception 'plan_required_business' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger domains_guard before insert on public.domains
  for each row execute function public.domains_guard();

-- ---------------------------------------------------------------------------
-- reports: denúncias feitas na página pública (inseridas pelo servidor)
-- ---------------------------------------------------------------------------
create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  page_id     uuid not null references public.pages (id) on delete cascade,
  reason      text not null check (reason in ('golpe', 'spam', 'conteudo_improprio', 'marca', 'outro')),
  details     text check (char_length(details) <= 1000),
  status      text not null default 'open' check (status in ('open', 'dismissed', 'actioned')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.pages          enable row level security;
alter table public.links          enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.click_events   enable row level security;
alter table public.domains        enable row level security;
alter table public.reports        enable row level security;
alter table public.reserved_slugs enable row level security;
alter table public.slug_holds     enable row level security;

-- profiles: cada um lê e edita o próprio nome; plano e papel só mudam pelo servidor
create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- pages: dono faz tudo; página publicada e não bloqueada é pública
create policy pages_public_read on public.pages for select using (published and blocked_at is null);
create policy pages_owner_all   on public.pages for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy pages_admin_all   on public.pages for all using (public.is_admin());
revoke update on public.pages from authenticated;
grant update (slug, template, style, theme, business_name, kind, bio, city, address, whatsapp, email,
              avatar_path, cover_path, hours, status_text, show_branding, published, onboarding_step)
  on public.pages to authenticated;

-- links: dono faz tudo; links ativos de página publicada são públicos
create policy links_public_read on public.links for select using (
  active and flagged_at is null and exists (
    select 1 from public.pages p where p.id = page_id and p.published and p.blocked_at is null));
create policy links_owner_all on public.links for all
  using (exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()));
create policy links_admin_all on public.links for all using (public.is_admin());
revoke update on public.links from authenticated;
grant update (kind, title, subtitle, url, icon, featured, position, active) on public.links to authenticated;

-- subscriptions: só leitura para o dono
create policy subs_select_own on public.subscriptions for select using (user_id = auth.uid() or public.is_admin());

-- click_events: leitura para o dono da página; inserção só pelo servidor
create policy clicks_select_owner on public.click_events for select using (
  public.is_admin() or exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()));

-- domains: dono lê, cria e remove; status é atualizado pelo servidor
create policy domains_owner_select on public.domains for select using (
  public.is_admin() or exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()));
create policy domains_owner_insert on public.domains for insert with check (
  exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()));
create policy domains_owner_delete on public.domains for delete using (
  exists (select 1 from public.pages p where p.id = page_id and p.owner_id = auth.uid()));

-- reports: só admin lê
create policy reports_admin on public.reports for all using (public.is_admin());

-- reserved_slugs: leitura livre
create policy reserved_read on public.reserved_slugs for select using (true);
-- slug_holds: sem políticas (só service role)

-- ---------------------------------------------------------------------------
-- Storage: bucket público "media" (avatar e capa), pasta = id do usuário
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy media_owner_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_owner_update on storage.objects for update to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy media_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
