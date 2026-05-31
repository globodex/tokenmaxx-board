create table if not exists public.profiles (
  id text primary key,
  name text not null,
  handle text not null unique,
  lifetime_tokens bigint not null check (lifetime_tokens >= 0),
  peak_tokens bigint not null check (peak_tokens >= 0),
  longest_task_minutes integer not null check (longest_task_minutes >= 0),
  current_streak integer not null check (current_streak >= 0),
  longest_streak integer not null check (longest_streak >= 0),
  activity_seed integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_score_inputs_idx
  on public.profiles (lifetime_tokens desc, peak_tokens desc, current_streak desc, longest_streak desc);

alter table public.profiles enable row level security;

drop policy if exists "profiles are publicly readable" on public.profiles;
create policy "profiles are publicly readable"
  on public.profiles
  for select
  using (true);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_updated_at();
