-- Linkmural · Fase 3 (Painel do cliente)
-- 1) Telefone separado do WhatsApp e atalhos de contato liga/desliga em pages
-- 2) page_stats_daily contando dias no fuso America/Sao_Paulo

alter table public.pages
  add column if not exists phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  add column if not exists actions jsonb not null default '{}'::jsonb;

grant update (phone, actions) on public.pages to authenticated;

create or replace function public.page_stats_daily(p_page uuid, p_from date, p_to date)
returns table (day date, views bigint, clicks bigint)
language sql stable security invoker set search_path = public as $$
  select d::date as day,
         count(e.*) filter (where e.event = 'view')  as views,
         count(e.*) filter (where e.event <> 'view') as clicks
    from generate_series(p_from, p_to, interval '1 day') d
    left join public.click_events e
      on e.page_id = p_page
     and (e.occurred_at at time zone 'America/Sao_Paulo')::date = d::date
   group by d
   order by d;
$$;
