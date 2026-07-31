alter table public.users
  add column if not exists is_active boolean not null default true;

create index if not exists idx_users_active on public.users(is_active);
