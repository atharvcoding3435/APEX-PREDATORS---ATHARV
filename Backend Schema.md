# Backend Schema — Campus Resource Management Platform (CRMP)

**Version:** 1.0.0
**Last Updated:** 2026-07-26
**Database:** PostgreSQL via Supabase

---

## 1. Entity-Relationship Diagram (Textual)

```
users (PK: id)
 │
 ├── 1:N ── bookings.created_by  → bookings.requester_id
 │              └── bookings.resource  → resources.id
 │              └── bookings.status ENUM (pending, confirmed, completed, cancelled)
 │
 ├── 1:N ── waitlist.user       → waitlist.user_id
 │              └── waitlist.booking  → bookings.id
 │
audit_logs (PK: id)
 │
 ├── N:1 ── audit_logs.booking  → bookings.id
 └── N:1 ── audit_logs.user     → users.id

resources (PK: id)
 │
 └── 1:N ── bookings.resource   → bookings.resource_id
```

---

## 2. Table Definitions

### 2.1 `users`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique user identifier |
| `email` | `text` | NOT NULL, UNIQUE | User email address |
| `role` | `text` | NOT NULL, CHECK (`role IN ('admin', 'faculty', 'student')`) | System role |
| `name` | `text` | NOT NULL, max 100 chars | Full display name |
| `department` | `text` | DEFAULT `'unassigned'` | Department affiliation |
| `avatar_url` | `text` | Nullable | Profile image URL (from Supabase Storage) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Account creation time |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` | Last profile update |
| `last_login_at` | `timestamptz` | Nullable | Most recent login timestamp |

**Indexes:**
- `idx_users_email` UNIQUE on `email`
- `idx_users_role` on `role` (for role-filtered queries)

**RLS Policy:**
```sql
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 2.2 `resources`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique resource identifier |
| `name` | `text` | NOT NULL, max 100 chars | Display name |
| `type` | `text` | NOT NULL, CHECK (`type IN ('classroom', 'lab', 'auditorium', 'equipment', 'sports')`) | Resource category |
| `location` | `text` | NOT NULL, max 200 chars | Building + room (e.g., "Science Block, Rm 101") |
| `description` | `text` | Nullable, max 500 chars | Free-text description |
| `capacity` | `integer` | NOT NULL, CHECK (`capacity > 0`), max 500 | Max occupancy |
| `schedule` | `jsonb` | NOT NULL | Daily availability schedule |
| `color` | `text` | DEFAULT `'#0088FF'`, max 7 chars | Calendar display color (hex) |
| `is_active` | `boolean` | NOT NULL, DEFAULT `true` | Soft-delete flag |
| `created_by` | `uuid` | FK → `users.id` | Who created this resource |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

**Schedule JSON Structure:**
```json
{
  "monday":    { "open": "08:00", "close": "18:00", "active": true },
  "tuesday":   { "open": "08:00", "close": "18:00", "active": true },
  "wednesday": { "open": "08:00", "close": "18:00", "active": true },
  "thursday":  { "open": "08:00", "close": "18:00", "active": true },
  "friday":    { "open": "08:00", "close": "18:00", "active": true },
  "saturday":  { "open": "09:00", "close": "13:00", "active": true },
  "sunday":    { "open": null, "close": null, "active": false }
}
```

**Indexes:**
- `idx_resources_type` on `type`
- `idx_resources_location` on `location` (GIN for partial match)
- `idx_resources_active` on `is_active`

