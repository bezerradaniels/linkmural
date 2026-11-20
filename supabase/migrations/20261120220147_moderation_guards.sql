-- Linkmural · moderação que não dá para contornar
-- 1) Página bloqueada não pode ser apagada pelo dono (só pelo admin ou pela exclusão de conta).
-- 2) Conta suspensa não cria nem republica páginas pelas próprias credenciais.
-- 3) O registro de auditoria sobrevive à exclusão da conta do admin.

create policy pages_no_delete_when_blocked on public.pages
  as restrictive
  for delete
  to authenticated
  using (blocked_at is null or (select public.is_admin()));

create or replace function public.pages_guard()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  p public.plan_tier := public.plan_of(new.owner_id);
  max_pages int := case p when 'business' then 3 else 1 end;
begin
  if exists (select 1 from public.reserved_slugs r where r.slug = new.slug) then
    raise exception 'slug_reserved' using errcode = 'P0001';
  end if;
  -- Requests made with the user's own session (auth.uid() set). Server-side
  -- admin actions use the service role and are not limited here.
  if auth.uid() is not null
     and exists (select 1 from public.profiles pr
                  where pr.id = new.owner_id and pr.suspended_at is not null)
     and (tg_op = 'INSERT' or (new.published and not old.published)) then
    raise exception 'account_suspended' using errcode = 'P0001';
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

alter table public.admin_actions alter column admin_id drop not null;
alter table public.admin_actions
  drop constraint admin_actions_admin_id_fkey,
  add constraint admin_actions_admin_id_fkey
    foreign key (admin_id) references public.profiles (id) on delete set null;
