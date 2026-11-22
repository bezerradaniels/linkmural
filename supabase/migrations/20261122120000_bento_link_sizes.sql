-- Linkmural · Bento Grid card sizes (2x1, 1x1, 2x2)
-- Adds `size` to `links` so Pro users can resize cards in the 2-column Bento grid.
-- Free plans always render cards as 2x1 (enforced in the app renderer).

alter table public.links
  add column if not exists size text not null default '2x1'
  check (size in ('2x1', '1x1', '2x2'));

grant update (size) on public.links to authenticated;
