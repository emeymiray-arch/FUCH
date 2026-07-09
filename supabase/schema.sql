-- FUCH / ФинОтчёт — выполните в Supabase → SQL Editor

-- Профили
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Финансы (JSON на пользователя)
create table if not exists public.user_finance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- Интеграции (Битрикс24 и др.)
create table if not exists public.user_integrations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bitrix24 jsonb,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_finance enable row level security;
alter table public.user_integrations enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "finance_all_own" on public.user_finance;
drop policy if exists "integrations_all_own" on public.user_integrations;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "finance_all_own" on public.user_finance for all using (auth.uid() = user_id);
create policy "integrations_all_own" on public.user_integrations for all using (auth.uid() = user_id);

-- Профиль при регистрации
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Realtime для синхронизации между устройствами
alter publication supabase_realtime add table public.user_finance;

-- Supabase Dashboard → Authentication → URL Configuration:
-- Site URL: https://fuch-mu.vercel.app
-- Redirect URLs: https://fuch-mu.vercel.app/auth/callback
