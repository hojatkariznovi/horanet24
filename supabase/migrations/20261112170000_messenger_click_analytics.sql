create table if not exists public.messenger_click_events (
  id bigint generated always as identity primary key,
  platform text not null check (platform in ('eitaa','telegram')),
  page_path text not null default '/',
  source_label text,
  created_at timestamptz not null default now()
);
create index if not exists messenger_click_events_created_at_idx on public.messenger_click_events (created_at desc);
create index if not exists messenger_click_events_platform_created_idx on public.messenger_click_events (platform, created_at desc);
alter table public.messenger_click_events enable row level security;
drop policy if exists "public can record messenger clicks" on public.messenger_click_events;
create policy "public can record messenger clicks"
on public.messenger_click_events for insert to anon, authenticated
with check (platform in ('eitaa','telegram') and length(page_path) <= 300 and (source_label is null or length(source_label) <= 160));
drop policy if exists "admins can read messenger clicks" on public.messenger_click_events;
create policy "admins can read messenger clicks"
on public.messenger_click_events for select to authenticated
using (exists (select 1 from public.site_admins sa where sa.user_id = (select auth.uid())));
grant insert on public.messenger_click_events to anon, authenticated;
grant select on public.messenger_click_events to authenticated;
grant usage, select on sequence public.messenger_click_events_id_seq to anon, authenticated;
