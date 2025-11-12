create table if not exists public.user_saved_spots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  spot_id uuid references public.spots(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, spot_id)
);

alter table public.user_saved_spots enable row level security;

create policy "user_saved_spots_select_own"
  on public.user_saved_spots
  for select
  using (auth.uid() = user_id);

create policy "user_saved_spots_insert_own"
  on public.user_saved_spots
  for insert
  with check (auth.uid() = user_id);

create policy "user_saved_spots_delete_own"
  on public.user_saved_spots
  for delete
  using (auth.uid() = user_id);


