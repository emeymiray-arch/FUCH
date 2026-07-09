-- ФинОтчёт: выполните в Supabase → SQL Editor

-- Профили пользователей
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz default now()
);

-- Финансовые данные (JSON на пользователя)
create table if not exists public.user_finance (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.user_finance enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "finance_all_own" on public.user_finance;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "finance_all_own" on public.user_finance for all using (auth.uid() = user_id);

-- Автопрофиль при регистрации
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

-- В Supabase Dashboard → Authentication → Providers → Email:
-- отключите "Confirm email" для быстрого входа без письма

-- Realtime: изменения финансов на других устройствах
alter publication supabase_realtime add table public.user_finance;
