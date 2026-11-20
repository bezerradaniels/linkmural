-- Plan of a published page's owner, for the public page to apply theme rules
-- (Pro+ fields are ignored on Free). Returns null for unpublished or blocked
-- pages, so it reveals nothing beyond what the public page already shows.
create or replace function public.public_page_plan(p_page uuid)
returns public.plan_tier language sql stable security definer set search_path = public as $$
  select pr.plan
    from public.pages p
    join public.profiles pr on pr.id = p.owner_id
   where p.id = p_page and p.published and p.blocked_at is null;
$$;
revoke execute on function public.public_page_plan(uuid) from public;
grant execute on function public.public_page_plan(uuid) to anon, authenticated;
