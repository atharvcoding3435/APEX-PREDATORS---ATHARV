# App Flow — Campus Resource Management Platform

**Version:** 1.0.0
**Last Updated:** 2026-07-26

---

## 1. Flow Overview

### 1.1 Entry Point

All flows start at the Landing page (`/`), which doubles as the login screen. After authentication, users are redirected to their role-appropriate dashboard.

```
[ Landing / Login ]
        │
        ├──→ Student ──→ [ Dashboard ]
        ├──→ Faculty  ──→ [ Dashboard ]
        └──→ Admin    ──→ [ Dashboard ]
```

---

## 2. Authentication Flow

### 2.1 Login via Magic Link

```
User opens app
  │
  ▼
Landing Page (email input)
  │
  ▼
User enters college email
  │
  ▼
Frontend validates email format (Zod schema)
  │
  ▼
POST /api/v1/auth/magic-link
  │
  ▼
Supabase Auth sends magic link to email
  │
  ▼
Email server delivers magic link to user
  │
  ▼
User clicks link (opens app via redirect)
  │
  ▼
/ auth / callback route handles Supabase OAuth redirect
  │
  ▼
Supabase verifies token, creates session
  │
  ▼
GET /api/v1/users/me returns user profile + role
  │
  ▼
Redirect to role-appropriate dashboard
```

**Error Paths:**
- Invalid email → Inline error message below input
- Magic link not received → "Resend" button, 30-second cooldown
- Expired link → "Link expired, request a new one" message
- User not in system → Auto-registered as `student` role by default (admin can later promote)

### 2.2 Login via Email/Password (Fallback)

Same flow as magic link, but:
- Uses `POST /api/v1/auth/login` instead
- Password policy enforced: min 8 chars, uppercase + number + special char
- 5 failed attempts lock the account for 15 minutes (tracked via Supabase Auth rate limiting)

### 2.3 Session Management

```
Session created on login
  │
  ├── Access token stored in memory (not localStorage — XSS-safe)
  ├── Supabase client auto-refreshes token before expiry
  ├── Session expiry after 2 hours inactivity
  │
  ▼
User clicks Logout
  │
  ▼
POST /api/v1/auth/logout → Supabase revokes session
  │
  ▼
Clear in-memory token → Redirect to Landing page
```

---

## 3. Core User Flows

### 3.1 Student Flow: Book a Resource

```
Student logs in
  │
  ▼
[ Dashboard ] — Sees upcoming bookings + calendar
  │
  ▼ Clicks "Book a Resource"
  │
[ Resource Search Page ]
  │— Filters: type, location, capacity, availability
  │— Scrolling card grid showing resources
  │— Each card: name, type badge, availability indicator
  │— Student clicks "View" on a resource card
  │
[ Resource Detail Page ]
  │— Shows resource info: name, type, location, capacity, schedule
  │— Date picker: select date
  │— Time slot grid: shows availability for selected date
  │— Student clicks an available slot
  │
[ Booking Form Page ]
  │— Pre-fills: resource, date, start_time, end_time
  │— Student enters: purpose (required, max 200 chars)
  │— Optional: notes
  │— Student clicks "Submit Booking"
  │
[ Confirmation Page ]
  │— If booking is auto-confirmed (no approval needed):
  │    Show success message + QR code generated
  │— If booking requires approval (faculty/professional resources):
  │    Show "Pending Approval" message
  │    Add booking to "My Bookings" list with pending status
  │    Notification sent to admin/faculty approver
```

### 3.2 Conflict Scenario: Slot Already Booked

```
Student clicks an unavailable slot
  │
  ▼
[ Conflict Dialog ]
  │— "This slot is already booked"
  │— Options: [Choose another slot] [Join waitlist]
  │— If Join Waitlist:
  │   User joins waitlist for that resource+date+time
  │   Position displayed (#3 of 8, etc.)
  │   User returns to Dashboard
  │   Real-time notification: "You are #2 on the waitlist"
  │   Real-time notification: "Slot available! Accept within 15 min"
```

### 3.3 Student Flow: QR Check-In

```
Booking day arrives
  │
  ▼
Student opens app → [ Dashboard ] → sees "Today's Bookings"
  │
  ▼ Clicks on a confirmed booking
  │
[ Booking Detail Page ]
  │— Shows QR code (branded, with CRMP logo overlay)
  │— QR encodes: booking_id, resource_id, date, time, checkin_token (single-use UUID)
  │
  ▼ Student goes to resource location
  │
[ Check-In Screen ]
  │— Two modes: Camera Scan or Manual Code Entry
  │
  ▼ Student scans QR at the resource (or admin/faculty scans student's QR)
  │
POST /api/v1/checkin
  │— Validates: booking status=CONFIRMED, date=today, time in window, token unused
  │
  ▼ On success:
  │— Booking status transitions CONFIRMED → COMPLETED
  │— Audit log entry created
  │— "Checked in at 10:15 AM" success message
  │— QR code expires (token invalidated)
```

