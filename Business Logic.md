# Business Logic — Campus Resource Management Platform

**Version:** 1.0.0
**Last Updated:** 2026-07-29
**Project:** APEX PREDATORS

---

## 1. Booking Rules

### 1.1 Who Can Book What

| User Role | Can Book | Booking Type | Auto-Approval |
|-----------|----------|-------------|---------------|
| **Student** | Classrooms, Equipment | Personal use | Yes (auto-confirmed) |
| **Student** | Labs, Auditoriums | Group/class use | No (requires Faculty approval) |
| **Faculty** | All indoor resources | Class/lab/meeting | Yes for own department, No for other departments |
| **Admin** | All resources | Any purpose | Yes (auto-confirmed) |

### 1.2 Booking Time Constraints

| Rule | Value |
|------|-------|
| Minimum advance booking | 30 minutes before slot starts |
| Maximum booking duration | 4 hours per single slot |
| Maximum advance booking window | 30 days |
| Booking cancellation window | Any time before slot start |
| Grace period for check-in | 15 minutes after slot start |

### 1.3 Daily Booking Limits per User

| Role | Max bookings per day | Max concurrent bookings |
|------|---------------------|------------------------|
| Student | 3 | 2 |
| Faculty | 5 | 3 |
| Admin | Unlimited | Unlimited |

---

## 2. Conflict Prevention Logic

### 2.1 Conflict Detection

```
CONFLICTS if:
  Same resource
  AND same date
  AND overlapping time
  AND at least one booking has status IN ('pending', 'confirmed')

Overlap formula:
  New booking starts BEFORE existing booking ends
  AND
  Existing booking starts BEFORE new booking ends
```

### 2.2 Conflict Response Flow

```
Conflict detected on booking attempt
        │
        ├── Slot has WAITLIST entries
        │     └── Show: "This slot is booked. You can #3 on the waitlist."
        │         [Join Waitlist]  [Choose another slot]
        │
        ├── Slot is CONFIRMED and no waitlist
        │     └── Show: "This slot is booked by [User Name]."
        │         [Choose another time]  [Request override]
        │
        └── Slot is PENDING (awaiting approval)
              └── Show: "This slot is pending approval."
                  [Join Waitlist]  [Choose another slot]
```

### 2.3 Override Request (Faculty/Admin only)

```
1. Click "Request Override" on the booked slot
2. System notifies the current booking holder
3. Current holder has 30 minutes to respond
4. If holder declines OR doesn't respond → slot is released
5. Original requester gets the slot auto-confirmed
6. Audit log records the override action
```

---

## 3. Approval Workflow

### 3.1 Auto-Approval Rules

```
AUTO-CONFIRM when:
  - Requester is Admin → always auto-confirm
  - Requester is Faculty AND booking is for own department → auto-confirm
  - Requester is Student AND resource type is 'classroom' → auto-confirmed
  - Requester is Student AND booking duration under 2 hours AND slot is off-peak (before 10 AM or after 4 PM) → auto-confirm

NEEDS APPROVAL when:
  - Student booking a Lab or Auditorium
  - Faculty booking another department's resource
  - Student booking during peak hours (10 AM - 2 PM) for more than 2 hours
  - Any booking overlapping with a maintenance window
```

### 3.2 Approval Routing

```
Booking submitted (status = 'pending')
        │
        ├── Requester = Student → Route to Faculty in same department
        │     └── Faculty has 24 hours to approve/reject
        │           After 24 hours with no response → auto-confirm
        │
        ├── Requester = Faculty (other dept) → Route to Department Admin
        │     └── Admin has 12 hours to approve/reject
        │           After 12 hours with no response → auto-confirm
        │
        └── Requester = Student (Lab/Auditorium) → Route to Lab Coordinator
              └── Coordinator has 12 hours → auto-confirm after timeout
```

### 3.3 Approval Actions

| Action | Who Can Do It | Effect |
|--------|---------------|--------|
| Approve | Admin, Faculty for own dept | Status → confirmed, notify requester |
| Reject | Admin, Faculty for own dept | Status → cancelled, notify requester with reason |
| Request Info | Admin, Faculty | Status stays pending, requester asked for more info |
| Escalate | Faculty → Admin | Request bumped to admin for final decision |

---

## 4. Waitlist Business Rules

### 4.1 Joining a Waitlist

```
Preconditions:
  - Slot must be fully booked (no available time remaining)
  - User must not already be on the waitlist for this slot
  - User's role must be eligible for this resource type

Process:
  1. Validate preconditions
  2. Insert into waitlist with next available position
  3. Notify user: "Added to waitlist at position #N"
  4. When slot becomes available, trigger allocation
```

