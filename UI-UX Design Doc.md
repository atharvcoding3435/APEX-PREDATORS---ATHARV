# UI/UX Design Doc — Campus Resource Management Platform (CRMP)

**Version:** 1.0.0
**Last Updated:** 2026-07-26

---

## 1. Design System

### 1.1 Typography

| Property | Value | Notes |
|----------|-------|-------|
| **Font Family** | Century Gothic (primary), Arial (fallback) | As per hackathon guidelines, no other fonts |
| **Font Color** | White (`#FFFFFF`) | On dark backgrounds exclusively |
| **Line Height** | 1.5× all text | Global default |
| **Base Size** | 16px | Root font size |

### 1.2 Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#0F0F1A` | App background |
| `--bg-card` | `#1A1A2E` | Card / panel backgrounds |
| `--bg-elevated` | `#2A2A4E` | Modals, dropdowns, hover states |
| `--text-primary` | `#FFFFFF` | Body text |
| `--text-secondary` | `#A0A0B8` | Muted labels, timestamps |
| `--accent-success` | `#00FF88` | Success indicators, confirmed status |
| `--accent-danger` | `#FF4444` | Conflicts, errors, cancelled status |
| `--accent-warning` | `#FFAA00` | Waitlisted, pending approval |
| `--accent-info` | `#0088FF` | Primary actions, links |
| `--border-subtle` | `#333355` | Card borders, dividers |

### 1.3 Spacing

Base unit: **8px**

| Token | Value |
|-------|-------|
| `--sp-1` | 4px |
| `--sp-2` | 8px |
| `--sp-3` | 16px |
| `--sp-4` | 24px |
| `--sp-5` | 32px |
| `--sp-6` | 48px |
| `--sp-8` | 64px |

### 1.4 Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Buttons, inputs |
| `--radius-md` | 8px | Cards, modals |
| `--radius-lg` | 12px | Large panels |

### 1.5 Shadows

```css
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.3);
--shadow-modal: 0 8px 32px rgba(0, 0, 0, 0.5);
--shadow-elevated: 0 4px 16px rgba(0, 0, 0, 0.4);
```

---

## 2. Screen Specifications

### 2.1 Login / Magic Link Entry (`/`)

**Layout:** Center card on dark background

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│              Campus Resource Platform               │
│                  (logo / title)                     │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │   Sign in to continue                         │  │
│  │                                               │  │
│  │   email@college.edu                           │  │
│  │   ┌─────────────────────────────────────┐     │  │
│  │   │ Enter your college email            │     │  │
│  │   └─────────────────────────────────────┘     │  │
│  │                                               │  │
│  │   ┌─────────────────────────────────────┐     │  │
│  │   │  Get Magic Link                     │     │  │
│  │   └─────────────────────────────────────┘     │  │
│  │                                               │  │
│  │   ─── or ───                                  │  │
│  │                                               │  │
│  │   ┌──────────────┐ ┌────────────────────┐    │  │
│  │   │ Google Login │ │ Password (alt)     │    │  │
│  │   └──────────────┘ └────────────────────┘    │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│        APEX PREDATORS                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Details:**
- Single input field for email
- Primary button: "Get Magic Link" (filled, accent color)
- Secondary option: password login
- No registration — uses Supabase Auth to handle first-time users automatically
- Background: dark gradient, no distractions

---

### 2.2 Dashboard (`/dashboard`)

**Layout:** Sidebar + Main content area

```
┌──────────┬──────────────────────────────────────────┐
│          │  Dashboard                    [User ▼]  │
│ ┌───────┐ │ ─────────────────────────────────────  │
│ │Dashboard│ │                                         │
│ ├───────┤ │  ┌─────────────────────────────────┐   │
│ │Bookings│ │  │  📅 Week / Day  Toggle         │   │
│ ├───────┤ │  │                                 │   │
│ │Search  │ │  │  Mon  Tue  Wed  Thu  Fri  Sat  │   │
│ ├───────┤ │  │  ┌────┬────┬────┬────┬────┬───┐│   │
│ │Waitlist│ │  │  │08AM│10AM│12PM│02PM│04PM│0PM││   │
│ ├───────┤ │  │  ├────┼────┼────┼────┼────┼───┤│   │
│ │Admin   │ │  │  │████░░████░░░░████░░░░████││   │
│ │Logs    │ │  │  ├────┼────┼────┼────┼────┼───┤│   │
│ └───────┘ │  │  │Science│  │Lab 1│  │Lab 2│  │ │   │
│           │  │  └──────┴────┴──────┴────┴────┘│   │
│           │  │                                 │   │
│           │  │  ┌─────────────────────────────┐│   │
│           │  │  │ Upcoming Bookings           ││   │
│           │  │  │ • Science Lab 101 - Fri 10  ││   │
│           │  │  │ • Auditorium - Mon 14        ││   │
│           │  │  └─────────────────────────────┘│   │
│           │  │                                  │   │
└───────────┴──────────────────────────────────────┘
```

