# Implementation Plan — Campus Resource Management Platform

**Version:** 1.0.0
**Last Updated:** 2026-07-26
**Project Duration:** 2 Days (Hackathon)

---

## 1. Sprint Overview

| Day | Focus | Output |
|-----|-------|--------|
| Day 1 | Foundation: Auth, DB schema, conflict-lock, resource CRUD | Working backend with protected routes |
| Day 2 | Features: Booking flow, waitlist, QR, real-time, polish | Full demo-ready app |

---

## 2. Day 1 — Foundation

### Session 1: Setup (0:00–1:00)

| Task | Details | Deliverable |
|------|---------|-------------|
| Project scaffolding | `npx create-next-app` with Tailwind, TypeScript | Working dev server at `localhost:3000` |
| Supabase project creation | New project, note URL + anon + service_role keys | Supabase project ready |
| Environment config | `.env.local` with Supabase credentials | `.env.local` committed to `.gitignore` |
| Dependency install | `npm install` all required packages | `package.json` complete |
| Git setup | Git repo, initial commit, `.gitignore` (`.env.local`, `node_modules`) | Clean git history |
| Folder structure creation | `app/`, `components/`, `lib/`, `hooks/`, `types/` | Directory tree ready |
**Estimated time**: ~60 min

### Session 2: Database Setup (1:00–3:00)

| Task | Details | Deliverable |
|------|---------|-------------|
| Schema creation | Run SQL from ` Backend Schema.md` in Supabase SQL Editor | `users`, `resources`, `bookings`, `waitlist`, `audit_logs` created |
| Row Level Security | Apply RLS policies to all 5 tables | Policies active, tested per role |
| Row-level locking | Verify `FOR UPDATE` prevents double bookings | Manual test: two sessions, same slot → second fails |
| Triggers | Create `update_updated_at`, `check_booking_conflict`, `process_waitlist`, `invalidate_checkin_token` | All triggers firing correctly |
| Test data seed | Insert 3 resources (classroom, lab, auditorium), 2 users per role | Sample data for demo |
**Estimated time**: ~120 min

### Session 3: Authentication (3:00–4:30)

| Task | Details | Deliverable |
|------|---------|-------------|
| Supabase Auth config | Enable email/password + magic link in Supabase dashboard | Auth providers active |
| Login page (`/`) | Email input + "Get Magic Link" button + password fallback | Working login UI |
| Auth hook (`useAuth`) | `useAuth` hook providing `user`, `role`, `loading`, `login`, `logout` | Reusable auth context |
| Protected routes | Middleware or wrapper that redirects unauthenticated users | `/dashboard` redirects to `/` if not logged in |
| Role-based routing | Route guards: faculty-only routes check `user.role !== 'faculty'` | Role enforcement at route level |
**Estimated time**: ~90 min

### Session 4: Resource CRUD (4:30–6:30)

| Task | Details | Deliverable |
|------|---------|-------------|
| Resource list page (`/resources`) | Grid of resource cards, search bar, filter by type | Visible resource list |
| Resource detail page (`/resources/[id]`) | Resource info, schedule display, availability indicator | Clickable from list |
| Admin: Add Resource | Modal form with name, type, location, capacity, schedule picker | Admin can create resources |
| Admin: Edit/Delete Resource | Edit button opens pre-filled modal; delete with confirmation | Admin can modify resources |
| Realtime sync | Subscribe to `resources` table changes; cards update instantly when admin adds/edits | Live resource updates |
**Estimated time**: ~120 min

### Session 5: Bookings — Conflict Lock (6:30–8:00)

| Task | Details | Deliverable |
|------|---------|-------------|
| Booking creation API | `POST /api/v1/bookings` with transaction + `FOR UPDATE` | Conflict lock verified |
| Booking list API | `GET /api/v1/bookings` filtered by user role | Role-scoped listing |
| Booking creation UI | Multi-step form: select slot → enter purpose → confirm | Student can book a slot |
| Conflict UX | If booking fails with conflict → show "Join Waitlist" option | Graceful conflict handling |
| Pending status | Bookings initially marked `pending`; visible in "Pending" tab | Status flow working |
**Estimated time**: ~90 min

