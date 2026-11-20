-- Linkmural · ajustes de segurança e desempenho apontados pelos advisors do Supabase
-- depois da migração inicial. As regras de acesso continuam as mesmas.

-- 1) search_path fixo no gatilho de updated_at
alter function public.set_updated_at() set search_path = '';

-- 2) Funções SECURITY DEFINER que não devem ser RPC públicas.
--    Gatilhos só rodam pelo próprio gatilho; plan_of é de uso interno.
revoke execute on function public.handle_new_user()   from public, anon, authenticated;
revoke execute on function public.pages_guard()       from public, anon, authenticated;
revoke execute on function public.links_limit()       from public, anon, authenticated;
revoke execute on function public.sync_profile_plan() from public, anon, authenticated;
revoke execute on function public.domains_guard()     from public, anon, authenticated;
revoke execute on function public.plan_of(uuid)       from public, anon, authenticated;
-- is_admin é usado nas políticas de quem está logado; visitante não precisa.
revoke execute on function public.is_admin() from public, anon;
grant  execute on function public.is_admin() to authenticated;
-- is_slug_available e page_slug_for_host continuam públicas de propósito (landing e domínio próprio).

-- 3) Privilégios que a API nunca usa
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- 4) Políticas: auth.uid() avaliado uma vez por consulta e regras de dono/admin só para quem está logado
alter policy profiles_select_own on public.profiles to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
alter policy profiles_update_own on public.profiles to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

alter policy pages_owner_all on public.pages to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
alter policy pages_admin_all on public.pages to authenticated
  using ((select public.is_admin()));

alter policy links_owner_all on public.links to authenticated
  using (exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())));
alter policy links_admin_all on public.links to authenticated
  using ((select public.is_admin()));

alter policy subs_select_own on public.subscriptions to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

alter policy clicks_select_owner on public.click_events to authenticated using (
  (select public.is_admin())
  or exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())));

alter policy domains_owner_select on public.domains to authenticated using (
  (select public.is_admin())
  or exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())));
alter policy domains_owner_insert on public.domains to authenticated with check (
  exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())));
alter policy domains_owner_delete on public.domains to authenticated using (
  exists (select 1 from public.pages p where p.id = page_id and p.owner_id = (select auth.uid())));

alter policy reports_admin on public.reports to authenticated
  using ((select public.is_admin()));

-- 5) Índice da chave estrangeira de denúncias
create index reports_page_idx on public.reports (page_id);
