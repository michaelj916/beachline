alter table public.spots
  add column if not exists provider_overrides jsonb default '{}'::jsonb;


