# Campus Resource Management Platform (CRMP)

**Team:** APEX PREDATORS
**Document:** Project Overview for All Team Members
**Last Updated:** 2026-07-28

---

## 1. What Is This Project?

We are building a **web application** that replaces paper sign-up sheets and messy spreadsheets for booking campus resources — classrooms, labs, equipment, auditoriums, and common spaces.

Right now, students and faculty check a physical ledger or WhatsApp group to see what's available, then email/admin to get approval. This causes double bookings, confusion, and wasted time.

**Our app gives everyone a live, conflict-free view of what's booked and when.**

---

## 2. The Problem

- **Double bookings**: Two people book the same room at the same time
- **No real-time visibility**: You don't know if something is free until you go check
- **Slow approvals**: Admin has to manually check and approve each request
- **No waitlist**: If a slot is taken, there's no way to queue up for it
- **No accountability**: No record of who booked what and when

---

## 3. The Solution

A web app where users can:

1. **See live availability** of all campus resources on a calendar
2. **Book a slot** with one click
3. **Get auto-approved** or have the request routed to the right person
4. **Join a waitlist** if the slot is taken — get notified instantly when it opens
5. **Check in with a QR code** when they arrive
6. **Admins see everything** — audit logs, utilization stats, and conflict alerts

---

## 4. How It Works (Technical Summary)

### Tech Stack

| Part | Tool | Why |
|------|------|-----|
| Frontend | React (Next.js) | Fast, modern, works everywhere |
| Backend | Next.js API routes | No separate server needed |
| Database | PostgreSQL via Supabase | ACID — prevents double bookings at the database level |
| Auth | Supabase Auth | Magic link login, no passwords to manage |
| Real-time | Supabase Realtime | Instant notifications when bookings change |
| Hosting | Vercel + Supabase | Free tier, serverless, zero maintenance |

**Key technical feature:** When two people try to book the same room at the same time, the database locks that slot and the second person gets an instant error — not a double booking.

### User Roles

- **Student**: Browse resources, book slots, view my bookings, join waitlists, scan QR to check in
- **Faculty**: Same as student + approve bookings for their department
- **Admin**: Same as faculty + manage all resources, users, and view system analytics

---

## 5. Project Files

This document is part of a set of project documents:

| File | What It Covers | Who It's For |
|------|---------------|-------------|
| `PRD.md` | Full product requirements — what to build | Everyone |
| `TRD.md` | Technical requirements — stack, performance, security | Dev + Tech Lead |
| `UI-UX Design Doc.md` | Design specs, colors, layouts, components | UI/UX + Frontend |
| `Backend Schema.md` | Database tables, RLS policies, SQL triggers | Backend Dev |
| `App Flow.md` | Step-by-step user flows (login → book → check-in) | Everyone |
| `Implementation Plan.md` | 2-day sprint plan with task breakdown | Everyone |

---

## 6. What Has Been Done So Far

- [x] Project documentation (PRD, TRD, UI/UX spec, schema, flows, implementation plan)
- [x] PPTX presentation ready for the hackathon
- [x] UI/UX demo HTML file (`UI-Demo.html`) — open in browser to see the design
- [ ] Next.js project scaffolding
- [ ] Database setup on Supabase
- [ ] Authentication (login/logout)
- [ ] Resource management (CRUD)
- [ ] Booking system with conflict lock
- [ ] Waitlist system
- [ ] QR check-in
- [ ] Dashboard and real-time updates
- [ ] Deployment on Vercel


## 8. How to Get Started

### Step 1: Clone the project
```bash
# The project folder is at:
C:\Campus Resource Management Platform\
```

### Step 2: Read these files first (5 minutes each)
1. `PRD.md` — understand what we're building
2. `App Flow.md` — understand the user journeys
3. `Implementation Plan.md` — see the day-by-day plan

### Step 3: Set up your environment (30 minutes)
1. Install Node.js 18+ if not already installed
2. Install npm dependencies: `npm install`
3. Create a Supabase project and get your credentials
4. Create a `.env.local` file with your Supabase URL and keys
5. Run the database schema SQL from `Backend Schema.md`

### Step 4: Start coding
Follow the task breakdown in `Implementation Plan.md` — Day 1 tasks first.

---

## 9. Key Rules

1. **No double bookings** — the database prevents this. We must not bypass it.
2. **Dark theme only** — background `#0F0F1A`, cards `#1A1A2E`, white text.
3. **Fonts are Century Gothic, Arial, or Times New Roman** only.
4. **Line spacing must be 1.5**.
5. **All content must be original** — no copied code or text without attribution.
6. **Keep the demo simple** — a working booking flow beats fancy features.

---

## 10. Demo Day Checklist

Before the hackathon presentation, make sure:

- [ ] App is deployed on Vercel (shareable URL)
- [ ] Demo login credentials exist for Student, Faculty, and Admin
- [ ] At least 3 resources exist in the database
- [ ] A complete booking flow works: search → book → approve → check-in
- [ ] Conflicting booking attempt is blocked and shows a clear error
- [ ] Waitlist auto-fill works (cancel a booking → next person gets notified)
- [ ] QR check-in works on mobile and desktop
- [ ] Real-time updates work (open dashboard in two tabs)

---

*End of Project Overview*
