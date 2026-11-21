-- Linkmural · Fase 7 (E-mails restantes do §14)
-- Amplia email_logs.kind com:
-- - day3_first_clicks: Dia 3 ("Seus primeiros cliques", só se houver cliques)
-- - day7_tip:          Dia 7 (dica ligada aos links escolhidos)
-- - free_link_limit:   Ao bater 5 links no Grátis ("Você chegou ao limite do Grátis")

alter table public.email_logs
  drop constraint if exists email_logs_kind_check;

alter table public.email_logs
  add constraint email_logs_kind_check
  check (
    kind in (
      'onboarding_1h',
      'onboarding_24h',
      'put_in_bio',
      'renewal_price_increase',
      'day3_first_clicks',
      'day7_tip',
      'free_link_limit'
    )
  );
