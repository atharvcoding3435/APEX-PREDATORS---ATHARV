create table if not exists public.system_settings (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.system_settings (key, value)
values (
  'booking',
  '{
    "maxBookingDurationHours": 4,
    "maxAdvanceBookingDays": 30,
    "workingHoursStart": "08:00",
    "workingHoursEnd": "18:00",
    "approvalRequired": true
  }'::jsonb
)
on conflict (key) do nothing;

alter table public.system_settings enable row level security;

drop policy if exists "Admins read system settings" on public.system_settings;
create policy "Admins read system settings" on public.system_settings
  for select using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins manage system settings" on public.system_settings;
create policy "Admins manage system settings" on public.system_settings
  for all using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
