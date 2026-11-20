-- Linkmural · Fase 4 (Lançamento do MVP)
-- 1) admin_actions: log de auditoria das ações administrativas
-- 2) waitlist: lista de espera dos planos pagos (Pro / Negócios)
-- 3) feedback: sugestões enviadas pelos usuários no painel
-- 4) is_slug_blocked: permite diferenciar página bloqueada de 404 sem expor rascunhos

create table if not exists public.admin_actions (
  id          bigint generated always as identity primary key,
  admin_id    uuid not null references public.profiles (id) on delete cascade,
  action      text not null,
  target_type text not null,
  target_id   text not null,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_actions_created_idx
  on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;
create policy admin_actions_admin_select
  on public.admin_actions
  for select
  to authenticated
  using ((select public.is_admin()));
revoke truncate, references, trigger on public.admin_actions from anon, authenticated;

create table if not exists public.waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  plan       public.plan_tier not null check (plan in ('pro', 'business')),
  source     text not null default 'planos',
  user_id    uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index if not exists waitlist_email_plan_uidx
  on public.waitlist (lower(email), plan);

alter table public.waitlist enable row level security;
create policy waitlist_admin_select
  on public.waitlist
  for select
  to authenticated
  using ((select public.is_admin()));
revoke truncate, references, trigger on public.waitlist from anon, authenticated;

create table if not exists public.feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles (id) on delete set null,
  page_id    uuid references public.pages (id) on delete set null,
  message    text not null check (char_length(message) between 3 and 2000),
  status     text not null default 'open' check (status in ('open', 'reviewed')),
  created_at timestamptz not null default now()
);
create index if not exists feedback_created_idx
  on public.feedback (created_at desc);

alter table public.feedback enable row level security;
create policy feedback_owner_insert
  on public.feedback
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));
create policy feedback_owner_select
  on public.feedback
  for select
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy feedback_admin_all
  on public.feedback
  for all
  to authenticated
  using ((select public.is_admin()));
revoke truncate, references, trigger on public.feedback from anon, authenticated;

-- Retorna true apenas quando o endereço pertence a uma página bloqueada pela moderação.
create or replace function public.is_slug_blocked(p_slug text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.pages
     where slug = p_slug and blocked_at is not null
  );
$$;
revoke execute on function public.is_slug_blocked(text) from public;
grant execute on function public.is_slug_blocked(text) to anon, authenticated;
