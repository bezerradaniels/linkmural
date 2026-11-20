-- Linkmural · eventos do funil de onboarding (Fase 2)
-- Gravados no servidor via service role; leitura apenas para admins.

create table public.onboarding_events (
  id          bigint generated always as identity primary key,
  event       text not null check (
    event in (
      'slug_escolhido',
      'conta_criada',
      'estilo_escolhido',
      'dados_salvos',
      'links_adicionados',
      'modelo_escolhido',
      'pagina_publicada',
      'link_copiado',
      'qr_baixado'
    )
  ),
  user_id     uuid references public.profiles (id) on delete set null,
  page_id     uuid references public.pages (id) on delete set null,
  slug        text,
  metadata    jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index onboarding_events_event_time_idx
  on public.onboarding_events (event, occurred_at desc);
create index onboarding_events_page_time_idx
  on public.onboarding_events (page_id, occurred_at desc);
create index onboarding_events_user_time_idx
  on public.onboarding_events (user_id, occurred_at desc);

alter table public.onboarding_events enable row level security;

create policy onboarding_events_admin_select
  on public.onboarding_events
  for select
  to authenticated
  using ((select public.is_admin()));

revoke truncate, references, trigger on public.onboarding_events from anon, authenticated;