**RLS Policy:**
```sql
-- All authenticated users can view active resources
CREATE POLICY "Authenticated users can view active resources" ON resources
  FOR SELECT USING (is_active = true);

-- Only admins can create/update/delete resources
CREATE POLICY "Admins can manage resources" ON resources
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 2.3 `bookings`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique booking identifier |
| `resource_id` | `uuid` | NOT NULL, FK → `resources.id` | Resource being booked |
| `requester_id` | `uuid` | NOT NULL, FK → `users.id` | Who made the booking |
| `status` | `text` | NOT NULL, CHECK (`status IN ('pending', 'confirmed', 'completed', 'cancelled')`), DEFAULT `'pending'` | Current booking state |
| `date` | `date` | NOT NULL | Date of the booking |
| `start_time` | `time` | NOT NULL | Start time (e.g., `10:00:00`) |
| `end_time` | `time` | NOT NULL | End time (e.g., `12:00:00`) |
| `purpose` | `text` | NOT NULL, max 200 chars | Reason for booking |
| `waitlist_position` | `integer` | Nullable, CHECK (`waitlist_position > 0`) | Position in waitlist (NULL if not waitlisted) |
| `waitlist_offered_at` | `timestamptz` | Nullable | When the user was offered a slot from waitlist |
| `waitlist_expires_at` | `timestamptz` | Nullable | Expiry of waitlist offer (default +15 min) |
| `checkin_token` | `uuid` | Nullable, UNIQUE | Single-use token for QR check-in |
| `checked_in_at` | `timestamptz` | Nullable | Timestamp of successful QR check-in |
| `qr_code_url` | `text` | Nullable | URL to stored QR code image |
| `cancelled_reason` | `text` | Nullable, max 500 chars | Reason for cancellation (required if status = 'cancelled') |
| `notes` | `text` | Nullable, max 1000 chars | Admin notes |
| `created_by` | `uuid` | NOT NULL, FK → `users.id` | Creator (same as requester in v1) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

**Indexes:**
- `idx_bookings_resource_date` UNIQUE on `(resource_id, date, start_time, end_time)` WHERE status IN ('pending', 'confirmed')
- `idx_bookings_requester` on `requester_id`
- `idx_bookings_status` on `status`
- `idx_bookings_resource_date_status` on `(resource_id, date, status)`
- `idx_bookings_waitlist` on `(resource_id, date, start_time, end_time, waitlist_position)`

**Indexes are intentionally designed with partial WHERE clauses to prevent double bookings while allowing the same resource to be booked on different dates or with different time slots.**

**RLS Policy:**
```sql
-- Users can view their own bookings
CREATE POLICY "Users view own bookings" ON bookings
  FOR SELECT USING (requester_id = auth.uid());

-- Admins and faculty in the resource's department can view all bookings
CREATE POLICY "Admins and faculty view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND (role = 'admin' OR role = 'faculty'))
  );

-- Users can create their own bookings
CREATE POLICY "Users create own bookings" ON bookings
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Admins can update any booking; users can update their own pending/confirmed bookings
CREATE POLICY "Users update own bookings" ON bookings
  FOR UPDATE USING (
    requester_id = auth.uid() AND status IN ('pending', 'confirmed')
  ) WITH CHECK (
    status IN ('pending', 'confirmed', 'completed', 'cancelled')
  );

-- Admins can update any booking
CREATE POLICY "Admins update any booking" ON bookings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 2.4 `waitlist`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique waitlist entry |
| `booking_id` | `uuid` | Nullable, FK → `bookings.id` | Linked booking (once slot is offered) |
| `resource_id` | `uuid` | NOT NULL, FK → `resources.id` | Resource being waited for |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | User on the waitlist |
| `date` | `date` | NOT NULL | Date of the desired slot |
| `start_time` | `time` | NOT NULL | Desired start time |
| `end_time` | `time` | NOT NULL | Desired end time |
| `position` | `integer` | NOT NULL, CHECK (`position > 0`) | Queue position |
| `status` | `text` | NOT NULL, CHECK (`status IN ('waiting', 'offered', 'expired', 'confirmed')`), DEFAULT `'waiting'` | Current waitlist state |
| `offered_at` | `timestamptz` | Nullable | When slot was offered to user |
| `expires_at` | `timestamptz` | NOT NULL | Deadline to accept the offer (offered_at + 15 min) |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

**Indexes:**
- `idx_waitlist_resource_position` on `(resource_id, date, start_time, end_time, position)`
- `idx_waitlist_user` on `user_id`
- `idx_waitlist_offered` on `(status, expires_at)`

**RLS Policy:**
```sql
Users can view their own waitlist entries:
CREATE POLICY "Users view own waitlist" ON waitlist
  FOR SELECT USING (user_id = auth.uid());

Users can join waitlist (INSERT):
CREATE POLICY "Users join waitlist" ON waitlist
  FOR INSERT WITH CHECK (user_id = auth.uid());

Admins can view all waitlist entries:
CREATE POLICY "Admins view all waitlist" ON waitlist
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
```

---