### Break: 30 min (8:00–8:30)

### Session 6: Approval Workflow (8:30–9:30)

| Task | Details | Deliverable |
|------|---------|-------------|
| Admin approval API | `PATCH /api/v1/bookings/:id/status` with role check | Admin can approve/reject |
| Booking detail page | Shows booking info, status badge, QR code button | User sees booking details |
| Notification trigger | Realtime event on status change → toast notification | Real-time status updates |
| Faculty approval | Faculty can approve bookings for their department | Dept-scoped approval |
**Estimated time**: ~60 min

### Day 1 Checkpoint (9:30)

| Check | Pass? |
|-------|-------|
| Login works for all 3 roles | ☐ |
| Resources are visible and searchable | ☐ |
| Admin can add/edit/delete resources | ☐ |
| Booking with conflict lock works | ☐ |
| Approval workflow works | ☐ |
| Real-time updates on dashboard | ☐ |
| No double bookings possible | ☐ |

**End of Day 1 target**: All P0 features functional, demo-ready for basic use case.

---

## 3. Day 2 — Features & Polish

### Session 7: Waitlist System (0:00–1:00)

| Task | Details | Deliverable |
|------|---------|-------------|
| Waitlist join API | `POST /api/v1/waitlist/:resource_id` | User can join a waitlist |
| Waitlist list API | `GET /api/v1/waitlist/:resource_id` | Waitlist position visible |
| Waitlist processing trigger | DB trigger sends notification on cancellation | Auto-fill on slot opening |
| Notification system | Realtime notification on waitlist position change | User gets notified when close |
| Acceptance window | 15-minute timeout for waitlist offers | Auto-expire and move to next user |
**Estimated time**: ~60 min

### Session 8: QR Check-In (1:00–2:30)

| Task | Details | Deliverable |
|------|---------|-------------|
| QR generation API | `GET /api/v1/bookings/:id/qr` returns QR image | Unique QR per booking |
| QR code styling | Branded QR with CRMP logo overlay | Professional-looking QR codes |
| QR display on booking detail | QR shown in booking detail page | Student can show QR |
| Check-in API | `POST /api/v1/checkin` with full validation | Admin/faculty can scan and complete |
| QR scanner page | Camera + manual entry fallback | Dedicated `/checkin` page |
| Offline check-in | IndexedDB queue + sync on reconnect (if time permits) | Offline-capable check-in |
| Audit logging | All check-ins logged with timestamp, user, IP | Audit trail for check-ins |
**Estimated time**: ~90 min

### Session 9: Dashboard & UI Polish (2:30–4:00)

| Task | Details | Deliverable |
|------|---------|-------------|
| Live calendar | Week/day toggle, color-coded cells | Calendar view on dashboard |
| Upcoming bookings list | Filtered by role, sortable | "My Bookings" on dashboard |
| Notification bell | Real-time badge count, dropdown with recent items | Persistent notification system |
| Dark theme consistency | All screens use design tokens from UI Spec | Uniform look and feel |
| Mobile responsiveness | Test all flows on mobile viewport | Working on phone browser |
| Loading states | Skeleton placeholders while data loads | No blank screens |
| Error handling | User-friendly error messages for all failure cases | Graceful degradation |
**Estimated time**: ~90 min

### Session 10: Testing & Demo Preparation (4:00–5:30)

| Task | Details | Deliverable |
|------|---------|-------------|
| Conflict prevention test | Two users try to book same slot simultaneously | Proof that conflict lock works |
| End-to-end flow test | Student login → search → book → cancel (admin approval) | Complete flow verified |
| Admin panel testing | CRUD on resources, user management, audit log viewer | All admin features functional |
| Mobile testing | Test all screens on mobile viewport | Responsive and usable |
| Offline simulation | Disable network → try to check-in → re-enable | Offline queue syncs |
| Demo run-through | Walk through full pitch with team | Smooth demo |
| Bug fixes | Fix any last-minute issues | Clean demo |
| Deploy to Vercel | Production deployment, share URL | Deployed URL ready |
**Estimated time**: ~90 min

