create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('admin', 'faculty', 'student')),
  name text not null,
  department text not null default 'unassigned',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('classroom', 'lab', 'auditorium', 'equipment', 'sports')),
  location text not null,
  description text,
  capacity integer not null check (capacity > 0),
  schedule jsonb not null,
  color text not null default '#0088FF',
  is_active boolean not null default true,
  department text not null default 'shared',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id),
  requester_id uuid not null references public.users(id),
  status text not null default 'pending' check (status in ('pending', 'approved', 'active', 'completed', 'cancelled', 'rejected')),
  date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,
  waitlist_position integer check (waitlist_position > 0),
  waitlist_offered_at timestamptz,
  waitlist_expires_at timestamptz,
  cancelled_reason text,
  notes text,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_valid_time check (start_time < end_time)
);

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  resource_id uuid not null references public.resources(id),
  user_id uuid not null references public.users(id),
  date date not null,
  start_time time not null,
  end_time time not null,
  position integer not null check (position > 0),
  status text not null default 'waiting' check (status in ('waiting', 'offered', 'expired', 'approved')),
  offered_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  constraint waitlist_valid_time check (start_time < end_time)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id),
  user_id uuid not null references public.users(id),
  action text not null,
  details jsonb not null default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_role on public.users(role);
create index if not exists idx_resources_type on public.resources(type);
create index if not exists idx_resources_active on public.resources(is_active);
create index if not exists idx_bookings_requester on public.bookings(requester_id);
create index if not exists idx_bookings_status on public.bookings(status);
create index if not exists idx_bookings_resource_date_status on public.bookings(resource_id, date, status);
create index if not exists idx_waitlist_resource_position on public.waitlist(resource_id, date, start_time, end_time, position);
create index if not exists idx_waitlist_user on public.waitlist(user_id);
create index if not exists idx_waitlist_offered on public.waitlist(status, expires_at);

create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.check_booking_conflict()
returns trigger as $$
begin
  if exists (
    select 1 from public.bookings
    where resource_id = new.resource_id
      and date = new.date
      and status in ('pending', 'approved', 'active')
      and start_time < new.end_time
      and end_time > new.start_time
  ) then
    raise exception 'CONFLICT: This time slot is already booked for this resource';
  end if;

  return new;
end;
$$ language plpgsql;

create or replace function public.process_waitlist()
returns trigger as $$
declare
  next_entry_id uuid;
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    select id into next_entry_id
    from public.waitlist
    where resource_id = old.resource_id
      and date = old.date
      and start_time = old.start_time
      and end_time = old.end_time
      and status = 'waiting'
    order by position asc
    limit 1;

    if next_entry_id is not null then
      update public.waitlist
      set status = 'offered',
          offered_at = now(),
          expires_at = now() + interval '15 minutes'
      where id = next_entry_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_bookings_conflict_check on public.bookings;
create trigger trg_bookings_conflict_check
  before insert on public.bookings
  for each row execute function public.check_booking_conflict();

drop trigger if exists trg_bookings_waitlist_process on public.bookings;
create trigger trg_bookings_waitlist_process
  after update on public.bookings
  for each row execute function public.process_waitlist();

drop trigger if exists trg_update_timestamps_users on public.users;
create trigger trg_update_timestamps_users
  before update on public.users
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_timestamps_resources on public.resources;
create trigger trg_update_timestamps_resources
  before update on public.resources
  for each row execute function public.update_updated_at_column();

drop trigger if exists trg_update_timestamps_bookings on public.bookings;
create trigger trg_update_timestamps_bookings
  before update on public.bookings
  for each row execute function public.update_updated_at_column();

alter table public.users enable row level security;
alter table public.resources enable row level security;
alter table public.bookings enable row level security;
alter table public.waitlist enable row level security;
alter table public.audit_logs enable row level security;

create policy "Users can view own profile" on public.users
  for select using (auth.uid() = id);

create policy "Admins can view all users" on public.users
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Authenticated users can view active resources" on public.resources
  for select using (is_active = true);

create policy "Admins can manage resources" on public.resources
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Users view own bookings" on public.bookings
  for select using (requester_id = auth.uid());

create policy "Admins and faculty view bookings" on public.bookings
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'faculty'))
  );

create policy "Users create own bookings" on public.bookings
  for insert with check (requester_id = auth.uid());

create policy "Users update own bookings" on public.bookings
  for update using (requester_id = auth.uid() and status in ('pending', 'approved'));

create policy "Admins update any booking" on public.bookings
  for update using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Users view own waitlist" on public.waitlist
  for select using (user_id = auth.uid());

create policy "Users join waitlist" on public.waitlist
  for insert with check (user_id = auth.uid());

create policy "Admins view all waitlist" on public.waitlist
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Admins read audit logs" on public.audit_logs
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Users read own audit logs" on public.audit_logs
  for select using (user_id = auth.uid());