**Details:**
- Left sidebar: Navigation links (Dashboard, Bookings, Search, Waitlist, Admin)
- Top bar: Calendar toggle (week/day views), notification bell, user dropdown
- Main area: Calendar grid showing resource availability (green = available, red = booked, amber = pending)
- Bottom section: Upcoming bookings list with search filter
- Resource list card on the right sidebar showing quick access to favorites

---

### 2.3 Resource Search (`/resources`)

**Layout:** Search bar + filter row + resource grid/list

```
┌─────────────────────────────────────────────────────┐
│  Search Resources                              [🔍]│
│  ─────────────────────────────────────────────────  │
│  [Classroom] [Lab] [Auditorium] [Equipment]        │
│  [Building ▼]       [Capacity ▼]    [Available Now]│
│                                                     │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │           │
│  │ │ Science Lab  │ │ │ │ Auditorium A │ │           │
│  │ │ 101          │ │ │ │ Main Hall    │ │           │
│  │ │ Type: Lab    │ │ │ │ Type: Auditorium     │ │
│  │ │ Avail: 3/5   │ │ │ │ Capacity: 200  │ │           │
│  │ │ [Book Now]   │ │ │ │ [View Slots] │ │           │
│  │ └─────────────┘ │ │ └─────────────┘ │           │
│  └─────────────────┘ └─────────────────┘           │
│                                                     │
│  ┌─────────────────┐ ┌─────────────────┐           │
│  │ ┌─────────────┐ │ │ ┌─────────────┐ │           │
│  │ │ Computer Lab │ │ │ │ Sports Gym   │ │           │
│  │ │ 202          │ │ │ │ Ground Floor │ │           │
│  │ │ Avail: Yes   │ │ │ │ Capacity: 50 │ │           │
│  │ │ [Book Now]   │ │ │ │ [View Slots] │ │           │
│  │ └─────────────┘ │ │ └─────────────┘ │           │
│  └─────────────────┘ └─────────────────┘           │
└─────────────────────────────────────────────────────┘
```

**Details:**
- Search bar at top with text input
- Filter chips: resource type toggle buttons (classroom, lab, auditorium, equipment)
- Location dropdown and capacity range dropdown for filtering
- "Available Now" toggle shows only resources with free slots today
- Resource cards in a responsive grid (3 columns desktop, 2 tablet, 1 mobile)
- Each card shows: name, type badge (color-coded), availability count, capacity, action button
- Color coding: Green badge = available, Red badge = fully booked, Amber = some pending

---

### 2.4 Booking Form (`/resources/[id]/book`)

**Layout:** Step-by-step wizard with progress indicator

```
┌─────────────────────────────────────────────────────┐
│  Book a Resource                           Step 2/3 │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Step 1: Select Time Slot                   │    │
│  │                                              │    │
│  │  Resource: Science Lab 101                  │    │
│  │  Capacity: 30  |  Type: Lab                 │    │
│  │  Location: Science Block, Room 101          │    │
│  │                                              │    │
│  │  Date Picker:  [ Aug 1, 2026 ▾ ]           │    │
│  │                                              │    │
│  │  Available Slots for Aug 1:                 │    │
│  │  ┌──────────────────────────────────────┐   │    │
│  │  │ 08:00 - 10:00   [ Available ]  🟢   │   │    │
│  │  │ 10:00 - 12:00  [ Booked ]       🔴  │   │    │
│  │  │ 12:00 - 14:00  [ Available ]  🟢    │   │    │
│  │  │ 14:00 - 16:00  [ 2 spots left ] 🟡  │   │    │
│  │  └──────────────────────────────────────┘   │    │
│  │                                              │    │
│  │              [ Next → ]                      │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Details:**
- 3-step wizard: Select Slot → Enter Details → Review & Confirm
- Step 1: Date picker + slot grid showing availability (green=free, red=booked, yellow=few spots)
- Step 2: Purpose textarea (max 200 chars), optional notes field
- Step 3: Review summary with all details + confirm/cancel buttons
- Real-time conflict indicator: if another booking is made for the same slot while the user is filling the form, show a warning and auto-refresh

---

### 2.5 Booking Detail / QR Display (`/bookings/[id]`)

**Layout:** Split card — details on left, QR on right

```
┌─────────────────────────────────────────────────────┐
│  Booking Details                             Status │
│  ───────────────────────────────────────────── Status │
│                                                     │
│  ┌──────────────────────┐  ┌───────────────────┐   │
│  │ Resource:            │  │                   │   │
│  │ Science Lab 101      │  │    ┌─────────┐    │   │
│  │                      │  │    │           │    │   │
│  │ Date: Aug 1, 2026    │  │    │  ██████  │    │   │
│  │ Time: 10:00 - 12:00  │  │    │  ██████  │    │   │
│  │ Purpose: Chemistry   │  │    │  ██████  │    │   │
│  │   practical           │  │    │  ██████  │    │   │
│  │                      │  │    │  ██████  │    │   │
│  │ Status: CONFIRMED    │  │    │  ██████  │    │   │
│  │                      │  │    │  ██████  │    │   │
│  │ Actions:             │  │    │         │    │   │
│  │ [Cancel Booking]     │  │    │  QR     │    │   │
│  │                      │  │    │  CODE   │    │   │
│  └──────────────────────┘  │    └─────────┘    │   │
│                            │                   │   │
│                            │  Scan to check in │   │
│                            └───────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │  Audit Trail                                │    │
│  │  Aug 1, 10:00 - Booking confirmed by Dr.   │    │
│  │  Aug 1, 10:00 - QR code generated          │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

