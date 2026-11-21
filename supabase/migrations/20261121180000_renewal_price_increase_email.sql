-- Linkmural · Aviso por e-mail antes da renovação com preço regular (Fase 8)
-- Amplia o conjunto de tipos aceitos em email_logs para registrar o envio único
-- de `renewal_price_increase` (disparado pela Edge Function send-lifecycle-emails
-- até 15 dias antes da primeira cobrança após o fim dos 12 meses de lançamento).

alter table public.email_logs
  drop constraint if exists email_logs_kind_check;

alter table public.email_logs
  add constraint email_logs_kind_check
  check (kind in ('onboarding_1h', 'onboarding_24h', 'put_in_bio', 'renewal_price_increase'));

create index if not exists subscriptions_renewal_notice_idx
  on public.subscriptions (current_period_end)
  where status = 'active' and cancel_at_period_end = false and current_period_end is not null;
