# Campus Resource Management Platform (Resourcify)

**Team:** APEX PREDATORS  
**Last Updated:** 2026-07-31

## What We Are Building

Resourcify is a campus resource management web app for booking classrooms, labs, equipment, auditoriums, and shared spaces without double bookings.

The app replaces paper ledgers, spreadsheets, and informal message chains with a live booking workspace where students and faculty can browse resources, request slots, see booking status, and join waitlists. Administrators manage resources, users, approvals, audit logs, and analytics from a separate admin panel.

## Core Problems

- Two users can accidentally request the same room or equipment at the same time.
- Students and faculty do not have reliable real-time availability.
- Admin teams spend too much time manually approving and checking requests.
- There is limited accountability around who reserved which resource and why.
- Popular resources need a waitlist and clear alternatives when a slot is unavailable.

## Current Product Scope

1. Browse and filter campus resources.
2. Create booking requests with validation.
3. Prevent overlapping active bookings.
4. Show professional conflict messages and alternatives.
5. Route pending bookings for approval.
6. Track booking lifecycle: Pending, Approved, Active, Completed, Cancelled, Rejected.
7. Support waitlist-oriented planning.
8. Provide admin-only resource management.
9. Show dashboard metrics for availability, approvals, active bookings, utilization, and waitlist demand.
10. Keep audit logs for booking and resource actions.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React 18, TypeScript |
| Styling | Tailwind CSS, Lucide React icons |
| API | Next.js route handlers under `/api/v1` |
| Validation | Zod |
| Data Foundation | Supabase-ready PostgreSQL schema and RLS policies |
| Hosting | Vercel |

## Role Model

| Role | Access |
|---|---|
| Student | Browse resources, create bookings, view own bookings, join waitlists |
| Faculty | Student access plus approval visibility for department workflows |
| Admin | Full resource CRUD, user view, approvals, audit logs, analytics |

## Navigation

General navigation:

- Dashboard
- Resources
- Bookings
- Profile

Admin navigation:

- Dashboard
- Resources
- Users
- Pending Approvals
- Audit Logs
- Analytics

## Definition Of Demo Ready

- App is deployed on Vercel.
- Public resources page has no admin controls.
- Admin resources page supports add, edit, deactivate, search, and filters.
- Booking conflict checks block overlapping pending, approved, and active bookings.
- Booking form shows availability, conflict detail, and suggested alternatives.
- Dashboard shows useful booking and resource metrics.
- Project builds successfully with no broken routes.