**Details:**
- Status displayed as a colored badge: Green (Confirmed), Amber (Pending), Red (Cancelled), Blue (Completed)
- QR code: 200x200px, branded with CRMP logo overlay
- "Cancel Booking" button only visible for pending/confirmed states
- Audit trail section at bottom showing immutable history
- QR code has a "Copy Code" button for manual entry fallback

---

### 2.6 Admin Panel (`/admin`)

**Layout:** Sidebar navigation + tabbed content area

#### 2.6.1 Admin Dashboard Overview

```
┌──────────────────┬──────────────────────────────────────┐
│  Admin Panel     │  ┌────────────────────────────────┐  │
│  ┌────────────┐  │  │  System Overview                │  │
│  │ Resources  │  │  │  Total Bookings: 85             │  │
│  │ 42 items   │  │  │  Today: 12                      │  │
│  ├────────────┤  │  │  Confirmed: 72  Pending: 8      │  │
│  │ Users      │  │  │  Completed: 44  Cancelled: 5    │  │
│  │ 128 users  │  │  │  Utilization: 73.5% ████████░  │  │
│  ├────────────┤  │  └────────────────────────────────┘  │
│  │ Audit Logs │  │                                       │
│  │ 340 entries │  │  ┌─────────────┐ ┌─────────────┐  │
│  ├────────────┤  │  │Top Resources │ │ Peak Hours  │  │
│  │ Waitlist   │  │  │1. Science Lab│ │ 10AM-12PM   │  │
│  │ 23 entries │  │  │   12 bookings│ │ 2PM-4PM     │  │
│  ├────────────┤  │  │2. Auditorium │ │             │  │
│  │ Settings   │  │  │   9 bookings │ │             │  │
│  └────────────┘  │  └─────────────┘ └─────────────┘  │
│                  │                                       │
└──────────────────┴──────────────────────────────────────┘
```

#### 2.6.2 Resource Management (`/admin/resources`)

- Table view of all resources with columns: Name, Type, Location, Capacity, Bookings Today, Status (Active/Inactive)
- Action buttons per row: Edit, Delete
- "Add Resource" button at top-right
- Add/Edit modal with all fields from data model (name, type, location, capacity, schedule JSON editor, color picker)
- Search and filter by type

#### 2.6.3 User Management (`/admin/users`)

- Table view of all users: Name, Email, Role, Department, Last Login
- Role dropdown per user to change admin/faculty/student
- Search and filter by role/department
- Bulk actions: Deactivate users, export user list

#### 2.6.4 Audit Log Viewer (`/admin/logs`)

- Table view with columns: Timestamp, User, Action, Details, IP
- Filter by action type, user, date range
- Export to CSV button
- Color-coded actions: Green (created/completed), Red (cancelled/rejected), Amber (pending)
- Immutable — no edit/delete buttons visible (audit logs are append-only at DB level)

---

### 2.7 Waitlist View (`/waitlist`)

**Layout:** List of waitlist entries with position and status