### 4.2 Waitlist Priority Scoring

```
Priority Score = (POSITION_WEIGHT * 3) + (FREQUENCY_WEIGHT * 2) + (AGE_WEIGHT * 1)

Default behavior: FIFO (first-in, first-out).
Priority scoring is a secondary tiebreaker only.
```

### 4.3 Waitlist Offer Acceptance

| Scenario | Action |
|----------|--------|
| User accepts within 15 min | Booking created with status confirmed, waitlist entry → confirmed |
| User declines | Waitlist entry → expired, next person gets offer |
| User doesn't respond within 15 min | Waitlist entry → expired, next person gets offer |
| User cancels accepted booking | Booking → cancelled, waitlist slot re-processed |

### 4.4 Waitlist Limit

| Resource Type | Max Waitlist Size |
|---------------|-------------------|
| Classroom | 10 users |
| Lab | 5 users |
| Auditorium | 20 users |
| Equipment | 5 users per slot |

If the waitlist is full, the user gets: "Waitlist is full for this slot. Try a different time or contact admin."

---

## 5. Cancellation Rules

### 5.1 Cancellation Permissions

| Who | Can Cancel | Condition |
|-----|-----------|-----------|
| Requester | Their own bookings | Only before slot start time |
| Approver | Any pending booking | Any approved booking |
| Admin | Any booking | Any time |

### 5.2 Cancellation Consequences

```
When a booking is cancelled:
  1. Status → 'cancelled'
  2. reason field is populated (required)
  3. Audit log entry created
  4. Check if waitlist exists for this slot
  5. IF yes → process_waitlist() → offer to next user
  6. Notify original requester of cancellation
  7. Notify new offer recipient (if any)
```

### 5.3 Late Cancellation Penalty

```
IF booking is cancelled within 2 hours of the slot start:
  - Requester's cancellation rate increases by 1

IF cancellation rate > 3 in the last 30 days:
  - Next booking attempt triggers a warning

After 5 cancellations in 30 days:
  - Temporary booking freeze (1 day)
```

---

## 6. QR Check-In Business Rules

### 6.1 Check-In Conditions

```
CHECK-IN ALLOWED IF ALL of:
  - Booking status == 'confirmed'
  - Booking date == TODAY (or yesterday with grace)
  - Current time >= booking.start_time - 15 minutes
  - Current time <= booking.end_time + 15 minutes
  - checkin_token IS NOT NULL (not already used)
```

### 6.2 No-Show Detection

```
At 8:00 AM local time on booking date:
  FOR EACH booking with status = 'confirmed' for TODAY:
    IF NO checkin record exists before booking.end_time:
      SET booking.status = 'no_show'
      INCREMENT user's no_show_count
      NOTIFY resource owner (faculty/admin)
```

### 6.3 No-Show Consequences

| No-Shows (last 30 days) | Consequence |
|-------------------------|-------------|
| 1-2 | Warning message on next booking |
| 3 | Booking limit reduced (max 1/day) |
| 5 | Booking freeze for 3 days |

---

## 7. Notification Rules

### 7.1 When Notifications Are Sent

| Event | Target | Channel |
|-------|--------|---------|
| Booking created (pending) | Requester | In-app + Email |
| Booking approved | Requester | In-app + Email |
| Booking rejected | Requester | In-app + Email |
| Booking cancelled | Requester + Approver | In-app |
| Waitlist offer received | Waitlisted user | In-app + Push |
| Waitlist expired (declined) | Waitlisted user | In-app |
| Booking confirmed (auto) | Requester | In-app |
| QR check-in success | Requester | In-app |
| Check-in expired (no-show) | Requester | In-app |
| Override requested | Current holder | In-app + Email |
| Override accepted | Requester | In-app |

### 7.2 Notification Throttling

```
- Maximum 1 notification per action (no duplicates)
- In-app notifications batch every 30 seconds for real-time updates
- Email notifications send immediately (no batch)
- Do not send notifications to the user who triggered the event
```

### 7.3 Notification Priority

| Priority | Type | Delivery |
|----------|------|----------|
| High | Booking confirmed, waitlist offer, approval | Immediate push + in-app bold |
| Medium | Booking created, booking cancelled | In-app toast after 1s delay |
| Low | Check-in success, system logs | In-app only, no toast |

---

## 8. Resource Availability Logic

### 8.1 Availability Calculation

```
available_slots = total_slots_in_schedule - occupied_slots

Where occupied_slots counts each distinct time slot (e.g., per hour)
that is covered by at least one active booking for that day.
```

