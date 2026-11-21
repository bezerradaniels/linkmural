-- Linkmural · agenda o envio dos e-mails automáticos (Fase 4 · F)
--
-- A cada 15 minutos, das 8h às 21h (horário de Brasília), o pg_cron chama a Edge
-- Function `send-lifecycle-emails` pelo pg_net. A URL da função e o segredo ficam no
-- Vault do Supabase: nada secreto entra neste arquivo, e ele serve para qualquer ambiente.
--
-- ANTES DE APLICAR (ver supabase/functions/send-lifecycle-emails/index.ts):
--   1. publicar a função com `supabase functions deploy send-lifecycle-emails --no-verify-jwt`;
--   2. definir os segredos da função (RESEND_API_KEY, CRON_SECRET, EMAIL_FROM, SITE_URL);
--   3. testar com ?dry_run=1 para ver quantos e-mails sairiam na primeira rodada;
--   4. criar os dois segredos no Vault (rodar uma vez no SQL Editor, com os valores reais):
--        select vault.create_secret('https://<project-ref>.supabase.co/functions/v1/send-lifecycle-emails', 'lifecycle_emails_function_url');
--        select vault.create_secret('<o mesmo CRON_SECRET da função>', 'lifecycle_emails_cron_secret');
--
-- Sem os dois segredos, invoke_lifecycle_emails() não faz nada: aplicar esta migração
-- antes da hora é seguro.
--
-- Para parar os envios:  select cron.unschedule('lifecycle-emails');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_lifecycle_emails()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url     text;
  fn_secret  text;
  request_id bigint;
begin
  -- Horário comercial em Brasília: nenhum e-mail de madrugada.
  if extract(hour from (now() at time zone 'America/Sao_Paulo')) not between 8 and 20 then
    return null;
  end if;

  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'lifecycle_emails_function_url';
  select decrypted_secret into fn_secret
    from vault.decrypted_secrets where name = 'lifecycle_emails_cron_secret';

  -- Ainda não configurado: não faz nada.
  if fn_url is null or fn_secret is null then
    return null;
  end if;

  select net.http_post(
    url := fn_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || fn_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) into request_id;

  return request_id;
end;
$$;

-- Só o pg_cron (dono do banco) chama; nem a API pública nem usuários logados.
revoke all on function public.invoke_lifecycle_emails() from public, anon, authenticated;

select cron.schedule(
  'lifecycle-emails',
  '*/15 * * * *',
  $$select public.invoke_lifecycle_emails()$$
);
