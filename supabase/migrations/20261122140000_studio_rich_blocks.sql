-- Linkmural · Plano Studio: blocos ricos misturados no Bento Grid (Galeria/Carrossel, YouTube, Card de Serviços)
alter type public.link_kind add value if not exists 'gallery';
alter type public.link_kind add value if not exists 'youtube';
alter type public.link_kind add value if not exists 'service';

alter table public.links
  add column if not exists data jsonb not null default '{}'::jsonb;

grant update (data) on public.links to authenticated;