### Day 2 Checkpoint (5:30)

| Check | Pass? |
|-------|-------|
| Waitlist auto-fill works | ☐ |
| QR code generation and display works | ☐ |
| QR check-in (scan + validate) works | ☐ |
| Audit logs capture all actions | ☐ |
| Dashboard shows real-time updates | ☐ |
| Mobile flows work on phone browser | ☐ |
| All P0 and P1 features functional | ☐ |
| Deployed URL is accessible | ☐ |
| Demo runs without errors | ☐ |

**End of Day 2 target**: Fully functional, deployed, demo-ready application.

---

## 4. Task Breakdown by Team Member

| Team Member | Day 1 Focus | Day 2 Focus |
|------------|-------------|-------------|
| **Backend Dev 1** | DB schema, RLS policies, triggers, auth, booking API | Waitlist logic, check-in API, audit logging |
| **Frontend Dev** | Login page, dashboard, resource UI, booking form | Dashboard polish, mobile responsiveness, QR display |
| **Full-Stack / Lead** | Architecture setup, API route wiring, conflict lock | App flow integration, testing, deployment |
| **UI/UX Designer** | Design tokens, component library setup | Animation templates, responsive refinements |

*Adjust roles based on your actual team composition.*

---

## 5. Risk Buffer (Built into schedule)

| Risk | Buffer | Mitigation if Buffer Exceeded |
|------|--------|------------------------------|
| DB schema issues | 30 min from Session 2 | Simplify RLS (disable on `audit_logs` for v1) |
| Auth integration delays | 20 min from Session 3 | Use Supabase `onAuthStateChange` listener directly instead of custom hook |
| Conflict lock debugging | 30 min from Session 5 | Use serializable isolation level instead of `FOR UPDATE` |
| QR generation issues | 15 min from Session 8 | Use plain QR (no styling) — still functional |
| Mobile responsiveness | 15 min from Session 9 | Ship with desktop-only; mobile as Phase 2 |
| Demo deployment issues | 15 min from Session 10 | Use Vercel Preview URL instead of custom domain; share QR code of URL |

---

## 6. Post-Hackathon Roadmap (v2.0)

| Week | Milestone | Effort |
|------|-----------|--------|
| Week 1 | Google Calendar sync, email notifications | 2–3 days |
| Week 2 | AI congestion prediction model | 3–5 days |
| Week 3 | IoT smart lock integration | 3–4 days |
| Week 4 | Multi-campus sync + native mobile apps | 5–7 days |

---

## 7. File Inventory for Implementation

### 7.1 Documentation Files (Read Before Coding)

| File | Purpose |
|------|---------|
| `PRD.md` | What to build (product requirements) |
| `TRD.md` | How to build it (technical requirements) |
| `App Flow.md` | Step-by-step user flows to implement |
| `UI-UX Design Doc.md` | Visual design specs (colors, tokens, layouts) |
| `Backend Schema.md` | Database tables, RLS policies, triggers |
| ` Implementation Plan.md` | (this file) Day-by-day execution plan |

### 7.2 Code Files to Create

Refer to the folder structure in `Architechture.md` (which has been consolidated into `Backend Schema.md` and this plan).

### 7.3 Key Libraries to Install

```bash
npm install framer-motion    #Animations (UI member provides templates)
npm install @supabase/supabase-js   #Database + Auth client
npm install qr-code-styling        #Branded QR codes
npm install lucide-react           #Icon library
npm install tailwindcss postcss autoprefixer  #Styling
```

---

## 8. Success Criteria (Hackathon Judging)

| Criterion | Target |
|-----------|--------|
| Functional booking flow | Complete: search → select → book → approve → check-in |
| Conflict prevention | Demonstrate two simultaneous bookings for same slot |
| Real-time updates | Open dashboard in two browsers; show instant sync |
| Role-based access | Student, faculty, and admin see different views |
| QR check-in | Scan a QR code and see booking transition to Completed |
| UI polish | Consistent dark theme, responsive, no broken layouts |
| Originality | State machine, waitlist, offline support show depth |
| Presentation | 10-minute pitch with live demo |

---

*End of Implementation Plan*