### 3.4 Faculty Flow: Approve a Booking

```
Faculty logs in → [ Dashboard ]
  │— Sees "Pending Approvals" section with count badge
  │
  ▼ Clicks "Pending Approvals"
  │
[ Pending Bookings List ]
  │— Shows all pending bookings for faculty's department
  │— Each entry: student name, resource, date/time, purpose
  │— Buttons: [Approve] [Reject]
  │
  ▼ Faculty clicks "Approve" on a booking
  │
[ Admin can also approve ]
  │
  ▼
PATCH /api/v1/bookings/:id/status  { status: "confirmed" }
  │
  ▼ Real-time notification pushes to student's dashboard
  │
Student sees "Confirmed" badge + QR code appears
```

### 3.5 Admin Flow: Manage Resources

```
Admin logs in → [ Admin Panel ]
  │— Full sidebar with: Resources, Users, Audit Logs
  │
  ▼ Clicks "Resources"
  │
[ Resource Management Page ]
  │— Table of all resources
  │— Columns: Name, Type, Location, Capacity, Bookings Today, Status
  │— Actions per row: Edit | Delete
  │— "Add Resource" button at top-right
  │
  ▼ Admin clicks "Add Resource"
  │
[ Add/Edit Resource Modal ]
  │— Form fields: name, type (dropdown), location, capacity, schedule (time picker per day), color
  │— Validation: all required fields filled, valid time ranges
  │─ Admin clicks "Save"
  │
  ▼ POST /api/v1/resources
  │— Resource appears in table immediately
  │— Real-time update pushes to all dashboards
```

### 3.6 Admin Flow: View Audit Logs

```
Admin clicks "Audit Logs" in sidebar
  │
  ▼
[ Audit Log Viewer ]
  │— Table with columns: Timestamp, User, Action, Details, IP
  │— Filters: action type dropdown, user search, date range
  │— Sortable columns
  │— Export to CSV button
  │— Rows color-coded: green (success), red (failure/rejection), amber (pending)
  │— Immutable — no edit/delete buttons visible
```

### 3.7 Waitlist Auto-Fill Flow

```
Admin rejects a booking
  │  (or user cancels a confirmed booking)
  │
  ▼
DELETE / PATCH booking status → CANCELLED
  │
  ▼ Trigger: DB trigger process_waitlist()
  │
  ▼ SELECT next entry from waitlist WHERE:
     - resource_id matches
     - date matches
     - start_time/end_time matches
     - status = 'waiting'
     ORDER BY position ASC LIMIT 1
  │
  ▼ UPDATE waitlist entry: status = 'offered', offered_at = now(), expires_at = now() + 15min
  │
  ▼ Real-time notification to waitlisted user:
     "A slot just opened for [Resource] on [Date] — Accept within 15 min!"
  │
  ▼ User has 15 minutes to accept
     ├── Accept → Booking created with status CONFIRMED → Waitlist entry status = 'confirmed'
     ├── Decline → Waitlist entry status = 'expired' → Next person gets offer
     └── Expires (no action) → Waitlist entry status = 'expired' → Next person gets offer
```

---

## 4. Navigation Map

### 4.1 Student Navigation

```
[ Sidebar ]
  Dashboard ────────────────────── /dashboard
  My Bookings ─────────────────── /bookings
  Find Resources ──────────────── /resources
  My Waitlist ─────────────────── /waitlist
  Logout ─────────────────────────
```

### 4.2 Faculty Navigation

```
[ Sidebar ]
  Dashboard ────────────────────── /dashboard
  My Bookings ─────────────────── /bookings
  Approvals ───────────────────── /admin/pending
  Find Resources ──────────────── /resources
  Waitlist ────────────────────── /admin/waitlist
  Student Resources ───────────── /resources (department-scoped)
  Logout ─────────────────────────
```

### 4.3 Admin Navigation

```
[ Sidebar ]
  Dashboard ────────────────────── /admin
  Resources ───────────────────── /admin/resources
  Users ───────────────────────── /admin/users
  Pending Approvals ───────────── /admin/pending
  Audit Logs ──────────────────── /admin/logs
  Waitlist Management ─────────── /admin/waitlist
  Analytics ───────────────────── /admin/analytics
  Logout ─────────────────────────
```

---

## 5. State Machine Reference (Per Booking)