### 8.2 Maintenance Windows

```
Maintenance blocks are stored as separate time ranges.
During maintenance, resources show as "Under Maintenance"
and cannot be booked.

Example: "Science Lab 101 — Maintenance: Every Wednesday 12:00-14:00"
```

### 8.3 Resource Utilization Score

```
utilization = (total booked hours THIS WEEK) / (total available hours THIS WEEK) * 100

Display on dashboard:
  < 30%  → Green (underutilized)
  30-70% → Blue (normal)
  70-90% → Amber (high demand)
  > 90%  → Red (overbooked — admin attention needed)
```

---

## 9. Dashboard Business Logic

### 9.1 Calendar View Logic

```
FOR EACH resource visible to the user:
  FOR EACH day in the displayed range (week/month):
    FOR EACH hour in schedule:
      status = CHECK conflict for this slot
      IF status == 'conflict':
        Render RED cell
      ELSE IF status == 'pending_booking':
        Render AMBER cell
      ELSE:
        Render GREEN cell (available)
```

### 9.2 "My Bookings" Sort Order

```
1. Today's bookings first (earliest time first)
2. Tomorrow's bookings
3. This week's bookings
4. Future bookings (chronological)

Filter: Users see their own bookings (Admin sees all, Faculty sees own + department)
```

---

## 10. Edge Case Handling

### 10.1 Simultaneous Booking Attempts

```
Scenario: User A and User B both try to book the last free slot at the same time.

Resolution:
  - Postgres row-level locking (SELECT FOR UPDATE) ensures one transaction proceeds first
  - Second transaction sees conflict and returns "Slot already booked"
  - Second user is offered the waitlist option
  - No data corruption, no double bookings
```

### 10.2 Booking Overnight (Cross-Midnight)

```
Booking from 23:00 to 01:00 the next day is ALLOWED with a warning.
Check-in rules apply to BOTH days.
User can check in starting at 23:00 on day 1 AND at 00:00 on day 2.
```

### 10.3 Resource Deletion with Active Bookings

```
Deletion attempt → REJECTED with message:
  "Cannot delete resource with N active bookings.
   Deactivate instead or cancel all bookings first."

Soft delete option (is_active = false):
  - Hides from search/available lists
  - Existing bookings remain visible
  - New bookings are blocked
```

### 10.4 Timezone Handling

```
All times stored in UTC in the database.
All times displayed in the user's local timezone (browser timezone).
Booking dates are compared in the user's local date, not UTC date.
```

---

## 11. Audit Trail Rules

### 11.1 Every Action Generates an Audit Log Entry

| Action | Details Stored |
|--------|---------------|
| `booking_created` | resource_id, date, slot, purpose |
| `booking_approved` | approved_by, booking_id |
| `booking_rejected` | rejected_by, booking_id, reason |
| `booking_cancelled` | cancelled_by, booking_id, reason |
| `booking_completed` | checkin_by, booking_id |
| `qr_checkin` | scanned_by, booking_id, timestamp |
| `waitlist_joined` | user_id, resource_id, position |
| `waitlist_offered` | offered_to, slot_details, expires_at |
| `waitlist_accepted` | accepted_by, waitlist_entry_id |
| `waitlist_expired` | expired_entry_id |
| `override_request` | requester, target_booking |
| `override_accepted` | approver, original_holder |

### 11.2 Audit Log Immutability

```
- audit_logs table has NO UPDATE or DELETE grants to any role
- Even admins cannot modify or delete audit entries
- All inserts happen through server-side API routes using the service_role key
```

---

## 12. Offline-First Rules

### 12.1 Offline Actions Queue

```
When offline, the following actions are queued and synced later:
  - QR check-in (most critical — must work offline)
  - Booking cancellation
  - Waitlist join

Offline actions that are BLOCKED (require internet):
  - New booking creation (needs real-time conflict check)
  - Waitlist acceptance (needs server confirmation)
  - Booking approval/rejection (needs server confirmation)
```

### 12.2 Sync Conflict Resolution

```
WHEN offline action is synced and server returns a conflict:

 FOR QR check-in conflicts (already checked in):
  → Show "This booking was already checked in"
  → No retry (already completed)

 FOR booking cancellation conflicts (booking was modified):
  → Show "This booking was updated since you last saw it"
  → Refresh and show current status

 FOR waitlist acceptance conflicts (slot filled):
  → Show "Slot was claimed by another waitlisted user"
  → User returned to waiting state
```

---

*End of Business Logic Document*