### 2.5 `audit_logs`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Unique log entry |
| `booking_id` | `uuid` | Nullable, FK → `bookings.id` | Related booking (if applicable) |
| `user_id` | `uuid` | NOT NULL, FK → `users.id` | Who performed the action |
| `action` | `text` | NOT NULL | Action type (see enum below) |
| `details` | `jsonb` | NOT NULL, DEFAULT `'{}'` | Structured action details |
| `ip_address` | `text` | Nullable | Client IP address |
| `user_agent` | `text` | Nullable | HTTP User-Agent header |
| `created_at` | `timestamptz` | NOT NULL, DEFAULT `now()` |

**Action Enum Values:**
- `booking_created`
- `booking_approved`
- `booking_rejected`
- `booking_cancelled`
- `booking_completed`
- `qr_checkin_success`
- `qr_checkin_failed`
- `waitlist_joined`
- `waitlist_offered`
- `waitlist_expired`
- `resource_created`
- `resource_updated`
- `resource_deleted`
- `login_success`
- `login_failed`
- `logout`

**Critical Constraint:** `audit_logs` is append-only. No UPDATE or DELETE privileges are granted to any role, including admin (enforced at the database level).

**RLS Policy:**
```sql
-- Admins can read all audit logs
CREATE POLICY "Admins read audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can read their own audit logs
CREATE POLICY "Users read own audit logs" ON audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- System inserts audit logs (no user policy needed; uses a service role)
-- INSERT is handled via the `postgres` role in server-side API routes
```

**Note:** Audit log inserts bypass RLS by using the `service_role` key in Next.js API routes. No user can modify existing audit entries.

---

## 3. Database Functions / Triggers

### 3.1 `update_updated_at_column()`

Automatic timestamp update trigger applied to all tables:
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to: users, resources, bookings, waitlist
```

### 3.2 `check_booking_conflict()`

Called as a BEFORE INSERT trigger on `bookings` to enforce no double bookings at the database level:
```sql
CREATE OR REPLACE FUNCTION check_booking_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE resource_id = NEW.resource_id
      AND date = NEW.date
      AND status IN ('pending', 'confirmed')
      AND start_time < NEW.end_time
      AND end_time > NEW.start_time
  ) THEN
    RAISE EXCEPTION 'CONFLICT: This time slot is already booked for this resource';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.3 `process_waitlist()`

Called as an AFTER UPDATE trigger on `bookings` when a booking transitions to `cancelled`. Finds the next waitlisted user for the same resource+date+time and offers the slot:
```sql
CREATE OR REPLACE FUNCTION process_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_user_id uuid;
  next_entry_id uuid;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    SELECT id, user_id INTO next_entry_id, next_user_id
    FROM waitlist
    WHERE resource_id = OLD.resource_id
      AND date = OLD.date
      AND start_time = OLD.start_time
      AND end_time = OLD.end_time
      AND status = 'waiting'
    ORDER BY position ASC
    LIMIT 1;

    IF next_user_id IS NOT NULL THEN
      UPDATE waitlist
      SET status = 'offered', offered_at = now(),
          expires_at = now() + interval '15 minutes'
      WHERE id = next_entry_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 3.4 `invalidate_checkin_token()`

Called as an AFTER UPDATE trigger on `bookings` when status changes to `completed` to prevent QR reuse:
```sql
CREATE OR REPLACE FUNCTION invalidate_checkin_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE bookings SET checkin_token = NULL WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 4. Database Schema Creation Script

```sql
-- ============================================
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create tables (see individual definitions above)
-- [All CREATE TABLE statements from Section 2 above]

-- 3. Create indexes
-- [All CREATE INDEX statements from each table definition above]

-- 4. Create functions
-- [All CREATE FUNCTION statements from Section 3 above]

-- 5. Create triggers
CREATE TRIGGER trg_bookings_conflict_check
  BEFORE INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION check_booking_conflict();

CREATE TRIGGER trg_bookings_waitlist_process
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION process_waitlist();

CREATE TRIGGER trg_bookings_invalidate_token
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION invalidate_checkin_token();

CREATE TRIGGER trg_update_timestamps
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_timestamps_resources
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_timestamps_bookings
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_timestamps_waitlist
  BEFORE UPDATE ON waitlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS on all tables (policies defined above)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
```

---

## 5. Migration Strategy

| Change | Approach |
|--------|----------|
| New columns | Use Supabase migration files in `supabase/migrations/` |
| Index additions | Add via migration, verify with `EXPLAIN ANALYZE` |
| RLS policy changes | Test in staging first; use `supabase db push` |
| Data backfills | Use Supabase SQL Editor in maintenance windows |

---

*End of Data Models*