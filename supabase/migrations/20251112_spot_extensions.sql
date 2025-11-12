-- surfwatch spot extensions migration
-- Creates supportive tables for community-driven surf data and cameras.

-- Ensure uuid extension
create extension if not exists "uuid-ossp";

-------------------------------
-- 1. Custom user-defined spots
-------------------------------

create table if not exists public.custom_spots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  name text not null,
  description text,
  lat double precision not null,
  lng double precision not null,
  linked_buoy_id text references public.spots(buoy_id),
  is_public boolean not null default true,
  moderation_status text not null default 'pending', -- pending/approved/rejected
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists custom_spots_user_idx on public.custom_spots (user_id);
create index if not exists custom_spots_buoy_idx on public.custom_spots (linked_buoy_id);

alter table public.custom_spots enable row level security;

create policy "custom_spots_select_public_or_owner"
  on public.custom_spots
  for select
  using (
    is_public = true
    or auth.uid() = user_id
    or moderation_status = 'approved'
  );

create policy "custom_spots_modify_owner"
  on public.custom_spots
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

--------------------------------
-- 2. Spot reports / observations
--------------------------------

create table if not exists public.spot_reports (
  id uuid primary key default uuid_generate_v4(),
  spot_id uuid references public.spots(id) on delete cascade,
  custom_spot_id uuid references public.custom_spots(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  observed_at timestamptz not null default now(),
  wave_height_m double precision,
  wind_speed_kt double precision,
  wind_direction_deg double precision,
  tide_state text,
  crowd_level text,
  notes text,
  media_url text,
  created_at timestamptz not null default now()
);

create index if not exists spot_reports_spot_idx on public.spot_reports (spot_id);
create index if not exists spot_reports_custom_spot_idx on public.spot_reports (custom_spot_id);
create index if not exists spot_reports_user_idx on public.spot_reports (user_id);

alter table public.spot_reports enable row level security;

create policy "spot_reports_select_public"
  on public.spot_reports
  for select
  using (true);

create policy "spot_reports_modify_owner"
  on public.spot_reports
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

----------------------
-- 3. Spot review table
----------------------

create table if not exists public.spot_reviews (
  id uuid primary key default uuid_generate_v4(),
  spot_id uuid references public.spots(id) on delete cascade,
  custom_spot_id uuid references public.custom_spots(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_reviews_spot_idx on public.spot_reviews (spot_id);
create index if not exists spot_reviews_custom_spot_idx on public.spot_reviews (custom_spot_id);
create index if not exists spot_reviews_user_idx on public.spot_reviews (user_id);

alter table public.spot_reviews enable row level security;

create policy "spot_reviews_select_public" on public.spot_reviews for select using (true);

create policy "spot_reviews_modify_owner"
  on public.spot_reviews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-------------------------
-- 4. Spot change tracking
-------------------------

create table if not exists public.spot_change_requests (
  id uuid primary key default uuid_generate_v4(),
  spot_id uuid references public.spots(id) on delete cascade,
  custom_spot_id uuid references public.custom_spots(id) on delete cascade,
  user_id uuid references auth.users on delete cascade,
  proposed_changes jsonb not null,
  status text not null default 'pending', -- pending/approved/rejected
  reviewer_id uuid references auth.users,
  reviewed_at timestamptz,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_change_requests_spot_idx on public.spot_change_requests (spot_id);
create index if not exists spot_change_requests_custom_spot_idx on public.spot_change_requests (custom_spot_id);
create index if not exists spot_change_requests_status_idx on public.spot_change_requests (status);

alter table public.spot_change_requests enable row level security;

create policy "spot_change_requests_select"
  on public.spot_change_requests
  for select
  using (
    auth.uid() = user_id
    or status = 'approved'
  );

create policy "spot_change_requests_create"
  on public.spot_change_requests
  for insert
  with check (auth.uid() = user_id);

create policy "spot_change_requests_update_owner"
  on public.spot_change_requests
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-------------------------
-- 5. Community spot cams
-------------------------

create table if not exists public.spot_cams (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade,
  spot_id uuid references public.spots(id) on delete set null,
  custom_spot_id uuid references public.custom_spots(id) on delete set null,
  title text not null,
  description text,
  stream_url text not null,
  thumbnail_url text,
  is_public boolean not null default true,
  moderation_status text not null default 'pending', -- pending/approved/rejected
  last_online_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists spot_cams_spot_idx on public.spot_cams (spot_id);
create index if not exists spot_cams_custom_idx on public.spot_cams (custom_spot_id);
create index if not exists spot_cams_user_idx on public.spot_cams (user_id);

alter table public.spot_cams enable row level security;

create policy "spot_cams_select_public"
  on public.spot_cams
  for select
  using (
    is_public = true
    or moderation_status = 'approved'
    or auth.uid() = user_id
  );

create policy "spot_cams_modify_owner"
  on public.spot_cams
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-----------------------------
-- Helper trigger for updated_at
-----------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end
$$;

create trigger custom_spots_touch_updated
  before update on public.custom_spots
  for each row
  execute procedure public.touch_updated_at();

create trigger spot_reviews_touch_updated
  before update on public.spot_reviews
  for each row
  execute procedure public.touch_updated_at();

create trigger spot_change_requests_touch_updated
  before update on public.spot_change_requests
  for each row
  execute procedure public.touch_updated_at();

create trigger spot_cams_touch_updated
  before update on public.spot_cams
  for each row
  execute procedure public.touch_updated_at();



