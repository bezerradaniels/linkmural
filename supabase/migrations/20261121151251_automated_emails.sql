-- Linkmural · E-mails automáticos essenciais (Fase 4 · F)
-- Controla os envios já feitos para evitar duplicidade e cria índices parciais
-- para as consultas agendadas pelo pg_cron / Edge Function.

create table public.email_logs (
  id      bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  page_id uuid references public.pages (id) on delete cascade,
  kind    text not null check (kind in ('onboarding_1h', 'onboarding_24h', 'put_in_bio')),
  sent_at timestamptz not null default now(),
  unique (user_id, kind)
);

create index email_logs_page_id_idx on public.email_logs (page_id);

-- Só a service role (Edge Function) lê e grava logs de envio.
alter table public.email_logs enable row level security;

-- Índices parciais para o cron não varrer a tabela inteira.
create index pages_onboarding_stalled_idx
  on public.pages (created_at)
  where published = false and blocked_at is null;

create index pages_published_bio_idx
  on public.pages (published_at)
  where published = true and blocked_at is null and published_at is not null;