```
                    ┌──────────┐
         ┌─────────│  AVAILABLE │───────────┐
         │         └──────────┘            │
         │              │                    │
         │         createBooking()        │
         │              ▼                    │
         │         ┌──────────┐            │
         │         │  PENDING  │            │
         │         └──────────┘            │
         │         ╱        ╲              │
         │   approve()    reject()         │
         │      │              │           │
         │      ▼              ▼           │
         │  ┌───────────┐  ┌───────────┐ │
         │  │CONFIRMED   │  │ CANCELLED  │ │
         │  └─────┬─────┘  └───────────┘ │
         │        │                        │
         │   checkInByQR()                │
         │        │                        │
         │        ▼                        │
         │  ┌───────────┐                 │
         │  │ COMPLETED  │───── (end)     │
         │  └───────────┘                  │
         │                                  │
         │   cancelBooking()               │
         │        │                        │
         │        ▼                        │
         │  ┌───────────┐                  │
         │  │  CANCELLED  │── (end)       │
         │  └───────────┘                  │
         │                                  │
         │   rejectBooking()               │
         │        │                        │
         │        ▼                        │
         │  ┌───────────┐                  │
         │  │  CANCELLED  │── (same end)  │
         │  └───────────┘                  │
```

---

## 6. Error Flows

### 6.1 Booking Conflict

```
User tries to book a taken slot
  │
  ▼
GET /api/v1/bookings/conflicts?resource=X&date=Y&start=A&end=B
  │  returns conflict=true
  │
  ▼ Show dialog:
    "This time slot is already booked. What would you like to do?"
    Buttons: [Choose Another Slot] [Join Waitlist] [Cancel]
```

### 6.2 Network Failure During Booking

```
User clicks "Submit Booking"
  │
  ▼ POST /api/v1/bookings fails (NetworkError)
  │
  ▼ Detect error (fetch threw)
  │
  ▼ Show offline-aware dialog:
    "It seems you're offline. Your booking request has been saved locally and will be retried."
  │   (stores request in IndexedDB)
  │
  ▼ When connectivity returns:
    Auto-retry the booking request
    Show success or error toast
```

### 6.3 QR Check-In Outside Time Window

```
Student scans QR at resource
  │
  ▼ POST /api/v1/checkin
  │  Server rejects: status=OUTSIDE_WINDOW
  │
  ▼ Show on student screen:
    "The check-in window has passed (was 10:00–12:00). Contact your instructor."
  │  Log failed attempt in audit_logs (action: qr_checkin_failed)
```

---

## 7. Mobile-Specific Flows

### 7.1 Camera-Based QR Scanner

```
Mobile: Booking detail page
  │
  ▼ Tap "Open Scanner"
  │
[ Full-Screen Camera View ]
  │— Camera feed with corner brackets overlay
  │— Auto-detects QR codes via jsQR library
  │— Haptic feedback on successful scan
  │— Vibration + green flash on success
  │— Red shake animation on failure
  │
  ▼ Detected QR payload:
    { booking_id, checkin_token }
  │
  ▼ POST /api/v1/checkin
  │  On success → Full-screen green checkmark animation
  │  On failure → Red error banner with reason
```

### 7.2 Manual Code Entry (Fallback)

```
[ Camera View ]
  │  "Can't scan? Enter code manually"  (text link)
  │
  ▼ Tap the link
  │
[ Text Input Screen ]
  │— Large input field for paste or type
  │— "Format: xxxxxxxx-xxxx-xxxx-xxxx"
  │— [Check In] button
  │
  ▼ Same POST /api/v1/checkin as camera flow
```

---

## 8. Real-Time Update Flow (Dashboard)

```
User has Dashboard open (tab A)
  │
Admin approves a booking (tab B, different user)
  │
  ▼ Supabase DB: UPDATE bookings SET status='confirmed'
  │
  ▼ Supabase Realtime: Postgres CDC detects change
    │
    ▼ Broadcasts to all connected clients watching 'bookings' table
    │
    ▼ Tab A (Student's Dashboard) receives event:
      { eventType: 'UPDATE', new: { id, status: 'confirmed', ... } }
    │
    ▼ React state updates via useRealtime hook
    │
    ▼ Dashboard calendar cell changes from amber (pending) to green (confirmed)
    │  Badge count updates: Pending: 1 → 0
    │  Notification bell shows new notification
```

---

## 9. Offline Flow

```
User has Dashboard open
  │  Network connection drops
  │
  ▼ Service Worker intercepts fetch requests
  │  Returns cached responses from Cache API (previous page loads)
  │
  ▼ User can still view:
    - Calendar (stale but visible)
    - Previously loaded bookings
    - QR codes (cached)
  │  Cannot: make new bookings, approve, cancel (offline queue stores intent)
  │
  ▼ When network returns:
    Service Worker syncs IndexedDB queue:
    - Any pending check-ins are retried
    - Any offline booking attempts are submitted
    - Conflicts detected on sync → user notified
    - "You're back online" toast notification
```

---

*End of App Flow Document*
