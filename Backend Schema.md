# Backend Schema - Resourcify

**Last Updated:** 2026-07-31

## Tables

### users

- `id uuid primary key`
- `email text unique not null`
- `role text check role in admin/faculty/student`
- `name text not null`
- `department text not null`
- `avatar_url text`
- `created_at timestamptz`
- `updated_at timestamptz`
- `last_login_at timestamptz`

### resources

- `id uuid primary key`
- `name text not null`
- `type text check type in classroom/lab/auditorium/equipment/sports`
- `location text not null`
- `description text`
- `capacity integer check capacity > 0`
- `schedule jsonb not null`
- `color text`
- `is_active boolean default true`
- `department text`
- `created_by uuid references users(id)`
- timestamps

### bookings

- `id uuid primary key`
- `resource_id uuid references resources(id)`
- `requester_id uuid references users(id)`
- `status text check status in pending/approved/active/completed/cancelled/rejected`
- `date date not null`
- `start_time time not null`
- `end_time time not null`
- `purpose text not null`
- `waitlist_position integer`
- `waitlist_offered_at timestamptz`
- `waitlist_expires_at timestamptz`
- `cancelled_reason text`
- `notes text`
- `created_by uuid references users(id)`
- timestamps

### waitlist

- `id uuid primary key`
- `booking_id uuid references bookings(id)`
- `resource_id uuid references resources(id)`
- `user_id uuid references users(id)`
- `date date not null`
- `start_time time not null`
- `end_time time not null`
- `position integer`
- `status text check status in waiting/offered/expired/approved`
- `offered_at timestamptz`
- `expires_at timestamptz`
- `created_at timestamptz`

### audit_logs

- `id uuid primary key`
- `booking_id uuid references bookings(id)`
- `user_id uuid references users(id)`
- `action text not null`
- `details jsonb`
- `ip_address text`
- `user_agent text`
- `created_at timestamptz`

## Conflict Trigger

The database must block overlapping bookings for the same resource and date when existing status is Pending, Approved, or Active.

```sql
new.start_time < existing.end_time
and existing.start_time < new.end_time
```

## RLS Summary

- Users can read their own profile and bookings.
- Admins can read all users, resources, bookings, and audit logs.
- All authenticated users can read active resources.
- Only admins can mutate resources.
- Users can create their own bookings.
- Users can update their own pending or approved bookings.
- Admins can update any booking.

## Removed Scope

The schema intentionally contains no physical attendance verification fields.