```
┌─────────────────────────────────────────────────────┐
│  My Waitlist                                      [+New]│
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Science Lab 101                             │    │
│  │ Date: Aug 1 | Slot: 10:00-12:00            │    │
│  │ Position: #2 of 5                          │    │
│  │ Status: Waiting                            │    │
│  │ Estimated wait: ~45 min                     │    │
│  │ [Leave Waitlist]                            │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │ Auditorium A                                │    │
│  │ Date: Aug 2 | Slot: 14:00-16:00            │    │
│  │ Position: #1 of 1                          │    │
│  │ Status: OFFERED — expires in 8 min ⏱       │    │
│  │ [Accept]  [Decline]                         │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

---

### 2.8 QR Scanner (`/checkin`)

**Layout:** Full-screen scanner view (mobile) or split view (desktop)

**Mobile Layout:**
```
┌─────────────────────────────────┐
│  ◀ Back    Scan Check-in    📷 │
│                                 │
│       ┌─────────────────────┐   │
│       │                     │   │
│       │    [Camera View]    │   │
│       │    [Scanning...]    │   │
│       │                     │   │
│       └─────────────────────┘   │
│                                 │
│  Or enter code manually:        │
│  ┌───────────────────────────┐  │
│  │ xxxxxxxx-xxxx-xxxx-xxxx  │  │
│  └───────────────────────────┘  │
│                                 │
│  [Check In]                     │
└─────────────────────────────────┘
```

**Desktop Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Check-In Scanner                          [Back]   │
│                                                     │
│  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │                     │  │                     │  │
│  │   [QR Scanner Video]│  │  Booking Details    │  │
│  │   Scanning...       │  │                     │  │
│  │                     │  │  Resource: ...      │  │
│  │                     │  │  Date/Time: ...     │  │
│  │                     │  │  Status: CONFIRMED  │  │
│  │                     │  │  Booking ID: ...    │  │
│  │                     │  │                     │  │
│  └─────────────────────┘  │  [Check In Now]     │  │
│                            │  [Show QR Code]     │  │
│                            └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Details:**
- Camera access uses the browser's `getUserMedia` API
- QR decoding uses `jsQR` or similar library
- Manual code entry fallback for broken cameras
- "Check In Now" button shows a confirmation dialog before processing
- Success state: Green checkmark with "Checked in at HH:MM" message
- Failure state: Red alert with reason (expired, already checked in, wrong time window)
- Offline mode: Camera detection is queued and synced when connectivity returns

---

## 3. Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|-----------|-------|---------------|
| Desktop | ≥1024px | Full sidebar, 3-column grid, calendar in full view |
| Tablet | 768–1023px | Collapsible sidebar (hamburger), 2-column grid, calendar compact |
| Mobile | <768px | Bottom navigation bar, single column, QR scanner full-screen |

### 3.1 Mobile-Specific Adaptations

- Sidebar becomes a slide-out drawer triggered by hamburger menu
- Calendar view shows one day at a time with horizontal scroll for hours
- Booking form is single-column with larger touch targets (min 44px tap area)
- QR scanner takes the full screen with no distraction
- "Book Now" button is fixed at the bottom of the screen for easy access
- Notifications appear as toast at the bottom, not as badges in the header

---

## 4. Accessibility (a11y)

| Requirement | Implementation |
|-------------|---------------|
| Keyboard navigation | All interactive elements reachable via Tab, focused elements show visible ring |
| Screen reader | ARIA labels on all icons, semantic HTML (`<nav>`, `<main>`, `<table>`), live regions for real-time updates |
| Color contrast | White text on `#1A1A2E` cards meets WCAG AA (contrast ratio > 4.5:1) |
| Reduced motion | User OS preference for `prefers-reduced-motion` disables CSS transitions |
| Font size | Base 16px with relative units throughout; no fixed pixel sizes |
| Focus management | Modal traps focus; after closing modal, focus returns to trigger element |

---

## 5. Animation & Micro-interactions

| Interaction | Animation | Duration |
|------------|-----------|----------|
| Button press | Scale down to 0.97 | 100ms |
| Card hover | Subtle lift (shadow increase) | 200ms |
| Page transition | Fade in + slight slide up | 300ms |
| Notification toast | Slide in from right, auto-dismiss | 3s |
| State badge change | Color crossfade | 400ms |
| Calendar slot select | Pulse glow on selected | 500ms |
| QR code generation | Fade in from skeleton | 600ms |

All animations respect `prefers-reduced-motion`.

---

## 6. Iconography

Use **Lucide** icon set (consistent, lightweight, React-compatible):

| Icon | Usage |
|------|-------|
| `Calendar` | Date picker, date displays |
| `Search` | Search bars |
| `Check` | Confirmed status, success |
| `X` | Close modals, reject booking |
| `Clock` | Time fields, pending status |
| `QrCode` | QR check-in, QR display |
| `Bell` | Notification bell |
| `Settings` | Admin settings |
| `Plus` | Add resource, create booking |
| `Trash` | Delete resource/booking |
| `Edit` | Edit action |
| `ArrowRight` | Navigation, step progression |
| `AlertTriangle` | Conflict warnings, errors |
| `WifiOff` | Offline indicator |
| `Users` | User list, attendees |

---

*End of UI/UX Specification*
