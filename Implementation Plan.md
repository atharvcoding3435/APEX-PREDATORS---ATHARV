# Implementation Plan - Resourcify

**Last Updated:** 2026-07-31

## Sprint Strategy

Each sprint should deliver one reviewable feature:

1. Build the feature.
2. Verify locally.
3. Commit and push.
4. Deploy to Vercel.
5. Team reviews the live output.

## Completed Sprints

| Sprint | Result |
|---|---|
| Deployment Foundation | Vercel production deployment is live |
| Booking Conflict UX | Booking form validates conflicts and suggests alternatives |
| Project Overview PDF | Team-facing project overview generated |
| Resource Role Architecture | Public resources are read-only; Admin Resources owns CRUD |
| Attendance Workflow Removal | Retired attendance workflow removed from app, schema, dependencies, and docs |

## Near-Term Sprint Backlog

| Sprint | Feature |
|---|---|
| Auth Foundation | Supabase auth, role loading, protected routes |
| Persistent Bookings | Replace mock booking creation with Supabase writes |
| Admin Approvals | Approve/reject actions backed by API and audit logs |
| Waitlist | Join waitlist, offer slots, accept/expire offers |
| Analytics | Real resource utilization and approval metrics |

## Definition Of Done Per Sprint

- TypeScript passes.
- Production build passes.
- No broken navigation routes.
- API errors are structured.
- UI is responsive.
- Changes are committed, pushed, and deployed for review.
